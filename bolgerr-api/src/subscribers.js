const SITE_URL = "https://nishublogs.online";
const API_URL = "https://bolgerr-api.shauryabolgerr.workers.dev";

export function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function addSubscriber(env, email) {
  const token = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO subscribers (email, token, active) VALUES (?, ?, 1)
     ON CONFLICT(email) DO UPDATE SET active = 1`
  ).bind(email, token).run();
}

export async function listSubscribers(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, email, active, subscribedAt FROM subscribers ORDER BY id DESC"
  ).all();
  return results;
}

export async function unsubscribe(env, token) {
  const r = await env.DB.prepare("UPDATE subscribers SET active = 0 WHERE token = ?")
    .bind(token)
    .run();
  return r.meta.changes > 0;
}

function buildEmailHtml(post, unsubscribeUrl) {
  const postUrl = `${SITE_URL}/#post-${post.id}`;
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0D0D0F">
    <p style="color:#5B4FE9;font-weight:bold;letter-spacing:.08em">NEW ON NISHU BLOGS</p>
    <h2 style="font-size:22px">${escapeHtml(post.title)}</h2>
    <p style="color:#6B7280;line-height:1.6">${escapeHtml(post.excerpt)}</p>
    <p><a href="${postUrl}" style="display:inline-block;padding:12px 22px;background:#5B4FE9;color:#ffffff;border-radius:40px;text-decoration:none">Read the article</a></p>
    <hr style="border:none;border-top:1px solid #E5E2DB;margin:32px 0"/>
    <p style="font-size:12px;color:#6B7280">You are receiving this because you subscribed to Nishu Blogs.
      <a href="${unsubscribeUrl}">Unsubscribe</a></p>
  </div>`;
}

export async function notifySubscribers(env, post) {
  if (!env.RESEND_API_KEY) {
    return { skipped: true, reason: "RESEND_API_KEY is not set" };
  }

  const { results } = await env.DB.prepare(
    "SELECT email, token FROM subscribers WHERE active = 1"
  ).all();
  if (!results.length) return { sent: 0, failed: 0 };

  const from = env.NEWSLETTER_FROM || "Nishu Blogs <onboarding@resend.dev>";
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < results.length; i += 100) {
    const batch = results.slice(i, i + 100).map(s => {
      const unsubscribeUrl = `${API_URL}/api/unsubscribe?token=${s.token}`;
      return {
        from,
        to: [s.email],
        subject: `New on Nishu Blogs: ${post.title}`,
        html: buildEmailHtml(post, unsubscribeUrl),
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      };
    });

    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      sent += batch.length;
    } else {
      failed += batch.length;
      console.error("Resend error:", res.status, await res.text());
    }
  }

  return { sent, failed };
}