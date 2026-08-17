import "dotenv/config";
import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";

const required = [
  "OPENROUTER_API_KEY",
  "BLOG_ADMIN_URL",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key} in .env`);
  }
}

const historyFile = path.resolve(
  process.env.HISTORY_FILE || "./data/topic-history.json"
);

async function readHistory() {
  try {
    return JSON.parse(await fs.readFile(historyFile, "utf8"));
  } catch {
    return [];
  }
}

async function saveHistory(history) {
  await fs.mkdir(path.dirname(historyFile), { recursive: true });
  await fs.writeFile(
    historyFile,
    JSON.stringify(history.slice(-100), null, 2)
  );
}

function cleanJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced) {
    text = fenced[1];
  }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error("AI did not return JSON.");
  }

  let json = text.slice(first, last + 1);

  try {
    return JSON.parse(json);
  } catch (error) {
    console.error("AI returned invalid JSON:");
    console.error(json);
    throw error;
  }
}

function markdownToHtml(md) {
  let s = md.trim();

  // Escape HTML
  s = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  s = s.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  s = s.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  s = s.replace(/^# (.+)$/gm, "<h2>$1</h2>");

  // Bold / italic
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Lists
  s = s.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
  s = s.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

  const blocks = s
    .split(/\n{2,}/)
    .map((x) => x.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      if (/^<(h2|h3|ul|ol|blockquote)/.test(block)) {
        return block;
      }

      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

async function generateArticle() {
  const history = await readHistory();

  const focus =
    process.env.TOPIC_FOCUS ||
    "technology, AI, web development, software, design, internet";

  const words = Number(process.env.ARTICLE_WORDS || 1200);

  const categories = (
    process.env.BLOG_CATEGORIES ||
    "Technology"
  )
    .split(",")
    .map((s) => s.trim());

  const previousTopics =
    history
      .slice(-30)
      .map((x, i) => `${i + 1}. ${x.title}`)
      .join("\n") || "(none)";

  const prompt = `
You are the editorial AI for Nishu Blogs.

Choose ONE useful, original topic for today's blog article.

Main focus:
${focus}

Previously used topics:
${previousTopics}

Write approximately ${words} words.

Audience:
General internet readers.

Rules:
- Write original content.
- Do not copy existing articles.
- Do not invent statistics.
- Do not invent quotes.
- Do not invent studies.
- Avoid medical, legal and financial advice.
- Use clear H2 and H3 headings.
- No title inside contentMarkdown.
- Make the article useful and engaging.
- Use natural English.
- Make the article SEO-friendly without keyword stuffing.

Return ONLY valid JSON.

IMPORTANT:
Do not put any text before or after the JSON.

Format:

{
  "title": "Article title",
  "excerpt": "Short 1-2 sentence summary",
  "category": "Technology",
  "emoji": "🤖",
  "readTime": "6 min",
  "contentMarkdown": "Full article in markdown"
}

Allowed categories:
${categories.join(", ")}
`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const text = response.data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenRouter returned no AI response.");
  }

  console.log("AI article generated.");

  const article = cleanJson(text);

  if (
    !article.title ||
    !article.excerpt ||
    !article.contentMarkdown
  ) {
    throw new Error("AI returned an incomplete article.");
  }

  if (!categories.includes(article.category)) {
    article.category = categories[0];
  }

  article.contentHtml = markdownToHtml(
    article.contentMarkdown
  );

  return article;
}

async function loginToBlog() {
  /*
   * BLOG_ADMIN_URL is:
   * https://nishublogs.online/admin.html/
   *
   * The API is on the same server.
   */

  const baseUrl = new URL(
    process.env.BLOG_ADMIN_URL
  ).origin;

  const loginUrl = `${baseUrl}/api/admin/login`;

  console.log("Logging into blog API...");

  const response = await axios.post(loginUrl, {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  });

  if (!response.data?.success || !response.data?.token) {
    throw new Error(
      response.data?.message || "Blog login failed."
    );
  }

  console.log("Blog API login successful.");

  return {
    baseUrl,
    token: response.data.token
  };
}

async function publishArticle(article) {
  const { baseUrl, token } = await loginToBlog();

  const postUrl = `${baseUrl}/api/posts`;

  console.log("Publishing article...");

  const response = await axios.post(
    postUrl,
    {
      title: article.title,
      category: article.category,
      emoji: article.emoji || "📝",
      author: process.env.BLOG_AUTHOR || "Nishu Blogs",
      readTime: article.readTime || "6 min",
      excerpt: article.excerpt,
      body: article.contentHtml,
      featured: false
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || "Blog publishing failed."
    );
  }

  const post = response.data.data;

  console.log("");
  console.log("====================================");
  console.log("ARTICLE PUBLISHED SUCCESSFULLY");
  console.log("====================================");
  console.log(`Title: ${post.title}`);
  console.log(`Category: ${post.category}`);
  console.log(`Slug: ${post.slug}`);
  console.log(`Date: ${post.date}`);
  console.log(`Published: ${post.published}`);
  console.log("====================================");

  return post;
}

export async function run({ dryRun = false } = {}) {
  console.log("");
  console.log(
    new Date().toISOString(),
    dryRun ? "DRY RUN" : "RUN"
  );

  const article = await generateArticle();

  console.log(`Generated title: ${article.title}`);

  if (dryRun) {
    console.log("");
    console.log("DRY RUN COMPLETE");
    console.log("Article was generated but NOT published.");
    console.log("");
    console.log(`Title: ${article.title}`);
    console.log(`Category: ${article.category}`);
    console.log(`Read time: ${article.readTime}`);
    return;
  }

  const post = await publishArticle(article);

  const history = await readHistory();

  history.push({
    title: post.title,
    date: post.date,
    category: post.category,
    slug: post.slug
  });

  await saveHistory(history);
}

if (
  process.argv[1] &&
  process.argv[1].endsWith("agent.js")
) {
  run().catch((err) => {
    console.error("");
    console.error("AI BLOG AGENT FAILED");
    console.error("");
    console.error(
      err.response?.data || err.message || err
    );
    process.exit(1);
  });
}
