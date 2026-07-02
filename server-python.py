#!/usr/bin/env python3
"""
=====================================================
BOLGERR — Python Flask Backend
Version: 1.0.0
Stack: Python 3.7+ + Flask + JSON file store
=====================================================

SETUP:
    pip install -r requirements.txt
    python server-python.py

Server runs at http://localhost:5000(or next available port)

API ENDPOINTS:
    GET    /api/posts              All posts (with filters)
    GET    /api/posts/<id>         Single post
    POST   /api/posts              Create post
    PUT    /api/posts/<id>         Update post
    DELETE /api/posts/<id>         Delete post
    GET    /api/categories         All categories
    GET    /api/stats              Site statistics
    POST   /api/contact            Contact form submission
    GET    /api/contact            List contact submissions (admin)
    POST   /api/newsletter         Newsletter subscription
    GET    /api/subscribers        List subscribers (admin)
"""
from flask import Flask, jsonify, request, send_from_directory, send_file
import flask_cors
from datetime import datetime
import json
import os
import socket
from pathlib import Path
import re

# ─────────────────────────────────────────────────
# FLASK APP SETUP
# ─────────────────────────────────────────────────
app = Flask(__name__, static_folder='.', static_url_path='')
flask_cors.CORS(app)

PORT = int(os.environ.get('PORT', 5000))
DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(exist_ok=True)


def find_available_port(start_port: int) -> int:
    """Return the first free port starting from start_port."""
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(('0.0.0.0', port))
                return port
            except OSError:
                port += 1

# ─────────────────────────────────────────────────
# DATA STORE HELPERS
# ─────────────────────────────────────────────────
def read_db(filename: str) -> list:
    """Read JSON file from data directory."""
    filepath = DATA_DIR / filename

    if not filepath.exists():
        return []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def write_db(filename: str, data: list) -> None:
    """Write data to JSON file in data directory."""
    filepath = DATA_DIR / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def seed_posts():
    """Initialize posts if database is empty."""
    if read_db('posts.json'):
        return

    posts = [
        {
            "id": 1,
            "slug": "small-language-models",
            "title": "The Quiet Revolution of Small Language Models",
            "category": "Technology",
            "emoji": "🤖",
            "author": "Priya Sharma",
            "readTime": "7 min",
            "date": "2025-06-10",
            "excerpt": "Big AI is grabbing headlines, but the real shift is happening at the edge — where models that run on your phone are changing everything.",
            "body": "<p>Every week, another headline announces the latest trillion-parameter behemoth. But quietly, in labs and startups far from Silicon Valley, something more interesting is happening: language models are shrinking, and in shrinking, they are becoming far more powerful in practice.</p><h2>Why Size Isn't Everything</h2><p>The obsession with scale made sense in 2020. More parameters, more data, more compute — the scaling laws suggested this was the only game in town. But 2025 looks different...</p>",
            "featured": True,
            "views": 3241,
            "published": True
        },
        {
            "id": 2,
            "slug": "brutalist-web-design",
            "title": "Why Brutalist Web Design Is Making a Comeback",
            "category": "Design",
            "emoji": "🏗️",
            "author": "Arjun Mehta",
            "readTime": "5 min",
            "date": "2025-06-08",
            "excerpt": "Raw, ugly, and deliberately uncomfortable — brutalism is challenging everything we thought we knew about 'good' design.",
            "body": "<p>In 2015, brutalist web design was a punchline. Ugly grids, mismatched fonts, raw HTML aesthetics — everything the UX community had worked to leave behind. By 2025, it's the hottest thing in digital design...</p>",
            "featured": False,
            "views": 1890,
            "published": True
        },
        {
            "id": 3,
            "slug": "disappearing-third-places",
            "title": "The Last Cafes: How Third Places Are Disappearing",
            "category": "Culture",
            "emoji": "☕",
            "author": "Leila Nair",
            "readTime": "9 min",
            "date": "2025-06-05",
            "excerpt": "We are losing the spaces where community happens — not to housing or commerce, but to something more subtle and more dangerous.",
            "body": "<p>Ray Oldenburg's concept of the 'third place' — neither home nor work, but the community gathering spot in between — has guided urban planners for decades...</p>",
            "featured": True,
            "views": 5120,
            "published": True
        },
    ]
    write_db('posts.json', posts)
    print(f'✓ Seeded posts.json with {len(posts)} articles')

# ═══════════════════════════════════════════════════
# ROUTES — POSTS API
# ═══════════════════════════════════════════════════

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """List all posts with optional filtering."""
    posts = [p for p in read_db('posts.json') if p.get('published', True)]

    # Filters
    category = request.args.get('category')
    search = request.args.get('search', '').lower()
    featured = request.args.get('featured', '').lower() == 'true'
    limit = request.args.get('limit', type=int)
    sort = request.args.get('sort', 'date')

    if category and category != 'All':
        posts = [p for p in posts if p.get('category') == category]

    if search:
        posts = [p for p in posts if search in p.get('title', '').lower()
                 or search in p.get('excerpt', '').lower()
                 or search in p.get('author', '').lower()]

    if featured:
        posts = [p for p in posts if p.get('featured', False)]

    # Sorting
    if sort == 'views':
        posts.sort(key=lambda p: p.get('views', 0), reverse=True)
    else:
        posts.sort(key=lambda p: p.get('date', ''), reverse=True)

    if limit:
        posts = posts[:limit]

    return jsonify({
        'success': True,
        'count': len(posts),
        'data': posts
    })

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """Get a single post by ID or slug."""
    posts = read_db('posts.json')

    # Find by ID
    post = next((p for p in posts if p.get('id') == post_id), None)

    # Find by slug
    if not post:
        post = next((p for p in posts if p.get('slug') == str(post_id)), None)

    if not post:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    # Increment view count
    for p in posts:
        if p.get('id') == post.get('id'):
            p['views'] = p.get('views', 0) + 1
    write_db('posts.json', posts)

    return jsonify({'success': True, 'data': post})

@app.route('/api/posts', methods=['POST'])
def create_post():
    """Create a new blog post."""
    data = request.json or {}

    # Validation
    required = ['title', 'category', 'excerpt']
    if not all(data.get(key) for key in required):
        return jsonify({
            'success': False,
            'message': 'title, category, and excerpt are required'
        }), 400

    posts = read_db('posts.json')
    new_id = max([p.get('id', 0) for p in posts]) + 1 if posts else 1

    # Create slug
    slug = re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')

    new_post = {
        'id': new_id,
        'slug': slug,
        'title': data.get('title'),
        'category': data.get('category'),
        'emoji': data.get('emoji', '📄'),
        'author': data.get('author', 'Anonymous'),
        'readTime': data.get('readTime', '5 min'),
        'date': datetime.now().date().isoformat(),
        'excerpt': data.get('excerpt'),
        'body': data.get('body', ''),
        'featured': data.get('featured', False),
        'views': 0,
        'published': True
    }

    posts.append(new_post)
    write_db('posts.json', posts)

    return jsonify({'success': True, 'data': new_post}), 201

@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """Update an existing post."""
    posts = read_db('posts.json')
    post_idx = next((i for i, p in enumerate(posts) if p.get('id') == post_id), None)

    if post_idx is None:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    data = request.json or {}
    posts[post_idx].update({k: v for k, v in data.items() if k != 'id'})
    write_db('posts.json', posts)

    return jsonify({'success': True, 'data': posts[post_idx]})

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """Delete (soft) a post by setting published=False."""
    posts = read_db('posts.json')
    post_idx = next((i for i, p in enumerate(posts) if p.get('id') == post_id), None)

    if post_idx is None:
        return jsonify({'success': False, 'message': 'Post not found'}), 404

    posts[post_idx]['published'] = False
    write_db('posts.json', posts)

    return jsonify({'success': True, 'message': 'Post archived successfully'})

# ═══════════════════════════════════════════════════
# ROUTES — CONTACT API
# ═══════════════════════════════════════════════════

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    """Submit contact form."""
    data = request.json or {}

    # Validation
    first_name = data.get('firstName', '').strip()
    last_name = data.get('lastName', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()

    if not all([first_name, email, subject, message]):
        return jsonify({
            'success': False,
            'message': 'All fields are required.'
        }), 400

    # Email validation
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({
            'success': False,
            'message': 'Invalid email address.'
        }), 400

    # Save to database
    contacts = read_db('contacts.json')
    entry = {
        'id': int(datetime.now().timestamp() * 1000),
        'firstName': first_name,
        'lastName': last_name,
        'email': email,
        'subject': subject,
        'message': message,
        'receivedAt': datetime.now().isoformat(),
        'read': False
    }
    contacts.append(entry)
    write_db('contacts.json', contacts)

    print(f'📧  New contact from {first_name} {last_name} <{email}> — "{subject}"')

    return jsonify({
        'success': True,
        'message': "Your message has been received! We'll reply within 24–48 hours."
    }), 200

@app.route('/api/contact', methods=['GET'])
def list_contacts():
    """List contact submissions (admin)."""
    contacts = read_db('contacts.json')
    return jsonify({'success': True, 'count': len(contacts), 'data': contacts})
@app.route('/api/contacts', methods=['GET'])
def list_contacts_plural():
    """Same as /api/contact but matches admin panel's plural endpoint."""
    return list_contacts()

@app.route('/api/contacts/<int:contact_id>/read', methods=['PATCH'])
def mark_contact_read(contact_id):
    """Mark a single contact message as read."""
    contacts = read_db('contacts.json')
    for c in contacts:
        if c.get('id') == contact_id:
            c['read'] = True
            write_db('contacts.json', contacts)
            return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Contact not found'}), 404

@app.route('/api/contacts/mark-all-read', methods=['PATCH'])
def mark_all_contacts_read():
    """Mark all contact messages as read."""
    contacts = read_db('contacts.json')
    for c in contacts:
        c['read'] = True
    write_db('contacts.json', contacts)
    return jsonify({'success': True})
# ═══════════════════════════════════════════════════
# ROUTES — NEWSLETTER API
# ═══════════════════════════════════════════════════

@app.route('/api/newsletter', methods=['POST'])
def subscribe_newsletter():
    """Subscribe to newsletter."""
    data = request.json or {}
    email = data.get('email', '').strip()

    if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({
            'success': False,
            'message': 'Please provide a valid email address.'
        }), 400

    subs = read_db('subscribers.json')

    # Check if already subscribed
    if any(s['email'].lower() == email.lower() for s in subs):
        return jsonify({
            'success': False,
            'message': "You're already subscribed! 🎉"
        }), 409

    subs.append({
        'email': email,
        'subscribedAt': datetime.now().isoformat(),
        'active': True
    })
    write_db('subscribers.json', subs)

    print(f'✉️  New subscriber: {email}')

    return jsonify({
        'success': True,
        'message': 'Welcome to Bolgerr! Check your inbox for a confirmation.'
    }), 201

@app.route('/api/subscribers', methods=['GET'])
def list_subscribers():
    """List all subscribers (admin)."""
    subs = read_db('subscribers.json')
    return jsonify({'success': True, 'count': len(subs), 'data': subs})

# ═══════════════════════════════════════════════════
# ROUTES — STATS & CATEGORIES API
# ═══════════════════════════════════════════════════

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get site statistics."""
    posts = [p for p in read_db('posts.json') if p.get('published', True)]
    subs = read_db('subscribers.json')
    total_views = sum(p.get('views', 0) for p in posts)
    categories = list(set(p.get('category') for p in posts))

    most_read = sorted(posts, key=lambda p: p.get('views', 0), reverse=True)[:3]

    return jsonify({
        'success': True,
        'data': {
            'totalPosts': len(posts),
            'totalViews': total_views,
            'totalSubscribers': len(subs),
            'categories': len(categories),
            'mostRead': [
                {'id': p['id'], 'title': p['title'], 'views': p.get('views', 0)}
                for p in most_read
            ]
        }
    })

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories with post count."""
    posts = [p for p in read_db('posts.json') if p.get('published', True)]
    cat_count = {}

    for post in posts:
        cat = post.get('category')
        cat_count[cat] = cat_count.get(cat, 0) + 1

    categories = [
        {'name': name, 'count': count}
        for name, count in sorted(cat_count.items(), key=lambda x: x[1], reverse=True)
    ]

    return jsonify({'success': True, 'data': categories})

# ═══════════════════════════════════════════════════
# ROUTES — SERVE FRONTEND
# ═══════════════════════════════════════════════════

@app.route('/')
def serve_index():
    """Serve main HTML file."""
    return send_file('index.html', mimetype='text/html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files."""
    if os.path.isfile(path):
        return send_file(path)
    return send_file('index.html', mimetype='text/html')

# ═══════════════════════════════════════════════════
# ERROR HANDLERS
# ═══════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'message': 'Endpoint not found'}), 404
    return send_file('index.html', mimetype='text/html')

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors."""
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

# ═══════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════

if __name__ == '__main__':
    seed_posts()

    RUN_PORT = PORT

    print(f"\n🚀  Bolgerr backend running at http://localhost:{RUN_PORT}")
    print(f"📖  API docs:")
    print(f"     GET  /api/posts              List all posts")
    print(f"     GET  /api/posts/:id          Single post")
    print(f"     POST /api/posts              Create post")
    print(f"     POST /api/contact            Submit contact form")
    print(f"     POST /api/newsletter         Subscribe to newsletter")
    print(f"     GET  /api/stats              Site statistics")
    print(f"     GET  /api/categories         All categories\n")

    app.run(host='0.0.0.0', port=RUN_PORT, debug=True)