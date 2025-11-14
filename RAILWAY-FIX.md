# URGENT: Fix Railway "npm: command not found" Error

## The Problem
You're getting `npm: command not found` because Railway doesn't know where to find your Node.js app in this monorepo.

## The Solution (2 Steps)

### Step 1: Set Root Directory in Railway

For **each service** you deployed:

1. Go to Railway dashboard
2. Select your service (server or client)
3. Click **Settings** → **Source**
4. Find **Root Directory** field
5. Set it:
   - **Server service**: Enter `server`
   - **Client service**: Enter `client`
6. Click **Save**
7. Service will automatically redeploy

### Step 2: Verify It's Working

After redeployment, check the build logs. You should see:

```
✓ Detected Node.js
✓ Installing dependencies...
✓ Running npm install
✓ Running npm run build
✓ Starting service...
```

Instead of:
```
✗ npm: command not found
```

## Configuration Files Added

I've added these files to fix the issue:

- ✅ `server/nixpacks.toml` - Tells Railway how to build the server
- ✅ `client/nixpacks.toml` - Tells Railway how to build the client
- ✅ Updated `README-DEPLOYMENT.md` - Full deployment instructions

These files tell Railway:
1. Use Node.js 20
2. Run `npm install`
3. Run `npm run build`
4. Start the app with the correct command

## Why This Happened

Your repo is a **monorepo** with:
```
jays-frames-cms/
├── server/          ← Server code & package.json
│   ├── package.json
│   └── nixpacks.toml  (NEW)
├── client/          ← Client code & package.json
│   ├── package.json
│   └── nixpacks.toml  (NEW)
└── README.md
```

Railway was looking in the root directory (where there's no `package.json`), so it couldn't detect Node.js.

By setting **Root Directory** to `server` or `client`, Railway finds the `package.json` and everything works!

## Quick Checklist

- [ ] Server service: Root Directory = `server`
- [ ] Client service: Root Directory = `client`
- [ ] Server has PostgreSQL database connected
- [ ] Server environment variable: `NODE_ENV=production`
- [ ] Client environment variable: `VITE_API_URL` = your server URL
- [ ] Client environment variable: `NODE_ENV=production`
- [ ] Both services deployed successfully
- [ ] No "npm: command not found" errors in logs

## Need More Help?

See the full deployment guide: `README-DEPLOYMENT.md`

The fix has been committed and pushed to your branch!
