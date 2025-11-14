import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import multer from 'multer';
import fs from 'fs';
import JSZip from 'jszip';
import {
  extractPageContent,
  analyzePageSEO,
  generateUpdatedFile,
  generateTSXFile,
} from './content-extractor';

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const upload = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ============================================================================
// CONTENT EXTRACTION ROUTES
// ============================================================================

app.post('/api/extract/batch', upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const extractedContents = [];

    for (const file of req.files as Express.Multer.File[]) {
      try {
        const content = extractPageContent(file.path);
        extractedContents.push(content);
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
      }
    }

    res.json({
      success: true,
      totalFiles: req.files.length,
      successfulExtractions: extractedContents.length,
      contents: extractedContents,
    });
  } catch (error: any) {
    console.error('Error in batch extraction:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pages/save', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { pageSlug, pageType, content, seoMeta, status = 'draft' } = req.body;

    await client.query('BEGIN');

    const existingPage = await client.query(
      'SELECT id, version FROM pages WHERE page_slug = $1',
      [pageSlug]
    );

    if (existingPage.rows.length > 0) {
      const pageId = existingPage.rows[0].id;
      const newVersion = existingPage.rows[0].version + 1;

      await client.query(
        `INSERT INTO page_versions (page_id, version, content, seo_meta)
         SELECT id, version, content, seo_meta FROM pages WHERE id = $1`,
        [pageId]
      );

      await client.query(
        `UPDATE pages 
         SET content = $1, seo_meta = $2, status = $3, version = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [JSON.stringify(content), JSON.stringify(seoMeta), status, newVersion, pageId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Page updated successfully',
        pageId,
        version: newVersion,
      });
    } else {
      const result = await client.query(
        `INSERT INTO pages (page_slug, page_type, content, seo_meta, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, version`,
        [pageSlug, pageType, JSON.stringify(content), JSON.stringify(seoMeta), status]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Page created successfully',
        pageId: result.rows[0].id,
        version: result.rows[0].version,
      });
    }
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error saving page:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/pages', async (req, res) => {
  try {
    const { pageType, status, search } = req.query;
    
    let query = 'SELECT * FROM pages WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (pageType) {
      query += ` AND page_type = $${paramIndex}`;
      params.push(pageType);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (page_slug ILIKE $${paramIndex} OR seo_meta->>'title' ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY updated_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      pages: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      'SELECT * FROM pages WHERE page_slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({
      success: true,
      page: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk find & replace
app.post('/api/bulk-edit/execute', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { findText, replaceText, targetFields, pageIds, dryRun = false } = req.body;

    await client.query('BEGIN');

    const affectedPages = [];

    for (const pageId of pageIds) {
      const pageResult = await client.query(
        'SELECT * FROM pages WHERE id = $1',
        [pageId]
      );

      if (pageResult.rows.length === 0) continue;

      const page = pageResult.rows[0];
      let modified = false;
      const changes: string[] = [];

      if (targetFields.includes('seo_meta')) {
        const seoMeta = page.seo_meta;
        
        for (const [key, value] of Object.entries(seoMeta)) {
          if (typeof value === 'string' && value.includes(findText)) {
            seoMeta[key] = value.replace(new RegExp(findText, 'g'), replaceText);
            modified = true;
            changes.push(`seo_meta.${key}`);
          }
        }

        if (modified && !dryRun) {
          await client.query(
            'UPDATE pages SET seo_meta = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(seoMeta), pageId]
          );
        }
      }

      if (targetFields.includes('content')) {
        const content = page.content;
        
        function replaceInObject(obj: any, path = ''): void {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'string' && value.includes(findText)) {
              obj[key] = value.replace(new RegExp(findText, 'g'), replaceText);
              modified = true;
              changes.push(`content.${currentPath}`);
            } else if (typeof value === 'object' && value !== null) {
              replaceInObject(value, currentPath);
            }
          }
        }

        replaceInObject(content);

        if (modified && !dryRun) {
          await client.query(
            'UPDATE pages SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(content), pageId]
          );
        }
      }

      if (modified) {
        affectedPages.push({
          pageId,
          pageSlug: page.page_slug,
          changes,
        });
      }
    }

    if (!dryRun) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }

    res.json({
      success: true,
      dryRun,
      affectedPages,
      totalAffected: affectedPages.length,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error executing bulk edit:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// SEO Analysis
app.post('/api/seo/analyze', async (req, res) => {
  try {
    const { pageSlug } = req.body;

    const pageResult = await pool.query(
      'SELECT * FROM pages WHERE page_slug = $1',
      [pageSlug]
    );

    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const page = pageResult.rows[0];

    const keywordsResult = await pool.query(
      'SELECT keyword FROM seo_keywords ORDER BY priority DESC'
    );
    const targetKeywords = keywordsResult.rows.map(row => row.keyword);

    const extractedContent = {
      pageSlug: page.page_slug,
      pageType: page.page_type,
      seoMeta: page.seo_meta,
      sections: page.content,
    };

    const analysis = analyzePageSEO(extractedContent, targetKeywords);

    res.json({
      success: true,
      analysis,
      page: {
        slug: page.page_slug,
        title: page.seo_meta.title,
      },
    });
  } catch (error: any) {
    console.error('Error analyzing SEO:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DOWNLOAD / EXPORT ROUTES
// ============================================================================

app.post('/api/pages/export/zip', async (req, res) => {
  try {
    const { pageIds } = req.body;

    // Fetch all pages or specific pages
    let query = 'SELECT * FROM pages';
    let params: any[] = [];

    if (pageIds && pageIds.length > 0) {
      query += ' WHERE id = ANY($1)';
      params = [pageIds];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No pages found' });
    }

    // Create ZIP file
    const zip = new JSZip();
    const pagesFolder = zip.folder('pages');

    for (const page of result.rows) {
      const tsxContent = generateTSXFile(
        page.page_slug,
        page.page_type,
        page.seo_meta,
        page.content
      );

      pagesFolder?.file(`${page.page_slug}.tsx`, tsxContent);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Send ZIP file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=pages-export.zip');
    res.send(zipBuffer);
  } catch (error: any) {
    console.error('Error exporting pages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Live SEO analysis for real-time feedback
app.post('/api/seo/analyze/live', async (req, res) => {
  try {
    const { content, seoMeta } = req.body;

    const keywordsResult = await pool.query(
      'SELECT keyword FROM seo_keywords ORDER BY priority DESC'
    );
    const targetKeywords = keywordsResult.rows.map(row => row.keyword);

    const extractedContent = {
      pageSlug: 'temp',
      pageType: 'general',
      seoMeta: seoMeta || { title: '', description: '', keywords: '', canonicalUrl: '' },
      sections: content || {},
    };

    const analysis = analyzePageSEO(extractedContent, targetKeywords);

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error in live SEO analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Jay's Frames CMS API running on port ${port}`);
});

export default app;
