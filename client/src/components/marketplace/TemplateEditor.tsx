import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye, Download, Upload, Palette, Code, Settings } from 'lucide-react';

interface TemplateEditorProps {
  template?: any;
  onSave: (templateData: any) => void;
  onPreview: () => void;
}

export function TemplateEditor({ template, onSave, onPreview }: TemplateEditorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('design');
  const [templateData, setTemplateData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    htmlContent: template?.htmlContent || '',
    cssContent: template?.cssContent || '',
    price: template?.price || 0,
    currency: template?.currency || 'USD',
    tags: template?.tags || [],
    licenseType: template?.licenseType || 'unlimited',
    thumbnailUrl: template?.thumbnailUrl || '',
    placeholders: template?.placeholders || []
  });

  const [newTag, setNewTag] = useState('');
  const [newPlaceholder, setNewPlaceholder] = useState({ key: '', label: '' });

  const handleSave = () => {
    if (!templateData.name || !templateData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    onSave(templateData);
    toast({
      title: 'Success!',
      description: 'Template saved successfully.',
    });
  };

  const addTag = () => {
    if (newTag && !templateData.tags.includes(newTag)) {
      setTemplateData({
        ...templateData,
        tags: [...templateData.tags, newTag]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplateData({
      ...templateData,
      tags: templateData.tags.filter((tag: string) => tag !== tagToRemove)
    });
  };

  const addPlaceholder = () => {
    if (newPlaceholder.key && newPlaceholder.label) {
      setTemplateData({
        ...templateData,
        placeholders: [...templateData.placeholders, newPlaceholder]
      });
      setNewPlaceholder({ key: '', label: '' });
    }
  };

  const removePlaceholder = (index: number) => {
    setTemplateData({
      ...templateData,
      placeholders: templateData.placeholders.filter((_: any, i: number) => i !== index)
    });
  };

  const defaultTemplateHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificate</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .certificate {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 800px;
            width: 100%;
        }
        .header {
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 2.5em;
            color: #333;
            margin-bottom: 10px;
            font-weight: bold;
        }
        .subtitle {
            font-size: 1.2em;
            color: #666;
            font-style: italic;
        }
        .content {
            margin: 40px 0;
        }
        .student-name {
            font-size: 2em;
            color: #667eea;
            font-weight: bold;
            margin: 20px 0;
        }
        .course-name {
            font-size: 1.5em;
            color: #333;
            margin: 20px 0;
        }
        .date {
            font-size: 1.1em;
            color: #666;
            margin-top: 30px;
        }
        .signature {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: end;
        }
        .signature-line {
            border-bottom: 2px solid #333;
            width: 200px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">This certifies that</div>
        </div>
        
        <div class="content">
            <div class="student-name">{{studentName}}</div>
            <div class="course-name">has successfully completed the course</div>
            <div class="course-name">{{courseTitle}}</div>
            <div class="date">on {{issueDate}}</div>
        </div>
        
        <div class="signature">
            <div>
                <div class="signature-line"></div>
                <div>Instructor Signature</div>
            </div>
            <div>
                <div class="signature-line"></div>
                <div>Date</div>
            </div>
        </div>
    </div>
</body>
</html>`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Editor</h2>
          <p className="text-gray-600">Create and customize your certificate template</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                    placeholder="e.g., Academic Certificate"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={templateData.price}
                    onChange={(e) => setTemplateData({ ...templateData, price: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={templateData.description}
                  onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                  placeholder="Describe your template..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={templateData.thumbnailUrl}
                  onChange={(e) => setTemplateData({ ...templateData, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/preview.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={templateData.currency} onValueChange={(value) => setTemplateData({ ...templateData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="license">License Type</Label>
                  <Select value={templateData.licenseType} onValueChange={(value) => setTemplateData({ ...templateData, licenseType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-use">Single Use</SelectItem>
                      <SelectItem value="multi-use">Multi Use</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="seat-based">Seat Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Categories & Tags</CardTitle>
              <CardDescription>Help users find your template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {templateData.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} Ã—
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Placeholders */}
          <Card>
            <CardHeader>
              <CardTitle>Template Fields</CardTitle>
              <CardDescription>Define the data fields for this template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Field key (e.g., studentName)"
                  value={newPlaceholder.key}
                  onChange={(e) => setNewPlaceholder({ ...newPlaceholder, key: e.target.value })}
                />
                <Input
                  placeholder="Field label (e.g., Student Name)"
                  value={newPlaceholder.label}
                  onChange={(e) => setNewPlaceholder({ ...newPlaceholder, label: e.target.value })}
                />
              </div>
              <Button onClick={addPlaceholder} size="sm">Add Field</Button>
              
              <div className="space-y-2">
                {templateData.placeholders.map((placeholder: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{placeholder.key}</span>
                    <span className="text-sm text-gray-600">{placeholder.label}</span>
                    <Button variant="ghost" size="sm" onClick={() => removePlaceholder(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                HTML Content
              </CardTitle>
              <CardDescription>Edit the HTML structure of your template</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={templateData.htmlContent || defaultTemplateHTML}
                onChange={(e) => setTemplateData({ ...templateData, htmlContent: e.target.value })}
                rows={20}
                className="font-mono text-sm"
                placeholder="Enter your HTML template..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSS Styles</CardTitle>
              <CardDescription>Customize the appearance of your template</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={templateData.cssContent}
                onChange={(e) => setTemplateData({ ...templateData, cssContent: e.target.value })}
                rows={15}
                className="font-mono text-sm"
                placeholder="Enter your CSS styles..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Template Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Canvas Width (px)</Label>
                  <Input id="width" type="number" defaultValue="800" />
                </div>
                <div>
                  <Label htmlFor="height">Canvas Height (px)</Label>
                  <Input id="height" type="number" defaultValue="600" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="format">Export Format</Label>
                <Select defaultValue="svg">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svg">SVG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>See how your template will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4" />
                  <p>Preview will be available when you add HTML content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
