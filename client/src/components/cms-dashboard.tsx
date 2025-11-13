import { useState, useEffect } from 'react';
import { Upload, Edit, Save, Download, AlertCircle, CheckCircle, TrendingUp, FileText } from 'lucide-react';
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

interface SEOAnalysis {
  wordCount: number;
  keywordDensity: { [keyword: string]: number };
  readabilityScore: number;
  suggestions: string[];
}

export default function CMSDashboard() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk edit state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [targetFields, setTargetFields] = useState<string[]>(['content', 'seo_meta']);
  const [bulkEditResults, setBulkEditResults] = useState<any>(null);

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
                <CardTitle>Edit Individual Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Page</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => {
                      const page = pages.find(p => p.id === parseInt(e.target.value));
                      setCurrentPage(page || null);
                      if (page) analyzeSEO(page.page_slug);
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
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-2">SEO Title</label>
                      <Input
                        value={currentPage.seo_meta.title}
                        onChange={(e) => setCurrentPage({
                          ...currentPage,
                          seo_meta: { ...currentPage.seo_meta, title: e.target.value }
                        })}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {currentPage.seo_meta.title.length} characters
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
                      <label className="block text-sm font-medium mb-2">Page Content (JSON)</label>
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
                        rows={10}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Analysis Tab */}
          <TabsContent value="seo" className="space-y-6">
            {currentPage && seoAnalysis && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      SEO Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600">Word Count</div>
                      <div className="text-2xl font-bold">{seoAnalysis.wordCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Readability Score</div>
                      <div className="text-2xl font-bold">{seoAnalysis.readabilityScore}</div>
                      <div className="text-xs text-gray-500">
                        {seoAnalysis.readabilityScore > 60 ? 'Easy to read' : 'Could be simpler'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Keyword Density
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(seoAnalysis.keywordDensity).map(([keyword, density]) => (
                        <div key={keyword} className="flex justify-between items-center">
                          <span className="text-sm">{keyword}</span>
                          <span className={`font-medium ${
                            density < 1 ? 'text-red-600' :
                            density > 4 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {density}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      SEO Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {seoAnalysis.suggestions.map((suggestion, index) => (
                        <Alert key={index}>
                          <AlertDescription>{suggestion}</AlertDescription>
                        </Alert>
                      ))}
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
            <Button disabled={pages.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download All {pages.length} Updated Files
            </Button>
            <p className="text-sm text-gray-600 mt-4">
              Download all edited files as a ZIP ready to deploy to Railway
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
