-- Jay's Frames Content Management System
-- PostgreSQL Schema for managing 60+ similar pages

CREATE TABLE IF NOT EXISTS page_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  template_structure JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(255) UNIQUE NOT NULL,
  page_type VARCHAR(50) NOT NULL,
  template_id INTEGER REFERENCES page_templates(id),
  content JSONB NOT NULL,
  seo_meta JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page_versions (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  seo_meta JSONB NOT NULL,
  changed_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_id, version)
);

CREATE TABLE IF NOT EXISTS bulk_edits (
  id SERIAL PRIMARY KEY,
  edit_name VARCHAR(255) NOT NULL,
  find_text TEXT NOT NULL,
  replace_text TEXT NOT NULL,
  target_fields TEXT[],
  pages_affected INTEGER[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seo_keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  target_density DECIMAL(5,2) DEFAULT 2.5,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default Houston Heights local SEO keywords
INSERT INTO seo_keywords (keyword, category, target_density, priority) VALUES
('Houston Heights', 'location', 3.0, 5),
('Houston Heights framing', 'location', 2.0, 5),
('custom framing Houston', 'service', 2.5, 4),
('picture framing Houston Heights', 'service', 1.5, 4),
('museum quality framing Houston', 'service', 1.0, 3),
('Jay''s Frames', 'brand', 4.0, 5),
('Heights framing', 'location', 1.5, 3),
('professional framer Houston', 'service', 1.0, 3),
('art framing near me', 'service', 0.5, 2),
('custom picture frames Houston', 'service', 1.0, 3)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(page_slug);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_page_versions_page_id ON page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_bulk_edits_status ON bulk_edits(status);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON page_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
