# 📖 BOLGERR — QUICK REFERENCE GUIDE

## ⚡ FASTEST START (Copy & Paste)

### Node.js (Recommended)
```bash
npm install && npm start
# → http://localhost:3000
```

### Python
```bash
pip install -r requirements.txt && python server-python.py
# → http://localhost:5000
```

---

## 🎯 COMMON COMMANDS

### Development
```bash
# Node.js — with auto-reload
npm run dev

# Python — debug mode
python server-python.py

# Both — view logs
npm start 2>&1 | tee app.log
python server-python.py 2>&1 | tee app.log
```

### Testing API
```bash
# Get all posts
curl http://localhost:3000/api/posts

# Get stats
curl http://localhost:3000/api/stats

# Subscribe to newsletter
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Docker
```bash
# Build
docker build -t bolgerr .

# Run
docker run -p 3000:3000 bolgerr

# Push to Docker Hub
docker tag bolgerr yourusername/bolgerr
docker push yourusername/bolgerr
```

### Database
```bash
# Seed sample data (auto on startup)
# Posts created automatically

# Export to JSON
# Already using JSON in data/ folder

# Migrate to SQL
# Use db-schema.sql with your DB
```

---

## 📋 CHECKLIST

### Before Launch
- [ ] Read README.md
- [ ] Test all pages work
- [ ] Test contact form
- [ ] Test newsletter signup
- [ ] Test on mobile
- [ ] Configure .env file
- [ ] Set up email (SMTP)
- [ ] Enable SSL/HTTPS
- [ ] Setup custom domain
- [ ] Configure DNS

### After Deployment
- [ ] Verify domain works
- [ ] Test contact form emails
- [ ] Check analytics
- [ ] Monitor server logs
- [ ] Setup backups
- [ ] Setup uptime monitoring
- [ ] Configure CDN
- [ ] Enable rate limiting
- [ ] Setup SSL renewal
- [ ] Monitor error tracking

---

## 📁 FILE REFERENCE

| File | Purpose | Lines |
|------|---------|-------|
| `index.html` | Frontend SPA | 2200 |
| `server.js` | Node.js backend | 400 |
| `server-python.py` | Python backend | 400 |
| `package.json` | Node dependencies | 20 |
| `requirements.txt` | Python dependencies | 5 |
| `README.md` | Full documentation | 500 |
| `API-DOCUMENTATION.md` | API guide | 400 |
| `DEPLOYMENT.md` | Deploy guide | 400 |
| `db-schema.sql` | Database schema | 250 |
| `.env.example` | Configuration | 100 |
| `FILES-INCLUDED.md` | This overview | 300 |

**Total:** 10 files, 4,575+ lines of code

---

## 🎨 3D EFFECTS QUICK GUIDE

### Canvas Background (Homepage)
- 60 floating nodes
- Purple/pink color scheme
- Connects nearby nodes
- Reduces opacity for readability
- Can be disabled in CSS

### Rotating 3D Cube (About Page)
- 6 faces with emojis
- Continuous rotation
- Pause on hover
- Drag to rotate
- Uses CSS `preserve-3d`

### Card Tilt (Blog Cards)
- 3D perspective on hover
- Mouse position tracking
- Smooth transitions
- Works on desktop
- Degrades gracefully on mobile

### Floating Particles
- 20 random shapes (◆✦✶○◇)
- Float up from bottom
- Variable speed & opacity
- Low CPU impact
- Decorative only

### Animated Counters
- Numbers count from 0 to target
- Triggered on scroll
- Homepage stats section
- Smooth easing
- Takes ~1 second

---

## 🔗 IMPORTANT LINKS

### Documentation
- **README.md** — Full overview
- **API-DOCUMENTATION.md** — All endpoints
- **DEPLOYMENT.md** — Deploy guide
- **db-schema.sql** — Database setup

### Resources
- **Node.js**: https://nodejs.org
- **Python**: https://python.org
- **Express**: https://expressjs.com
- **Flask**: https://flask.palletsprojects.com
- **Vercel**: https://vercel.com
- **Railway**: https://railway.app
- **Docker**: https://docker.com

---

## 🚀 DEPLOYMENT QUICK LINKS

| Platform | Time | Cost | Difficulty |
|----------|------|------|------------|
| **Vercel** | 2 min | Free | Easy |
| **Railway** | 2 min | $5/mo | Easy |
| **Heroku** | 5 min | $7/mo | Easy |
| **Docker** | 5 min | $5/mo | Medium |
| **AWS** | 10 min | $1-10/mo | Hard |

### Deploy with One Command
```bash
# Vercel
vercel

# Railway
railway link  # then auto-deploys on push

# Heroku
git push heroku main

# Docker
docker build -t bolgerr . && docker run -p 3000:3000 bolgerr
```

---

## 🔒 SECURITY CHECKLIST

### Before Production
- [ ] Set NODE_ENV=production
- [ ] Add API authentication
- [ ] Configure CORS origin
- [ ] Enable HTTPS/SSL
- [ ] Set strong admin password
- [ ] Add rate limiting
- [ ] Setup email verification
- [ ] Enable input sanitization
- [ ] Setup error tracking (Sentry)
- [ ] Regular backups automated

### Environment Variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Update these:
NODE_ENV=production
PORT=3000
ADMIN_PASSWORD=strong_password
SMTP_PASSWORD=app_specific_password
JWT_SECRET=long_random_string
```

---

## 📊 PERFORMANCE TIPS

### Frontend
- [x] Minify CSS/JS in production
- [x] Enable gzip compression
- [x] Use CDN for static files
- [x] Lazy load images
- [x] Reduce animation on mobile

### Backend
- [x] Add caching headers
- [x] Use database indexes
- [x] Archive old posts
- [x] Compress API responses
- [x] Add rate limiting

### Server
- [x] Use Node 18+ or Python 3.9+
- [x] Run with PM2 or systemd
- [x] Enable reverse proxy (Nginx)
- [x] Monitor CPU/memory
- [x] Setup auto-restart

---

## 🆘 COMMON ISSUES

### Port Already in Use
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=4000 npm start
```

### CORS Errors
```javascript
// In server.js, update CORS origin:
app.use(cors({ origin: 'https://yourdomain.com' }));
```

### Module Not Found
```bash
# Node.js
rm -rf node_modules package-lock.json
npm install

# Python
rm -rf venv
python -m venv venv
pip install -r requirements.txt
```

### Database Connection
```bash
# Check if database exists
ls -la data/

# Reseed data
rm data/*.json
npm start  # Auto-seeds on startup
```

### Emails Not Sending
```bash
# In .env, verify:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app_specific_password  # NOT regular password!

# For Gmail: https://myaccount.google.com/apppasswords
```

---

## 📞 SUPPORT MATRIX

| Issue | Solution |
|-------|----------|
| Site not loading | Check server is running (`npm start`) |
| CORS error | Update CORS_ORIGIN in .env |
| Database empty | Auto-seeded on startup, or delete data/ |
| Emails not sending | Check SMTP config in .env |
| 404 on API call | Verify endpoint URL and method (GET/POST) |
| Port conflicts | Use different port (`PORT=4000 npm start`) |
| Memory leak | Restart server or upgrade RAM |
| Slow performance | Add database, enable caching, use CDN |

---

## 🎓 LEARNING PATH

### Week 1: Get Familiar
- [ ] Read README.md
- [ ] Setup locally (Node.js)
- [ ] Explore all pages
- [ ] Test API endpoints
- [ ] Read API documentation

### Week 2: Customize
- [ ] Update site colors/fonts
- [ ] Add your blog posts
- [ ] Configure email (SMTP)
- [ ] Customize contact form
- [ ] Add custom domain

### Week 3: Deploy
- [ ] Choose hosting platform
- [ ] Follow deployment guide
- [ ] Setup domain DNS
- [ ] Enable SSL/HTTPS
- [ ] Monitor production

### Week 4: Enhance
- [ ] Add database
- [ ] Setup admin dashboard
- [ ] Add image uploads
- [ ] Implement comments
- [ ] Add analytics

---

## 🎯 NEXT FEATURES TO ADD

### Easy (< 1 hour each)
- [ ] Dark mode toggle
- [ ] Social share buttons
- [ ] Author bio section
- [ ] Related posts sidebar
- [ ] Reading time estimate

### Medium (2-4 hours each)
- [ ] Comments system
- [ ] Image upload
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Search enhancement

### Advanced (8+ hours each)
- [ ] Database migration
- [ ] User authentication
- [ ] Membership system
- [ ] Advanced analytics
- [ ] Multi-language support

---

## 💰 COST BREAKDOWN (Monthly)

### Minimal Setup (Free)
- Vercel (free tier)
- JSON storage (included)
- Total: **$0**

### Standard Setup ($7-15/mo)
- Railway ($5-10/mo)
- Custom domain ($1/mo)
- Email service (free tier)
- CDN (free tier)
- Total: **$6-11/mo**

### Production Setup ($20-50/mo)
- Dedicated server or AWS
- PostgreSQL database
- Email service (paid)
- CDN (if needed)
- Monitoring tools
- Total: **$20-50/mo**

---

## 📚 LEARNING RESOURCES

### Video Tutorials
- Setup & deployment walkthrough
- Customization guide
- 3D effects deep dive
- Backend integration
- Deployment to Vercel/Railway

### Documentation
- Full API reference
- Database schema
- Security guide
- Performance optimization
- Troubleshooting

### Community
- GitHub Discussions
- Stack Overflow (tag: bolgerr)
- Discord community (optional)
- Email support

---

## 🎉 SUCCESS INDICATORS

You'll know you're successful when:
1. ✅ Site loads in < 2 seconds
2. ✅ All pages accessible on mobile
3. ✅ Contact form emails arrive
4. ✅ Newsletter subscriptions work
5. ✅ Blog posts searchable
6. ✅ 3D effects smooth (60fps)
7. ✅ No console errors
8. ✅ API responds quickly (< 200ms)
9. ✅ Domain custom
10. ✅ HTTPS enabled

---

## 🏁 LAUNCH CHECKLIST

### 1 Week Before
- [ ] Test all features
- [ ] Prepare blog posts
- [ ] Configure email
- [ ] Setup domain
- [ ] Write launch announcement

### Day Before
- [ ] Final testing
- [ ] Backup database
- [ ] Deploy to production
- [ ] Test live site
- [ ] Notify team

### Launch Day
- [ ] Monitor server
- [ ] Check analytics
- [ ] Respond to feedback
- [ ] Share on social
- [ ] Celebrate! 🎊

---

## 📞 GET HELP

- **Docs**: See README.md
- **Issues**: Check DEPLOYMENT.md troubleshooting
- **Errors**: Read error message + check logs
- **Email**: support@bolgerr.com
- **GitHub**: github.com/bolgerr/bolgerr

---

**Ready to launch?** Start with `npm install && npm start` 🚀

Made with ❤️ by Bolgerr Team
