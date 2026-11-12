import { isValidEmail } from "./subscribers.js";

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
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function reply(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

function isAuthorized(request, env) {
  return request.headers.get("Authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}

function razorpayAuth(env) {
  return "Basic " + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
}

async function getPrice(env) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'plus_price'").first();
  const n = Number(row?.value);
  return Number.isFinite(n) && n > 0 ? n : 199;
}

export async function getPlusPrice(request, env) {
  return reply(request, { success: true, price: await getPrice(env), currency: "INR" });
}

export async function setPlusPrice(request, env) {
  if (!isAuthorized(request, env)) {
    return reply(request, { success: false, message: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => ({}));
  const price = Math.round(Number(body.price));
  if (!Number.isFinite(price) || price < 1 || price > 100000) {
    return reply(request, { success: false, message: "Price must be between 1 and 100000 rupees." }, 400);
  }
  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES ('plus_price', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(String(price)).run();
  return reply(request, { success: true, price });
}

export async function createPlusOrder(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return reply(request, { success: false, message: "Please enter a valid email address." }, 400);
  }

  const price = await getPrice(env);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: razorpayAuth(env), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: price * 100,
      currency: "INR",
      receipt: `plus_${Date.now()}`,
      notes: { email },
    }),
  });
  const order = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Razorpay order error:", res.status, JSON.stringify(order));
    return reply(request, { success: false, message: "Could not start payment. Please try again." }, 502);
  }

  return reply(request, {
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
    email,
    price,
  });
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPlusPayment(request, env) {
  const body = await request.json().catch(() => ({}));
  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  if (!orderId || !paymentId || !signature) {
    return reply(request, { success: false, message: "Missing payment details." }, 400);
  }

  // 1. The payment must be signed by Razorpay with our secret
  const expected = await hmacHex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
  if (!safeEqual(expected, signature)) {
    return reply(request, { success: false, message: "Payment could not be verified." }, 400);
  }

  // 2. Read the order from Razorpay to get the email and confirm it was paid
  const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: razorpayAuth(env) },
  });
  const order = await orderRes.json().catch(() => ({}));
  if (!orderRes.ok) {
    return reply(request, { success: false, message: "Could not confirm the order." }, 502);
  }
  const email = order.notes?.email;
  if (order.status !== "paid" || !isValidEmail(email)) {
    return reply(request, { success: false, message: "Payment is not completed." }, 400);
  }

  // 3. Mark the subscriber as Plus (safe to repeat)
  await env.DB.prepare(
    `INSERT INTO subscribers (email, token, active, plan, paymentId)
     VALUES (?, ?, 1, 'plus', ?)
     ON CONFLICT(email) DO UPDATE SET active = 1, plan = 'plus', paymentId = excluded.paymentId`
  ).bind(email, crypto.randomUUID(), paymentId).run();

  return reply(request, { success: true, plan: "plus" });
}
export async function plusStats(request, env) {
  if (!isAuthorized(request, env)) {
    return reply(request, { success: false, message: "Unauthorized" }, 401);
  }
  const price = await getPrice(env);
  const plusRow = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM subscribers WHERE plan = 'plus'"
  ).first();
  const freeRow = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM subscribers WHERE plan IS NULL OR plan != 'plus'"
  ).first();
  const buyers = await env.DB.prepare(
    "SELECT email, subscribedAt, active FROM subscribers WHERE plan = 'plus' ORDER BY id DESC"
  ).all();
  const plusCount = plusRow?.n || 0;
  return reply(request, {
    success: true,
    price,
    plusCount,
    freeCount: freeRow?.n || 0,
    estimatedRevenue: plusCount * price,
    buyers: buyers.results || [],
  });
}
export async function getPlusStatus(request, env) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'plus_enabled'").first();
  return reply(request, { success: true, enabled: row?.value === "1", price: await getPrice(env) });
}

export async function setPlusStatus(request, env) {
  if (!isAuthorized(request, env)) {
    return reply(request, { success: false, message: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => ({}));
  const enabled = body.enabled === true;
  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES ('plus_enabled', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(enabled ? "1" : "0").run();
  return reply(request, { success: true, enabled });
}