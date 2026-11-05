const CORS = {
  "Access-Control-Allow-Origin": "https://knowledge6566.github.io",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

// Only requests with the correct admin token can change data
function isAuthorized(request, env) {
  return request.headers.get("Authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // GET all posts (public)
    if (url.pathname === "/api/posts" && request.method === "GET") {
      const { results } = await env.DB
        .prepare("SELECT * FROM posts ORDER BY created_at DESC")
        .all();
      return json(results);
    }

    // CREATE a post (admin only)
    if (url.pathname === "/api/posts" && request.method === "POST") {
      if (!isAuthorized(request, env)) return json({ error: "Unauthorized" }, 401);
      const { title, slug, content } = await request.json();
      const r = await env.DB
        .prepare("INSERT INTO posts (title, slug, content) VALUES (?, ?, ?)")
        .bind(title, slug, content)
        .run();
      return json({ id: r.meta.last_row_id, title, slug }, 201);
    }

    const match = url.pathname.match(/^\/api\/posts\/(\d+)$/);

    // GET one post (public)
    if (match && request.method === "GET") {
      const post = await env.DB
        .prepare("SELECT * FROM posts WHERE id = ?")
        .bind(match[1])
        .first();
      return post ? json(post) : json({ error: "Not found" }, 404);
    }

    // DELETE a post (admin only)
    if (match && request.method === "DELETE") {
      if (!isAuthorized(request, env)) return json({ error: "Unauthorized" }, 401);
      await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(match[1]).run();
      return json({ ok: true });
    }

    return json({ error: "Not found" }, 404);
  },
};