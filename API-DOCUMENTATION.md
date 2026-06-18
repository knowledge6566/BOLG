## 📚 BOLGERR API DOCUMENTATION

### Base URL
```
Development:  http://localhost:3000     (Node.js)
              http://localhost:5000     (Python)
Production:   https://api.bolgerr.com
```

### Authentication
Currently, the API is **open** (GET endpoints are public, POST/PUT/DELETE can be secured with API keys in production).

---

## 📖 ENDPOINTS

### 1. POSTS API

#### Get All Posts
```http
GET /api/posts
```

**Query Parameters:**
- `category` (string) - Filter by category: "Technology", "Design", "Culture", "Science", "Life", "Business"
- `search` (string) - Search in title, excerpt, author
- `featured` (boolean) - Get only featured posts: `true`
- `sort` (string) - Sort by: "date" (default) or "views"
- `limit` (number) - Max results to return (default: all)

**Example Requests:**
```bash
# Get all posts
curl http://localhost:3000/api/posts

# Get Technology posts
curl "http://localhost:3000/api/posts?category=Technology"

# Search for articles about AI
curl "http://localhost:3000/api/posts?search=AI"

# Get featured posts, sorted by views
curl "http://localhost:3000/api/posts?featured=true&sort=views"

# Get first 5 most viewed posts
curl "http://localhost:3000/api/posts?sort=views&limit=5"

# Complex query
curl "http://localhost:3000/api/posts?category=Technology&search=language&sort=views&limit=10"
```

**Response:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": 1,
      "slug": "small-language-models",
      "title": "The Quiet Revolution of Small Language Models",
      "category": "Technology",
      "emoji": "🤖",
      "author": "Priya Sharma",
      "readTime": "7 min",
      "date": "2025-06-10",
      "excerpt": "Big AI is grabbing headlines, but the real shift is happening at the edge...",
      "body": "<p>Full HTML content...</p>",
      "featured": true,
      "views": 3241,
      "published": true
    },
    ...
  ]
}
```

---

#### Get Single Post
```http
GET /api/posts/:id
```

**Parameters:**
- `id` (number or string) - Post ID (number) or slug (string)

**Examples:**
```bash
# Get by ID
curl http://localhost:3000/api/posts/1

# Get by slug
curl http://localhost:3000/api/posts/small-language-models
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "small-language-models",
    "title": "The Quiet Revolution of Small Language Models",
    ...
  }
}
```

**Note:** Fetching a post automatically increments its view count.

---

#### Create Post
```http
POST /api/posts
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "My New Article",
  "category": "Technology",
  "emoji": "🚀",
  "author": "John Doe",
  "readTime": "8 min",
  "excerpt": "A brief summary of the article...",
  "body": "<p>Full HTML content of the article...</p>",
  "featured": false
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Future of Web Development",
    "category": "Technology",
    "emoji": "💻",
    "author": "Jane Smith",
    "readTime": "6 min",
    "excerpt": "Exploring emerging trends in web technologies...",
    "body": "<h2>Introduction</h2><p>Web development is evolving rapidly...</p>",
    "featured": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 9,
    "slug": "future-of-web-development",
    "title": "The Future of Web Development",
    "category": "Technology",
    "emoji": "💻",
    "author": "Jane Smith",
    "readTime": "6 min",
    "date": "2025-06-12",
    "excerpt": "Exploring emerging trends in web technologies...",
    "body": "<h2>Introduction</h2><p>Web development is evolving rapidly...</p>",
    "featured": true,
    "views": 0,
    "published": true
  }
}
```

---

#### Update Post
```http
PUT /api/posts/:id
Content-Type: application/json
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "featured": true,
    "views": 5000
  }'
```

---

#### Delete Post
```http
DELETE /api/posts/:id
```

**Note:** This performs a soft-delete (sets `published: false`).

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/posts/1
```

**Response:**
```json
{
  "success": true,
  "message": "Post archived successfully"
}
```

---

### 2. CONTACT API

#### Submit Contact Form
```http
POST /api/contact
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "subject": "Story Pitch",
  "message": "I have an interesting story idea about AI and creativity..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "subject": "Story Pitch",
    "message": "I would like to pitch a story about the future of remote work..."
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your message has been received! We'll reply within 24–48 hours."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "All fields are required."
}
```

---

#### Get Contact Submissions (Admin)
```http
GET /api/contact
```

**Example:**
```bash
curl http://localhost:3000/api/contact
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": 1623456789000,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "subject": "Story Pitch",
      "message": "I have an interesting story idea...",
      "receivedAt": "2025-06-12T10:30:00Z",
      "read": false
    },
    ...
  ]
}
```

---

### 3. NEWSLETTER API

#### Subscribe to Newsletter
```http
POST /api/newsletter
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "subscriber@example.com"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Welcome to Bolgerr! Check your inbox for a confirmation."
}
```

**Duplicate Response (409):**
```json
{
  "success": false,
  "message": "You're already subscribed! 🎉"
}
```

---

#### Get Subscribers (Admin)
```http
GET /api/subscribers
```

**Example:**
```bash
curl http://localhost:3000/api/subscribers
```

**Response:**
```json
{
  "success": true,
  "count": 94000,
  "data": [
    {
      "email": "subscriber@example.com",
      "subscribedAt": "2025-06-10T14:20:00Z",
      "active": true
    },
    ...
  ]
}
```

---

### 4. STATS API

#### Get Site Statistics
```http
GET /api/stats
```

**Example:**
```bash
curl http://localhost:3000/api/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPosts": 248,
    "totalViews": 450000,
    "totalSubscribers": 94000,
    "categories": 12,
    "mostRead": [
      {
        "id": 1,
        "title": "The Quiet Revolution of Small Language Models",
        "views": 5120
      },
      {
        "id": 3,
        "title": "The Last Cafes: How Third Places Are Disappearing",
        "views": 4890
      },
      {
        "id": 5,
        "title": "How to Build a Daily Writing Practice That Actually Sticks",
        "views": 4310
      }
    ]
  }
}
```

---

#### Get Categories
```http
GET /api/categories
```

**Example:**
```bash
curl http://localhost:3000/api/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "name": "Technology", "count": 45 },
    { "name": "Design", "count": 38 },
    { "name": "Culture", "count": 32 },
    { "name": "Science", "count": 28 },
    { "name": "Life", "count": 25 },
    { "name": "Business", "count": 20 },
    ...
  ]
}
```

---

## 🔌 INTEGRATION EXAMPLES

### JavaScript/Fetch
```javascript
// Get all technology posts
fetch('http://localhost:3000/api/posts?category=Technology')
  .then(res => res.json())
  .then(data => console.log(data.data));

// Subscribe to newsletter
fetch('http://localhost:3000/api/newsletter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
})
  .then(res => res.json())
  .then(data => console.log(data.message));
```

### Python/Requests
```python
import requests

# Get featured posts
response = requests.get('http://localhost:3000/api/posts?featured=true')
posts = response.json()['data']

# Create a new post
new_post = {
    'title': 'New Article',
    'category': 'Technology',
    'emoji': '🚀',
    'author': 'Author Name',
    'excerpt': 'Article summary...',
    'body': '<p>Article content...</p>'
}
response = requests.post('http://localhost:3000/api/posts', json=new_post)
print(response.json())
```

### cURL
```bash
# List all posts
curl -s http://localhost:3000/api/posts | jq '.data[] | {title, author, views}'

# Get statistics
curl -s http://localhost:3000/api/stats | jq '.data'

# Search for posts
curl -s "http://localhost:3000/api/posts?search=machine+learning" | jq '.count'
```

---

## ⚠️ ERROR HANDLING

### Common Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "title, category, and excerpt are required"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Post not found"
}
```

**409 Conflict**
```json
{
  "success": false,
  "message": "You're already subscribed! 🎉"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🔒 SECURITY RECOMMENDATIONS

1. **Add API Keys** - Require authentication for POST/PUT/DELETE
2. **Rate Limiting** - Prevent abuse (e.g., 100 requests/hour)
3. **Input Validation** - Sanitize all inputs server-side
4. **HTTPS Only** - Use SSL/TLS in production
5. **CORS** - Restrict to trusted domains only
6. **SQL Injection Prevention** - Use parameterized queries (already done)
7. **XSS Prevention** - Escape HTML output
8. **Admin Authentication** - Protect admin endpoints with login

---

## 📊 RATE LIMITING (Production)

Recommended limits:
- Public endpoints: 100 requests/hour per IP
- Contact form: 5 submissions/hour per IP
- Newsletter: 10 subscriptions/hour per IP
- Admin endpoints: 1000 requests/hour per API key

---

## 🧪 TESTING

### Test with Postman
1. Import this collection: [Generate from endpoints above]
2. Set `{{base_url}}` to `http://localhost:3000`
3. Run tests

### Test with Thunder Client (VS Code)
1. Create requests for each endpoint
2. Test various query parameters
3. Verify response codes and data

---

## 📈 RESPONSE TIMES (Expected)

| Endpoint | Average | Max |
|----------|---------|-----|
| GET /api/posts | 50ms | 200ms |
| GET /api/posts/:id | 20ms | 100ms |
| POST /api/posts | 100ms | 300ms |
| GET /api/stats | 30ms | 150ms |
| POST /api/contact | 50ms | 200ms |

---

## 📞 SUPPORT

For API issues:
- Email: api-support@bolgerr.com
- GitHub Issues: github.com/bolgerr/bolgerr/issues
- Documentation: docs.bolgerr.com
