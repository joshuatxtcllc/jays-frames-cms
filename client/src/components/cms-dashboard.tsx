import { useState, useEffect } from 'react';
import { Upload, Edit, Save, Download, AlertCircle, CheckCircle, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/index';
import { Textarea } from '@/components/ui/index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/index';
import { Alert, AlertDescription } from '@/components/ui/index';

interface Page {
  id: number;
  page_slug: string;
  page_type: string;
  content: any;
  seo_meta: {
    title: string;
    description: string;
    keywords: string;
    canonicalUrl: string;
  };
  status: string;
  version: number;
  updated_at: string;
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

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CMSDashboard() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [seoAnalysis, setSeoAnalysis] = useState<EnhancedSEOAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk edit state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [targetFields, setTargetFields] = useState<string[]>(['content', 'seo_meta']);
  const [bulkEditResults, setBulkEditResults] = useState<any>(null);

  // Live editing state
  const [liveAnalysisEnabled, setLiveAnalysisEnabled] = useState(true);
  const debouncedCurrentPage = useDebounce(currentPage, 1000);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch all pages
  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/pages?search=${searchTerm}`);
      const data = await response.json();
      if (data.success) {
        setPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [searchTerm]);

  // Live SEO analysis on content change
  useEffect(() => {
    if (liveAnalysisEnabled && debouncedCurrentPage) {
      analyzeSEOLive(debouncedCurrentPage);
    }
  }, [debouncedCurrentPage, liveAnalysisEnabled]);

  // Handle file upload and extraction
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      setLoading(true);
      setUploadStatus(`Uploading ${files.length} files...`);

      const response = await fetch(`${API_URL}/api/extract/batch`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus(`Extracted ${data.successfulExtractions} of ${data.totalFiles} files`);

        // Save extracted contents to database
        for (const content of data.contents) {
          await fetch(`${API_URL}/api/pages/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageSlug: content.pageSlug,
              pageType: content.pageType,
              content: content.sections,
              seoMeta: content.seoMeta,
              status: 'draft',
            }),
          });
        }

        // Refresh pages list
        await fetchPages();
        setUploadStatus('All files processed and saved successfully!');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus('Error processing files');
    } finally {
      setLoading(false);
    }
  };

  // Execute bulk find & replace
  const executeBulkEdit = async (dryRun: boolean = false) => {
    if (!findText || selectedPages.length === 0) {
      alert('Please enter text to find and select pages');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/bulk-edit/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findText,
          replaceText,
          targetFields,
          pageIds: selectedPages,
          dryRun,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBulkEditResults(data);
        if (!dryRun) {
          await fetchPages(); // Refresh pages after edit
          setFindText('');
          setReplaceText('');
          setSelectedPages([]);
        }
      }
    } catch (error) {
      console.error('Error executing bulk edit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Analyze page SEO
  const analyzeSEO = async (pageSlug: string) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/seo/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageSlug }),
      });

      const data = await response.json();

      if (data.success) {
        setSeoAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing SEO:', error);
    } finally {
      setLoading(false);
    }
  };

  // Live SEO analysis
  const analyzeSEOLive = async (page: Page) => {
    try {
      const response = await fetch(`${API_URL}/api/seo/analyze/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: page.content,
          seoMeta: page.seo_meta,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSeoAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error in live SEO analysis:', error);
    }
  };

  // Update page content
  const updatePageContent = async (page: Page) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/pages/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageSlug: page.page_slug,
          pageType: page.page_type,
          content: page.content,
          seoMeta: page.seo_meta,
          status: 'published',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Page updated successfully!');
        await fetchPages();
      }
    } catch (error) {
      console.error('Error updating page:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download all pages as ZIP
  const downloadAllPages = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/pages/export/zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds: pages.map(p => p.id) }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jays-frames-pages.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading pages:', error);
      alert('Error downloading files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle page selection
  const togglePageSelection = (pageId: number) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  // Select/deselect all pages
  const toggleAllPages = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(pages.map(p => p.id));
    }
  };

  // Get color indicator for status
  const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
    if (status === 'green') return 'text-green-600';
    if (status === 'yellow') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBg = (status: 'green' | 'yellow' | 'red') => {
    if (status === 'green') return 'bg-green-100';
    if (status === 'yellow') return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreColor = (score: number) => {
    if (score >= 67) return 'text-green-600';
    if (score >= 34) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Jay's Frames Content Management System
          </h1>
          <p className="text-lg text-gray-600">
            Bulk edit 60+ pages with SEO optimization and live preview
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Step 1: Upload Your React Page Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                multiple
                accept=".tsx,.jsx"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {uploadStatus && (
                <Alert>
                  <AlertDescription>{uploadStatus}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-gray-600">
                Upload all 60 React/TSX files at once. We'll extract all text content automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="bulk-edit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bulk-edit">Bulk Editor</TabsTrigger>
            <TabsTrigger value="individual">Individual Pages</TabsTrigger>
            <TabsTrigger value="seo">SEO Analysis</TabsTrigger>
          </TabsList>

          {/* Bulk Edit Tab */}
          <TabsContent value="bulk-edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Step 2: Bulk Find & Replace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Find Text</label>
                    <Input
                      value={findText}
                      onChange={(e) => setFindText(e.target.value)}
                      placeholder="e.g., 'Jay Stevens'"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Replace With</label>
                    <Input
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder="e.g., 'Jay Stevens'"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Search In:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={targetFields.includes('content')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetFields([...targetFields, 'content']);
                          } else {
                            setTargetFields(targetFields.filter(f => f !== 'content'));
                          }
                        }}
                      />
                      Page Content
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={targetFields.includes('seo_meta')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetFields([...targetFields, 'seo_meta']);
                          } else {
                            setTargetFields(targetFields.filter(f => f !== 'seo_meta'));
                          }
                        }}
                      />
                      SEO Meta Tags
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => executeBulkEdit(true)}
                    variant="outline"
                    disabled={loading || selectedPages.length === 0}
                  >
                    Preview Changes
                  </Button>
                  <Button
                    onClick={() => executeBulkEdit(false)}
                    disabled={loading || selectedPages.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Apply to {selectedPages.length} Pages
                  </Button>
                </div>

                {bulkEditResults && (
                  <Alert className={bulkEditResults.dryRun ? 'border-blue-500' : 'border-green-500'}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">
                        {bulkEditResults.dryRun ? 'Preview Results' : 'Changes Applied'}
                      </div>
                      <div>
                        Affected {bulkEditResults.totalAffected} pages
                      </div>
                      {bulkEditResults.affectedPages.slice(0, 5).map((page: any) => (
                        <div key={page.pageId} className="text-sm mt-1">
                          • {page.pageSlug}: {page.changes.join(', ')}
                        </div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Pages List with Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Select Pages ({selectedPages.length} of {pages.length} selected)
                  </CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search pages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button onClick={toggleAllPages} variant="outline" size="sm">
                      {selectedPages.length === pages.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pages.map(page => (
                    <div
                      key={page.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPages.includes(page.id)
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => togglePageSelection(page.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{page.seo_meta.title}</div>
                          <div className="text-sm text-gray-600">/{page.page_slug}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {page.status}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedPages.includes(page.id)}
                            onChange={() => togglePageSelection(page.id)}
                            className="w-5 h-5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Pages Tab */}
          <TabsContent value="individual" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Individual Page</CardTitle>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={liveAnalysisEnabled}
                      onChange={(e) => setLiveAnalysisEnabled(e.target.checked)}
                    />
                    Live SEO Analysis
                  </label>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Page</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => {
                      const page = pages.find(p => p.id === parseInt(e.target.value));
                      setCurrentPage(page || null);
                      if (page && !liveAnalysisEnabled) analyzeSEO(page.page_slug);
                    }}
                  >
                    <option value="">Choose a page...</option>
                    {pages.map(page => (
                      <option key={page.id} value={page.id}>
                        {page.seo_meta.title}
                      </option>
                    ))}
                  </select>
                </div>

                {currentPage && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column - Editor */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                          <span>SEO Title</span>
                          {seoAnalysis && (
                            <span className={`text-xs px-2 py-1 rounded ${getStatusBg(seoAnalysis.titleStatus)}`}>
                              {currentPage.seo_meta.title.length} chars
                              {seoAnalysis.titleStatus === 'green' && ' ✓'}
                              {seoAnalysis.titleStatus === 'yellow' && ' ⚠'}
                              {seoAnalysis.titleStatus === 'red' && ' ✗'}
                            </span>
                          )}
                        </label>
                        <Input
                          value={currentPage.seo_meta.title}
                          onChange={(e) => setCurrentPage({
                            ...currentPage,
                            seo_meta: { ...currentPage.seo_meta, title: e.target.value }
                          })}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Optimal: 50-60 characters {seoAnalysis?.titleHasKeyword ? '✓ Has keyword' : '✗ Missing keyword'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Meta Description</label>
                        <Textarea
                          value={currentPage.seo_meta.description}
                          onChange={(e) => setCurrentPage({
                            ...currentPage,
                            seo_meta: { ...currentPage.seo_meta, description: e.target.value }
                          })}
                          rows={3}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {currentPage.seo_meta.description.length} characters (aim for 150-160)
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Keywords</label>
                        <Input
                          value={currentPage.seo_meta.keywords}
                          onChange={(e) => setCurrentPage({
                            ...currentPage,
                            seo_meta: { ...currentPage.seo_meta, keywords: e.target.value }
                          })}
                        />
                      </div>

                      <div className="pt-4">
                        <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                          <span>Page Content (JSON)</span>
                          {seoAnalysis && (
                            <span className={`text-xs px-2 py-1 rounded ${getStatusBg(seoAnalysis.firstParagraphStatus)}`}>
                              First ¶: {seoAnalysis.firstParagraphWordCount} words
                              {seoAnalysis.firstParagraphStatus === 'green' && ' ✓'}
                              {seoAnalysis.firstParagraphStatus === 'yellow' && ' ⚠'}
                              {seoAnalysis.firstParagraphStatus === 'red' && ' ✗'}
                            </span>
                          )}
                        </label>
                        <Textarea
                          value={JSON.stringify(currentPage.content, null, 2)}
                          onChange={(e) => {
                            try {
                              setCurrentPage({
                                ...currentPage,
                                content: JSON.parse(e.target.value)
                              });
                            } catch (error) {
                              // Invalid JSON, ignore
                            }
                          }}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>

                      <Button
                        onClick={() => updatePageContent(currentPage)}
                        disabled={loading}
                        className="w-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>

                    {/* Right Column - Live Feedback */}
                    {seoAnalysis && (
                      <div className="space-y-4">
                        {/* Overall Score */}
                        <Card className={`border-2 ${
                          seoAnalysis.overallScore >= 67 ? 'border-green-500' :
                          seoAnalysis.overallScore >= 34 ? 'border-yellow-500' : 'border-red-500'
                        }`}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">SEO Score</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center">
                              <div className={`text-6xl font-bold ${getScoreColor(seoAnalysis.overallScore)}`}>
                                {seoAnalysis.overallScore}
                              </div>
                              <div className="text-sm text-gray-600 mt-2">out of 100</div>
                              <div className="mt-4 bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    seoAnalysis.overallScore >= 67 ? 'bg-green-500' :
                                    seoAnalysis.overallScore >= 34 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${seoAnalysis.overallScore}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Keyword Stuffing Alerts */}
                        {seoAnalysis.keywordStuffingAlerts.length > 0 && (
                          <Alert className="border-red-500 bg-red-50">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <AlertDescription>
                              <div className="font-semibold text-red-900 mb-2">⚠️ Keyword Stuffing Detected!</div>
                              {seoAnalysis.keywordStuffingAlerts.map((alert, idx) => (
                                <div key={idx} className="mt-3 text-sm border-t pt-2">
                                  <div className="font-medium text-red-800">"{alert.keyword}"</div>
                                  <div className="mt-1 space-y-1">
                                    <div>Density: <span className="font-bold">{alert.density}%</span> (Target: 1-3%)</div>
                                    <div>Google Penalty Risk: <span className={`font-bold ${
                                      alert.penaltyRisk === 'High' ? 'text-red-600' :
                                      alert.penaltyRisk === 'Medium' ? 'text-yellow-600' : 'text-orange-600'
                                    }`}>{alert.penaltyRisk}</span></div>
                                    <div className="text-xs bg-white p-2 rounded mt-2">
                                      <strong>Recommendation:</strong> Reduce from {alert.currentCount} to ~{alert.recommendedCount} occurrences
                                      <br />
                                      <span className="text-gray-600">Before: {alert.density}% → After: ~3%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Score Breakdown */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Score Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {seoAnalysis.scoreBreakdown.map((breakdown, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{breakdown.category}</span>
                                  <span className={`font-bold ${getStatusColor(breakdown.status)}`}>
                                    {breakdown.score}/{breakdown.maxScore}
                                  </span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      breakdown.status === 'green' ? 'bg-green-500' :
                                      breakdown.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${(breakdown.score / breakdown.maxScore) * 100}%` }}
                                  />
                                </div>
                                {breakdown.issues.length > 0 && (
                                  <div className="text-xs text-gray-600 ml-2">
                                    {breakdown.issues.map((issue, i) => (
                                      <div key={i}>• {issue}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        {/* Keyword Density */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Keyword Density</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {Object.entries(seoAnalysis.keywordDensity).map(([keyword, density]) => (
                              <div key={keyword} className="flex justify-between items-center text-sm">
                                <span className="truncate">{keyword}</span>
                                <span className={`font-medium px-2 py-1 rounded ${
                                  density >= 1 && density <= 3 ? 'bg-green-100 text-green-700' :
                                  density < 1 ? 'bg-red-100 text-red-700' :
                                  density > 4 ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {density}%
                                </span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Content Stats</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Word Count</span>
                              <span className="font-medium">{seoAnalysis.wordCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Readability</span>
                              <span className="font-medium">{seoAnalysis.readabilityScore}/100</span>
                            </div>
                            <div className="flex justify-between">
                              <span>H1 Tags</span>
                              <span className={`font-medium ${seoAnalysis.h1Count === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                {seoAnalysis.h1Count}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Analysis Tab */}
          <TabsContent value="seo" className="space-y-6">
            {currentPage && seoAnalysis && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Overall Score Card */}
                <Card className={`border-2 ${
                  seoAnalysis.overallScore >= 67 ? 'border-green-500' :
                  seoAnalysis.overallScore >= 34 ? 'border-yellow-500' : 'border-red-500'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Overall SEO Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-7xl font-bold ${getScoreColor(seoAnalysis.overallScore)}`}>
                        {seoAnalysis.overallScore}
                      </div>
                      <div className="text-lg text-gray-600 mt-2">out of 100</div>
                      <div className="mt-6 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            seoAnalysis.overallScore >= 67 ? 'bg-green-500' :
                            seoAnalysis.overallScore >= 34 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${seoAnalysis.overallScore}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Content Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600">Word Count</div>
                      <div className="text-3xl font-bold">{seoAnalysis.wordCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Readability Score</div>
                      <div className="text-3xl font-bold">{seoAnalysis.readabilityScore}</div>
                      <div className="text-xs text-gray-500">
                        {seoAnalysis.readabilityScore > 60 ? '✓ Easy to read' : '⚠ Could be simpler'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Breakdown */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Detailed Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {seoAnalysis.scoreBreakdown.map((breakdown, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{breakdown.category}</span>
                          <span className={`text-lg font-bold ${getStatusColor(breakdown.status)}`}>
                            {breakdown.score}/{breakdown.maxScore}
                          </span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              breakdown.status === 'green' ? 'bg-green-500' :
                              breakdown.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(breakdown.score / breakdown.maxScore) * 100}%` }}
                          />
                        </div>
                        {breakdown.issues.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {breakdown.issues.map((issue, i) => (
                              <div key={i} className="text-sm text-gray-600">• {issue}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Keyword Stuffing Alerts */}
                {seoAnalysis.keywordStuffingAlerts.length > 0 && (
                  <Card className="md:col-span-2 border-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        Keyword Stuffing Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {seoAnalysis.keywordStuffingAlerts.map((alert, idx) => (
                          <Alert key={idx} className="border-red-300 bg-red-50">
                            <AlertDescription>
                              <div className="space-y-2">
                                <div className="font-semibold text-red-900">"{alert.keyword}"</div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Current Density:</span>
                                    <span className="ml-2 font-bold text-red-700">{alert.density}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Google Penalty Risk:</span>
                                    <span className={`ml-2 font-bold ${
                                      alert.penaltyRisk === 'High' ? 'text-red-600' :
                                      alert.penaltyRisk === 'Medium' ? 'text-yellow-600' : 'text-orange-600'
                                    }`}>{alert.penaltyRisk}</span>
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded mt-2 text-sm">
                                  <strong>Recommendation:</strong> Reduce from {alert.currentCount} to approximately {alert.recommendedCount} occurrences
                                  <div className="mt-1 text-gray-600">
                                    Before: {alert.density}% → After: ~3% (optimal range: 1-3%)
                                  </div>
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Keyword Density */}
                <Card>
                  <CardHeader>
                    <CardTitle>Keyword Density Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(seoAnalysis.keywordDensity).map(([keyword, density]) => (
                        <div key={keyword}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{keyword}</span>
                            <span className={`font-bold ${
                              density >= 1 && density <= 3 ? 'text-green-600' :
                              density < 1 ? 'text-red-600' :
                              density > 4 ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {density}%
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                density >= 1 && density <= 3 ? 'bg-green-500' :
                                density < 1 ? 'bg-red-500' :
                                density > 4 ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min(density * 20, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      SEO Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {seoAnalysis.suggestions.length > 0 ? (
                        seoAnalysis.suggestions.map((suggestion, index) => (
                          <Alert key={index}>
                            <AlertDescription>{suggestion}</AlertDescription>
                          </Alert>
                        ))
                      ) : (
                        <div className="text-green-600 font-medium">✓ All SEO best practices are being followed!</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!currentPage && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Select a page from the Individual Pages tab to see SEO analysis
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Download Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Step 3: Download Updated Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={downloadAllPages}
              disabled={pages.length === 0 || loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All {pages.length} Updated Files as ZIP
            </Button>
            <p className="text-sm text-gray-600 mt-4">
              Download all edited files as individual .tsx files in a ZIP archive, ready to deploy to Railway
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
