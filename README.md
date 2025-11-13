# Jay's Frames Content Management System

**Production-ready hybrid CMS for bulk editing 60+ React pages with SEO optimization and Railway deployment.**

## 🎯 What This Solves

You have 60 similar pages that need bulk edits. This system:

1. **Extracts** content from React/TSX files automatically
2. **Stores** in PostgreSQL with version history
3. **Bulk edits** across all pages at once (find & replace)
4. **Analyzes** SEO for Houston Heights keywords
5. **Generates** updated files ready to deploy

## ⚡ Quick Start

### Setup (5 minutes)

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Setup database
export DATABASE_URL="your_postgres_url"
cd server && npm run db:setup

# 3. Run locally
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

### Usage Workflow

1. **Upload** your 60 `.tsx` files at http://localhost:5173
2. **Bulk Edit** - Change "Jay Stevens" to "Jay Rodriguez" across all 60 pages in seconds
3. **Review** SEO scores for Houston Heights keywords
4. **Download** updated files
5. **Deploy** to Railway

## 🚀 Key Features

### Bulk Find & Replace
Change text across 60 pages in one click. Example: Replace all instances of old phone number with new one.

### SEO Analysis
- Keyword density for "Houston Heights", "custom framing Houston"
- Meta description length validation  
- Readability scoring
- Automatic suggestions

### Version Control
- Every change saves a version
- Revert to any previous state
- See full change history

### Live Preview
See exactly what will change before applying edits.

## 📁 Project Structure

```
jays-frames-cms/
├── server/                    # Express API
│   ├── schema.sql            # Database schema
│   ├── content-extractor.ts  # Extract from React files
│   ├── index.ts              # API endpoints
│   └── package.json
├── client/                    # React Dashboard
│   ├── src/components/
│   │   └── cms-dashboard.tsx # Main UI
│   └── package.json
└── railway.toml              # Deployment config
```

## 🗄️ Database Tables

- **pages** - Extracted page content
- **page_versions** - Version history
- **seo_keywords** - Target keywords with density goals
- **bulk_edits** - Operation history

## 🚢 Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway link
railway up
```

Or use Railway UI:
1. Create project
2. Add PostgreSQL
3. Add service pointing to `/server`
4. Add service pointing to `/client`
5. Set `DATABASE_URL` env var
6. Deploy!

## 📝 Example: Bulk Edit Workflow

### Change Business Name Across 60 Pages

1. Go to "Bulk Editor" tab
2. Find: `Jay's Frames`
3. Replace: `Jay's Custom Framing`
4. Select: All 60 pages
5. Target: Content ✓ SEO Meta ✓
6. Preview to verify changes
7. Apply - Done in 2 seconds!

### Fix Phone Numbers

1. Find: `(713) 555-0100`
2. Replace: `(713) 555-0123`
3. Apply to selected pages

### Update Location References

1. Find: `Houston`
2. Replace: `Houston Heights, TX`
3. Target only SEO meta tags

## 🎨 Customization

### Add Your Keywords

Edit `server/schema.sql`:

```sql
INSERT INTO seo_keywords (keyword, category, target_density, priority) VALUES
('your custom keyword', 'service', 2.5, 5);
```

### Extract Custom Components

Edit `server/content-extractor.ts`:

```typescript
if (openingElement.name.name === 'YourComponent') {
  // Custom extraction logic
}
```

## 📊 SEO Features

### Built-in Keywords
- Houston Heights (3% target density)
- custom framing Houston (2.5%)
- picture framing Houston Heights (1.5%)
- Jay's Frames (4%)
- And 6 more...

### Analysis
- Word count minimum: 500 words
- Meta description: 150-160 chars
- Title tag optimization
- Readability score (Flesch Reading Ease)

## 🔧 API Endpoints

```
POST /api/extract/batch       - Upload & extract files
GET  /api/pages               - List all pages
POST /api/pages/save          - Save/update page
POST /api/bulk-edit/execute   - Bulk find & replace
POST /api/seo/analyze         - Analyze page SEO
```

## 💡 Pro Tips

1. **Always preview** before applying bulk changes
2. **Use version history** to undo mistakes
3. **Target specific fields** to avoid unwanted replacements
4. **Check SEO analysis** after major content changes
5. **Export regularly** for backups

## 🐛 Troubleshooting

**Can't connect to database?**
```bash
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT 1"
```

**File extraction failing?**
Check file is valid React/TSX with no syntax errors.

**Railway deployment issues?**
```bash
railway logs
```

## 📈 Performance

- Handles 60+ pages easily
- Bulk edits complete in seconds
- Fast search with PostgreSQL indexes
- Version history doesn't slow queries

## 🔒 Security

- Parameterized queries (SQL injection protection)
- File upload validation
- XSS prevention
- Content sanitization

## 📚 Tech Stack

- Express.js + PostgreSQL (backend)
- React 18 + TypeScript (frontend)
- Babel (React file parsing)
- Railway (deployment)

## 🎯 Perfect For

- Bulk content updates across many pages
- SEO optimization for local Houston business
- Version-controlled content management
- Quick fixes across entire site

---

**Built for Jay's Frames - 218 W 27th St, Houston Heights, TX**

Making it easy to manage 60+ pages with Houston-focused SEO 🚀
