# Jay's Frames CMS - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RAILWAY DEPLOYMENT                       │
│                                                              │
│  ┌────────────────┐          ┌──────────────────┐          │
│  │   PostgreSQL   │◄─────────│   Express API    │          │
│  │   Database     │          │   (Node.js)      │          │
│  │                │          │                  │          │
│  │  • pages       │          │  Endpoints:      │          │
│  │  • sections    │          │  /api/pages      │          │
│  │  • seo         │          │  /api/sections   │          │
│  │  • templates   │          │  /api/seo        │          │
│  │  • keywords    │          │  /api/templates  │          │
│  └────────────────┘          └──────────────────┘          │
│                                      ▲                       │
│                                      │                       │
│                                      │ API Calls             │
│                                      │                       │
│  ┌───────────────────────────────────┴──────────────────┐  │
│  │             React Frontend (Vite)                    │  │
│  │                                                       │  │
│  │  Components:                                          │  │
│  │  • Dashboard      - Overview & stats                │  │
│  │  • PageList       - Browse/search pages             │  │
│  │  • PageEditor     - Visual + HTML editing           │  │
│  │    - ReactQuill (WYSIWYG)                          │  │
│  │    - HTML textarea                                  │  │
│  │    - Live preview                                   │  │
│  │    - SEO analyzer                                   │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │
                            ▼
                   ┌─────────────────┐
                   │   Your Browser   │
                   │  (Desktop/Mobile)│
                   └─────────────────┘
```

## Data Flow

### Creating a Page

```
User Input → PageEditor Component → API POST /api/pages
                                           ↓
                                    PostgreSQL Insert
                                           ↓
                                    Return Page ID
                                           ↓
                                    Create Sections
                                           ↓
                                    API POST /api/sections
                                           ↓
                                    Page Complete
```

### SEO Analysis Flow

```
Page Content → Collect all sections → Combine into full text
                                            ↓
                                    SEO Analyzer Utility
                                            ↓
                                    Calculate metrics:
                                    • Keyword density
                                    • Word count
                                    • Meta tag optimization
                                    • Link analysis
                                            ↓
                                    Generate score (0-100)
                                            ↓
                                    Return suggestions
                                            ↓
                                    Store in seo_analysis table
```

## Database Schema

```sql
┌──────────────────────┐
│       pages          │
├──────────────────────┤
│ id (PK)              │
│ slug (unique)        │
│ title                │
│ metaDescription      │
│ metaKeywords         │
│ canonicalUrl         │
│ status               │
│ pageType             │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘
          │
          │ 1:N
          ▼
┌──────────────────────┐
│   page_sections      │
├──────────────────────┤
│ id (PK)              │
│ pageId (FK)          │
│ sectionType          │
│ sectionOrder         │
│ title                │
│ subtitle             │
│ content (JSON)       │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│   seo_analysis       │       │  page_templates      │
├──────────────────────┤       ├──────────────────────┤
│ id (PK)              │       │ id (PK)              │
│ pageId (FK)          │       │ name                 │
│ keywordDensity       │       │ description          │
│ readabilityScore     │       │ pageType             │
│ wordCount            │       │ templateStructure    │
│ overallScore         │       │ isDefault            │
│ suggestions (JSON)   │       │ createdAt            │
│ analyzedAt           │       └──────────────────────┘
└──────────────────────┘

┌──────────────────────┐
│   local_keywords     │
├──────────────────────┤
│ id (PK)              │
│ keyword              │
│ category             │
│ priority             │
│ monthlySearchVolume  │
│ createdAt            │
└──────────────────────┘
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **React Quill** - WYSIWYG editor
- **Wouter** - Lightweight routing
- **Lucide React** - Icons

### Backend
- **Express** - Web server
- **Node.js** - Runtime
- **TypeScript** - Type safety
- **Drizzle ORM** - Database toolkit
- **PostgreSQL** - Database

### Deployment
- **Railway** - Hosting platform
- **GitHub** - Version control

## Key Features Explained

### 1. Dual Editor Mode

**Visual Mode (React Quill)**:
```
User types "Hello World" → Quill formats to HTML → Stored as:
{ html: "<p>Hello World</p>" }
```

**HTML Mode**:
```
User types "<h2>Title</h2>" → Validated → Stored directly → Rendered
```

### 2. SEO Analyzer Logic

```javascript
// Example keyword density calculation
const content = "Houston Heights framing service in Houston Heights..."
const keyword = "Houston Heights"
const occurrences = countOccurrences(content, keyword) // 2
const totalWords = content.split(' ').length // 8
const density = (occurrences / totalWords) * 100 // 25%

// Score calculation
if (density >= 1 && density <= 3) {
  score += 15 // Optimal
} else if (density > 3) {
  score -= 10 // Keyword stuffing
} else {
  score -= 15 // Too few keywords
}
```

### 3. Section Management

Sections are stored as JSON for flexibility:

```json
{
  "sectionType": "values",
  "content": {
    "items": [
      {
        "icon": "Heart",
        "title": "Passion",
        "description": "We love what we do"
      }
    ]
  }
}
```

This allows different section types with different structures.

## Performance Optimizations

1. **Lazy Loading**: Components load on demand
2. **Database Indexing**: Slug, pageId, status columns indexed
3. **Connection Pooling**: PostgreSQL connection pool
4. **Optimistic UI**: Updates show immediately, sync in background
5. **Caching**: API responses cached where appropriate

## Security Measures

1. **Environment Variables**: Sensitive data never hardcoded
2. **SQL Injection Protection**: Drizzle ORM parameterized queries
3. **CORS Configuration**: Only allowed origins
4. **SSL/TLS**: Railway enforces HTTPS
5. **Input Sanitization**: HTML cleaned before storage

## Scalability

**Current Capacity**:
- 1000+ pages easily
- Multiple concurrent editors
- Real-time SEO analysis

**Future Scaling**:
- Add Redis caching for API responses
- Implement CDN for static assets
- Background job queue for SEO analysis
- WebSocket for real-time collaboration

## Monitoring & Maintenance

**Health Checks**:
```
GET /api/health
→ { status: "ok", timestamp: "2024-11-12T..." }
```

**Logging**:
- Railway auto-logs all requests
- Error tracking built-in
- Database query logging

**Backups**:
- Railway auto-backup PostgreSQL daily
- Manual backup: `pg_dump $DATABASE_URL`

## Cost Breakdown

**Railway Hosting**:
- Hobby Plan: $5/month (includes $5 credit)
- PostgreSQL: ~$5-10/month
- Bandwidth: Included in plan
- **Total: ~$10-15/month**

**Alternative Hosting** (if needed):
- Render: Similar pricing
- DigitalOcean App Platform: $5-12/month
- Heroku: $7-25/month

## Development Workflow

```
Local Development
      ↓
Git Commit
      ↓
Push to GitHub
      ↓
Railway Auto-Deploy
      ↓
Live in Production
```

**Typical Development Cycle**: 5-10 minutes from code to production

## API Endpoints Reference

```
GET    /api/health           - Health check
GET    /api/pages            - List all pages
GET    /api/pages/:id        - Get single page with sections
POST   /api/pages            - Create new page
PUT    /api/pages/:id        - Update page
DELETE /api/pages/:id        - Delete page

POST   /api/sections         - Create section
PUT    /api/sections/:id     - Update section
DELETE /api/sections/:id     - Delete section

POST   /api/seo/analyze/:id  - Analyze page SEO
GET    /api/seo/:id          - Get latest SEO analysis

GET    /api/templates        - List templates
POST   /api/pages/from-template/:id - Create page from template

GET    /api/keywords         - List local keywords
```

---

This architecture is designed to be:
- ✅ Simple to understand
- ✅ Easy to maintain
- ✅ Scalable for growth
- ✅ Cost-effective
- ✅ Production-ready

Built specifically for Jay's Frames Houston Heights framing business! 🖼️
