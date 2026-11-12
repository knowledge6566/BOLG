import { publishDailyArticle, fixMojibake } from "./agent.js";
import {
  isValidEmail,
  addSubscriber,
  listSubscribers,
  unsubscribe,
  notifySubscribers,
} from "./subscribers.js";
import { getPlusPrice, setPlusPrice, createPlusOrder, verifyPlusPayment } from "./plus.js";
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

function json(request, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request), ...extraHeaders },
  });
}

let publicPostsCache = { expiresAt: 0, data: null };

async function invalidatePostsCache(env) {
  publicPostsCache = { expiresAt: 0, data: null };
  if (env.POSTS_CACHE) await env.POSTS_CACHE.delete("published");
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
  const slugify = s => String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return [
    p.title,
    p.excerpt || "",
    p.body || "",
    p.author || "Nishu Blogs",
    p.readTime || "5 min",
    p.category || "Technology",
    p.emoji || "",
    p.coverImage || "",
    p.featured ? 1 : 0,
    p.published === false ? 0 : 1,
    p.seoTitle || "",
    slugify(p.slug || p.seoTitle || p.title),
    p.metaDescription || "",
    p.keyword || "",
    p.labels || "",
  ];
}

async function safeNotify(env, post) {
  try {
    const result = await notifySubscribers(env, post);
    console.log("Newsletter result:", JSON.stringify(result));
  } catch (err) {
    console.error("Newsletter failed:", err.message);
  }
}

async function publishAndNotify(env) {
  const title = await publishDailyArticle(env);
  await invalidatePostsCache(env);
  const post = await env.DB.prepare(
    "SELECT * FROM posts WHERE published = 1 ORDER BY id DESC LIMIT 1"
  ).first();
  if (post) await safeNotify(env, post);
  return title;
}

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
    : `SELECT id, title, excerpt, author, readTime, category, emoji,
         featured, published, views, postDate, seoTitle, slug, metaDescription, keyword, labels
       FROM posts WHERE published = 1 ORDER BY id DESC`;
  let data;
  if (!wantsAll && env.POSTS_CACHE) {
    data = await env.POSTS_CACHE.get("published", "json");
  }
  if (!wantsAll && !data && publicPostsCache.expiresAt > Date.now()) {
    data = publicPostsCache.data;
  } else {
    if (!data) {
      const { results } = await env.DB.prepare(sql).all();
      data = results.map(toPost);
      if (!wantsAll) {
        publicPostsCache = { expiresAt: Date.now() + 30_000, data };
        if (env.POSTS_CACHE) {
          await env.POSTS_CACHE.put("published", JSON.stringify(data), { expirationTtl: 300 });
        }
      }
    }
  }
  const headers = !wantsAll
    ? { "Cache-Control": "public, max-age=30, s-maxage=300" }
    : {};
  return json(request, { success: true, data }, 200, headers);
}

async function getPost(request, env, id) {
  const row = await env.DB.prepare(
    "SELECT * FROM posts WHERE id = ? AND published = 1"
  ).bind(id).first();
  if (!row) return json(request, { success: false, message: "Post not found." }, 404);
  return json(request, { success: true, data: toPost(row) });
}

async function getPostCover(request, env, id) {
  const row = await env.DB.prepare(
    "SELECT coverImage FROM posts WHERE id = ? AND published = 1"
  ).bind(id).first();
  if (!row) return json(request, { success: false, message: "Post not found." }, 404);
  return json(
    request,
    { success: true, data: { coverImage: row.coverImage || "" } },
    200,
    { "Cache-Control": "public, max-age=300, s-maxage=3600" }
  );
}

async function createPost(request, env) {
  const p = await request.json();
  if (!p.title) return json(request, { success: false, message: "Title is required." }, 400);
  const r = await env.DB.prepare(
    `INSERT INTO posts (title, excerpt, body, author, readTime, category, emoji, coverImage, featured, published,
       seoTitle, slug, metaDescription, keyword, labels)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(...postValues(p)).run();
  const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
    .bind(r.meta.last_row_id)
    .first();
  await invalidatePostsCache(env);
  if (row && row.published) await safeNotify(env, row);
  return json(request, { success: true, data: toPost(row) }, 201);
}

async function updatePost(request, env, id) {
  const p = await request.json();
  if (!p.title) return json(request, { success: false, message: "Title is required." }, 400);
  await env.DB.prepare(
    `UPDATE posts SET title=?, excerpt=?, body=?, author=?, readTime=?, category=?, emoji=?,
       coverImage=?, featured=?, published=?, seoTitle=?, slug=?, metaDescription=?, keyword=?, labels=?
     WHERE id=?`
  ).bind(...postValues(p), id).run();
  await invalidatePostsCache(env);
  return json(request, { success: true });
}

async function deletePost(request, env, id) {
  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  await invalidatePostsCache(env);
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

async function subscribeHandler(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return json(request, { success: false, message: "Please enter a valid email address." }, 400);
  }
  await addSubscriber(env, email);
  return json(request, { success: true, message: "Subscribed." }, 201);
}

async function unsubscribeHandler(url, env) {
  const token = url.searchParams.get("token") || "";
  const ok = token ? await unsubscribe(env, token) : false;
  const message = ok
    ? "You have been unsubscribed. You will no longer receive emails from Nishu Blogs."
    : "This unsubscribe link is not valid or was already used.";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Nishu Blogs</title></head>
<body style="font-family:Arial,sans-serif;max-width:520px;margin:4rem auto;padding:0 1rem;color:#0D0D0F">
<h2>Nishu Blogs</h2><p>${message}</p>
<p><a href="https://nishublogs.online" style="color:#5B4FE9">Back to the blog</a></p>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function subscribersHandler(request, env) {
  const rows = await listSubscribers(env);
  const active = rows.filter(r => r.active).length;
  return json(request, { success: true, active, data: rows });
}

async function incrementViews(request, env, id) {
  await env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ? AND published = 1").bind(id).run();
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
  if (fixed) await invalidatePostsCache(env);
  return json(request, { success: true, fixed });
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(publishAndNotify(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request) });
    }

    const postId = pathname.match(/^\/api\/posts\/(\d+)$/)?.[1];
    const coverId = pathname.match(/^\/api\/posts\/(\d+)\/cover$/)?.[1];
    const viewId = pathname.match(/^\/api\/posts\/(\d+)\/view$/)?.[1];
    const contactReadId = pathname.match(/^\/api\/contacts\/(\d+)\/read$/)?.[1];

    const needsAdmin =
      (pathname === "/api/posts" && method === "POST") ||
      (postId && (method === "PUT" || method === "DELETE")) ||
      (pathname === "/api/contacts" && method === "GET") ||
      (contactReadId && method === "PATCH") ||
      (pathname === "/api/contacts/mark-all-read" && method === "PATCH") ||
      (pathname === "/api/subscribers" && method === "GET") ||
      (pathname === "/api/agent/run" && method === "POST") ||
      (pathname === "/api/admin/fix-encoding" && method === "POST");

    if (needsAdmin && !isAuthorized(request, env)) {
      return json(request, { success: false, message: "Unauthorized" }, 401);
    }

    try {
      if (pathname === "/api/admin/login" && method === "POST") return await adminLogin(request, env);
      if (pathname === "/api/contact" && method === "POST") return await createContact(request, env);
      if (pathname === "/api/subscribe" && method === "POST") return await subscribeHandler(request, env);
      if (pathname === "/api/unsubscribe" && method === "GET") return await unsubscribeHandler(url, env);
      if (pathname === "/api/subscribers" && method === "GET") return await subscribersHandler(request, env);
      if (pathname === "/api/posts" && method === "GET") return await getPosts(request, env, url);
      if (pathname === "/api/posts" && method === "POST") return await createPost(request, env);
      if (coverId && method === "GET") return await getPostCover(request, env, coverId);
      if (postId && method === "GET") return await getPost(request, env, postId);
      if (postId && method === "PUT") return await updatePost(request, env, postId);
      if (postId && method === "DELETE") return await deletePost(request, env, postId);
      if (viewId && method === "POST") return await incrementViews(request, env, viewId);
      if (pathname === "/api/contacts" && method === "GET") return await getContacts(request, env);
      if (contactReadId && method === "PATCH") return await markRead(request, env, contactReadId);
      if (pathname === "/api/contacts/mark-all-read" && method === "PATCH") return await markAllRead(request, env);
      if (pathname === "/api/visit" && method === "POST") return await recordVisit(request, env);
      if (pathname === "/api/stats" && method === "GET") return await getStats(request, env);
      if (pathname === "/api/admin/fix-encoding" && method === "POST") return await fixOldPosts(request, env);
      if (pathname === "/api/plus/price" && method === "GET") return await getPlusPrice(request, env);
      if (pathname === "/api/plus/price" && method === "PUT") return await setPlusPrice(request, env);
      if (pathname === "/api/plus/order" && method === "POST") return await createPlusOrder(request, env);
      if (pathname === "/api/plus/verify" && method === "POST") return await verifyPlusPayment(request, env);
      if (pathname === "/api/agent/run" && method === "POST") {
        const title = await publishAndNotify(env);
        return json(request, { success: true, title }, 201);
      }

      return json(request, { success: false, message: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json(request, { success: false, message: "Server error" }, 500);
    }
  },
};
