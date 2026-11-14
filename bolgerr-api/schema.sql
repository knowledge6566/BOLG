CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  body TEXT DEFAULT '',
  author TEXT DEFAULT 'Anonymous',
  readTime TEXT DEFAULT '5 min',
  category TEXT DEFAULT 'Technology',
  emoji TEXT DEFAULT '📝',
  coverImage TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,
  views INTEGER DEFAULT 0,
  postDate TEXT DEFAULT (date('now')),
  seoTitle TEXT DEFAULT '',
  slug TEXT DEFAULT '',
  metaDescription TEXT DEFAULT '',
  keyword TEXT DEFAULT '',
  labels TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT DEFAULT '',
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  receivedAt TEXT DEFAULT (datetime('now')),
  isRead INTEGER DEFAULT 0
);