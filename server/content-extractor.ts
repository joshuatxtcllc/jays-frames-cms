import fs from 'fs';
import path from 'path';

// Enhanced content extractor with full TSX reconstruction and advanced SEO analysis

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

interface KeywordStuffingAlert {
  keyword: string;
  density: number;
  severity: 'low' | 'medium' | 'high';
  penaltyRisk: 'Low' | 'Medium' | 'High';
  currentCount: number;
  recommendedCount: number;
}

interface SEOScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  status: 'green' | 'yellow' | 'red';
  issues: string[];
}

interface EnhancedSEOAnalysis {
  // Original metrics
  wordCount: number;
  keywordDensity: { [keyword: string]: number };
  readabilityScore: number;
  suggestions: string[];

  // New enhanced metrics
  overallScore: number; // 0-100
  scoreBreakdown: SEOScoreBreakdown[];
  keywordStuffingAlerts: KeywordStuffingAlert[];

  // Title metrics
  titleLength: number;
  titleStatus: 'green' | 'yellow' | 'red';
  titleHasKeyword: boolean;

  // First paragraph metrics
  firstParagraphWordCount: number;
  firstParagraphStatus: 'green' | 'yellow' | 'red';
  keywordInFirstSentence: boolean;

  // Content quality
  hasH1: boolean;
  h1Count: number;
  hasMetaDescription: boolean;
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

  // Extract h3 headings
  const h3Matches = fileContent.matchAll(/<h3[^>]*>(.*?)<\/h3>/gs);
  let h3Count = 0;
  for (const match of h3Matches) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      extracted.sections[`heading_h3_${h3Count++}`] = {
        type: 'h3',
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
 * Enhanced SEO analysis with scoring, keyword stuffing detection, and visual indicators
 */
export function analyzePageSEO(
  content: ExtractedContent,
  targetKeywords: string[]
): EnhancedSEOAnalysis {
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
  const keywordCounts: { [keyword: string]: number } = {};

  targetKeywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = allText.match(regex) || [];
    const count = matches.length;
    const density = wordCount > 0 ? (count / wordCount) * 100 : 0;
    keywordDensity[keyword] = parseFloat(density.toFixed(2));
    keywordCounts[keyword] = count;
  });

  // Simple readability score (simplified Flesch)
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
  const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence)));

  // ===== NEW: TITLE ANALYSIS =====
  const titleLength = content.seoMeta.title.length;
  let titleStatus: 'green' | 'yellow' | 'red' = 'red';
  if (titleLength >= 50 && titleLength <= 60) {
    titleStatus = 'green';
  } else if (titleLength >= 40 && titleLength < 70) {
    titleStatus = 'yellow';
  }

  // Check if title has keyword
  const titleHasKeyword = targetKeywords.some(kw =>
    content.seoMeta.title.toLowerCase().includes(kw.toLowerCase())
  );

  // ===== NEW: FIRST PARAGRAPH ANALYSIS =====
  const firstParagraph = Object.entries(content.sections)
    .filter(([key, val]) => key.startsWith('paragraph_'))
    .sort((a, b) => {
      const numA = parseInt(a[0].split('_')[1]);
      const numB = parseInt(b[0].split('_')[1]);
      return numA - numB;
    })[0];

  let firstParagraphWordCount = 0;
  let firstParagraphStatus: 'green' | 'yellow' | 'red' = 'red';
  let keywordInFirstSentence = false;

  if (firstParagraph && typeof firstParagraph[1].content === 'string') {
    const fpWords = firstParagraph[1].content.split(/\s+/).filter(w => w.length > 0);
    firstParagraphWordCount = fpWords.length;

    if (firstParagraphWordCount >= 150 && firstParagraphWordCount <= 200) {
      firstParagraphStatus = 'green';
    } else if (firstParagraphWordCount >= 100 && firstParagraphWordCount < 250) {
      firstParagraphStatus = 'yellow';
    }

    // Check if keyword is in first sentence
    const firstSentence = firstParagraph[1].content.split(/[.!?]/)[0];
    keywordInFirstSentence = targetKeywords.some(kw =>
      firstSentence.toLowerCase().includes(kw.toLowerCase())
    );
  }

  // ===== NEW: KEYWORD STUFFING ALERTS =====
  const keywordStuffingAlerts: KeywordStuffingAlert[] = [];

  targetKeywords.forEach((keyword) => {
    const density = keywordDensity[keyword];
    const count = keywordCounts[keyword];

    if (density > 4.0) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      let penaltyRisk: 'Low' | 'Medium' | 'High' = 'Low';

      if (density > 6.0) {
        severity = 'high';
        penaltyRisk = 'High';
      } else if (density > 5.0) {
        severity = 'medium';
        penaltyRisk = 'Medium';
      }

      // Calculate recommended count for 3% density
      const recommendedCount = Math.floor((wordCount * 3.0) / 100);

      keywordStuffingAlerts.push({
        keyword,
        density,
        severity,
        penaltyRisk,
        currentCount: count,
        recommendedCount,
      });
    }
  });

  // ===== NEW: OVERALL SCORE BREAKDOWN =====
  const scoreBreakdown: SEOScoreBreakdown[] = [];

  // 1. Title Score (20 points max)
  let titleScore = 0;
  const titleIssues: string[] = [];

  if (titleLength >= 50 && titleLength <= 60) {
    titleScore += 10;
  } else if (titleLength >= 40 && titleLength < 70) {
    titleScore += 5;
    titleIssues.push(`Title length is ${titleLength} chars (optimal: 50-60)`);
  } else {
    titleIssues.push(`Title length is ${titleLength} chars (optimal: 50-60)`);
  }

  if (titleHasKeyword) {
    titleScore += 10;
  } else {
    titleIssues.push('Title should include a target keyword');
  }

  scoreBreakdown.push({
    category: 'Title Optimization',
    score: titleScore,
    maxScore: 20,
    status: titleScore >= 15 ? 'green' : titleScore >= 10 ? 'yellow' : 'red',
    issues: titleIssues,
  });

  // 2. Meta Description Score (15 points max)
  let metaScore = 0;
  const metaIssues: string[] = [];
  const descLength = content.seoMeta.description.length;

  if (descLength >= 150 && descLength <= 160) {
    metaScore += 15;
  } else if (descLength >= 120 && descLength < 170) {
    metaScore += 10;
    metaIssues.push(`Description length is ${descLength} chars (optimal: 150-160)`);
  } else if (descLength > 0) {
    metaScore += 5;
    metaIssues.push(`Description length is ${descLength} chars (optimal: 150-160)`);
  } else {
    metaIssues.push('Missing meta description');
  }

  scoreBreakdown.push({
    category: 'Meta Description',
    score: metaScore,
    maxScore: 15,
    status: metaScore >= 12 ? 'green' : metaScore >= 8 ? 'yellow' : 'red',
    issues: metaIssues,
  });

  // 3. First Paragraph Score (20 points max)
  let firstParaScore = 0;
  const firstParaIssues: string[] = [];

  if (firstParagraphWordCount >= 150 && firstParagraphWordCount <= 200) {
    firstParaScore += 10;
  } else if (firstParagraphWordCount >= 100 && firstParagraphWordCount < 250) {
    firstParaScore += 5;
    firstParaIssues.push(`First paragraph has ${firstParagraphWordCount} words (optimal: 150-200)`);
  } else if (firstParagraphWordCount > 0) {
    firstParaIssues.push(`First paragraph has ${firstParagraphWordCount} words (optimal: 150-200)`);
  } else {
    firstParaIssues.push('No paragraphs found');
  }

  if (keywordInFirstSentence) {
    firstParaScore += 10;
  } else {
    firstParaIssues.push('Keyword should appear in first sentence');
  }

  scoreBreakdown.push({
    category: 'First Paragraph',
    score: firstParaScore,
    maxScore: 20,
    status: firstParaScore >= 15 ? 'green' : firstParaScore >= 10 ? 'yellow' : 'red',
    issues: firstParaIssues,
  });

  // 4. Keyword Density Score (25 points max)
  let keywordScore = 0;
  const keywordIssues: string[] = [];

  targetKeywords.forEach((keyword) => {
    const density = keywordDensity[keyword];
    if (density >= 1.0 && density <= 3.0) {
      keywordScore += (25 / targetKeywords.length);
    } else if (density >= 0.5 && density < 5.0) {
      keywordScore += (12 / targetKeywords.length);
      if (density < 1.0) {
        keywordIssues.push(`"${keyword}" density too low (${density}%, target: 1-3%)`);
      } else {
        keywordIssues.push(`"${keyword}" density too high (${density}%, target: 1-3%)`);
      }
    } else {
      if (density === 0) {
        keywordIssues.push(`"${keyword}" not found in content`);
      } else {
        keywordIssues.push(`"${keyword}" density critical (${density}%, target: 1-3%)`);
      }
    }
  });

  scoreBreakdown.push({
    category: 'Keyword Density',
    score: Math.round(keywordScore),
    maxScore: 25,
    status: keywordScore >= 18 ? 'green' : keywordScore >= 12 ? 'yellow' : 'red',
    issues: keywordIssues,
  });

  // 5. Content Quality Score (20 points max)
  let contentScore = 0;
  const contentIssues: string[] = [];

  // Check word count
  if (wordCount >= 500) {
    contentScore += 10;
  } else if (wordCount >= 300) {
    contentScore += 5;
    contentIssues.push(`Content has ${wordCount} words (recommended: 500+)`);
  } else {
    contentIssues.push(`Content too short (${wordCount} words, recommended: 500+)`);
  }

  // Check H1 tags
  const h1Count = Object.keys(content.sections).filter(k => k.startsWith('heading_h1_')).length;
  if (h1Count === 1) {
    contentScore += 5;
  } else if (h1Count === 0) {
    contentIssues.push('Missing H1 heading');
  } else {
    contentIssues.push(`Multiple H1 tags found (${h1Count}), should have exactly 1`);
  }

  // Check readability
  if (readabilityScore >= 60) {
    contentScore += 5;
  } else if (readabilityScore >= 40) {
    contentScore += 2;
    contentIssues.push(`Readability score is ${readabilityScore.toFixed(1)} (target: 60+)`);
  } else {
    contentIssues.push(`Readability score is low (${readabilityScore.toFixed(1)}, target: 60+)`);
  }

  scoreBreakdown.push({
    category: 'Content Quality',
    score: contentScore,
    maxScore: 20,
    status: contentScore >= 15 ? 'green' : contentScore >= 10 ? 'yellow' : 'red',
    issues: contentIssues,
  });

  // Calculate overall score
  const overallScore = Math.round(
    scoreBreakdown.reduce((sum, breakdown) => sum + breakdown.score, 0)
  );

  // Generate suggestions (legacy format)
  const suggestions: string[] = [];

  if (wordCount < 300) {
    suggestions.push('Content is too short. Aim for at least 500 words for better SEO.');
  }

  targetKeywords.forEach((keyword) => {
    if (keywordDensity[keyword] < 1.0) {
      suggestions.push(`Keyword "${keyword}" density is low (${keywordDensity[keyword]}%). Target: 1-3%`);
    } else if (keywordDensity[keyword] > 4.0) {
      suggestions.push(`⚠️ KEYWORD STUFFING: "${keyword}" density is too high (${keywordDensity[keyword]}%). May trigger spam filters.`);
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
    // Original metrics
    wordCount,
    keywordDensity,
    readabilityScore: parseFloat(readabilityScore.toFixed(1)),
    suggestions,

    // New enhanced metrics
    overallScore,
    scoreBreakdown,
    keywordStuffingAlerts,

    titleLength,
    titleStatus,
    titleHasKeyword,

    firstParagraphWordCount,
    firstParagraphStatus,
    keywordInFirstSentence,

    hasH1: h1Count > 0,
    h1Count,
    hasMetaDescription: content.seoMeta.description.length > 0,
  };
}

/**
 * Generate complete TSX file from database content
 */
export function generateTSXFile(
  pageSlug: string,
  pageType: string,
  seoMeta: ExtractedContent['seoMeta'],
  sections: ExtractedContent['sections']
): string {
  // Sort sections by type and index
  const sortedSections = Object.entries(sections).sort((a, b) => {
    const [keyA, valA] = a;
    const [keyB, valB] = b;

    // Extract type and index from keys like "heading_h1_0", "paragraph_2"
    const getTypeAndIndex = (key: string) => {
      const parts = key.split('_');
      const indexStr = parts[parts.length - 1];
      const index = parseInt(indexStr) || 0;
      const type = parts.slice(0, -1).join('_');
      return { type, index };
    };

    const aInfo = getTypeAndIndex(keyA);
    const bInfo = getTypeAndIndex(keyB);

    // Sort by index
    return aInfo.index - bInfo.index;
  });

  // Build content sections
  let contentJSX = '';

  sortedSections.forEach(([key, section]) => {
    if (section.type === 'h1') {
      contentJSX += `      <h1 className="text-4xl font-bold mb-6">${section.content}</h1>\n`;
    } else if (section.type === 'h2') {
      contentJSX += `      <h2 className="text-3xl font-semibold mt-8 mb-4">${section.content}</h2>\n`;
    } else if (section.type === 'h3') {
      contentJSX += `      <h3 className="text-2xl font-semibold mt-6 mb-3">${section.content}</h3>\n`;
    } else if (section.type === 'paragraph') {
      contentJSX += `      <p className="text-lg mb-4">${section.content}</p>\n`;
    }
  });

  // Generate complete TSX file
  const tsxTemplate = `import React from 'react';
import SEOHead from '../components/SEOHead';

export default function ${toPascalCase(pageSlug)}() {
  return (
    <>
      <SEOHead
        title="${escapeQuotes(seoMeta.title)}"
        description="${escapeQuotes(seoMeta.description)}"
        keywords="${escapeQuotes(seoMeta.keywords)}"
        canonicalUrl="${escapeQuotes(seoMeta.canonicalUrl)}"
      />

      <div className="container mx-auto px-4 py-12">
${contentJSX.trimEnd()}
      </div>
    </>
  );
}
`;

  return tsxTemplate;
}

/**
 * Generate updated file (enhanced version that updates all content)
 */
export function generateUpdatedFile(
  originalFilePath: string,
  updatedContent: ExtractedContent
): string {
  // Try to read original file for structure preservation
  let fileContent = '';
  try {
    fileContent = fs.readFileSync(originalFilePath, 'utf-8');
  } catch (error) {
    // If original file doesn't exist, generate new one
    return generateTSXFile(
      updatedContent.pageSlug,
      updatedContent.pageType,
      updatedContent.seoMeta,
      updatedContent.sections
    );
  }

  // Update SEO meta
  if (updatedContent.seoMeta.title) {
    fileContent = fileContent.replace(
      /title="[^"]*"/,
      `title="${escapeQuotes(updatedContent.seoMeta.title)}"`
    );
  }

  if (updatedContent.seoMeta.description) {
    fileContent = fileContent.replace(
      /description="[^"]*"/,
      `description="${escapeQuotes(updatedContent.seoMeta.description)}"`
    );
  }

  if (updatedContent.seoMeta.keywords) {
    fileContent = fileContent.replace(
      /keywords="[^"]*"/,
      `keywords="${escapeQuotes(updatedContent.seoMeta.keywords)}"`
    );
  }

  if (updatedContent.seoMeta.canonicalUrl) {
    fileContent = fileContent.replace(
      /canonicalUrl="[^"]*"/,
      `canonicalUrl="${escapeQuotes(updatedContent.seoMeta.canonicalUrl)}"`
    );
  }

  // Update content sections
  Object.entries(updatedContent.sections).forEach(([key, section]) => {
    const escapedContent = escapeHtml(section.content);

    if (section.type === 'h1') {
      const index = parseInt(key.split('_').pop() || '0');
      const regex = new RegExp(`<h1[^>]*>.*?</h1>`, 'gs');
      let count = 0;
      fileContent = fileContent.replace(regex, (match) => {
        if (count === index) {
          count++;
          return match.replace(/>.*?</, `>${escapedContent}<`);
        }
        count++;
        return match;
      });
    } else if (section.type === 'h2') {
      const index = parseInt(key.split('_').pop() || '0');
      const regex = new RegExp(`<h2[^>]*>.*?</h2>`, 'gs');
      let count = 0;
      fileContent = fileContent.replace(regex, (match) => {
        if (count === index) {
          count++;
          return match.replace(/>.*?</, `>${escapedContent}<`);
        }
        count++;
        return match;
      });
    } else if (section.type === 'h3') {
      const index = parseInt(key.split('_').pop() || '0');
      const regex = new RegExp(`<h3[^>]*>.*?</h3>`, 'gs');
      let count = 0;
      fileContent = fileContent.replace(regex, (match) => {
        if (count === index) {
          count++;
          return match.replace(/>.*?</, `>${escapedContent}<`);
        }
        count++;
        return match;
      });
    } else if (section.type === 'paragraph') {
      const index = parseInt(key.split('_').pop() || '0');
      const regex = new RegExp(`<p[^>]*>.*?</p>`, 'gs');
      let count = 0;
      fileContent = fileContent.replace(regex, (match) => {
        // Only replace paragraphs with substantial content (>50 chars)
        const currentContent = match.replace(/<[^>]*>/g, '').trim();
        if (currentContent.length > 50) {
          if (count === index) {
            count++;
            return match.replace(/>.*?</, `>${escapedContent}<`);
          }
          count++;
        }
        return match;
      });
    }
  });

  return fileContent;
}

// Helper functions
function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}

function escapeHtml(str: string): string {
  // Don't escape HTML entities, preserve them as-is
  return str;
}

export default {
  extractPageContent,
  analyzePageSEO,
  generateUpdatedFile,
  generateTSXFile,
};
