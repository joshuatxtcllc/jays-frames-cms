import fs from 'fs';
import path from 'path';

// Simple content extractor using regex patterns
// For production with Babel, you'd need: npm install @babel/parser @babel/traverse @babel/types

interface ExtractedContent {
  pageSlug: string;
  pageType: string;
  seoMeta: {
    title: string;
    description: string;
    keywords: string;
    canonicalUrl: string;
  };
  sections: {
    [key: string]: {
      type: string;
      content: any;
    };
  };
}

interface SEOAnalysis {
  wordCount: number;
  keywordDensity: { [keyword: string]: number };
  readabilityScore: number;
  suggestions: string[];
}

/**
 * Extract content from React/TSX files using regex patterns
 * Note: For production, use Babel AST parser for more accurate extraction
 */
export function extractPageContent(filePath: string): ExtractedContent {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, path.extname(filePath));
  
  const extracted: ExtractedContent = {
    pageSlug: fileName.toLowerCase(),
    pageType: determinePageType(fileName),
    seoMeta: {
      title: '',
      description: '',
      keywords: '',
      canonicalUrl: '',
    },
    sections: {},
  };

  // Extract SEOHead component props
  const titleMatch = fileContent.match(/title="([^"]*)"/);
  if (titleMatch) extracted.seoMeta.title = titleMatch[1];

  const descMatch = fileContent.match(/description="([^"]*)"/);
  if (descMatch) extracted.seoMeta.description = descMatch[1];

  const keywordsMatch = fileContent.match(/keywords="([^"]*)"/);
  if (keywordsMatch) extracted.seoMeta.keywords = keywordsMatch[1];

  const canonicalMatch = fileContent.match(/canonicalUrl="([^"]*)"/);
  if (canonicalMatch) extracted.seoMeta.canonicalUrl = canonicalMatch[1];

  // Extract h1 headings
  const h1Matches = fileContent.matchAll(/<h1[^>]*>(.*?)<\/h1>/gs);
  let h1Count = 0;
  for (const match of h1Matches) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      extracted.sections[`heading_h1_${h1Count++}`] = {
        type: 'h1',
        content: text,
      };
    }
  }

  // Extract h2 headings
  const h2Matches = fileContent.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs);
  let h2Count = 0;
  for (const match of h2Matches) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      extracted.sections[`heading_h2_${h2Count++}`] = {
        type: 'h2',
        content: text,
      };
    }
  }

  // Extract paragraphs
  const pMatches = fileContent.matchAll(/<p[^>]*>(.*?)<\/p>/gs);
  let pCount = 0;
  for (const match of pMatches) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text && text.length > 50) {
      extracted.sections[`paragraph_${pCount++}`] = {
        type: 'paragraph',
        content: text,
      };
    }
  }

  return extracted;
}

/**
 * Determine page type from filename
 */
function determinePageType(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('about')) return 'about';
  if (lowerName.includes('service')) return 'service';
  if (lowerName.includes('location')) return 'location';
  if (lowerName.includes('portfolio')) return 'portfolio';
  if (lowerName.includes('contact')) return 'contact';
  
  return 'general';
}

/**
 * Analyze page content for SEO
 */
export function analyzePageSEO(
  content: ExtractedContent,
  targetKeywords: string[]
): SEOAnalysis {
  // Combine all text
  let allText = content.seoMeta.title + ' ' + content.seoMeta.description;
  
  Object.values(content.sections).forEach((section) => {
    if (typeof section.content === 'string') {
      allText += ' ' + section.content;
    }
  });

  const words = allText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Calculate keyword density
  const keywordDensity: { [keyword: string]: number } = {};
  
  targetKeywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = allText.match(regex) || [];
    const density = wordCount > 0 ? (matches.length / wordCount) * 100 : 0;
    keywordDensity[keyword] = parseFloat(density.toFixed(2));
  });

  // Simple readability score (simplified Flesch)
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
  const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence)));

  // Generate suggestions
  const suggestions: string[] = [];
  
  if (wordCount < 300) {
    suggestions.push('Content is too short. Aim for at least 500 words for better SEO.');
  }
  
  targetKeywords.forEach((keyword) => {
    if (keywordDensity[keyword] < 1.0) {
      suggestions.push(`Keyword "${keyword}" density is low (${keywordDensity[keyword]}%). Target: 1-3%`);
    } else if (keywordDensity[keyword] > 4.0) {
      suggestions.push(`Keyword "${keyword}" density is too high (${keywordDensity[keyword]}%). May trigger spam filters.`);
    }
  });
  
  if (!content.seoMeta.title.toLowerCase().includes('houston')) {
    suggestions.push('Consider adding "Houston Heights" to your title tag for local SEO.');
  }

  if (content.seoMeta.description.length < 120) {
    suggestions.push('Meta description is too short. Aim for 150-160 characters.');
  }

  if (content.seoMeta.description.length > 160) {
    suggestions.push('Meta description is too long. Keep it under 160 characters.');
  }

  return {
    wordCount,
    keywordDensity,
    readabilityScore: parseFloat(readabilityScore.toFixed(1)),
    suggestions,
  };
}

/**
 * Generate updated file (simplified version)
 */
export function generateUpdatedFile(
  originalFilePath: string,
  updatedContent: ExtractedContent
): string {
  let fileContent = fs.readFileSync(originalFilePath, 'utf-8');
  
  // Update SEO meta
  if (updatedContent.seoMeta.title) {
    fileContent = fileContent.replace(
      /title="[^"]*"/,
      `title="${updatedContent.seoMeta.title}"`
    );
  }
  
  if (updatedContent.seoMeta.description) {
    fileContent = fileContent.replace(
      /description="[^"]*"/,
      `description="${updatedContent.seoMeta.description}"`
    );
  }
  
  if (updatedContent.seoMeta.keywords) {
    fileContent = fileContent.replace(
      /keywords="[^"]*"/,
      `keywords="${updatedContent.seoMeta.keywords}"`
    );
  }
  
  return fileContent;
}

export default {
  extractPageContent,
  analyzePageSEO,
  generateUpdatedFile,
};
