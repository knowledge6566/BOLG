-- ============================================================
-- BOLGERR DATABASE SCHEMA
-- Supports: SQLite, PostgreSQL, MySQL
-- ============================================================

-- POSTS TABLE
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  author VARCHAR(100),
  read_time VARCHAR(20),
  excerpt TEXT NOT NULL,
  body LONGTEXT,
  featured BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_published (published),
  INDEX idx_featured (featured),
  INDEX idx_date (created_at DESC)
);

-- CONTACTS TABLE
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(200),
  message LONGTEXT NOT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMP NULL,
  reply_message LONGTEXT,
  INDEX idx_email (email),
  INDEX idx_received (received_at DESC)
);

-- NEWSLETTER SUBSCRIBERS
CREATE TABLE subscribers (
  email VARCHAR(255) PRIMARY KEY,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  unsubscribed_at TIMESTAMP NULL,
  INDEX idx_active (active)
);

-- COMMENTS (Optional)
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_name VARCHAR(100),
  author_email VARCHAR(255),
  author_website VARCHAR(255),
  content TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_approved (approved)
);

-- USERS (Admin) — Optional
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'author') DEFAULT 'author',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);

-- STATS / ANALYTICS (Optional)
CREATE TABLE analytics (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  post_id INT,
  page_path VARCHAR(255),
  visitor_ip VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(255),
  visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_post (post_id),
  INDEX idx_page (page_path),
  INDEX idx_date (visit_at DESC)
);

-- ============================================================
-- SAMPLE QUERIES
-- ============================================================

-- Get all published posts
SELECT * FROM posts WHERE published = TRUE ORDER BY created_at DESC;

-- Get most popular posts
SELECT id, title, views FROM posts WHERE published = TRUE ORDER BY views DESC LIMIT 10;

-- Get posts by category
SELECT * FROM posts WHERE category = 'Technology' AND published = TRUE;

-- Search posts
SELECT * FROM posts WHERE published = TRUE AND (title LIKE '%AI%' OR excerpt LIKE '%AI%' OR body LIKE '%AI%');

-- Get subscriber count
SELECT COUNT(*) as total_subscribers FROM subscribers WHERE active = TRUE;

-- Get unread contact submissions
SELECT * FROM contacts WHERE read = FALSE ORDER BY received_at DESC;

-- Get post engagement stats
SELECT 
  p.id,
  p.title,
  COUNT(DISTINCT a.visitor_ip) as unique_visitors,
  COUNT(a.id) as total_views,
  COUNT(DISTINCT c.id) as comment_count
FROM posts p
LEFT JOIN analytics a ON p.id = a.post_id
LEFT JOIN comments c ON p.id = c.post_id AND c.approved = TRUE
GROUP BY p.id
ORDER BY total_views DESC;

-- ============================================================
-- IMPORT/EXPORT HELPERS (Node.js/Python)
-- ============================================================

-- IMPORT JSON TO SQLITE (Node.js with better-sqlite3)
/*
const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('bolgerr.db');
const posts = JSON.parse(fs.readFileSync('data/posts.json'));

const insert = db.prepare(`
  INSERT INTO posts (id, slug, title, category, emoji, author, read_time, excerpt, body, featured, views, published)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

posts.forEach(p => {
  insert.run(
    p.id, p.slug, p.title, p.category, p.emoji, p.author,
    p.readTime, p.excerpt, p.body, p.featured, p.views, p.published
  );
});

console.log(`Imported ${posts.length} posts to SQLite`);
*/

-- EXPORT SQLITE TO JSON (Python)
/*
import sqlite3
import json

conn = sqlite3.connect('bolgerr.db')
conn.row_factory = sqlite3.Row

cursor = conn.cursor()
cursor.execute('SELECT * FROM posts')

posts = [dict(row) for row in cursor.fetchall()]

with open('posts_backup.json', 'w') as f:
    json.dump(posts, f, indent=2, default=str)

print(f'Exported {len(posts)} posts to JSON')
*/

-- ============================================================
-- MIGRATION EXAMPLES
-- ============================================================

-- Add new column to posts
ALTER TABLE posts ADD COLUMN seo_keywords VARCHAR(255);
ALTER TABLE posts ADD COLUMN og_image_url VARCHAR(255);

-- Create index for faster queries
CREATE INDEX idx_posts_search ON posts(title, excerpt, body(100));

-- Add soft-delete support
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP NULL;

-- Rename column
ALTER TABLE contacts RENAME COLUMN message TO message_text;

-- ============================================================
-- BACKUP & RESTORE
-- ============================================================

-- BACKUP (MySQL)
/*
mysqldump -u root -p bolgerr > bolgerr_backup.sql
*/

-- RESTORE (MySQL)
/*
mysql -u root -p bolgerr < bolgerr_backup.sql
*/

-- BACKUP (SQLite)
/*
.backup bolgerr_backup.db
*/

-- RESTORE (SQLite)
/*
.restore bolgerr_backup.db
*/

-- ============================================================
-- OPTIMIZATION TIPS
-- ============================================================

/*
1. Add indexes on frequently queried columns:
   - published, category, featured (in posts)
   - email, active (in subscribers)
   - post_id, approved (in comments)

2. Analyze query performance:
   EXPLAIN SELECT * FROM posts WHERE category = 'Technology';

3. Optimize text searches:
   - Use FULLTEXT indexes for large content columns
   - Consider Elasticsearch for advanced search

4. Archive old data:
   - Move posts older than 2 years to archive table
   - Keeps main table lean and fast

5. Monitor table size:
   SELECT table_name, ROUND(((data_length+index_length)/1024/1024), 2) as size_mb
   FROM information_schema.TABLES
   WHERE table_schema = 'bolgerr';
*/
