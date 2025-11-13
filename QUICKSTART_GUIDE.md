# 🚀 Quick Start - Jay's Frames CMS

## Get Running in 5 Minutes

### Step 1: Install (2 mins)

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Step 2: Database (1 min)

```bash
# Use Railway's PostgreSQL or local Postgres
export DATABASE_URL="postgresql://localhost/jays_frames_cms"

# Run schema
cd server
npm run db:setup
```

### Step 3: Run (30 seconds)

**Terminal 1 - API Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Dashboard:**
```bash
cd client
npm run dev
```

Open http://localhost:5173

### Step 4: Use It! (2 mins)

1. **Upload** your 60 `.tsx` files
2. **Bulk Edit**:
   - Find: "old text"
   - Replace: "new text"
   - Select: All pages
   - Click: Apply
3. **Done!** Download updated files

## Common Tasks

### Change Business Name Everywhere

Find: `Jay's Frames`
Replace: `Jay's Custom Framing`
Target: Content ✓ SEO Meta ✓

### Update Phone Number

Find: `(713) 555-0100`
Replace: `(713) 555-0123`

### Fix Location Names

Find: `Houston`
Replace: `Houston Heights, TX`
Target: SEO Meta only

## Deploy to Railway

```bash
npm i -g @railway/cli
railway login
railway up
```

## Need Help?

Check the full README.md for detailed docs.

---

**That's it! You're ready to bulk edit 60+ pages! 🎉**
