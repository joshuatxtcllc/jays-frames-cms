# Railway Deployment Guide

This is a monorepo with two services:
- **Server** (backend API): Located in `/server`
- **Client** (frontend): Located in `/client`

## Deploying to Railway

⚠️ **CRITICAL**: This is a monorepo - you must configure the **Root Directory** for each service!

### 1. Deploy the Server (Backend)

1. **Create a new project** in Railway
2. **Add a service** → Connect your GitHub repository (`joshuatxtcllc/jays-frames-cms`)
3. **IMPORTANT - Configure Root Directory:**
   - Go to service **Settings** → **Source**
   - Set **Root Directory** to: `server` ⚠️
   - This tells Railway where to find package.json
4. **Add PostgreSQL database:**
   - Click "+ New" → Database → PostgreSQL
   - Railway auto-creates `DATABASE_URL` variable
5. **Set environment variables** (Settings → Variables):
   ```
   NODE_ENV=production
   ```
   (Don't set PORT - Railway assigns it automatically)
6. **Deploy** - Railway will use `server/nixpacks.toml` to:
   - Install Node.js 20
   - Run `npm install`
   - Run `npm run build`
   - Start with `npm start`

### 2. Deploy the Client (Frontend)

1. In the **same Railway project**, click **+ New** → Service
2. Connect the **same GitHub repository**
3. **IMPORTANT - Configure Root Directory:**
   - Go to service **Settings** → **Source**
   - Set **Root Directory** to: `client` ⚠️
   - This tells Railway where to find package.json
4. **Set environment variables:**
   ```
   NODE_ENV=production
   VITE_API_URL=https://your-server-url.up.railway.app
   ```
   (Replace with your actual server URL from step 1)
5. **Deploy** - Railway will use `client/nixpacks.toml` to:
   - Install Node.js 20
   - Run `npm install`
   - Run `npm run build`
   - Start with `npm run preview`

### 3. Initialize Database

Once deployed, connect to your server and run:

```bash
# SSH into your server service or use Railway CLI
railway run psql $DATABASE_URL -f server/schema.sql
```

This will create all necessary tables and seed the initial SEO keywords.

### Health Check

Your server exposes a health check endpoint at `/health` which you can use for monitoring.

## Environment Variables Reference

### Server
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to `production`
- `PORT` - Default 3001 (Railway auto-assigns)

### Client
- `VITE_API_URL` - Full URL to your server (e.g., `https://your-server.railway.app`)
- `NODE_ENV` - Set to `production`

## Troubleshooting

### "npm: command not found" Error
**This is the most common issue!**

**Cause:** Railway can't find Node.js because the Root Directory is not set correctly.

**Solution:**
1. Go to your service in Railway dashboard
2. Click **Settings** → **Source**
3. Find **Root Directory** field
4. Set it to `server` (for server service) or `client` (for client service)
5. Redeploy

Railway needs this to find the `package.json` file and detect it's a Node.js project.

### CORS Issues
Make sure your client URL is whitelisted in the server's CORS settings (it's set to allow all origins by default).

### Database Connection
Ensure the PostgreSQL service is running and `DATABASE_URL` is correctly set in your server environment.

### Build Failures
Check that all dependencies are listed in `package.json` files in both `/server` and `/client` directories.

### Client Can't Connect to Server
1. Verify `VITE_API_URL` in client environment variables
2. Make sure it's the full URL: `https://your-server.up.railway.app`
3. Check server is running and accessible
