# Bolgerr  — Daily AI Blog Agent

This runner triggers the deployed AI agent through the Bolgerr API.
Article generation and database access run in the Cloudflare Worker.

## 1. Install

Open Terminal and go to this folder:

```bash
cd "nishu ai blog agent"
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
BLOG_API_URL=https://your-worker.workers.dev
ADMIN_USERNAME=YOUR_ADMIN_USERNAME
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
```

Do not share `.env` with anyone.

## 3. First test — NO publishing

Run:

```bash
npm test
```

This checks that the API is reachable and reads the published post list.
It does not generate or publish an article.

## 4. Test real publishing ONCE

Then:

```bash
npm run publish-now
```

This publishes one article.

## 5. Daily automation

The deployed Cloudflare Worker schedules daily publication. Use
`npm run publish-now` only when you intentionally want to publish one additional article.
