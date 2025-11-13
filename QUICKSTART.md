# 🚀 Quick Start Guide - Jay's Frames CMS

## What You Just Got

A **production-ready CMS** that lets you:
- ✅ Edit all 60 of your Houston Heights framing pages
- ✅ See HTML and visual editor side-by-side
- ✅ Live preview before publishing
- ✅ SEO analyzer with Houston Heights keyword optimization
- ✅ One-click deploy to Railway
- ✅ Built for mobile editing (you can edit from your phone browser)

## Difficulty Level: **EASY** 

This is a complete, production-ready system. Just deploy and start editing.

---

## 📱 Get Started in 10 Minutes

### Option 1: Railway (Recommended - Easiest)

```bash
# 1. Download the CMS to your computer
# (Click the download button in this chat)

# 2. Upload to GitHub (from your terminal or GitHub Desktop)
cd jays-frames-cms
git init
git add .
git commit -m "Initial commit"
git branch -M main
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/jays-frames-cms.git
git push -u origin main

# 3. Deploy to Railway (takes 3 minutes)
- Go to railway.app
- Click "New Project" → "Deploy from GitHub"
- Select your repo
- Click "+ New" → "Database" → "PostgreSQL"
- Wait for deployment... DONE! 🎉
```

### Option 2: Local Testing First

```bash
# 1. Install dependencies
npm install

# 2. Set up your local database
# Create a PostgreSQL database, then:
cp .env.example .env
# Edit .env with your database URL

# 3. Push database schema
npm run db:push

# 4. Seed initial data (keywords and templates)
npm run db:seed

# 5. Start the dev server
npm run dev

# Visit: http://localhost:5173
```

---

## 🎯 What You Can Do Right Now

### 1. Create Your First Page

1. Click **"New Page"** in sidebar
2. Fill in:
   - Title: "Custom Framing Houston Heights | Jay's Frames"
   - Slug: "custom-framing"
   - Meta Description: "Professional custom framing in Houston Heights. Museum-quality materials, expert craftsmanship, 15+ years experience. Visit Jay's Frames today!"
3. Add sections (Hero, Story, Values, CTA)
4. Edit in **Visual Mode** (like Word) or **HTML Mode** (direct code)
5. Click **"Analyze SEO"** - get your score and suggestions
6. Save as Draft or Publish

### 2. Edit Existing Pages

1. Go to **"All Pages"**
2. Search for any page
3. Click **"Edit"**
4. Make changes - see live preview on right
5. Save

### 3. Understand the Editor

**Visual Tab**: 
- Rich text editor
- Buttons for bold, headings, lists
- Great for quick text changes

**HTML Tab**:
- Direct HTML editing
- Full control
- Perfect for copying from your existing pages

**You can switch between them anytime!**

---

## 📊 SEO Analyzer Explained

After you click "Analyze SEO", you get:

**Overall Score** (0-100):
- 80-100: Excellent ✅
- 60-79: Good 👍
- <60: Needs work ⚠️

**What it checks**:
- Houston Heights keyword density (aim for 1-3%)
- Word count (target: 800-2000 words)
- Meta title length (50-60 chars)
- Meta description length (150-160 chars)
- H1 tags (should have exactly 1)
- H2 tags (should have 2-6)
- Internal links (3+ is good)
- Image alt tags

**Suggestions**:
The analyzer tells you EXACTLY what to fix.

---

## 🎨 How to Edit Your 60 Pages

### The Fast Way (Recommended):

1. **Create a template** from your best page
2. **Use that template** for similar pages
3. **Bulk edit** common elements
4. **Run SEO analysis** on each page
5. **Publish** when ready

### Example Workflow:

```
Page 1: Custom Framing (create from scratch)
  ↓
Save as template
  ↓
Page 2-60: Use template
  ↓
Edit specific content for each page
  ↓
Run SEO analysis on all
  ↓
Publish
```

---

## 📱 Mobile Editing

The CMS works on mobile browsers! You can:
- Edit content from your phone
- See live preview
- Publish pages
- Check SEO scores

**Pro tip**: The visual editor works best on desktop, but HTML mode works great on mobile for quick fixes.

---

## 🔑 Key Features You'll Love

### 1. **Visual + HTML Editing**
Switch between WYSIWYG and raw HTML anytime. Best of both worlds.

### 2. **Live Preview**
See exactly how your page looks before publishing.

### 3. **SEO Score**
Get instant feedback on Houston Heights keyword optimization.

### 4. **Draft/Publish**
Safe workflow - edit in draft, publish when ready.

### 5. **Section-Based**
Pages are built from sections (Hero, Story, Values, etc.). Add, remove, reorder easily.

### 6. **Keyword Tracking**
Built-in database of 20+ Houston Heights framing keywords with search volumes.

---

## 🎯 Your First Day Checklist

- [ ] Deploy to Railway (10 min)
- [ ] Create your first page (5 min)
- [ ] Run SEO analysis (1 min)
- [ ] Save as template (30 sec)
- [ ] Create 3 more pages from template (10 min)
- [ ] Publish your first page (30 sec)

**Total time: ~30 minutes to go live**

---

## 💰 Cost

**Railway**:
- Free trial with limited hours
- After trial: ~$10-15/month for production use
- Includes PostgreSQL database
- Auto-deploys on Git push

**No other costs** - everything included.

---

## 🆘 Common Questions

**Q: Can I edit HTML directly?**
A: Yes! Click the "HTML" tab in any section.

**Q: How do I add images?**
A: In visual mode, paste image URLs. Or in HTML mode, add `<img>` tags.

**Q: Can I copy/paste from Word?**
A: Yes, but clean formatting in HTML mode for best results.

**Q: How do I backup?**
A: Railway auto-backups PostgreSQL. You can also export via pg_dump.

**Q: Can multiple people edit?**
A: Yes! Host on Railway, share the URL.

**Q: Does this replace my website?**
A: No, this MANAGES your website content. Export or integrate with your existing site.

---

## 🚨 If Something Goes Wrong

1. **Check Railway logs**: Dashboard → Service → Deployments
2. **Test health endpoint**: Visit `your-url.railway.app/api/health`
3. **Verify database**: Make sure PostgreSQL service is running
4. **Check environment variables**: Especially `DATABASE_URL`

---

## 🎉 Next Steps

1. **Deploy to Railway** (follow DEPLOYMENT.md)
2. **Create 5 pages** (get comfortable with the editor)
3. **Run SEO analysis** on each
4. **Set up templates** for common page types
5. **Bulk import** your existing 60 pages
6. **Optimize** all pages for Houston Heights keywords

---

## 📞 Pro Tips

1. **Always use the SEO analyzer** - it catches issues before they hurt rankings
2. **Include "Houston Heights" in every page title**
3. **Aim for 800+ words** per service page
4. **Add 3+ internal links** per page
5. **Use descriptive alt text** on all images
6. **Keep meta descriptions 150-160 characters**

---

**You're all set!** This CMS is production-ready and optimized for your Houston Heights framing business. Deploy it and start managing your 60+ pages with ease.

Questions? Check README.md and DEPLOYMENT.md for detailed guides.

---

Built specifically for **Jay's Frames** 🖼️
Houston Heights' Premier Custom Framing Business
