import { publishDailyArticle, fixMojibake } from "./agent.js";

const ALLOWED_ORIGINS = [
  "https://knowledge6566.github.io",
  "https://nishublogs.online",
  "https://www.nishublogs.online",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

function isAuthorized(request, env) {
  return request.headers.get("Authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}

const toPost = row => ({
  ...row,
  date: row.postDate,
  featured: !!row.featured,
  published: !!row.published,
});

const toContact = row => ({ ...row, read: !!row.isRead });

function postValues(p) {
  return [
    p.title,
    p.excerpt || "",
    p.body || "",
    p.author || "Anonymous",
    p.readTime || "5 min",
    p.category || "Technology",
    p.emoji || "📝",
    p.coverImage || "",
    p.featured ? 1 : 0,
    p.published === false ? 0 : 1,
  ];
}

// ---------- Handlers ----------

async function adminLogin(request, env) {
  const { username, password } = await request.json();
  if (env.ADMIN_USERNAME && env.ADMIN_PASSWORD &&
      username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
    return json(request, { success: true, token: env.ADMIN_TOKEN });
  }
  return json(request, { success: false, message: "Incorrect username or password." }, 401);
}

async function getPosts(request, env, url) {
  const wantsAll = url.searchParams.get("admin") === "true" && isAuthorized(request, env);
  const sql = wantsAll
    ? "SELECT * FROM posts ORDER BY id DESC"
    : "SELECT * FROM posts WHERE published = 1 ORDER BY id DESC";
  const { results } = await env.DB.prepare(sql).all();
  return json(request, { success: true, data: results.map(toPost) });
}

async function createPost(request, env) {
  const p = await request.json();
  if (!p.title) return json(request, { success: false, message: "Title is required." }, 400);
  const r = await env.DB.prepare(
    `INSERT INTO posts (title, excerpt, body, author, readTime, category, emoji, coverImage, featured, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(...postValues(p)).run();
  const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
    .bind(r.meta.last_row_id)
    .first();
  return json(request, { success: true, data: toPost(row) }, 201);
}

async function updatePost(request, env, id) {
  const p = await request.json();
  if (!p.title) return json(request, { success: false, message: "Title is required." }, 400);
  await env.DB.prepare(
    `UPDATE posts SET title=?, excerpt=?, body=?, author=?, readTime=?, category=?, emoji=?,
     coverImage=?, featured=?, published=? WHERE id=?`
  ).bind(...postValues(p), id).run();
  return json(request, { success: true });
}

async function deletePost(request, env, id) {
  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  return json(request, { success: true });
}

async function createContact(request, env) {
  const c = await request.json();
  if (!c.firstName || !c.email || !c.message) {
    return json(request, { success: false, message: "Missing required fields." }, 400);
  }
  await env.DB.prepare(
    "INSERT INTO contacts (firstName, lastName, email, subject, message) VALUES (?, ?, ?, ?, ?)"
  ).bind(c.firstName, c.lastName || "", c.email, c.subject || "", c.message).run();
  return json(request, { success: true, message: "Message received." }, 201);
}

async function getContacts(request, env) {
  const { results } = await env.DB.prepare("SELECT * FROM contacts ORDER BY id DESC").all();
  return json(request, { success: true, data: results.map(toContact) });
}

async function markRead(request, env, id) {
  await env.DB.prepare("UPDATE contacts SET isRead = 1 WHERE id = ?").bind(id).run();
  return json(request, { success: true });
}

async function markAllRead(request, env) {
  await env.DB.prepare("UPDATE contacts SET isRead = 1").run();
  return json(request, { success: true });
}

async function fixOldPosts(request, env) {
  const { results } = await env.DB.prepare("SELECT id, title, excerpt, body FROM posts").all();
  let fixed = 0;
  for (const r of results) {
    const title = fixMojibake(r.title);
    const excerpt = fixMojibake(r.excerpt || "");
    const body = fixMojibake(r.body || "");
    if (title !== r.title || excerpt !== (r.excerpt || "") || body !== (r.body || "")) {
      await env.DB.prepare("UPDATE posts SET title=?, excerpt=?, body=? WHERE id=?")
        .bind(title, excerpt, body, r.id)
        .run();
      fixed++;
    }
  }
  return json(request, { success: true, fixed });
}

async function incrementViews(request, env, id) {
  await env.DB.prepare(
    "UPDATE posts SET views = views + 1 WHERE id = ? AND published = 1"
  ).bind(id).run();
  return json(request, { success: true });
}

async function recordVisit(request, env) {
  await env.DB.prepare("UPDATE site_stats SET visits = visits + 1 WHERE id = 1").run();
  return json(request, { success: true });
}

async function getStats(request, env) {
  const s = await env.DB.prepare("SELECT visits FROM site_stats WHERE id = 1").first();
  const p = await env.DB.prepare("SELECT COALESCE(SUM(views), 0) AS total FROM posts").first();
  return json(request, { success: true, siteVisits: s?.visits || 0, articleViews: p?.total || 0 });
}

// ---------- Router ----------

export default {
  // Runs automatically on the cron schedule in wrangler.jsonc
  async scheduled(event, env, ctx) {
    ctx.waitUntil(publishDailyArticle(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request) });
    }

    const postId = pathname.match(/^\/api\/posts\/(\d+)$/)?.[1];
    const contactReadId = pathname.match(/^\/api\/contacts\/(\d+)\/read$/)?.[1];
    const viewId = pathname.match(/^\/api\/posts\/(\d+)\/view$/)?.[1];

    // Routes that change data or read messages require the admin token
    
          const needsAdmin =
      (pathname === "/api/posts" && method === "POST") ||
      (postId && (method === "PUT" || method === "DELETE")) ||
      (pathname === "/api/contacts" && method === "GET") ||
      (contactReadId && method === "PATCH") ||
      (pathname === "/api/contacts/mark-all-read" && method === "PATCH") ||
      (pathname === "/api/agent/run" && method === "POST") ||
      (pathname === "/api/admin/fix-encoding" && method === "POST");

    if (needsAdmin && !isAuthorized(request, env)) {
      return json(request, { success: false, message: "Unauthorized" }, 401);
    }

    try {
      if (pathname === "/api/admin/login" && method === "POST") return await adminLogin(request, env);
      if (pathname === "/api/contact" && method === "POST") return await createContact(request, env);
      if (pathname === "/api/posts" && method === "GET") return await getPosts(request, env, url);
      if (pathname === "/api/posts" && method === "POST") return await createPost(request, env);
      if (postId && method === "PUT") return await updatePost(request, env, postId);
      if (postId && method === "DELETE") return await deletePost(request, env, postId);
      if (viewId && method === "POST") return await incrementViews(request, env, viewId);
      if (pathname === "/api/contacts" && method === "GET") return await getContacts(request, env);
      if (contactReadId && method === "PATCH") return await markRead(request, env, contactReadId);
      if (pathname === "/api/contacts/mark-all-read" && method === "PATCH") return await markAllRead(request, env);
      if (pathname === "/api/visit" && method === "POST") return await recordVisit(request, env);
      if (pathname === "/api/stats" && method === "GET") return await getStats(request, env);
      if (pathname === "/api/admin/fix-encoding" && method === "POST") return await fixOldPosts(request, env);

      // Manual test: publishes one article immediately
      if (pathname === "/api/agent/run" && method === "POST") {
        const title = await publishDailyArticle(env);
        return json(request, { success: true, title }, 201);
      }

      return json(request, { success: false, message: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json(request, { success: false, message: "Server error" }, 500);
    }
  },
};