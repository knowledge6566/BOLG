/**
 * Bolgerr  — Node.js / Express Backend
 * Version: 2.0.0 — Supabase (Postgres) data store
 *
 * ENV VARS (set on your host, never commit):
 *   ADMIN_USER, ADMIN_PASS_HASH, JWT_SECRET
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *   PORT (optional)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

/* ─── Config ─── */
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ADMIN_USER || !ADMIN_PASS_HASH || !JWT_SECRET) {
  console.warn('⚠️  ADMIN_USER, ADMIN_PASS_HASH or JWT_SECRET missing. Admin login disabled.');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ─── Middleware ─── */
app.use(cors({ origin: 'https://knowledge6566.github.io' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ─── Helpers ─── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function requireAdmin(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Convert DB row (snake_case) to the shape the frontend expects (camelCase)
function toPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    emoji: row.emoji,
    author: row.author,
    readTime: row.read_time,
    date: row.date,
    excerpt: row.excerpt,
    body: row.body,
    featured: row.featured,
    views: row.views,
    published: row.published,
  };
}

// Convert frontend fields to DB columns
const POST_FIELD_MAP = {
  title: 'title',
  category: 'category',
  emoji: 'emoji',
  author: 'author',
  readTime: 'read_time',
  date: 'date',
  excerpt: 'excerpt',
  body: 'body',
  featured: 'featured',
  views: 'views',
  published: 'published',
  slug: 'slug',
};

function toRow(body) {
  const row = {};
  for (const [key, col] of Object.entries(POST_FIELD_MAP)) {
    if (body[key] !== undefined) row[col] = body[key];
  }
  return row;
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ═══════════════════════════════════════════════
   ADMIN LOGIN
   ═══════════════════════════════════════════════ */
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!ADMIN_USER || !ADMIN_PASS_HASH || !JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Server admin auth is not configured.' });
  }
  if (username !== ADMIN_USER) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password || '', ADMIN_PASS_HASH);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ success: true, token });
});

/* ═══════════════════════════════════════════════
   POSTS API
   ═══════════════════════════════════════════════ */

// GET /api/posts — public; ?admin=true with valid token shows drafts
app.get('/api/posts', async (req, res) => {
  try {
    let wantsAdminView = req.query.admin === 'true';
    if (wantsAdminView) {
      try {
        jwt.verify(getToken(req) || '', JWT_SECRET);
      } catch {
        wantsAdminView = false;
      }
    }

    let query = supabase.from('posts').select('*');
    if (!wantsAdminView) query = query.eq('published', true);

    const { category, search, featured, limit, sort } = req.query;

    if (category && category !== 'All') query = query.eq('category', category);
    if (featured === 'true') query = query.eq('featured', true);
    if (search) {
      const q = String(search).replace(/[%,]/g, '');
      query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,author.ilike.%${q}%`);
    }

    if (sort === 'views') query = query.order('views', { ascending: false });
    else query = query.order('date', { ascending: false });

    if (limit) query = query.limit(parseInt(limit, 10));

    const { data, error } = await query;
    if (error) throw error;

    const posts = data.map(toPost);
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load posts' });
  }
});

// GET /api/posts/:idOrSlug — single post, increments views
app.get('/api/posts/:idOrSlug', async (req, res) => {
  try {
    const key = req.params.idOrSlug;
    const isId = /^\d+$/.test(key);

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq(isId ? 'id' : 'slug', isId ? Number(key) : key)
      .maybeSingle();
    if (error) throw error;
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Increment views
    await supabase.from('posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id);

    res.json({ success: true, data: toPost({ ...post, views: (post.views || 0) + 1 }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load post' });
  }
});

// POST /api/posts — create (admin)
app.post('/api/posts', requireAdmin, async (req, res) => {
  try {
    const { title, category, excerpt } = req.body;
    if (!title || !category || !excerpt) {
      return res.status(400).json({ success: false, message: 'title, category, and excerpt are required' });
    }

    const row = {
      ...toRow(req.body),
      slug: req.body.slug || slugify(title),
      emoji: req.body.emoji || '📄',
      author: req.body.author || 'Anonymous',
      read_time: req.body.readTime || '5 min',
      date: new Date().toISOString().split('T')[0],
      body: req.body.body || '',
      featured: req.body.featured === true || req.body.featured === 'true',
      views: 0,
      published: true,
    };
    delete row.readTime;

    const { data, error } = await supabase.from('posts').insert(row).select().single();
    if (error) throw error;

    res.status(201).json({ success: true, data: toPost(data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// PUT /api/posts/:id — update (admin)
app.put('/api/posts/:id', requireAdmin, async (req, res) => {
  try {
    const row = toRow(req.body);
    delete row.id;

    const { data, error } = await supabase
      .from('posts')
      .update(row)
      .eq('id', Number(req.params.id))
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Post not found' });

    res.json({ success: true, data: toPost(data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id — soft delete (admin)
app.delete('/api/posts/:id', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ published: false })
      .eq('id', Number(req.params.id))
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Post not found' });

    res.json({ success: true, message: 'Post archived successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to archive post' });
  }
});

/* ═══════════════════════════════════════════════
   CONTACT FORM API
   ═══════════════════════════════════════════════ */

app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;
    if (!firstName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const { error } = await supabase.from('contacts').insert({
      first_name: firstName,
      last_name: lastName || '',
      email,
      subject,
      message,
      read: false,
    });
    if (error) throw error;

    console.log(`📧  New contact from ${firstName} ${lastName || ''} <${email}> — "${subject}"`);
    res.status(200).json({
      success: true,
      message: "Your message has been received! We'll reply within 24–48 hours.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to submit message.' });
  }
});

// GET /api/contacts — admin
app.get('/api/contacts', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('received_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: 'Failed to load contacts' });
  res.json({ success: true, count: data.length, data });
});

// PATCH /api/contacts/:id/read — admin
app.patch('/api/contacts/:id/read', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('contacts')
    .update({ read: true })
    .eq('id', Number(req.params.id))
    .select()
    .maybeSingle();
  if (error) return res.status(500).json({ success: false, message: 'Update failed' });
  if (!data) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true });
});

// PATCH /api/contacts/mark-all-read — admin
app.patch('/api/contacts/mark-all-read', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('contacts').update({ read: true }).eq('read', false);
  if (error) return res.status(500).json({ success: false, message: 'Update failed' });
  res.json({ success: true });
});

/* ═══════════════════════════════════════════════
   NEWSLETTER API
   ═══════════════════════════════════════════════ */

app.post('/api/newsletter', async (req, res) => {
  try {
    const email = (req.body.email || '').trim();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const { error } = await supabase.from('subscribers').insert({ email: email.toLowerCase() });
    if (error) {
      // 23505 = unique violation in Postgres
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: "You're already subscribed! 🎉" });
      }
      throw error;
    }

    console.log(`✉️  New subscriber: ${email}`);
    res.status(201).json({
      success: true,
      message: 'Welcome to Bolgerr ! Check your inbox for a confirmation.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Subscription failed.' });
  }
});

// GET /api/subscribers — admin
app.get('/api/subscribers', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('subscribers').select('*');
  if (error) return res.status(500).json({ success: false, message: 'Failed to load subscribers' });
  res.json({ success: true, count: data.length, data });
});

/* ═══════════════════════════════════════════════
   STATS & CATEGORIES API
   ═══════════════════════════════════════════════ */

app.get('/api/stats', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, views, category')
      .eq('published', true);
    if (error) throw error;

    const { count: subCount } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const categories = new Set(posts.map(p => p.category));
    const mostRead = [...posts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 3)
      .map(p => ({ id: p.id, title: p.title, views: p.views }));

    res.json({
      success: true,
      data: {
        totalPosts: posts.length,
        totalViews,
        totalSubscribers: subCount || 0,
        categories: categories.size,
        mostRead,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
});

app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('category')
    .eq('published', true);
  if (error) return res.status(500).json({ success: false, message: 'Failed to load categories' });

  const counts = {};
  data.forEach(({ category }) => {
    counts[category] = (counts[category] || 0) + 1;
  });
  const categories = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  res.json({ success: true, data: categories });
});

/* ═══════════════════════════════════════════════
   FRONTEND FALLBACK & ERRORS
   ═══════════════════════════════════════════════ */

// Serve index.html for non-API routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

/* ─── Start ─── */
app.listen(PORT, () => {
  console.log(`\n🚀  Bolgerr  backend running on port ${PORT}`);
});