# 🚀 Deployment Checklist - Jay's Frames CMS on Railway

## Pre-Deployment (5 minutes)

### 1. Download & Extract
```bash
# Download jays-frames-cms.tar.gz
tar -xzf jays-frames-cms.tar.gz
cd jays-frames-cms
```

### 2. Test Locally (Optional but Recommended)
```bash
# Server
cd server
npm install
export DATABASE_URL="postgresql://localhost/test"
npm run dev

# Client (new terminal)
cd ../client
npm install
npm run dev
```

## Railway Deployment (10 minutes)

### Step 1: Create Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Name it: "jays-frames-cms"

### Step 2: Add PostgreSQL Database
1. In your project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a Postgres database
4. Copy the `DATABASE_URL` from the Variables tab

### Step 3: Deploy API Server
1. Click "+ New" → "GitHub Repo" or "Empty Service"
2. If using GitHub:
   - Push `/server` folder to your repo
   - Select the repo
   - Set Root Directory: `/server`
3. If using Empty Service:
   - Upload `/server` folder
   
4. Configure Build:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   
5. Add Environment Variables:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (reference Postgres service)
   - `NODE_ENV`: `production`
   - `PORT`: `3001`

6. Deploy!

### Step 4: Setup Database Schema
```bash
# After API is deployed, run this once:
railway run npm run db:setup
```

Or use Railway CLI:
```bash
railway link
railway run sh -c "cd server && npm run db:setup"
```

### Step 5: Deploy Client
1. Click "+ New" → "GitHub Repo" or "Empty Service"
2. If using GitHub:
   - Select your repo
   - Set Root Directory: `/client`
3. If using Empty Service:
   - Upload `/client` folder

4. Configure Build:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --port 3000`

5. Add Environment Variables:
   - `VITE_API_URL`: `https://${{cms-api.RAILWAY_PUBLIC_DOMAIN}}`
   - `NODE_ENV`: `production`

6. Deploy!

## Post-Deployment (2 minutes)

### Step 1: Get Your URLs
- API URL: Click on "cms-api" service → Copy public URL
- Client URL: Click on "cms-client" service → Copy public URL

### Step 2: Test the System
1. Open Client URL
2. Upload a test `.tsx` file
3. Try bulk find & replace
4. Check SEO analysis

### Step 3: Update Environment
If needed, update `VITE_API_URL` in client:
1. Go to cms-client service
2. Variables tab
3. Update `VITE_API_URL` with actual API URL
4. Redeploy

## Troubleshooting

### Database Connection Failed
```bash
# Check DATABASE_URL is set
railway variables

# Test database
railway run psql $DATABASE_URL -c "SELECT 1"
```

### API Won't Start
```bash
# Check logs
railway logs

# Common issues:
# - Missing DATABASE_URL
# - Schema not initialized (run npm run db:setup)
# - Wrong NODE_ENV
```

### Client Can't Reach API
```bash
# Check VITE_API_URL
railway variables

# Make sure it points to API public domain
# Example: https://cms-api-production.up.railway.app
```

### Build Fails
```bash
# Check build logs
railway logs --build

# Common issues:
# - npm install failures (check package.json)
# - TypeScript errors (run locally first)
# - Missing dependencies
```

## Production Checklist

- [ ] Database is provisioned
- [ ] API service deployed and healthy
- [ ] Client service deployed and accessible
- [ ] Database schema initialized
- [ ] Test file upload works
- [ ] Test bulk edit works
- [ ] SEO analysis returns results
- [ ] All 60 pages can be loaded
- [ ] Custom domain configured (optional)

## Security Recommendations

1. **Enable Railway Auth** (optional)
   - Settings → Authentication
   - Protects your CMS from public access

2. **Rate Limiting** (add to API in production)
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

3. **Backup Database**
   - Railway auto-backs up PostgreSQL
   - Configure backup schedule in Railway dashboard

## Monitoring

### Health Checks
- API: https://your-api-url/health
- Should return: `{"status":"healthy","database":"connected"}`

### Logs
```bash
# API logs
railway logs -s cms-api

# Client logs
railway logs -s cms-client

# Database logs
railway logs -s postgres
```

## Scaling

Railway auto-scales based on usage. Default limits:
- 500MB RAM per service
- Shared CPU
- 1GB Postgres storage

To upgrade:
1. Go to Settings → Resources
2. Increase RAM/CPU as needed
3. For database, upgrade plan in Postgres service

## Cost Estimation

Railway Free Tier includes:
- $5/month free credit
- Auto-sleep after inactivity

Typical costs for this CMS:
- API: ~$5-10/month
- Client: ~$5-10/month  
- Postgres: $5/month
- **Total: ~$15-25/month**

## Success!

Your CMS is now live and ready to:
✅ Upload 60+ React pages
✅ Bulk edit content across all pages
✅ Analyze SEO for Houston Heights keywords
✅ Track version history
✅ Download updated files

**CMS Dashboard:** [Your Client URL]
**API Endpoint:** [Your API URL]

---

Need help? Check README.md or QUICKSTART_GUIDE.md for more details.
