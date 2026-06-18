# 🚀 BOLGERR — Complete Blogger Website
## Multi-Page Blog with 3D Effects, Frontend & Backend

---

## 📋 PROJECT STRUCTURE

```
bolgerr/
├── index.html              ← Single-page frontend (all pages included)
├── server.js               ← Node.js/Express backend
├── package.json            ← Dependencies
├── server-python.py        ← Alternative Python/Flask backend
├── requirements.txt        ← Python dependencies
├── db-schema.sql          ← Database setup (optional)
├── data/                  ← JSON storage (auto-created)
│   ├── posts.json
│   ├── contacts.json
│   ├── subscribers.json
│   └── config.json
└── README.md              ← This file
```

---

## 🎯 FEATURES INCLUDED

### ✨ Frontend (HTML + CSS + JavaScript)
- **8 Complete Pages:**
  - Home (with hero, featured posts, stats counter, newsletter)
  - Blog Archive (with filters, search, pagination)
  - Single Post View (with reading time, author info)
  - About Me (with interactive 3D cube, timeline)
  - Contact Us (with form validation, success message)
  - Privacy Policy (full content)
  - Disclaimer (full content)
  - Terms & Conditions (full content)

- **3D Effects:**
  - Animated neural-network canvas background
  - Interactive rotating 3D cube (pause on hover)
  - 3D card tilt effect on blog cards
  - Floating ambient particles
  - Animated counters on scroll
  - Smooth page transitions

### ⚙️ Backend (Choose your stack)

#### Option 1: Node.js + Express (Recommended)
```bash
npm install
node server.js
# → http://localhost:3000
```

#### Option 2: Python + Flask
```bash
pip install -r requirements.txt
python server-python.py
# → http://localhost:5000
```

### 🗄️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List all posts (with filters) |
| GET | `/api/posts/:id` | Get single post |
| POST | `/api/posts` | Create new post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| GET | `/api/categories` | All categories |
| GET | `/api/stats` | Site analytics |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/contact` | List submissions (admin) |
| POST | `/api/newsletter` | Subscribe to newsletter |
| GET | `/api/subscribers` | List subscribers (admin) |

---

## 🛠️ SETUP INSTRUCTIONS

### Prerequisites
- Node.js 14+ OR Python 3.7+
- npm OR pip

### Node.js Setup (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start server:**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:3000
   ```

### Python Setup (Alternative)

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Flask server:**
   ```bash
   python server-python.py
   ```

4. **Open browser:**
   ```
   http://localhost:5000
   ```

---

## 📝 USAGE EXAMPLES

### Create a new blog post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Article",
    "category": "Technology",
    "emoji": "🤖",
    "author": "Your Name",
    "readTime": "5 min",
    "excerpt": "A brief summary...",
    "body": "<p>Full HTML content...</p>",
    "featured": false
  }'
```

### Get all posts with filters
```bash
# By category
http://localhost:3000/api/posts?category=Technology

# By search
http://localhost:3000/api/posts?search=AI

# Featured only
http://localhost:3000/api/posts?featured=true

# Sorted by views
http://localhost:3000/api/posts?sort=views

# Limited results
http://localhost:3000/api/posts?limit=5
```

### Subscribe to newsletter
```bash
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Submit contact form
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "subject": "Story Pitch",
    "message": "I have an interesting idea..."
  }'
```

---

## 🎨 3D EFFECTS EXPLAINED

### 1. Neural Network Canvas (Background)
- 60 floating nodes connected by lines
- Purple/pink color scheme matching brand
- Subtle animations that don't distract
- Reduces opacity to let content shine
- **Location:** Fixed background on all pages

### 2. 3D Rotating Cube (About Page)
- Six faces with emojis (✍️💡🎨🌍⚡📖)
- Continuous rotation animation
- Pause & drag to manually rotate with mouse
- Uses CSS 3D transforms (`rotateX`, `rotateY`, `translateZ`)
- **Interaction:** Hover to pause, move mouse to control

### 3. Card Tilt Effect (Blog Cards)
- Subtle 3D perspective on hover
- Mouse position affects tilt angle
- Smooth transition with `transform-style: preserve-3d`
- Works on mobile (gracefully degrades)
- **Interaction:** Hover over any blog card

### 4. Floating Particles
- 20 random SVG shapes (◆✦✶○◇)
- Float up from bottom with animation
- Variable opacity and duration
- Creates depth and movement
- **Location:** Overlaid on page, low opacity

### 5. Animated Counters
- Statistics counter on homepage
- Counts from 0 to target on scroll
- Triggered when stats section enters viewport
- Smooth easing animation
- **Stats:** Articles, Readers, Categories, Years

---

## 📊 DATA STRUCTURE

### Post Object
```json
{
  "id": 1,
  "slug": "my-article-title",
  "title": "My Article Title",
  "category": "Technology",
  "emoji": "🤖",
  "author": "Author Name",
  "readTime": "5 min",
  "date": "2025-06-10",
  "excerpt": "Brief summary of the article",
  "body": "<p>Full HTML content...</p>",
  "featured": true,
  "views": 1240,
  "published": true
}
```

### Contact Submission
```json
{
  "id": 1623456789,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "subject": "Story Pitch",
  "message": "Full message text",
  "receivedAt": "2025-06-10T10:30:00Z",
  "read": false
}
```

### Newsletter Subscriber
```json
{
  "email": "subscriber@example.com",
  "subscribedAt": "2025-06-10T10:30:00Z",
  "active": true
}
```

---

## 🔧 CUSTOMIZATION

### Change Colors
Edit the CSS variables in `index.html`:
```css
:root {
  --ink:     #0D0D0F;     /* Main text color */
  --paper:   #F8F6F1;     /* Background */
  --accent:  #5B4FE9;     /* Primary (purple) */
  --accent2: #E94F6A;     /* Secondary (pink) */
  --muted:   #6B7280;     /* Secondary text */
}
```

### Add New Categories
1. Create posts with the category name
2. Edit filter buttons in blog page (hardcoded for demo)
3. API will auto-detect new categories via `/api/categories`

### Change Fonts
```css
:root {
  --ff-display: 'Syne';              /* Headings */
  --ff-body:    'Inter';             /* Body text */
  --ff-serif:   'Playfair Display'; /* Accent text */
}
```

### Enable Email Notifications
Uncomment the nodemailer section in `server.js` and configure SMTP:
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
```

---

## 🚀 DEPLOYMENT

### Deploy to Vercel (Node.js)
```bash
npm install -g vercel
vercel
```
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server.js" }
  ]
}
```

### Deploy to Heroku (Python)
```bash
heroku login
heroku create your-app-name
git push heroku main
```
Create `Procfile`:
```
web: python server-python.py
```

### Deploy to Railway (Either)
1. Connect GitHub repo
2. Auto-detect Node.js or Python
3. Set `PORT` environment variable
4. Auto-deploy on push

### Deploy to AWS/GCP (Docker)
Create `Dockerfile`:
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t bolgerr .
docker run -p 3000:3000 bolgerr
```

---

## 🔐 SECURITY BEST PRACTICES

### In Production
1. **Enable HTTPS** - Always encrypt traffic
2. **Add authentication** - Protect admin endpoints
3. **Validate input** - Sanitize all form submissions
4. **Rate limiting** - Prevent abuse on API endpoints
5. **CORS** - Restrict to your domain only
6. **Environment variables** - Keep secrets safe

### Example: Add Basic Auth
```javascript
// server.js
const basicAuth = require('express-basic-auth');
app.use('/api/admin/', basicAuth({
  users: { admin: process.env.ADMIN_PASSWORD },
  challenge: true
}));
```

---

## 📱 RESPONSIVE DESIGN

The website is **fully responsive**:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px-1199px)
- ✅ Mobile (< 768px)

Mobile features:
- Hamburger menu navigation
- Touch-friendly buttons
- Optimized column layouts
- Readable typography sizes
- Reduced animation on low-end devices

---

## ♿ ACCESSIBILITY

- ✅ Semantic HTML5
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Color contrast WCAG AA
- ✅ Reduced motion support
- ✅ Focus indicators
- ✅ Alt text for images

---

## 🐛 TROUBLESHOOTING

### Port already in use
```bash
# Node.js
PORT=4000 npm start

# Python
python -c "import os; os.environ['PORT']='5001'; exec(open('server-python.py').read())"
```

### CORS errors
Ensure backend is running and accessible. Frontend automatically detects localhost.

### Data not persisting
Check that `data/` folder exists and is writable:
```bash
mkdir -p data
chmod 755 data
```

### 3D effects not working
- Check browser support (Chrome, Firefox, Safari, Edge)
- Disable extensions that block animations
- Ensure JavaScript is enabled

---

## 📚 FURTHER ENHANCEMENTS

Consider adding:
1. **Database** - SQLite, PostgreSQL, MongoDB
2. **Comments** - Disqus or custom system
3. **Admin Dashboard** - Content management UI
4. **Image Upload** - Cloudinary or local storage
5. **Search** - Elasticsearch or full-text search
6. **Analytics** - Google Analytics integration
7. **Email** - Newsletters, notifications
8. **Social Share** - Share buttons
9. **Dark Mode** - Theme toggle
10. **Multi-language** - i18n support

---

## 📞 SUPPORT

For issues or questions:
- Email: support@bolgerr.com
- GitHub: github.com/bolgerr/bolgerr
- Twitter: @bolgerr_blog

---

## 📄 LICENSE

MIT License - Free for personal and commercial use

---

**Made with ❤️ by Bolgerr Team** — Bengaluru, India
