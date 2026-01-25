import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { defaultTemplates } from '../../../shared/templates/default-templates';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Trash2,
  Save,
  Eye,
  Upload,
  Grid,
  Type,
  MousePointer2,
  Plus,
  Settings2,
  ChevronRight,
  Maximize2,
  Undo2,
  Redo2,
  Download,
  Shield,
  Award,
  Image as ImageIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FieldMapping {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  required: boolean;
  locked: boolean;
  type: 'text' | 'date' | 'number' | 'qr' | 'signature';
}

export const TemplateDesigner: React.FC = () => {
  const [fields, setFields] = useState<FieldMapping[]>([]);
  const [history, setHistory] = useState<FieldMapping[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<'fields' | 'layers'>('fields');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('templateId');
    if (templateId) {
      const template = defaultTemplates.find(t => t.metadata.id === templateId);
      if (template) {
        // Load background (the SVG without placeholders)
        let cleanDesign = template.design;
        template.metadata.fields.forEach(f => {
          cleanDesign = cleanDesign.replace(new RegExp(`{{${f.name}}}`, 'g'), '');
        });
        const svgBlob = new Blob([cleanDesign], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        setBackgroundImage(url);

        // Try to extract field positions from SVG
        const loadedFields: FieldMapping[] = [];
        template.metadata.fields.forEach((f, idx) => {
          // Find <text ...>{{fieldName}}</text>
          const regex = new RegExp(`<text[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*>.*?{{${f.name}}}.*?<\/text>`, 'i');
          const match = template.design.match(regex);

          let x = 100;
          let y = 100 + (idx * 40);
          let fontSize = 16;
          let color = '#1a1a1a';
          let fontFamily = 'serif';

          if (match) {
            x = parseFloat(match[1]);
            y = parseFloat(match[2]);
            // Extract more properties if needed
            const fontMatch = match[0].match(/font-size="([^"]*)"/);
            if (fontMatch) fontSize = parseFloat(fontMatch[1]);
            const fillMatch = match[0].match(/fill="([^"]*)"/);
            if (fillMatch) color = fillMatch[1];
            const familyMatch = match[0].match(/font-family="([^"]*)"/);
            if (familyMatch) fontFamily = familyMatch[1];

            // Adjust x/y because our editor uses center-based placement for the text span
            // The SVG text x/y is the baseline. 
            // We'll just use them as is for now and let user adjust.
            // SVG width is 800, our canvas is 595. We need to scale.
            const scale = 595 / 800;
            x = x * scale;
            y = y * scale;
            fontSize = fontSize * scale;
          }

          loadedFields.push({
            id: `field_${Date.now()}_${idx}`,
            name: (f.name as any),
            x: x - 50, // basic adjustment
            y: y - 15,
            width: 200,
            height: 30,
            fontSize: fontSize === 16 ? 16 : fontSize,
            fontFamily: fontFamily.includes('serif') ? 'Playfair Display' : 'Outfit',
            fontWeight: '600',
            color: color.startsWith('url') ? '#1e40af' : color,
            required: (f.required as any),
            locked: false,
            type: (f.type as any) || 'text'
          });
        });

        // Add QR code if exists in SVG
        if (template.design.includes('QR')) {
          const qrMatch = template.design.match(/<rect[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*>/);
          if (qrMatch) {
            const scale = 595 / 800;
            loadedFields.push({
              id: `field_qr_${Date.now()}`,
              name: 'qrCode',
              x: parseFloat(qrMatch[1]) * scale,
              y: parseFloat(qrMatch[2]) * scale,
              width: parseFloat(qrMatch[3]) * scale,
              height: parseFloat(qrMatch[4]) * scale,
              fontSize: 12,
              fontFamily: 'Outfit',
              fontWeight: '400',
              color: '#000000',
              required: true,
              locked: true,
              type: 'qr'
            });
          }
        }

        setFields(loadedFields);
        setHistory([loadedFields]);
        setHistoryIndex(0);
      }
    }
  }, []);

  const availableFields = [
    { name: 'studentName', label: 'Student Name', required: true, locked: false, icon: <Type className="w-4 h-4" /> },
    { name: 'institutionName', label: 'Institution Name', required: true, locked: true, icon: <Plus className="w-4 h-4" /> },
    { name: 'courseName', label: 'Course Name', required: true, locked: false, icon: <Type className="w-4 h-4" /> },
    { name: 'grade', label: 'Grade', required: true, locked: false, icon: <Type className="w-4 h-4" /> },
    { name: 'completionDate', label: 'Completion Date', required: true, locked: false, type: 'date', icon: <Plus className="w-4 h-4" /> },
    { name: 'certificateType', label: 'Certificate Type', required: true, locked: false, icon: <Plus className="w-4 h-4" /> },
    { name: 'issueDate', label: 'Issue Date', required: true, locked: true, type: 'date', icon: <Plus className="w-4 h-4" /> },
    { name: 'certificateId', label: 'Certificate ID', required: true, locked: true, icon: <Plus className="w-4 h-4" /> },
    { name: 'qrCode', label: 'QR Code', required: true, locked: true, type: 'qr', icon: <Maximize2 className="w-4 h-4" /> },
    { name: 'verificationUrl', label: 'Verification URL', required: true, locked: true, icon: <Plus className="w-4 h-4" /> }
  ];

  const addToHistory = useCallback((currentFields: FieldMapping[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...currentFields]);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setFields([...history[newIndex]]);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setFields([...history[newIndex]]);
      setHistoryIndex(newIndex);
    }
  };

  const addField = (fieldName: string) => {
    const fieldInfo = availableFields.find(f => f.name === fieldName);
    if (!fieldInfo || fields.some(f => f.name === fieldName)) return;

    const newField: FieldMapping = {
      id: `field_${Date.now()}`,
      name: fieldName,
      x: 100,
      y: 100,
      width: 200,
      height: 30,
      fontSize: 16,
      fontFamily: 'Outfit',
      fontWeight: '500',
      color: '#1a1a1a',
      required: fieldInfo.required,
      locked: fieldInfo.locked,
      type: (fieldInfo.type as any) || 'text'
    };

    const newFields = [...fields, newField];
    setFields(newFields);
    setSelectedField(newField.id);
    addToHistory(newFields);
  };

  const updateField = (fieldId: string, updates: Partial<FieldMapping>, saveToHistory = true) => {
    const newFields = fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setFields(newFields);
    if (saveToHistory) {
      addToHistory(newFields);
    }
  };

  const removeField = (fieldId: string) => {
    const newFields = fields.filter(field => field.id !== fieldId);
    setFields(newFields);
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
    addToHistory(newFields);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSvg = () => {
    const width = 595;
    const height = 842;
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Background
    if (backgroundImage) {
      svg += `<image href="${backgroundImage}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />`;
    } else {
      svg += `<rect width="${width}" height="${height}" fill="white" />`;
    }

    // Fields
    fields.forEach(field => {
      if (field.type === 'qr') {
        svg += `<rect x="${field.x}" y="${field.y}" width="${field.width}" height="${field.height}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>`;
        svg += `<text x="${field.x + field.width / 2}" y="${field.y + field.height / 2 + 5}" text-anchor="middle" font-family="monospace" font-size="8" fill="#64748b">QR</text>`;
      } else {
        const placeholder = `{{${field.name}}}`;
        svg += `<text 
          x="${field.x + field.width / 2}" 
          y="${field.y + field.height / 2 + 5}" 
          text-anchor="middle" 
          font-family="${field.fontFamily}" 
          font-size="${field.fontSize}" 
          font-weight="${field.fontWeight}" 
          fill="${field.color}"
        >${placeholder}</text>`;
      }
    });

    svg += '</svg>';
    return svg;
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSvg, setPreviewSvg] = useState('');

  const handlePreview = () => {
    const svg = generateSvg();
    const mockData: Record<string, string> = {
      studentName: 'John Doe',
      courseName: 'Bachelor of Computer Science',
      institutionName: 'EduCreds Academy',
      issueDate: 'January 24, 2024',
      certificateId: 'EC-2024-001',
      grade: 'Distinction',
      certificateType: 'Degree',
      verificationUrl: 'https://verify.educreds.xyz/c/EC-2024-001'
    };

    let rendered = svg;
    Object.entries(mockData).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    setPreviewSvg(rendered);
    setIsPreviewOpen(true);
  };

  const handlePublish = async () => {
    const svg = generateSvg();
    console.log('Publishing template SVG:', svg);
    // TODO: Call API to save template
    alert('Template design generated! check console for SVG.');
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === canvasRef.current) {
      setSelectedField(null);
    }
  };

  const selectedFieldData = selectedField ? fields.find(f => f.id === selectedField) : null;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0c] text-slate-200 overflow-hidden select-none font-sans">
      {/* Premium Top Navigation Bar */}
      <header className="h-14 border-b border-white/5 bg-[#121217]/80 backdrop-blur-xl flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">EduCreds Designer</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Premium Workspace</p>
          </div>
          <Separator orientation="vertical" className="h-4 mx-2 bg-white/5" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/5 disabled:opacity-30"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="h-4 w-4 text-slate-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/5 disabled:opacity-30"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:bg-white/5 text-slate-400"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Background
          </Button>
          <div className="flex items-center bg-[#18181f] rounded-lg border border-white/5 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-3 text-xs ${zoom === 100 ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              onClick={() => setZoom(100)}
            >
              100%
            </Button>
            <Select value={zoom.toString()} onValueChange={(v) => setZoom(parseInt(v))}>
              <SelectTrigger className="h-7 w-16 bg-transparent border-none focus:ring-0 text-xs text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#18181f] border-white/10 text-slate-300">
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
                <SelectItem value="125">125%</SelectItem>
                <SelectItem value="150">150%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-4 bg-white/5" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:bg-white/5 text-slate-400"
            onClick={handlePreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/20"
            onClick={handlePublish}
          >
            <Save className="w-4 h-4 mr-2" />
            Publish Template
          </Button>
        </div>
      </header>


      <div className="flex-1 flex overflow-hidden">
        {/* Left Interactive Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-[#121217] flex flex-col z-40">
          <div className="p-4">
            <div className="flex items-center gap-2 p-1 bg-[#18181f] rounded-xl border border-white/5 mb-6">
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex-1 flex items-center justify-center py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'fields' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Elements
              </button>
              <button
                onClick={() => setActiveTab('layers')}
                className={`flex-1 flex items-center justify-center py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'layers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Layers
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'fields' ? (
                <motion.div
                  key="fields"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Standard Fields</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {availableFields.map(field => (
                        <motion.button
                          key={field.name}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => addField(field.name)}
                          disabled={fields.some(f => f.name === field.name)}
                          className={`flex items-center justify-between w-full p-2.5 rounded-xl border transition-all text-left ${fields.some(f => f.name === field.name)
                            ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                            : 'bg-white/[0.03] border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/[0.05]'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${fields.some(f => f.name === field.name) ? 'bg-slate-800 text-slate-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                              {field.icon}
                            </div>
                            <span className="text-xs font-medium text-slate-300">{field.label}</span>
                          </div>
                          {!fields.some(f => f.name === field.name) && (
                            <Plus className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="layers"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-2"
                >
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Canvas Layers</h3>
                  {fields.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 italic text-xs">No active layers</div>
                  ) : (
                    fields.map(field => (
                      <div
                        key={field.id}
                        onClick={() => setSelectedField(field.id)}
                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${selectedField === field.id ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5'}`}
                      >
                        <Type className="w-4 h-4" />
                        <span className="text-xs font-medium">{field.name}</span>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Central Workspace Canvas */}
        <main className="flex-1 bg-[#0a0a0c] relative overflow-hidden flex items-center justify-center">
          {/* Workspace Controls Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#121217]/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-4 z-10 shadow-2xl">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 rounded-full ${showGrid ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`}
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-white/10">Show Grid</TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="h-3 bg-white/10" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-500 hover:text-white">
                    <MousePointer2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-white/10">Select Tool</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-500 hover:text-white">
                    <Type className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-white/10">Text Tool</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <ScrollArea className="w-full h-full">
            <div className="min-w-full min-h-full flex items-center justify-center p-24">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
                style={{
                  width: `${595 * (zoom / 100)}px`,
                  height: `${842 * (zoom / 100)}px`,
                  backgroundImage: backgroundImage ? `url(${backgroundImage})` : (showGrid ?
                    `radial-gradient(circle, #f0f0f0 1px, transparent 1px)` : 'none'),
                  backgroundSize: backgroundImage ? 'contain' : (showGrid ? `${15 * (zoom / 100)}px ${15 * (zoom / 100)}px` : 'auto'),
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                ref={canvasRef}
                onClick={handleCanvasClick}
              >
                {/* Secondary Grid Overlay if background exists */}
                {backgroundImage && showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                      backgroundSize: `${15 * (zoom / 100)}px ${15 * (zoom / 100)}px`
                    }}
                  />
                )}

                {/* Field Elements */}
                {fields.map(field => (
                  <motion.div
                    key={field.id}
                    layoutId={field.id}
                    drag
                    dragMomentum={false}
                    onDragStart={() => setSelectedField(field.id)}
                    whileHover={{ scale: 1.01 }}
                    className={`absolute select-none group ${selectedField === field.id
                      ? 'ring-2 ring-indigo-500 ring-offset-0 bg-indigo-50/10'
                      : 'hover:ring-1 hover:ring-indigo-300 ring-offset-0'
                      } ${field.locked ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing'}`}
                    style={{
                      left: field.x * (zoom / 100),
                      top: field.y * (zoom / 100),
                      width: field.width * (zoom / 100),
                      height: field.height * (zoom / 100),
                      fontSize: field.fontSize * (zoom / 100),
                      fontFamily: field.fontFamily,
                      fontWeight: field.fontWeight,
                      color: field.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: selectedField === field.id ? 'none' : '1px dashed #e2e8f0'
                    }}
                    onDrag={(e, info) => {
                      updateField(field.id, {
                        x: field.x + info.delta.x / (zoom / 100),
                        y: field.y + info.delta.y / (zoom / 100)
                      }, false);
                    }}
                    onDragEnd={() => {
                      addToHistory(fields);
                    }}
                  >
                    {field.type === 'qr' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white border border-slate-200">
                        <Grid className="w-1/2 h-1/2 text-slate-300" />
                        <span className="text-[8px] uppercase font-bold text-slate-400 mt-1">QR Code</span>
                      </div>
                    ) : (
                      <span className="truncate px-2">
                        {field.name === 'studentName' ? 'John Doe' :
                          field.name === 'courseName' ? 'Bachelor of Science' :
                            field.name === 'institutionName' ? 'EduCreds University' :
                              field.name === 'issueDate' ? 'Jan 24, 2024' :
                                field.name === 'certificateId' ? 'CERT-123456' :
                                  field.name}
                      </span>
                    )}

                    {selectedField === field.id && !field.locked && (
                      <div className="absolute -top-6 -right-2 flex gap-1">
                        <button
                          className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </ScrollArea>
        </main>

        {/* Right Dynamic Property Inspector */}
        <aside className="w-80 border-l border-white/5 bg-[#121217] flex flex-col z-40 overflow-y-auto">
          <div className="p-5">
            {selectedFieldData ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Inspector</h2>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-white/5 border-white/10 text-slate-500 py-0 h-5">
                    {selectedFieldData.type}
                  </Badge>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Settings2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{selectedFieldData.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight">Geometry & Positioning</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">X Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedFieldData.x)}
                        onChange={(e) => updateField(selectedFieldData.id, { x: parseInt(e.target.value) || 0 })}
                        disabled={selectedFieldData.locked}
                        className="h-9 bg-[#18181f] border-white/10 text-xs focus-visible:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedFieldData.y)}
                        onChange={(e) => updateField(selectedFieldData.id, { y: parseInt(e.target.value) || 0 })}
                        disabled={selectedFieldData.locked}
                        className="h-9 bg-[#18181f] border-white/10 text-xs focus-visible:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">Width</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedFieldData.width)}
                        onChange={(e) => updateField(selectedFieldData.id, { width: parseInt(e.target.value) || 0 })}
                        disabled={selectedFieldData.locked}
                        className="h-9 bg-[#18181f] border-white/10 text-xs focus-visible:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">Height</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedFieldData.height)}
                        onChange={(e) => updateField(selectedFieldData.id, { height: parseInt(e.target.value) || 0 })}
                        disabled={selectedFieldData.locked}
                        className="h-9 bg-[#18181f] border-white/10 text-xs focus-visible:ring-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">Typography</span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">Font Style</Label>
                      <Select
                        value={selectedFieldData.fontFamily}
                        onValueChange={(value) => updateField(selectedFieldData.id, { fontFamily: value })}
                        disabled={selectedFieldData.locked}
                      >
                        <SelectTrigger className="h-9 bg-[#18181f] border-white/10 text-xs focus:ring-indigo-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#18181f] border-white/10 text-slate-200">
                          <SelectItem value="Outfit">Outfit (Modern)</SelectItem>
                          <SelectItem value="Inter">Inter (Sans)</SelectItem>
                          <SelectItem value="Playfair Display">Playfair (Serif)</SelectItem>
                          <SelectItem value="JetBrains Mono">JetBrains (Mono)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">Size</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.fontSize}
                          onChange={(e) => updateField(selectedFieldData.id, { fontSize: parseInt(e.target.value) || 12 })}
                          disabled={selectedFieldData.locked}
                          className="h-9 bg-[#18181f] border-white/10 text-xs focus-visible:ring-indigo-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">Color</Label>
                        <div className="flex items-center gap-2 h-9 px-2 bg-[#18181f] border border-white/10 rounded-md">
                          <input
                            type="color"
                            value={selectedFieldData.color}
                            onChange={(e) => updateField(selectedFieldData.id, { color: e.target.value })}
                            disabled={selectedFieldData.locked}
                            className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
                          />
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedFieldData.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedFieldData.locked && (
                  <div className="mt-8 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 flex flex-col items-center text-center gap-2">
                    <Shield className="w-6 h-6 text-indigo-400 opacity-50 mb-1" />
                    <p className="text-[11px] font-semibold text-indigo-300">Protected System Field</p>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      This element is governed by protocol security and cannot be manually adjusted.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                  <MousePointer2 className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Editor Inactive</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a layer on the canvas to inspect its properties and modify attributes.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Dynamic Status Bar */}
      <footer className="h-8 border-t border-white/5 bg-[#0a0a0c] flex items-center justify-between px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Systems Ready</span>
          </div>
          <Separator orientation="vertical" className="h-2.5 bg-white/10" />
          <span>EduCreds V2.0.0</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{fields.length} Active Layer{fields.length !== 1 ? 's' : ''}</span>
          <Separator orientation="vertical" className="h-2.5 bg-white/10" />
          <div className="flex items-center gap-1 text-indigo-400 font-bold">
            <Maximize2 className="w-3 h-3" />
            <span>595 x 842 PX</span>
          </div>
        </div>
      </footer>
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl bg-[#121217] border-white/10 text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Certificate Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div
              className="bg-white shadow-2xl overflow-hidden"
              style={{ width: '595px', height: '842px', zoom: 0.7 }}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="border-white/10 hover:bg-white/5">
                Close Preview
              </Button>
              <Button onClick={() => {
                const blob = new Blob([previewSvg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'certificate-preview.svg';
                a.click();
              }} className="bg-indigo-600 hover:bg-indigo-500">
                <Download className="w-4 h-4 mr-2" />
                Download SVG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateDesigner;