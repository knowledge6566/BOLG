const CP1252 = {
  8364: 128, 8218: 130, 402: 131, 8222: 132, 8230: 133, 8224: 134, 8225: 135,
  710: 136, 8240: 137, 352: 138, 8249: 139, 338: 140, 381: 142, 8216: 145,
  8217: 146, 8220: 147, 8221: 148, 8226: 149, 8211: 150, 8212: 151, 8209: 145,
  732: 152, 8482: 153, 353: 154, 8250: 155, 339: 156, 382: 158, 376: 159,
};

const MOJIBAKE_RUN = /[\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2011\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]+/g;

export function fixMojibake(s) {
  if (!s) return "";
  return s.replace(MOJIBAKE_RUN, run => {
    if (!/[\u00C2-\u00F4]/.test(run)) return run;
    const bytes = [];
    for (const ch of run) {
      const cp = ch.codePointAt(0);
      bytes.push(CP1252[cp] !== undefined ? CP1252[cp] : cp);
    }
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
    } catch {
      return run;
    }
  });
}

function parseJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1];
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("AI did not return JSON.");
  const json = text.slice(first, last + 1);
  try {
    return JSON.parse(json);
  } catch {
    const cleaned = json
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u0000-\u001F]+/g, " ");
    return JSON.parse(cleaned);
  }
}

function markdownToHtml(md) {
  let s = md.trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  s = s.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  s = s.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  s = s.replace(/^# (.+)$/gm, "<h2>$1</h2>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
  s = s.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);

  return s
    .split(/\n{2,}/)
    .map(x => x.trim())
    .filter(Boolean)
    .map(block => /^<(h2|h3|ul|ol|blockquote)/.test(block)
      ? block
      : `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

const COVER_IMAGE_FALLBACKS = {
  Technology: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  Design: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80",
  Culture: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
  Science: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
  Life: "https://images.unsplash.com/photo-1500534623283-312aede485b7?auto=format&fit=crop&w=1200&q=80",
  Business: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  Entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
};

async function findCoverImage(title, category, usedImages = new Set()) {
  const query = encodeURIComponent(`${title} ${category}`);
  const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;
  try {
    const response = await fetch(endpoint, { headers: { "User-Agent": "NishuBlogs/1.0" } });
    if (!response.ok) throw new Error(`Wikimedia image search failed: HTTP ${response.status}`);
    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});
    const image = pages
      .map(page => page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url || "")
      .find(url => url && !usedImages.has(url));
    return image || "";
  } catch (error) {
    console.warn(`Cover image search failed: ${error.message}`);
    return "";
  }
}

function fallbackCoverImage(category) {
  return COVER_IMAGE_FALLBACKS[category] || COVER_IMAGE_FALLBACKS.Technology;
}

async function callModel(env, model, prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error ${res.status} (${model}): ${await res.text()}`);

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`OpenRouter returned no content (${model}).`);
  return text;
}

async function generateAndSave(env, model) {
  const categories = (env.BLOG_CATEGORIES || "Technology").split(",").map(s => s.trim());
  const words = Number(env.ARTICLE_WORDS || 1200);
  const focus = env.TOPIC_FOCUS || "technology, AI, web development, software, design, internet";

  const { results } = await env.DB
    .prepare("SELECT title FROM posts ORDER BY id DESC LIMIT 30")
    .all();
  const previousTopics = results.map((r, i) => `${i + 1}. ${r.title}`).join("\n") || "(none)";
  const existingCovers = await env.DB
    .prepare("SELECT coverImage FROM posts WHERE coverImage IS NOT NULL AND trim(coverImage) != ''")
    .all();
  const usedImages = new Set(existingCovers.results.map(row => row.coverImage));

  const prompt = `
You are the editorial AI for Bolgerr .

Choose ONE useful, original topic for today's blog article.

Main focus:
${focus}

Previously used topics (do not repeat these):
${previousTopics}

Write approximately ${words} words.

Rules:
- Write original content.
- Do not invent statistics, quotes or studies.
- Avoid medical, legal and financial advice.
- Use clear H2 and H3 headings.
- No title inside contentMarkdown.
- Use natural English and make it SEO-friendly without keyword stuffing.

Return ONLY valid JSON. No text before or after the JSON.
Use only straight double quotes. Do not put line breaks inside string values; write \\n instead.

{
  "title": "Article title",
  "excerpt": "Short 1-2 sentence summary",
  "category": "one of the allowed categories",
  "emoji": "one emoji",
  "readTime": "6 min",
  "contentMarkdown": "Full article in markdown"
}
Pick the category that best fits the topic you chose. Use only the allowed categories, and choose the most specific one. Do not default to the first one.
Allowed categories: ${categories.join(", ")}
`;

  const text = await callModel(env, model, prompt);

  const article = parseJson(text);
  article.title = fixMojibake(article.title);
  article.excerpt = fixMojibake(article.excerpt);
  article.contentMarkdown = fixMojibake(article.contentMarkdown);

  if (!article.title || !article.excerpt || !article.contentMarkdown) {
    throw new Error("AI returned an incomplete article.");
  }
  const matched = categories.find(c => c.toLowerCase() === String(article.category || "").trim().toLowerCase());
  article.category = matched || (env.DEFAULT_CATEGORY || categories[0]);
  const coverImage = await findCoverImage(article.title, article.category, usedImages) || fallbackCoverImage(article.category);

  await env.DB.prepare(
    `INSERT INTO posts (title, excerpt, body, author, readTime, category, emoji, coverImage, featured, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`
  ).bind(
    article.title,
    article.excerpt,
    markdownToHtml(article.contentMarkdown),
    env.BLOG_AUTHOR || "Bolgerr ",
    article.readTime || "6 min",
    article.category,
    article.emoji || "📝",
    coverImage
  ).run();

  return article.title;
}

export async function publishDailyArticle(env) {
  const models = (env.OPENROUTER_MODELS || "openrouter/free")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const model = models[(attempt - 1) % models.length];
    try {
      return await generateAndSave(env, model);
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 15000));
      }
    }
  }
  throw lastError;
}