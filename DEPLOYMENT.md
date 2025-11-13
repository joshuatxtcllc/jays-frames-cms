# Railway Deployment Guide for Jay's Frames CMS

## Quick Deploy (5 Minutes)

### Step 1: Push to GitHub

```bash
cd jays-frames-cms
git init
git add .
git commit -m "Initial commit - Jay's Frames CMS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jays-frames-cms.git
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `jays-frames-cms` repository
5. Railway will automatically detect it's a Node.js project

### Step 3: Add PostgreSQL

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically creates and connects the database
4. The `DATABASE_URL` environment variable is automatically set

### Step 4: Configure Build

Railway should automatically detect the build commands from `package.json`:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

If you need to manually set these:
1. Click on your service
2. Go to **"Settings"**
3. Under **"Deploy"**, set:
   - Build Command: `npm run build`
   - Start Command: `npm start`

### Step 5: Set Environment Variables

In Railway dashboard, go to your service → **"Variables"** tab:

Required variables (DATABASE_URL is auto-created):
```env
NODE_ENV=production
PORT=3000
```

### Step 6: Deploy

1. Railway will automatically deploy
2. Watch the logs for any errors
3. Once complete, click **"Generate Domain"** to get your public URL
4. Your CMS is now live at: `https://your-project.railway.app`

## Database Setup

Railway's PostgreSQL automatically runs migrations when you deploy. The schema is pushed via Drizzle during the build process.

## Troubleshooting

### Build Fails

**Error**: `Cannot find module 'drizzle-orm'`
**Solution**: Make sure all dependencies are in `package.json`, not just `devDependencies`

**Error**: `Database connection failed`
**Solution**: 
1. Check that PostgreSQL service is running in Railway
2. Verify `DATABASE_URL` is set (should be automatic)
3. Ensure SSL is configured (Railway PostgreSQL requires SSL)

### App Won't Start

**Error**: `Port already in use`
**Solution**: Railway automatically sets the PORT variable. Make sure your server uses `process.env.PORT`

**Error**: `Cannot find module './dist/server/index.js'`
**Solution**: 
1. Check that build command ran successfully
2. Verify `tsconfig.server.json` is correct
3. Ensure `build:server` script creates files in `dist/server`

### Database Connection Issues

If you see: `Error: connect ECONNREFUSED`
- Railway PostgreSQL requires SSL in production
- Check `server/db/index.ts` has SSL configuration:
```typescript
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
```

## Custom Domain (Optional)

1. In Railway project, go to service → **"Settings"**
2. Click **"Generate Domain"** (if not already done)
3. Or click **"Custom Domain"** to use your own (e.g., cms.jaysframes.com)
4. Follow Railway's instructions to update DNS records

## Environment Variables Reference

```env
# Automatically created by Railway
DATABASE_URL=postgresql://...

# You need to set these
NODE_ENV=production
PORT=3000

# Optional: Frontend API URL (if separating frontend)
VITE_API_URL=https://your-project.railway.app
```

## Monitoring & Logs

- **View Logs**: Click your service → "Deployments" → Click latest deployment
- **Monitor Health**: Use the `/api/health` endpoint
- **Database Access**: Railway provides a PostgreSQL connection string in the database service

## Updating Your CMS

After making changes locally:

```bash
git add .
git commit -m "Update: description of changes"
git push origin main
```

Railway automatically redeploys when you push to main branch.

## Backup Strategy

Railway provides automatic backups for PostgreSQL. To manually backup:

1. Go to your PostgreSQL service in Railway
2. Click **"Data"** tab
3. Use the provided connection details to export with `pg_dump`

```bash
pg_dump $DATABASE_URL > backup.sql
```

## Cost Estimate

Railway Pricing (as of 2024):
- **Hobby Plan**: $5/month (includes $5 credit)
- **PostgreSQL**: ~$5-10/month depending on usage
- **Total**: ~$10-15/month for production use

**Free Tier**: Railway offers a trial with limited hours - great for testing!

## Security Checklist

✅ Environment variables are set (not hardcoded)
✅ PostgreSQL has strong password (Railway generates this)
✅ SSL enabled for database connection
✅ `.env` file is in `.gitignore`
✅ No sensitive data committed to Git

## Next Steps After Deployment

1. **Access your CMS**: Visit `https://your-project.railway.app`
2. **Create first page**: Test the page creation workflow
3. **Import existing content**: Bulk import your 60 pages
4. **Set up templates**: Create reusable page templates
5. **Run SEO analysis**: Optimize all pages for Houston Heights keywords

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Verify all environment variables are set
3. Test the `/api/health` endpoint
4. Review the troubleshooting section above

---

Your Jay's Frames CMS should now be live and ready to manage your Houston Heights framing business content! 🎉
