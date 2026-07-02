/**
 * =============================================
 *   BOLGERR — Node.js / Express Backend
 *   Version: 1.0.0
 *   Stack: Node.js + Express + JSON file store
 * =============================================
 *
 * SETUP INSTRUCTIONS:
 *   1. npm install express cors nodemailer
 *   2. node server.js
 * 
 *   Server runs at http://localhost:3000
 *
 * API ENDPOINTS:
 *   GET    /api/posts             - All posts (optional ?category=Tech&search=...)
 *   GET    /api/posts/:id         - Single post
 *   POST   /api/posts             - Create post (admin)
 *   PUT    /api/posts/:id         - Update post (admin)
 *   DELETE /api/posts/:id         - Delete post (admin)
 *   POST   /api/contact           - Contact form submission
 *   POST   /api/newsletter        - Newsletter subscription
 *   GET    /api/subscribers       - List subscribers (admin)
 *   GET    /api/stats             - Site statistics
 *   GET    /api/categories        - All categories
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const net     = require('net');

const app  = express();
const PORT = Number(process.env.PORT) || 3000;

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const tester = net.createServer();
      tester.unref();
      tester.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          return tryPort(port + 1);
        }
        reject(err);
      });
      tester.listen(port, '0.0.0.0', () => {
        const address = tester.address();
        tester.close(() => resolve(address.port));
      });
    };

    tryPort(startPort);
  });
}

/* ─── Middleware ─────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname))); // Serve HTML/CSS/JS

/* ─── Simple JSON file "database" ───────────── */
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function readDB(file) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function writeDB(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

function quoteCsvCell(value) {
  if (value === undefined || value === null) return '';
  return `"${String(value).replace(/"/g, '""')}"`;
}

function appendContactCsv(entry) {
  const csvPath = path.join(DATA_DIR, 'contacts.csv');
  const header = 'id,firstName,lastName,email,subject,message,receivedAt,read\n';
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, header, 'utf-8');
  }
  const row = [
    entry.id,
    entry.firstName,
    entry.lastName,
    entry.email,
    entry.subject,
    entry.message,
    entry.receivedAt,
    entry.read,
  ].map(quoteCsvCell).join(',') + '\n';
  fs.appendFileSync(csvPath, row, 'utf-8');
}

/* ─── Seed posts if empty ────────────────────── */
function seedPosts() {
  if (readDB('posts.json').length > 0) return;
  const posts = [
    {
      id: 1, slug: 'small-language-models',
      title: 'The Quiet Revolution of Small Language Models',
      category: 'Technology', emoji: '🤖',
      author: 'Priya Sharma', readTime: '7 min',
      date: '2025-06-10',
      excerpt: 'Big AI grabs headlines, but the real shift is happening at the edge.',
      body: '<p>Every week, another headline announces the latest trillion-parameter behemoth...',
      featured: true, views: 3241, published: true,
    },
    {
      id: 2, slug: 'brutalist-web-design',
      title: 'Why Brutalist Web Design Is Making a Comeback',
      category: 'Design', emoji: '🏗️',
      author: 'Arjun Mehta', readTime: '5 min',
      date: '2025-06-08',
      excerpt: 'Raw, ugly, and deliberately uncomfortable — brutalism is challenging everything.',
      body: '<p>In 2015, brutalist web design was a punchline...',
      featured: false, views: 1890, published: true,
    },
    {
      id: 3, slug: 'disappearing-third-places',
      title: 'The Last Cafes: How Third Places Are Disappearing',
      category: 'Culture', emoji: '☕',
      author: 'Leila Nair', readTime: '9 min',
      date: '2025-06-05',
      excerpt: 'We are losing the spaces where community happens.',
      body: '<p>Ray Oldenburg\'s concept of the "third place"...',
      featured: true, views: 5120, published: true,
    },
    {
      id: 4, slug: 'crispr-at-10',
      title: 'CRISPR at 10: What We Got Right, What We Missed',
      category: 'Science', emoji: '🧬',
      author: 'Dr. Kavya Rao', readTime: '11 min',
      date: '2025-06-02',
      excerpt: 'A decade after CRISPR entered the clinic, we take stock.',
      body: '<p>When Jennifer Doudna and Emmanuelle Charpentier described CRISPR...',
      featured: false, views: 2870, published: true,
    },
    {
      id: 5, slug: 'daily-writing-practice',
      title: 'How to Build a Daily Writing Practice That Actually Sticks',
      category: 'Life', emoji: '📝',
      author: 'Arjun Mehta', readTime: '6 min',
      date: '2025-05-30',
      excerpt: 'Most writing routines fail in week two. Here\'s what actually works.',
      body: '<p>Jerry Seinfeld\'s calendar method. Morning pages...',
      featured: false, views: 4310, published: true,
    },
    {
      id: 6, slug: 'founders-trap',
      title: "The Founder's Trap: When Vision Becomes Blindness",
      category: 'Business', emoji: '💼',
      author: 'Priya Sharma', readTime: '8 min',
      date: '2025-05-27',
      excerpt: "The qualities that make founders successful can also destroy companies.",
      body: '<p>There\'s a particular kind of cognitive distortion that affects brilliant founders...',
      featured: false, views: 1560, published: true,
    },
  ];
  writeDB('posts.json', posts);
  console.log('✓ Seeded posts.json with', posts.length, 'articles');
}

seedPosts();

/* ═══════════════════════════════════════════════
   POSTS API
   ═══════════════════════════════════════════════ */
// GET /api/posts  — list all posts with optional filters
// Use ?admin=true to get ALL posts (including drafts) for the admin panel
app.get('/api/posts', (req, res) => {
  const allPostsRaw = readDB('posts.json');
  // Admin mode: return every post regardless of published/draft status
  let posts = req.query.admin === 'true'
    ? allPostsRaw
    : allPostsRaw.filter(p => p.published);
  const { category, search, featured, limit, sort } = req.query;

  if (category && category !== 'All') {
    posts = posts.filter(p => p.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q)
    );
  }
  if (featured === 'true') {
    posts = posts.filter(p => p.featured);
  }
  if (sort === 'views') {
    posts.sort((a, b) => b.views - a.views);
  } else {
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  if (limit) posts = posts.slice(0, parseInt(limit));

  res.json({ success: true, count: posts.length, data: posts });
});

// GET /api/posts/:id  — single post (also increments view count)
app.get('/api/posts/:id', (req, res) => {
  const posts = readDB('posts.json');
  const idx   = posts.findIndex(p => p.id === parseInt(req.params.id) || p.slug === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Post not found' });

  posts[idx].views = (posts[idx].views || 0) + 1;
  writeDB('posts.json', posts);

  res.json({ success: true, data: posts[idx] });
});

// POST /api/posts  — create a new post
app.post('/api/posts', (req, res) => {
  const { title, category, emoji, author, readTime, excerpt, body, featured } = req.body;
  if (!title || !category || !excerpt) {
    return res.status(400).json({ success: false, message: 'title, category, and excerpt are required' });
}

  const posts = readDB('posts.json');
  const newPost = {
    id: posts.length ? Math.max(...posts.map(p=>p.id)) + 1 : 1,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''),
    title, category, emoji: emoji || '📄',
    author: author || 'Anonymous',
    readTime: readTime || '5 min',
    date: new Date().toISOString().split('T')[0],
    excerpt, body: body || '',
    featured: featured === true || featured === 'true',
    views: 0, published: true,
  };

  posts.push(newPost);
  writeDB('posts.json', posts);
  res.status(201).json({ success: true, data: newPost });
});

// PUT /api/posts/:id  — update a post
app.put('/api/posts/:id', (req, res) => {
  const posts = readDB('posts.json');
  const idx   = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Post not found' });

  posts[idx] = { ...posts[idx], ...req.body, id: posts[idx].id };
  writeDB('posts.json', posts);
  res.json({ success: true, data: posts[idx] });
});

// DELETE /api/posts/:id  — delete (soft-delete by setting published=false)
app.delete('/api/posts/:id', (req, res) => {
  const posts = readDB('posts.json');
  const idx   = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Post not found' });

  posts[idx].published = false;
  writeDB('posts.json', posts);
  res.json({ success: true, message: 'Post archived successfully' });
});

/* ═══════════════════════════════════════════════
   CONTACT FORM API
   ═══════════════════════════════════════════════ */
app.post('/api/contact', (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  // Validation
  if (!firstName || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  // Save to local store
  const contacts = readDB('contacts.json');
  const entry = {
    id: Date.now(),
    firstName, lastName, email, subject, message,
    receivedAt: new Date().toISOString(),
    read: false,
  };
  contacts.push(entry);
  writeDB('contacts.json', contacts);
  appendContactCsv(entry);

  // ─── EMAIL (configure SMTP in production) ─────────────────────
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({ host:'smtp.example.com', port:587, auth:{user:'',pass:''} });
  // transporter.sendMail({ from:'noreply@bolgerr.com', to:'hello@bolgerr.com', subject:`[Bolgerr] ${subject}`, text:message });
  // ──────────────────────────────────────────────────────────────

  console.log(`📧  New contact from ${firstName} ${lastName} <${email}> — "${subject}"`);
  res.status(200).json({ success: true, message: "Your message has been received! We'll reply within 24–48 hours." });
});

// GET /api/contacts  — admin: list all contacts
app.get('/api/contacts', (req, res) => {
  const contacts = readDB('contacts.json');
  res.json({ success: true, count: contacts.length, data: contacts });
});

// PATCH /api/contacts/:id/read  — mark one contact as read
app.patch('/api/contacts/:id/read', (req, res) => {
  const contacts = readDB('contacts.json');
  const idx = contacts.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Contact not found' });
  contacts[idx].read = true;
  writeDB('contacts.json', contacts);
  res.json({ success: true });
});

// PATCH /api/contacts/mark-all-read  — mark all contacts as read
app.patch('/api/contacts/mark-all-read', (req, res) => {
  const contacts = readDB('contacts.json');
  contacts.forEach(c => { c.read = true; });
  writeDB('contacts.json', contacts);
  res.json({ success: true });
});

/* ═══════════════════════════════════════════════
   NEWSLETTER API
   ═══════════════════════════════════════════════ */
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const subs = readDB('subscribers.json');
  if (subs.find(s => s.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, message: 'You\'re already subscribed! 🎉' });
  }

  subs.push({ email, subscribedAt: new Date().toISOString(), active: true });
  writeDB('subscribers.json', subs);

  console.log(`✉️  New subscriber: ${email}`);
  res.status(201).json({ success: true, message: 'Welcome to Bolgerr! Check your inbox for a confirmation.' });
});

// GET /api/subscribers  — admin view
app.get('/api/subscribers', (req, res) => {
  const subs = readDB('subscribers.json');
  res.json({ success: true, count: subs.length, data: subs });
});

/* ═══════════════════════════════════════════════
   STATS & CATEGORIES API
   ═══════════════════════════════════════════════ */
app.get('/api/stats', (req, res) => {
  const posts = readDB('posts.json').filter(p => p.published);
  const subs  = readDB('subscribers.json');
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const cats  = [...new Set(posts.map(p => p.category))];

  res.json({
    success: true,
    data: {
      totalPosts: posts.length,
      totalViews,
      totalSubscribers: subs.length,
      categories: cats.length,
      mostRead: posts.sort((a,b)=>b.views-a.views).slice(0,3).map(p=>({id:p.id,title:p.title,views:p.views})),
    }
  });
});

app.get('/api/categories', (req, res) => {
  const posts = readDB('posts.json').filter(p => p.published);
  const catCount = {};
  posts.forEach(p => { catCount[p.category] = (catCount[p.category]||0)+1; });
  const categories = Object.entries(catCount).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  res.json({ success: true, data: categories });
});

/* ═══════════════════════════════════════════════
   SERVE FRONTEND (SPA fallback)
   ═══════════════════════════════════════════════ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ─── 404 Handler ───────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

/* ─── Error Handler ─────────────────────────── */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

/* ─── Start ─────────────────────────────────── */
(async () => {
  try {
    const RUN_PORT = await findAvailablePort(PORT);
    app.listen(RUN_PORT, () => {
      console.log(`\n🚀  Bolgerr backend running at http://localhost:${RUN_PORT}`);
      console.log(`📖  API docs:`);
      console.log(`     GET  /api/posts              List all posts`);
      console.log(`     GET  /api/posts/:id          Single post`);
      console.log(`     POST /api/posts              Create post`);
      console.log(`     POST /api/contact            Submit contact form`);
      console.log(`     POST /api/newsletter         Subscribe to newsletter`);
      console.log(`     GET  /api/stats              Site statistics`);
      console.log(`     GET  /api/categories         All categories\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();