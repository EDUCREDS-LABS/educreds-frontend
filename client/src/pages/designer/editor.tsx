import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEditorStore } from '@/store/editorStore';
import { DesignCanvas } from '@/components/editor/DesignCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Eye, 
  Download, 
  Upload, 
  Palette, 
  Code, 
  Settings,
  ArrowLeft,
  FileText,
  Image,
  Layers
} from 'lucide-react';
import { marketplaceService } from '@/lib/marketplaceService';

interface TemplateFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  licenseType: string;
  templateType: 'certificate' | 'logo' | 'banner' | 'other';
  isPublished: boolean;
}

export default function DesignerEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('design');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templateForm, setTemplateForm] = useState<TemplateFormData>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    tags: [],
    licenseType: 'unlimited',
    templateType: 'certificate',
    isPublished: false
  });
  const [newTag, setNewTag] = useState('');

  const {
    editor,
    isLoading,
    isDirty,
    currentTemplate,
    saveTemplate,
    exportTemplate,
    clearEditor
  } = useEditorStore();

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  const handleSave = async () => {
    if (!templateForm.name || !templateForm.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in template name and description.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      await saveTemplate();
      
      // Save template metadata to backend
      const templateData = {
        ...templateForm,
        creatorId: user?.id,
        htmlContent: editor?.getHtml() || '',
        cssContent: editor?.getCss() || '',
        grapesJsData: editor?.getProjectData() || {},
        placeholders: extractPlaceholders(editor?.getHtml() || ''),
        designMetadata: {
          canvasSize: { width: 800, height: 600 },
          layers: editor?.getComponents().length || 0,
          elements: editor?.getComponents().length || 0,
          fonts: extractFonts(editor?.getCss() || ''),
          colors: extractColors(editor?.getCss() || ''),
        }
      };

      await marketplaceService.createTemplate(templateData);
      
      toast({
        title: 'Success!',
        description: 'Template saved successfully.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!templateForm.name || !templateForm.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in template name and description before publishing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsPublishing(true);
      await saveTemplate();
      
      const templateData = {
        ...templateForm,
        isPublished: true,
        creatorId: user?.id,
        htmlContent: editor?.getHtml() || '',
        cssContent: editor?.getCss() || '',
        grapesJsData: editor?.getProjectData() || {},
        placeholders: extractPlaceholders(editor?.getHtml() || ''),
        designMetadata: {
          canvasSize: { width: 800, height: 600 },
          layers: editor?.getComponents().length || 0,
          elements: editor?.getComponents().length || 0,
          fonts: extractFonts(editor?.getCss() || ''),
          colors: extractColors(editor?.getCss() || ''),
        }
      };

      await marketplaceService.createTemplate(templateData);
      
      toast({
        title: 'Published!',
        description: 'Template published to marketplace successfully.',
      });
      
      // Redirect to designer dashboard
      window.location.href = '/designer';
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'Publish Failed',
        description: 'Failed to publish template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExport = async (format: string, data: any) => {
    try {
      
      if (format === 'png' || format === 'pdf') {
        // Handle binary data
        const blob = new Blob([data as Blob]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateForm.name || 'template'}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Handle text data
        const blob = new Blob([data as string], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateForm.name || 'template'}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: 'Export Successful',
        description: `Template exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: `Failed to export as ${format.toUpperCase()}`,
        variant: 'destructive',
      });
    }
  };

  const addTag = () => {
    if (newTag && !templateForm.tags.includes(newTag)) {
      setTemplateForm({
        ...templateForm,
        tags: [...templateForm.tags, newTag]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplateForm({
      ...templateForm,
      tags: templateForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const goBack = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        window.location.href = '/designer';
      }
    } else {
      window.location.href = '/designer';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the design editor.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Design Editor</h1>
            <p className="text-sm text-gray-600">Create professional certificate templates</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isDirty && <Badge variant="secondary">Unsaved</Badge>}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport('html')}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport('png')}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            <Publish className="h-4 w-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="design" className="text-xs">
                <Palette className="h-4 w-4 mr-1" />
                Design
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs">
                <Code className="h-4 w-4 mr-1" />
                Code
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="design" className="p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Template Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="name" className="text-xs">Template Name</Label>
                      <Input
                        id="name"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        placeholder="e.g., Academic Certificate"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-xs">Description</Label>
                      <Textarea
                        id="description"
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                        placeholder="Describe your template..."
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="price" className="text-xs">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={templateForm.price}
                          onChange={(e) => setTemplateForm({ ...templateForm, price: Number(e.target.value) })}
                          min="0"
                          step="0.01"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency" className="text-xs">Currency</Label>
                        <Select value={templateForm.currency} onValueChange={(value) => setTemplateForm({ ...templateForm, currency: value })}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="templateType" className="text-xs">Template Type</Label>
                      <Select value={templateForm.templateType} onValueChange={(value: any) => setTemplateForm({ ...templateForm, templateType: value })}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="certificate">Certificate</SelectItem>
                          <SelectItem value="logo">Logo</SelectItem>
                          <SelectItem value="banner">Banner</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="text-sm"
                      />
                      <Button onClick={addTag} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {templateForm.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag} Ã—
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">License Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={templateForm.licenseType} onValueChange={(value) => setTemplateForm({ ...templateForm, licenseType: value })}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-use">Single Use</SelectItem>
                        <SelectItem value="multi-use">Multi Use</SelectItem>
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                        <SelectItem value="seat-based">Seat Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Canvas Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Width (px)</Label>
                        <Input value="800" disabled className="text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Height (px)</Label>
                        <Input value="600" disabled className="text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Background</Label>
                      <Select defaultValue="white">
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="transparent">Transparent</SelectItem>
                          <SelectItem value="gradient">Gradient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Export Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Default Format</Label>
                      <Select defaultValue="png">
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="svg">SVG</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Quality</Label>
                      <Select defaultValue="high">
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code" className="p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">HTML Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={editor?.getHtml() || ''}
                      readOnly
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">CSS Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={editor?.getCss() || ''}
                      readOnly
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 flex flex-col">
          <DesignCanvas
            canvasSize="certificate"
            onSave={handleSave}
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  );
}

// Helper functions
function extractPlaceholders(html: string): { key: string; label: string }[] {
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const placeholders: { key: string; label: string }[] = [];
  let match;
  
  while ((match = placeholderRegex.exec(html)) !== null) {
    const key = match[1];
    if (!placeholders.find(p => p.key === key)) {
      placeholders.push({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      });
    }
  }
  
  return placeholders;
}

function extractFonts(css: string): string[] {
  const fontRegex = /font-family:\s*([^;]+)/g;
  const fonts: string[] = [];
  let match;
  
  while ((match = fontRegex.exec(css)) !== null) {
    const fontFamily = match[1].replace(/['"]/g, '').trim();
    if (!fonts.includes(fontFamily)) {
      fonts.push(fontFamily);
    }
  }
  
  return fonts;
}

function extractColors(css: string): string[] {
  const colorRegex = /(?:color|background-color|border-color):\s*([^;]+)/g;
  const colors: string[] = [];
  let match;
  
  while ((match = colorRegex.exec(css)) !== null) {
    const color = match[1].trim();
    if (!colors.includes(color) && color !== 'transparent') {
      colors.push(color);
    }
  }
  
  return colors;
}
