# Railway Deployment Guide

This is a monorepo with two services:
- **Server** (backend API): Located in `/server`
- **Client** (frontend): Located in `/client`

## Deploying to Railway

Railway v2 will auto-detect your monorepo structure. Follow these steps:

### 1. Deploy the Server (Backend)

1. Create a new project in Railway
2. Connect your GitHub repository
3. Railway will detect it's a monorepo - select the **server** folder
4. Add a PostgreSQL database from Railway's service catalog
5. Set environment variables:
   - `DATABASE_URL` - Auto-populated by Railway when you add PostgreSQL
   - `NODE_ENV=production`
   - `PORT=3001` (optional, Railway auto-assigns)

Build settings:
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 2. Deploy the Client (Frontend)

1. In the same Railway project, add a new service
2. Connect the same GitHub repository
3. Select the **client** folder
4. Set environment variables:
   - `VITE_API_URL` - Your server's public URL (from step 1)
   - `NODE_ENV=production`

Build settings:
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview -- --port 3000`

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

### CORS Issues
Make sure your client URL is whitelisted in the server's CORS settings (it's set to allow all origins by default).

### Database Connection
Ensure the PostgreSQL service is running and `DATABASE_URL` is correctly set in your server environment.

### Build Failures
Check that all dependencies are listed in `package.json` files in both `/server` and `/client` directories.
