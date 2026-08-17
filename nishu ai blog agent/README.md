# Nishu Blogs — Daily AI Blog Agent

This version is designed for the custom admin panel at:

https://nishublogs.online/admin.html/

It uses:
- OpenAI Responses API to write the article
- Playwright to operate the existing admin panel
- node-style scheduling through the operating system/hosting process
- a local topic history to reduce repeated topics

## 1. Install

Open Terminal and go to this folder:

```bash
cd ~/Desktop/ai-blog-agent
```

Install packages:

```bash
npm install
```

Install the Chromium browser used by Playwright:

```bash
npm run install-browser
```

## 2. Create .env

Copy:

```bash
cp .env.example .env
```

Open it:

```bash
nano .env
```

Set:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
BLOG_ADMIN_URL=https://nishublogs.online/admin.html/
ADMIN_USERNAME=YOUR_ADMIN_USERNAME
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
AUTO_PUBLISH=false
SCHEDULE_TIME=0 9 * * *
```

Do not share `.env` with anyone.

## 3. First test — NO publishing

Run:

```bash
npm test
```

This generates an article, opens the admin page, fills the form, but does NOT publish.

A screenshot called `dry-run-preview.png` should be created.

## 4. Test real publishing ONCE

Only after the dry run looks correct:

```env
AUTO_PUBLISH=true
```

Then:

```bash
npm run publish-now
```

This publishes one article.

## 5. Daily automation

For a simple local test, run:

```bash
npm start
```

For a real 24/7 daily agent, do not rely on your Mac being awake. Deploy this folder to a server/hosting service that supports a long-running Node.js process or use a scheduled job.

## Important

The first version intentionally does NOT auto-generate a cover image. Get text publishing working first. Image automation can be added after the publisher is confirmed.

If the agent says "Title field not found", "article editor not found", or "Publish Post button not found", send the exact terminal error. Those are selector/integration issues and can be fixed without rebuilding the whole agent.
