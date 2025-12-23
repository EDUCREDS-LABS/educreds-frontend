import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Upload, 
  Eye, 
  Award, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Layout,
  Settings,
  DollarSign,
  Tag,
  Zap,
  Plus,
  Trash2,
  Move,
  RotateCcw,
  Copy,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  CalendarDays,
  Pen,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

interface CertificateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'signature' | 'logo' | 'seal';
  required: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  placeholder?: string;
}

interface CertificateTemplate {
  id?: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  tags: string[];
  fields: CertificateField[];
  design: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
    elements: any[];
  };
  educredsIntegration: {
    compatible: boolean;
    blockchainReady: boolean;
    templateData: any;
  };
}

const categories = [
  { value: 'academic', label: 'Academic Certificates' },
  { value: 'professional', label: 'Professional Certificates' },
  { value: 'training', label: 'Training Certificates' },
  { value: 'achievement', label: 'Achievement Awards' },
  { value: 'completion', label: 'Completion Certificates' },
  { value: 'participation', label: 'Participation Certificates' }
];

const subcategories = {
  academic: ['University Degree', 'High School Diploma', 'Graduate Certificate', 'Honor Roll'],
  professional: ['Certification', 'License', 'Accreditation', 'Qualification'],
  training: ['Course Completion', 'Workshop', 'Seminar', 'Bootcamp'],
  achievement: ['Excellence Award', 'Recognition', 'Merit Badge', 'Honor'],
  completion: ['Program Completion', 'Project Completion', 'Internship', 'Apprenticeship'],
  participation: ['Event Participation', 'Conference Attendance', 'Volunteer Service', 'Membership']
};

const fieldTypes = [
  { value: 'text', label: 'Text Field', icon: Type },
  { value: 'date', label: 'Date Field', icon: CalendarDays },
  { value: 'signature', label: 'Signature', icon: Pen },
  { value: 'logo', label: 'Logo/Image', icon: ImageIcon },
  { value: 'seal', label: 'Official Seal', icon: Award }
];

export const CertificateDesigner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<CertificateTemplate>({
    title: '',
    description: '',
    category: 'academic',
    subcategory: '',
    price: 0,
    tags: [],
    fields: [],
    design: {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      elements: []
    },
    educredsIntegration: {
      compatible: true,
      blockchainReady: true,
      templateData: {}
    }
  });

  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const addField = (type: CertificateField['type']) => {
    const newField: CertificateField = {
      id: `field_${Date.now()}`,
      name: `${type}_${template.fields.length + 1}`,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${template.fields.length + 1}`,
      type,
      required: true,
      x: 100 + (template.fields.length * 20),
      y: 100 + (template.fields.length * 20),
      width: type === 'text' || type === 'date' ? 200 : 100,
      height: type === 'text' || type === 'date' ? 30 : 60,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      alignment: 'center',
      placeholder: `Enter ${type}`
    };

    setTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<CertificateField>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const deleteField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !template.tags.includes(newTag.trim())) {
      setTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const saveTemplate = async () => {
    // Save to EduCreds backend
    const templateData = {
      ...template,
      educredsIntegration: {
        ...template.educredsIntegration,
        templateData: {
          fields: template.fields.map(field => ({
            key: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            position: { x: field.x, y: field.y },
            style: {
              fontSize: field.fontSize,
              fontFamily: field.fontFamily,
              color: field.color,
              alignment: field.alignment
            }
          })),
          canvas: template.design
        }
      }
    };

    console.log('Saving template for EduCreds:', templateData);
    // API call to save template
  };

  const publishToMarketplace = async () => {
    await saveTemplate();
    console.log('Publishing to marketplace...');
    // API call to publish template
  };

  const selectedFieldData = template.fields.find(f => f.id === selectedField);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="flex items-center space-x-4">
          <Award className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold">Certificate Designer</h1>
            <p className="text-sm text-gray-600">Create templates for EduCreds marketplace</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={saveTemplate}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={publishToMarketplace} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Publish to Marketplace
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Tools & Properties */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col">
          <Tabs defaultValue="template" className="flex-1">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Template Title</label>
                <Input
                  value={template.title}
                  onChange={(e) => setTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter template title"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={template.description}
                  onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your certificate template"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select 
                  value={template.category} 
                  onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value, subcategory: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {template.category && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Subcategory</label>
                  <Select 
                    value={template.subcategory} 
                    onValueChange={(value) => setTemplate(prev => ({ ...prev, subcategory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories[template.category as keyof typeof subcategories]?.map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Price (USD)</label>
                <Input
                  type="number"
                  value={template.price}
                  onChange={(e) => setTemplate(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Zap className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">EduCreds Integration</span>
                </div>
                <div className="space-y-2 text-xs text-blue-600 dark:text-blue-400">
                  <div className="flex items-center">
                    <Checkbox checked={template.educredsIntegration.compatible} disabled />
                    <span className="ml-2">Compatible with EduCreds</span>
                  </div>
                  <div className="flex items-center">
                    <Checkbox checked={template.educredsIntegration.blockchainReady} disabled />
                    <span className="ml-2">Blockchain ready</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fields" className="flex-1 p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Add Certificate Fields</h3>
                <div className="grid grid-cols-2 gap-2">
                  {fieldTypes.map(type => (
                    <Button
                      key={type.value}
                      variant="outline"
                      size="sm"
                      onClick={() => addField(type.value as CertificateField['type'])}
                      className="h-auto p-3 flex-col"
                    >
                      <type.icon className="w-5 h-5 mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Certificate Fields ({template.fields.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {template.fields.map(field => (
                    <div
                      key={field.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedField === field.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedField(field.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{field.label}</div>
                          <div className="text-xs text-gray-500">{field.type} • {field.required ? 'Required' : 'Optional'}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteField(field.id);
                          }}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedFieldData && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Field Properties</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Label</label>
                      <Input
                        value={selectedFieldData.label}
                        onChange={(e) => updateField(selectedField!, { label: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Field Name</label>
                      <Input
                        value={selectedFieldData.name}
                        onChange={(e) => updateField(selectedField!, { name: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedFieldData.required}
                        onCheckedChange={(checked) => updateField(selectedField!, { required: checked as boolean })}
                      />
                      <label className="text-sm">Required field</label>
                    </div>
                    {(selectedFieldData.type === 'text' || selectedFieldData.type === 'date') && (
                      <>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Font Size</label>
                          <Slider
                            value={[selectedFieldData.fontSize || 16]}
                            onValueChange={(value) => updateField(selectedField!, { fontSize: value[0] })}
                            min={8}
                            max={72}
                            step={1}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Text Alignment</label>
                          <div className="flex space-x-1">
                            {['left', 'center', 'right'].map(align => (
                              <Button
                                key={align}
                                size="sm"
                                variant={selectedFieldData.alignment === align ? 'default' : 'outline'}
                                onClick={() => updateField(selectedField!, { alignment: align as any })}
                              >
                                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                {align === 'right' && <AlignRight className="w-4 h-4" />}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="design" className="flex-1 p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Canvas Settings</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Width</label>
                      <Input
                        type="number"
                        value={template.design.width}
                        onChange={(e) => setTemplate(prev => ({
                          ...prev,
                          design: { ...prev.design, width: parseInt(e.target.value) || 800 }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Height</label>
                      <Input
                        type="number"
                        value={template.design.height}
                        onChange={(e) => setTemplate(prev => ({
                          ...prev,
                          design: { ...prev.design, height: parseInt(e.target.value) || 600 }
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Background Color</label>
                    <Input
                      type="color"
                      value={template.design.backgroundColor}
                      onChange={(e) => setTemplate(prev => ({
                        ...prev,
                        design: { ...prev.design, backgroundColor: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Quick Presets</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setTemplate(prev => ({
                      ...prev,
                      design: { ...prev.design, width: 800, height: 600 }
                    }))}
                  >
                    Certificate (800×600)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setTemplate(prev => ({
                      ...prev,
                      design: { ...prev.design, width: 1200, height: 800 }
                    }))}
                  >
                    Diploma (1200×800)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setTemplate(prev => ({
                      ...prev,
                      design: { ...prev.design, width: 600, height: 400 }
                    }))}
                  >
                    Badge (600×400)
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-700 p-8">
            <div className="flex items-center justify-center h-full">
              <div 
                className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
                style={{
                  width: `${Math.min(template.design.width, 800)}px`,
                  height: `${Math.min(template.design.height, 600)}px`,
                  backgroundColor: template.design.backgroundColor
                }}
              >
                {/* Certificate Fields */}
                {template.fields.map(field => (
                  <div
                    key={field.id}
                    className={`absolute border-2 cursor-move ${
                      selectedField === field.id ? 'border-blue-500' : 'border-dashed border-gray-300'
                    }`}
                    style={{
                      left: `${(field.x / template.design.width) * 100}%`,
                      top: `${(field.y / template.design.height) * 100}%`,
                      width: `${(field.width / template.design.width) * 100}%`,
                      height: `${(field.height / template.design.height) * 100}%`,
                      fontSize: `${(field.fontSize || 16) * 0.8}px`,
                      fontFamily: field.fontFamily,
                      color: field.color,
                      textAlign: field.alignment,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: field.alignment === 'left' ? 'flex-start' : 
                                   field.alignment === 'right' ? 'flex-end' : 'center',
                      padding: '4px'
                    }}
                    onClick={() => setSelectedField(field.id)}
                  >
                    {field.type === 'text' || field.type === 'date' ? (
                      <span className="truncate">{field.placeholder || field.label}</span>
                    ) : field.type === 'signature' ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        Signature
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Sample Certificate Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">Certificate of Achievement</h1>
                  <p className="text-lg text-gray-600 mb-8">This is to certify that</p>
                  <div className="text-2xl font-semibold text-gray-800 mb-8 border-b-2 border-gray-300 pb-2">
                    [Student Name]
                  </div>
                  <p className="text-lg text-gray-600 mb-4">has successfully completed</p>
                  <div className="text-xl font-medium text-gray-800 mb-8">[Course Name]</div>
                  <div className="flex justify-between w-full mt-auto">
                    <div className="text-center">
                      <div className="border-t border-gray-300 pt-2">Date</div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-gray-300 pt-2">Signature</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="bg-white dark:bg-gray-800 border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Canvas: {template.design.width} × {template.design.height}px • Fields: {template.fields.length}
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Zap className="w-3 h-3 mr-1" />
                  EduCreds Ready
                </Badge>
                <span className="text-gray-500">Auto-saved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDesigner;