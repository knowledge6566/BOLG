# 🚀 BOLGERR DEPLOYMENT GUIDE

## Quick Deploy Buttons

| Platform | Deploy |
|----------|--------|
| **Vercel** | `vercel` (one-click) |
| **Railway** | Connect GitHub repo |
| **Heroku** | `git push heroku main` |
| **Docker** | `docker run -p 3000:3000 bolgerr` |
| **AWS** | CloudFormation template |
| **DigitalOcean** | App Platform |
| **Replit** | Fork & run |

---

## 1️⃣ VERCEL (Node.js — Recommended)

### Prerequisites
- Vercel account (free tier available)
- GitHub account

### Steps

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/bolgerr
   git push -u origin main
   ```

2. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "server.js" }
     ],
     "env": {
       "PORT": "3000"
     }
   }
   ```

3. **Deploy:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import GitHub repo
   - Click "Deploy"
   - Visit `https://your-project.vercel.app`

### Auto-Deploy
Every push to `main` branch auto-deploys to production.

---

## 2️⃣ HEROKU (Node.js or Python)

### Prerequisites
- Heroku CLI installed: `npm install -g heroku`
- Heroku account

### Node.js Setup

1. **Create `Procfile`:**
   ```
   web: node server.js
   ```

2. **Create `.env`:**
   ```
   PORT=5000
   NODE_ENV=production
   ```

3. **Deploy:**
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   heroku logs --tail
   ```

4. **Visit:** `https://your-app-name.herokuapp.com`

### Python Setup

1. **Create `Procfile`:**
   ```
   web: python server-python.py
   ```

2. **Create `runtime.txt`:**
   ```
   python-3.11.0
   ```

3. **Deploy:**
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

### View Logs
```bash
heroku logs --tail
```

### Scale App (if needed)
```bash
heroku ps:scale web=2
```

---

## 3️⃣ RAILWAY

### Prerequisites
- Railway account (free tier: $5/month)
- GitHub account

### Steps

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Connect on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Select your repo
   - Select root directory
   - Click "Deploy"

3. **Configure:**
   - Environment: Auto-detected (Node.js or Python)
   - Port: Auto-configured
   - Database: Optional (PostgreSQL, MySQL)

4. **Visit:** Auto-generated URL (e.g., `https://bolgerr-production.up.railway.app`)

---

## 4️⃣ DOCKER (Any Platform)

### Build Docker Image

1. **Create `Dockerfile`:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Create `.dockerignore`:**
   ```
   node_modules
   npm-debug.log
   .git
   .gitignore
   README.md
   ```

3. **Build image:**
   ```bash
   docker build -t bolgerr:latest .
   ```

4. **Run locally:**
   ```bash
   docker run -p 3000:3000 bolgerr:latest
   # Visit http://localhost:3000
   ```

### Deploy to Docker Hub

1. **Create Docker Hub account:** [hub.docker.com](https://hub.docker.com)

2. **Tag image:**
   ```bash
   docker tag bolgerr:latest username/bolgerr:latest
   ```

3. **Push:**
   ```bash
   docker login
   docker push username/bolgerr:latest
   ```

4. **Pull and run anywhere:**
   ```bash
   docker pull username/bolgerr:latest
   docker run -p 3000:3000 username/bolgerr:latest
   ```

---

## 5️⃣ AWS EC2

### Prerequisites
- AWS account
- EC2 instance (t2.micro — free tier eligible)
- Security Group allowing ports 80, 443, 3000

### Setup

1. **SSH into instance:**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

2. **Install dependencies:**
   ```bash
   sudo yum update -y
   sudo yum install nodejs npm -y
   ```

3. **Clone repo:**
   ```bash
   git clone https://github.com/yourusername/bolgerr
   cd bolgerr
   npm install
   ```

4. **Install PM2 (process manager):**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "bolgerr"
   pm2 startup
   pm2 save
   ```

5. **Setup Nginx (reverse proxy):**
   ```bash
   sudo yum install nginx -y
   sudo systemctl start nginx
   ```

6. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/conf.d/default.conf
   ```
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
       }
   }
   ```

7. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

8. **Visit:** `http://your-instance-ip` or `http://your-domain.com`

---

## 6️⃣ AWS ELASTIC BEANSTALK

### Easiest AWS Deployment

1. **Install EB CLI:**
   ```bash
   pip install awsebcli
   ```

2. **Initialize:**
   ```bash
   eb init -p node.js-18 bolgerr --region us-east-1
   ```

3. **Create environment:**
   ```bash
   eb create production
   ```

4. **Deploy:**
   ```bash
   eb deploy
   ```

5. **Open:**
   ```bash
   eb open
   ```

### View logs:
```bash
eb logs
```

---

## 7️⃣ GOOGLE CLOUD RUN

### Containerized Serverless

1. **Install Cloud SDK:**
   ```bash
   curl https://sdk.cloud.google.com | bash
   gcloud init
   ```

2. **Create `cloudbuild.yaml`:**
   ```yaml
   steps:
     - name: 'gcr.io/cloud-builders/docker'
       args: ['build', '-t', 'gcr.io/$PROJECT_ID/bolgerr', '.']
     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/bolgerr']
     - name: 'gcr.io/cloud-builders/gke-deploy'
       args: ['run', '--filename=', '--image=gcr.io/$PROJECT_ID/bolgerr', '--location=us-central1']
   ```

3. **Deploy:**
   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   gcloud run deploy bolgerr --image gcr.io/your-project/bolgerr --platform managed --region us-central1
   ```

---

## 8️⃣ NETLIFY (Frontend Only)

If using Netlify for frontend and separate backend:

1. **Create `netlify.toml`:**
   ```toml
   [build]
   publish = "."
   command = "echo 'No build needed'"

   [[redirects]]
   from = "/api/*"
   to = "https://api.yourdomain.com/api/:splat"
   status = 200
   ```

2. **Deploy:**
   ```bash
   npm install -g netlify-cli
   netlify deploy
   ```

---

## 🌐 CUSTOM DOMAIN SETUP

### CloudFlare (Recommended)

1. **Change nameservers** to CloudFlare at domain registrar
2. **Add DNS records in CloudFlare:**
   - Type: CNAME
   - Name: `@` (root)
   - Target: `your-app.vercel.app`
3. **Enable SSL/TLS** in CloudFlare (Free tier)

### Let's Encrypt (Free SSL)

```bash
sudo certbot certonly --standalone -d yourdomain.com
sudo certbot renew --dry-run  # Test auto-renewal
```

---

## 📊 PRODUCTION CHECKLIST

- [ ] **Environment Variables**: Set `NODE_ENV=production`, `PORT=3000`
- [ ] **Database**: Migrate to PostgreSQL or MongoDB (not JSON)
- [ ] **SSL/TLS**: Enable HTTPS (Let's Encrypt or CloudFlare)
- [ ] **Email**: Configure SMTP for contact form & newsletters
- [ ] **Monitoring**: Add error tracking (Sentry, LogRocket)
- [ ] **Backups**: Daily backup of `data/` folder
- [ ] **CDN**: Serve static assets from CloudFlare/Cloudinary
- [ ] **Analytics**: Add Google Analytics or Plausible
- [ ] **Rate Limiting**: Prevent abuse on API endpoints
- [ ] **CORS**: Restrict to your domain only
- [ ] **Secrets**: Move API keys to env variables
- [ ] **Testing**: Run smoke tests before deploy
- [ ] **Monitoring**: Set up uptime monitoring (UptimeRobot)
- [ ] **Logs**: Centralize logs (LogDNA, Datadog)

---

## 🔄 CI/CD PIPELINE

### GitHub Actions (Auto-Deploy)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - name: Deploy to Vercel
        run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 📈 SCALING TIPS

### Horizontal Scaling
- Run multiple instances behind a load balancer
- Use managed services (Vercel, Railway, Heroku)

### Vertical Scaling
- Upgrade server size (more CPU/RAM)
- Optimize database queries
- Add caching (Redis)

### Database Optimization
- Migrate from JSON to PostgreSQL
- Add indexes on frequently queried columns
- Archive old data

### Frontend Optimization
- Enable gzip compression
- Minify CSS/JS
- Use CDN for static assets
- Lazy load images

---

## 📝 COSTS (Approximate)

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Vercel | 100GB bandwidth/month | $20+/month |
| Railway | $5/month | Pay-as-you-go |
| Heroku | ❌ (Ended Nov 2022) | $7-50/month |
| AWS | 12 months free | Varies |
| DigitalOcean | None | $5-40+/month |
| Google Cloud | $300 credit | Varies |

---

## 🆘 TROUBLESHOOTING

### "Port 3000 already in use"
```bash
lsof -i :3000
kill -9 <PID>
```

### "Connection refused"
- Check if server is running
- Check firewall rules
- Verify port is open

### "502 Bad Gateway"
- Server crashed; check logs
- Too many requests; add rate limiting
- Memory limit exceeded; scale up

### "CORS errors"
- Update `CORS()` in server with correct origin
- Example: `cors({ origin: 'https://yourdomain.com' })`

---

## 🎉 SUCCESS!

Once deployed:
1. Visit your domain
2. Test all pages work
3. Submit test contact form
4. Subscribe to newsletter
5. Monitor logs for errors
5. Celebrate! 🎊

---

**Need help?** Contact: deploy-support@bolgerr.com
