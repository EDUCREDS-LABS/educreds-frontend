import React, { useState, useRef, useCallback, useEffect } from 'react';
import { defaultTemplates } from '../../../shared/templates/default-templates';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  Maximize2,
  Undo2,
  Redo2,
  Download,
  Shield,
  Award,
  Smartphone,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Copy,
  ChevronRight,
  ChevronLeft,
  Lock,
  Unlock,
  Magnet,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { API_CONFIG } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';
import { LayerPanel } from '@/components/designer/LayerPanel';
import { CanvasPreview } from '@/components/designer/CanvasPreview';
import { IssuancePreviewModal } from '@/components/designer/IssuancePreviewModal';
import { DesignerAccessibilityProvider, announceToScreenReader } from '@/components/designer/DesignerAccessibility';

// ─── Safe SVG utilities ───────────────────────────────────────────────────────

const renderSvgSafely = (svgString: string): HTMLElement | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length > 0) return null;
    doc.querySelectorAll('script').forEach(s => s.remove());
    doc.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
      });
    });
    return doc.documentElement;
  } catch {
    return null;
  }
};

const parseTemplateFields = (svgContent: string, fields: any[]): FieldMapping[] => {
  const loaded: FieldMapping[] = [];
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) return loaded;

    fields.forEach((f, idx) => {
      let found = false;
      xmlDoc.querySelectorAll('text').forEach(textEl => {
        if (found) return;
        if (!textEl.textContent?.includes(`{{${f.name}}}`)) return;
        const x = parseFloat(textEl.getAttribute('x') || '0');
        const y = parseFloat(textEl.getAttribute('y') || '0');
        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
          const fontSize = parseFloat(textEl.getAttribute('font-size') || '16');
          const color = textEl.getAttribute('fill') || '#1a1a1a';
          const fontFamily = textEl.getAttribute('font-family') || 'serif';
          loaded.push({
            id: `field_${Date.now()}_${idx}`,
            name: f.name,
            x: (x * 595) / 800 - 50,
            y: (y * 595) / 800 - 15,
            width: 200,
            height: 30,
            fontSize: (fontSize * 595) / 800,
            fontFamily: fontFamily.includes('serif') ? 'Playfair Display' : 'Outfit',
            fontWeight: '600',
            color: normalizeHexColor(color.startsWith('url') ? '#1e40af' : color),
            required: f.required,
            locked: false,
            visible: true,
            type: f.type || 'text',
          });
          found = true;
        }
      });
      if (!found) {
        loaded.push({
          id: `field_${Date.now()}_${idx}`,
          name: f.name,
          x: 100,
          y: 100 + idx * 40,
          width: 200,
          height: 30,
          fontSize: 16,
          fontFamily: 'Outfit',
          fontWeight: '600',
          color: '#1a1a1a',
          required: f.required,
          locked: false,
          visible: true,
          type: f.type || 'text',
        });
      }
    });
  } catch (err) {
    console.error('Error parsing SVG template:', err);
  }
  return loaded;
};

// ─── Validation helpers ───────────────────────────────────────────────────────

const validatePosition = (value: string, min: number, max: number): number => {
  const n = parseInt(value, 10);
  return Math.max(min, Math.min(max, isNaN(n) ? 0 : n));
};

const validateDimension = (value: string, min = 1, max = 842): number => {
  const n = parseInt(value, 10);
  return Math.max(min, Math.min(max, isNaN(n) ? 30 : n));
};

const validateFontSize = (value: string, min = 8, max = 96): number => {
  const n = parseInt(value, 10);
  return Math.max(min, Math.min(max, isNaN(n) ? 16 : n));
};

const normalizeHexColor = (color: string): string => {
  const t = (color ?? '').trim();
  const short3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
  if (short3.test(t))
    return t.replace(short3, (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`).toUpperCase();
  if (/^#[0-9a-f]{6}$/i.test(t)) return t.toUpperCase();
  return '#000000';
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface FieldMapping {
  id: string;
  name: string;
  /** Human-readable label shown in the inspector and used as placeholder label */
  label?: string;
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
  visible: boolean;
  type: 'text' | 'date' | 'number' | 'qr' | 'signature';
  /** When set, this is a user-placed free text element (literal content, not a variable) */
  customText?: string;
}

interface AvailableField {
  name: string;
  label: string;
  required: boolean;
  locked: boolean;
  type?: 'text' | 'date' | 'number' | 'qr' | 'signature';
  icon: React.ReactNode;
}

interface TemplateDesignerProps {
  backHref?: string;
  backLabel?: string;
}

interface SaveForm {
  name: string;
  description: string;
  type: string;
}

// ─── ToolBtn (pure, outside component) ───────────────────────────────────────

interface ToolBtnProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const ToolBtn: React.FC<ToolBtnProps> = ({ icon, label, active, disabled, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all select-none ${
          active
            ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30'
            : disabled
            ? 'text-slate-700 cursor-not-allowed'
            : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.08]'
        }`}
      >
        {icon}
      </button>
    </TooltipTrigger>
    <TooltipContent
      side="bottom"
      className="bg-[#1a1a22] border-white/10 text-[11px] text-slate-300 px-2 py-1"
    >
      {label}
    </TooltipContent>
  </Tooltip>
);

// ─── InspectorAlignBtn ────────────────────────────────────────────────────────

const InspectorAlignBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className="h-8 flex items-center justify-center bg-[#18181f] border border-white/5 rounded-lg
               hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400
               transition-all disabled:opacity-30 disabled:cursor-not-allowed"
  >
    {icon}
  </button>
);

// ─── Helper: canvas preview text ──────────────────────────────────────────────

const PREVIEW_TEXT: Record<string, string> = {
  studentName: 'John Doe',
  courseName: 'Bachelor of Computer Science',
  institutionName: 'EduCreds University',
  issueDate: 'Jan 24, 2024',
  completionDate: 'Dec 15, 2023',
  certificateId: 'CERT-123456',
  grade: 'Distinction',
  certificateType: 'Degree Certificate',
  verificationUrl: 'verify.educreds.xyz/…',
};

const getPreviewText = (field: FieldMapping): string =>
  field.customText !== undefined
    ? field.customText || '…'
    : (PREVIEW_TEXT[field.name] ?? field.name);

// ─── TemplateDesigner ─────────────────────────────────────────────────────────

export const TemplateDesigner: React.FC<TemplateDesignerProps> = ({
  backHref,
  backLabel = 'Back',
}) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [fields, setFields] = useState<FieldMapping[]>([]);
  const [history, setHistory] = useState<FieldMapping[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<'fields' | 'layers'>('fields');
  const [activeTool, setActiveTool] = useState<'select' | 'text'>('select');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSvg, setPreviewSvg] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveForm, setSaveForm] = useState<SaveForm>({
    name: '',
    description: '',
    type: 'certificate',
  });
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [showSidePreview, setShowSidePreview] = useState(true);
  // New state for issuance preview and layer highlighting
  const [issuanceFormData, setIssuanceFormData] = useState<Record<string, string>>({});
  const [showIssuancePreview, setShowIssuancePreview] = useState(false);
  const [highlightedLayer, setHighlightedLayer] = useState<string | null>(null);


  // ── Refs ───────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);
  /** Always reflects the latest fields value — safe to read inside event callbacks */
  const fieldsRef = useRef<FieldMapping[]>(fields);

  // ── Computed ───────────────────────────────────────────────────────────────
  const canvasWidth = pageOrientation === 'portrait' ? 595 : 842;
  const canvasHeight = pageOrientation === 'portrait' ? 842 : 595;
  const selectedFieldData = selectedField ? fields.find(f => f.id === selectedField) ?? null : null;

  // ── Effects ────────────────────────────────────────────────────────────────

  // Keep fieldsRef in sync
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  // Load template from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('templateId');
    if (!templateId) return;
    const template = defaultTemplates.find(t => t.metadata.id === templateId);
    if (!template) return;

    let cleanDesign = template.design;
    template.metadata.fields.forEach(f => {
      cleanDesign = cleanDesign.replace(new RegExp(`{{${f.name}}}`, 'g'), '');
    });

    const svgBlob = new Blob([cleanDesign], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    setBackgroundImage(url);

    const loadedFields = parseTemplateFields(cleanDesign, template.metadata.fields);
    setFields(loadedFields);
    setHistory([loadedFields]);
    setHistoryIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render SVG preview safely after dialog opens
  useEffect(() => {
    if (!isPreviewOpen || !previewRef.current || !previewSvg) return;
    const el = renderSvgSafely(previewSvg);
    if (el) {
      previewRef.current.replaceChildren(el);
    } else {
      previewRef.current.innerHTML =
        '<div class="text-red-500 p-4 text-sm">Error rendering preview</div>';
    }
  }, [isPreviewOpen, previewSvg]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (backgroundImage?.startsWith('blob:')) URL.revokeObjectURL(backgroundImage);
    };
  }, [backgroundImage]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.key === 'Escape') {
        setSelectedField(null);
        setActiveTool('select');
        return;
      }
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === 'v') { setActiveTool('select'); return; }
        if (e.key === 't') { setActiveTool('text'); return; }
        if (e.key === 'g') { setShowGrid(g => !g); return; }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = selectedField;
        if (!sel) return;
        const field = fieldsRef.current.find(f => f.id === sel);
        if (field && !field.locked) {
          const next = fieldsRef.current.filter(f => f.id !== sel);
          setFields(next);
          setSelectedField(null);
          addToHistoryDirect(next);
        }
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoAction(); return; }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redoAction(); return; }
        if (e.key === 'd') { e.preventDefault(); duplicateFieldAction(); return; }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedField]);

  // ── Available fields catalogue ─────────────────────────────────────────────

  const availableFields: AvailableField[] = [
    { name: 'studentName',     label: 'Student Name',      required: true,  locked: false, icon: <Type className="w-4 h-4" /> },
    { name: 'institutionName', label: 'Institution Name',  required: true,  locked: true,  icon: <Plus className="w-4 h-4" /> },
    { name: 'courseName',      label: 'Course Name',       required: true,  locked: false, icon: <Type className="w-4 h-4" /> },
    { name: 'grade',           label: 'Grade',             required: true,  locked: false, icon: <Type className="w-4 h-4" /> },
    { name: 'completionDate',  label: 'Completion Date',   required: true,  locked: false, type: 'date', icon: <Plus className="w-4 h-4" /> },
    { name: 'certificateType', label: 'Certificate Type',  required: true,  locked: false, icon: <Plus className="w-4 h-4" /> },
    { name: 'issueDate',       label: 'Issue Date',        required: true,  locked: true,  type: 'date', icon: <Plus className="w-4 h-4" /> },
    { name: 'certificateId',   label: 'Certificate ID',    required: true,  locked: true,  icon: <Plus className="w-4 h-4" /> },
    { name: 'qrCode',          label: 'QR Code',           required: true,  locked: true,  type: 'qr',   icon: <Maximize2 className="w-4 h-4" /> },
    { name: 'verificationUrl', label: 'Verification URL',  required: true,  locked: true,  icon: <Plus className="w-4 h-4" /> },
  ];

  // ── History helpers (using refs to avoid stale closures) ───────────────────

  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  const addToHistoryDirect = (currentFields: FieldMapping[]) => {
    const prevHistory = historyRef.current;
    const prevIndex = historyIndexRef.current;
    let newHistory = prevHistory.slice(0, prevIndex + 1);
    newHistory.push([...currentFields]);
    if (newHistory.length > 50) newHistory = newHistory.slice(-50);
    const newIndex = newHistory.length - 1;
    setHistory(newHistory);
    setHistoryIndex(newIndex);
  };

  const addToHistory = useCallback((currentFields: FieldMapping[]) => {
    addToHistoryDirect(currentFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const undoAction = () => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx > 0) {
      const newIndex = idx - 1;
      setFields([...hist[newIndex]]);
      setHistoryIndex(newIndex);
    }
  };

  const redoAction = () => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx < hist.length - 1) {
      const newIndex = idx + 1;
      setFields([...hist[newIndex]]);
      setHistoryIndex(newIndex);
    }
  };

  // ── Field CRUD ─────────────────────────────────────────────────────────────

  const addField = (fieldName: string) => {
    const fieldInfo = availableFields.find(f => f.name === fieldName);
    if (!fieldInfo || fields.some(f => f.name === fieldName)) return;

    const newField: FieldMapping = {
      id: `field_${Date.now()}`,
      name: fieldName,
      label: fieldInfo.label,
      x: 100,
      y: 100,
      width: 200,
      height: 30,
      fontSize: 16,
      fontFamily: 'Outfit',
      fontWeight: '500',
      color: normalizeHexColor('#1a1a1a'),
      required: fieldInfo.required,
      locked: fieldInfo.locked,
      visible: true,
      type: fieldInfo.type || 'text',
    };

    const next = [...fields, newField];
    setFields(next);
    setSelectedField(newField.id);
    addToHistory(next);
  };

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FieldMapping>, saveHistory = true) => {
      setFields(prev => {
        const next = prev.map(f => (f.id === fieldId ? { ...f, ...updates } : f));
        if (saveHistory) addToHistoryDirect(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const removeField = (fieldId: string) => {
    const next = fields.filter(f => f.id !== fieldId);
    setFields(next);
    if (selectedField === fieldId) setSelectedField(null);
    addToHistory(next);
  };

  // ── Duplicate ──────────────────────────────────────────────────────────────

  const duplicateFieldAction = () => {
    const sel = selectedField;
    if (!sel) return;
    const field = fieldsRef.current.find(f => f.id === sel);
    if (!field) return;

    const newField: FieldMapping = {
      ...field,
      id: `field_${Date.now()}`,
      x: field.x + 20,
      y: field.y + 20,
      locked: false,
      // For system fields that don't allow duplicates by name, give a unique name
      ...(field.customText === undefined && { name: `${field.name}_${Date.now()}` }),
    };

    const next = [...fieldsRef.current, newField];
    setFields(next);
    setSelectedField(newField.id);
    addToHistoryDirect(next);
  };

  // ── Alignment ─────────────────────────────────────────────────────────────

  type AlignDir = 'left' | 'center-h' | 'right' | 'top' | 'middle-v' | 'bottom';

  const alignField = (dir: AlignDir) => {
    if (!selectedField) return;
    const field = fieldsRef.current.find(f => f.id === selectedField);
    if (!field || field.locked) return;

    const updates: Partial<FieldMapping> = {};
    switch (dir) {
      case 'left':     updates.x = 0; break;
      case 'center-h': updates.x = Math.round((canvasWidth - field.width) / 2); break;
      case 'right':    updates.x = Math.max(0, canvasWidth - field.width); break;
      case 'top':      updates.y = 0; break;
      case 'middle-v': updates.y = Math.round((canvasHeight - field.height) / 2); break;
      case 'bottom':   updates.y = Math.max(0, canvasHeight - field.height); break;
    }

    updateField(selectedField, updates);
  };

  // ── Z-order ────────────────────────────────────────────────────────────────

  const bringForward = () => {
    if (!selectedField) return;
    const idx = fields.findIndex(f => f.id === selectedField);
    if (idx < fields.length - 1) {
      const next = [...fields];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      setFields(next);
      addToHistory(next);
    }
  };

  const sendBackward = () => {
    if (!selectedField) return;
    const idx = fields.findIndex(f => f.id === selectedField);
    if (idx > 0) {
      const next = [...fields];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      setFields(next);
      addToHistory(next);
    }
  };

  // ── Lock/unlock ────────────────────────────────────────────────────────────

  const toggleLock = () => {
    if (!selectedFieldData) return;
    updateField(selectedFieldData.id, { locked: !selectedFieldData.locked });
  };

  // ── Image upload ───────────────────────────────────────────────────────────

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(`File must be < 5 MB. Got: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      return;
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(`Allowed types: JPEG, PNG, WebP`);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 4);
      let header = '';
      arr.forEach(b => (header += b.toString(16).padStart(2, '0')));
      const validSigs = ['89504e47', 'ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8', '52494646'];
      if (!validSigs.includes(header)) {
        alert('Invalid image — signature mismatch');
        return;
      }
      if (backgroundImage?.startsWith('blob:')) URL.revokeObjectURL(backgroundImage);
      setBackgroundImage(URL.createObjectURL(file));
    };
    reader.readAsArrayBuffer(file);
  };

  // ── SVG generation ─────────────────────────────────────────────────────────

  const generateSvg = (): string => {
    const w = canvasWidth;
    const h = canvasHeight;
    const escapeXml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;

    if (backgroundImage) {
      const safeImage = escapeXml(backgroundImage);
      svg += `<image xlink:href="${safeImage}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" />`;
    } else {
      svg += `<rect width="${w}" height="${h}" fill="white" />`;
    }

    fields.forEach(field => {
      if (field.type === 'qr') {
        svg += `<rect x="${field.x}" y="${field.y}" width="${field.width}" height="${field.height}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>`;
        svg += `<text x="${field.x + field.width / 2}" y="${field.y + field.height / 2 + 5}" text-anchor="middle" font-family="monospace" font-size="8" fill="#64748b">QR</text>`;
      } else {
        const content =
          field.customText !== undefined ? String(field.customText) : `{{${field.name}}}`;
        const safeContent = escapeXml(content);
        const safeFont = escapeXml(field.fontFamily || 'sans-serif');
        svg += `<text x="${field.x + field.width / 2}" y="${field.y + field.height / 2 + 5}" text-anchor="middle" font-family="${safeFont}" font-size="${field.fontSize}" font-weight="${field.fontWeight}" fill="${field.color}">${safeContent}</text>`;
      }
    });

    svg += '</svg>';
    return svg;
  };

  // ── Preview ────────────────────────────────────────────────────────────────

  const handlePreview = () => {
    const svg = generateSvg();
    const mockData: Record<string, string> = {
      studentName: 'John Doe',
      courseName: 'Bachelor of Computer Science',
      institutionName: 'EduCreds Academy',
      issueDate: 'January 24, 2024',
      completionDate: 'December 15, 2023',
      certificateId: 'EC-2024-001',
      grade: 'Distinction',
      certificateType: 'Degree',
      verificationUrl: 'https://educreds.xyz/verification-portal?certificateId=EC-2024-001',
    };

    let rendered = svg;
    Object.entries(mockData).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    setPreviewSvg(rendered);
    setIsPreviewOpen(true);
  };

  // ── Publish / Save flow ────────────────────────────────────────────────────

  const handlePublishClick = () => {
    if (fields.length === 0) {
      alert('Please add at least one field to the template.');
      return;
    }
    const requiredFields = ['studentName', 'institutionName', 'certificateId'];
    const missing = requiredFields.filter(rf => !fields.some(f => f.name === rf));
    if (missing.length) {
      alert(`Missing required fields: ${missing.join(', ')}`);
      return;
    }
    setIsSaveDialogOpen(true);
  };

  const handleSaveConfirm = async (mode: 'draft' | 'publish') => {
    if (!saveForm.name.trim()) {
      alert('Please enter a template name.');
      return;
    }
    setIsPublishing(true);
    try {
      const svg = generateSvg();

      // Map designer fields → placeholders ({ key, label }) expected by backend.
      // Exclude free-text (customText) elements — they are literals, not variables.
      const placeholders = fields
        .filter(f => f.customText === undefined && f.name)
        .map(f => ({ key: f.name, label: f.label ?? f.name }));

      // Store full designer state for round-trip editing
      const grapesJsData = {
        fields: fields.map(f => ({
          name: f.name,
          label: f.label ?? f.name,
          type: f.type,
          x: Math.round(f.x),
          y: Math.round(f.y),
          width: Math.round(f.width),
          height: Math.round(f.height),
          fontSize: f.fontSize,
          fontFamily: f.fontFamily,
          fontWeight: f.fontWeight ?? 'normal',
          color: f.color,
          required: f.required,
          locked: f.locked ?? false,
          ...(f.customText !== undefined && { customText: f.customText }),
        })),
        pageOrientation,
        backgroundImage,
        canvasWidth,
        canvasHeight,
      };

      // Map UI type → backend templateType enum
      const typeMap: Record<string, string> = {
        certificate: 'certificate',
        degree: 'certificate',
        badge: 'other',
        transcript: 'other',
        other: 'other',
      };
      const templateType = typeMap[saveForm.type] ?? 'certificate';

      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.CERT}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          name: saveForm.name.trim(),
          description: saveForm.description.trim() || saveForm.name.trim(),
          htmlContent: svg,
          cssContent: '',
          placeholders,
          templateType,
          isPublished: mode === 'publish',
          grapesJsData,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = errBody?.message
          ? Array.isArray(errBody.message)
            ? errBody.message.join(', ')
            : errBody.message
          : `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(msg);
      }

      setIsSaveDialogOpen(false);
      alert(
        mode === 'publish'
          ? '✅ Template published to library!'
          : '✅ Template saved as draft!'
      );
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Canvas interaction ─────────────────────────────────────────────────────

  const snap = (v: number) => (snapToGrid ? Math.round(v / 15) * 15 : v);

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== canvasRef.current) return;

    if (activeTool === 'text') {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scale = zoom / 100;
      const rawX = (event.clientX - rect.left) / scale;
      const rawY = (event.clientY - rect.top) / scale;

      const newField: FieldMapping = {
        id: `field_${Date.now()}`,
        name: `customText_${Date.now()}`,
        x: Math.max(0, snap(rawX - 100)),
        y: Math.max(0, snap(rawY - 18)),
        width: 200,
        height: 36,
        fontSize: 18,
        fontFamily: 'Outfit',
        fontWeight: '500',
        color: '#1a1a1a',
        required: false,
        locked: false,
        type: 'text',
        customText: 'Custom Text',
      };

      const next = [...fieldsRef.current, newField];
      setFields(next);
      setSelectedField(newField.id);
      addToHistoryDirect(next);
      setActiveTool('select');
    } else {
      setSelectedField(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────

  const canZoomIn = zoom < 200;
  const canZoomOut = zoom > 25;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0c] text-slate-200 overflow-hidden select-none font-sans">

      {/* ── Top Navigation Bar ──────────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/5 bg-[#121217]/90 backdrop-blur-xl flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-4">
          {backHref && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs hover:bg-white/5 text-slate-400 gap-1.5 -ml-2"
                onClick={() => { window.location.href = backHref; }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {backLabel}
              </Button>
              <Separator orientation="vertical" className="h-4 bg-white/5" />
            </>
          )}

          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">EduCreds Designer</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              Premium Workspace
            </p>
          </div>

          <Separator orientation="vertical" className="h-4 mx-2 bg-white/5" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 hover:bg-white/5 disabled:opacity-30"
              onClick={undoAction}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4 text-slate-400" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 hover:bg-white/5 disabled:opacity-30"
              onClick={redoAction}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <Button
            variant="ghost" size="sm"
            className="h-8 text-xs hover:bg-white/5 text-slate-400"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Background
          </Button>

          {/* Zoom control */}
          <div className="flex items-center bg-[#18181f] rounded-lg border border-white/5 p-0.5">
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30"
              onClick={() => setZoom(z => Math.max(25, z - 25))}
              disabled={!canZoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button
              onClick={() => setZoom(100)}
              className="h-7 px-2 text-[11px] font-mono text-slate-300 hover:text-white min-w-[40px] text-center"
            >
              {zoom}%
            </button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30"
              onClick={() => setZoom(z => Math.min(200, z + 25))}
              disabled={!canZoomIn}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 bg-white/5" />

          {/* Orientation */}
          <div className="flex items-center bg-[#18181f] rounded-lg border border-white/5 p-0.5">
            <Button
              variant="ghost" size="sm"
              className={`h-7 px-3 text-xs flex items-center gap-1 ${pageOrientation === 'portrait' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              onClick={() => setPageOrientation('portrait')}
              title="Portrait (595×842)"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Portrait</span>
            </Button>
            <Button
              variant="ghost" size="sm"
              className={`h-7 px-3 text-xs flex items-center gap-1 ${pageOrientation === 'landscape' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              onClick={() => setPageOrientation('landscape')}
              title="Landscape (842×595)"
            >
              <Smartphone className="w-4 h-4" style={{ transform: 'rotate(90deg)' }} />
              <span className="hidden sm:inline">Landscape</span>
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 bg-white/5" />

          <Button
            variant="ghost" size="sm"
            className="h-8 text-xs hover:bg-white/5 text-slate-400"
            onClick={handlePreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>

          <Button
            variant="outline" size="sm"
            className="h-8 text-xs border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400"
            onClick={() => {
              if (fields.length === 0) { alert('Add at least one field first.'); return; }
              setIsSaveDialogOpen(true);
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            onClick={handlePublishClick}
            disabled={isPublishing}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isPublishing ? 'Saving…' : 'Publish Template'}
          </Button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-72 border-r border-white/5 bg-[#121217] flex flex-col z-40 shrink-0">
          <div className="p-4 flex flex-col h-full overflow-hidden">
            {/* Tab switcher */}
            <div className="flex items-center gap-2 p-1 bg-[#18181f] rounded-xl border border-white/5 mb-5">
              {(['fields', 'layers'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab === 'fields' ? 'Elements' : 'Layers'}
                </button>
              ))}
            </div>

            <ScrollArea className="flex-1 -mr-2 pr-2">
              <AnimatePresence mode="wait">
                {activeTab === 'fields' ? (
                  <motion.div
                    key="fields"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    {/* Custom text button */}
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                        Tools
                      </h3>
                      <motion.button
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTool('text')}
                        className={`flex items-center gap-3 w-full p-2.5 rounded-xl border transition-all text-left ${
                          activeTool === 'text'
                            ? 'bg-indigo-500/10 border-indigo-500/40'
                            : 'bg-white/[0.03] border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/[0.05]'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <Type className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-300">Add Custom Text</p>
                          <p className="text-[10px] text-slate-600">Click canvas to place (T)</p>
                        </div>
                      </motion.button>
                    </div>

                    {/* Standard fields */}
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                        Standard Fields
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {availableFields.map(field => {
                          const inUse = fields.some(f => f.name === field.name);
                          return (
                            <motion.button
                              key={field.name}
                              whileHover={!inUse ? { x: 4 } : {}}
                              whileTap={!inUse ? { scale: 0.98 } : {}}
                              onClick={() => addField(field.name)}
                              disabled={inUse}
                              className={`flex items-center justify-between w-full p-2.5 rounded-xl border transition-all text-left ${
                                inUse
                                  ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                                  : 'bg-white/[0.03] border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/[0.05]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${inUse ? 'bg-slate-800 text-slate-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                  {field.icon}
                                </div>
                                <span className="text-xs font-medium text-slate-300">
                                  {field.label}
                                </span>
                              </div>
                              {!inUse && <Plus className="w-3.5 h-3.5 text-slate-600" />}
                            </motion.button>
                          );
                        })}
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
                     <LayerPanel
                       layers={fields.map(field => ({
                         id: field.id,
                         name: field.name,
                         customText: field.customText,
                         type: field.type,
                         locked: field.locked,
                         visible: field.visible !== false, // Convert to boolean
                       }))}
                       selectedId={selectedField}
                       onSelectLayer={(id) => {
                         setSelectedField(id);
                         announceToScreenReader(`Layer ${id} selected`);
                       }}
                       onReorderLayers={(newOrder) => {
                         setFields(newOrder);
                         addToHistory(newOrder);
                       }}
                       onToggleVisibility={(id, visible) => {
                         updateField(id, { visible });
                       }}
                       onToggleLock={(id, locked) => {
                         updateField(id, { locked });
                       }}
                       onDeleteLayer={removeField}
                       onHighlightLayer={setHighlightedLayer} // NEW: Add this
                     />
                   </motion.div>
                 )}
              </AnimatePresence>
            </ScrollArea>
          </div>
        </aside>

        {/* ── Canvas Area ──────────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#0a0a0c] relative overflow-hidden flex items-center justify-center">

          {/* Floating Toolbar */}
          <TooltipProvider>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">

              {/* Primary row */}
              <div className="pointer-events-auto bg-[#121217]/80 backdrop-blur-xl border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-2xl">
                {/* Tool mode */}
                <ToolBtn
                  icon={<MousePointer2 className="h-3.5 w-3.5" />}
                  label="Select (V)"
                  active={activeTool === 'select'}
                  onClick={() => setActiveTool('select')}
                />
                <ToolBtn
                  icon={<Type className="h-3.5 w-3.5" />}
                  label="Text Tool — click canvas to place (T)"
                  active={activeTool === 'text'}
                  onClick={() => setActiveTool('text')}
                />

                <Separator orientation="vertical" className="h-4 bg-white/10 mx-0.5" />

                {/* View */}
                <ToolBtn
                  icon={<Grid className="h-3.5 w-3.5" />}
                  label="Toggle Grid (G)"
                  active={showGrid}
                  onClick={() => setShowGrid(g => !g)}
                />
                <ToolBtn
                  icon={<Magnet className="h-3.5 w-3.5" />}
                  label="Snap to Grid"
                  active={snapToGrid}
                  onClick={() => setSnapToGrid(s => !s)}
                />

                <Separator orientation="vertical" className="h-4 bg-white/10 mx-0.5" />

                {/* Zoom */}
                <ToolBtn
                  icon={<ZoomOut className="h-3.5 w-3.5" />}
                  label="Zoom Out"
                  disabled={!canZoomOut}
                  onClick={() => setZoom(z => Math.max(25, z - 25))}
                />
                <button
                  onClick={() => setZoom(100)}
                  className="h-7 px-2 text-[11px] font-mono text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors min-w-[42px] text-center"
                  title="Reset to 100%"
                >
                  {zoom}%
                </button>
                <ToolBtn
                  icon={<ZoomIn className="h-3.5 w-3.5" />}
                  label="Zoom In"
                  disabled={!canZoomIn}
                  onClick={() => setZoom(z => Math.min(200, z + 25))}
                />

                {/* Contextual: manipulation (when field selected) */}
                <AnimatePresence>
                  {selectedField && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                      animate={{ opacity: 1, width: 'auto', marginLeft: 4 }}
                      exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                      className="flex items-center gap-1 overflow-hidden"
                    >
                      <Separator orientation="vertical" className="h-4 bg-white/10 mx-0.5" />
                      <ToolBtn
                        icon={<Copy className="h-3.5 w-3.5" />}
                        label="Duplicate (Ctrl+D)"
                        onClick={duplicateFieldAction}
                      />
                      <ToolBtn
                        icon={<ChevronRight className="h-3.5 w-3.5 -rotate-90" />}
                        label="Bring Forward"
                        onClick={bringForward}
                      />
                      <ToolBtn
                        icon={<ChevronRight className="h-3.5 w-3.5 rotate-90" />}
                        label="Send Backward"
                        onClick={sendBackward}
                      />
                      <Separator orientation="vertical" className="h-4 bg-white/10 mx-0.5" />
                      {selectedFieldData?.locked ? (
                        <ToolBtn
                          icon={<Unlock className="h-3.5 w-3.5" />}
                          label="Unlock Element"
                          active
                          onClick={toggleLock}
                        />
                      ) : (
                        <ToolBtn
                          icon={<Lock className="h-3.5 w-3.5" />}
                          label="Lock Element"
                          onClick={toggleLock}
                        />
                      )}
                      <ToolBtn
                        icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
                        label="Delete"
                        disabled={selectedFieldData?.locked}
                        onClick={() => selectedField && removeField(selectedField)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Secondary row: alignment (only when field selected) */}
              <AnimatePresence>
                {selectedField && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="pointer-events-auto bg-[#121217]/80 backdrop-blur-xl border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-xl"
                  >
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mr-1">
                      Align
                    </span>
                    <ToolBtn icon={<AlignLeft className="h-3.5 w-3.5" />} label="Align Left" disabled={selectedFieldData?.locked} onClick={() => alignField('left')} />
                    <ToolBtn icon={<AlignCenter className="h-3.5 w-3.5" />} label="Align Center H" disabled={selectedFieldData?.locked} onClick={() => alignField('center-h')} />
                    <ToolBtn icon={<AlignRight className="h-3.5 w-3.5" />} label="Align Right" disabled={selectedFieldData?.locked} onClick={() => alignField('right')} />
                    <Separator orientation="vertical" className="h-4 bg-white/10 mx-0.5" />
                    <ToolBtn icon={<AlignVerticalJustifyStart className="h-3.5 w-3.5" />} label="Align Top" disabled={selectedFieldData?.locked} onClick={() => alignField('top')} />
                    <ToolBtn icon={<AlignVerticalJustifyCenter className="h-3.5 w-3.5" />} label="Align Middle V" disabled={selectedFieldData?.locked} onClick={() => alignField('middle-v')} />
                    <ToolBtn icon={<AlignVerticalJustifyEnd className="h-3.5 w-3.5" />} label="Align Bottom" disabled={selectedFieldData?.locked} onClick={() => alignField('bottom')} />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </TooltipProvider>

          {/* Canvas scroll wrapper */}
          <ScrollArea className="w-full h-full">
            <div className="min-w-full min-h-full flex items-center justify-center p-24">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.55)] overflow-hidden"
                style={{
                  width: `${canvasWidth * (zoom / 100)}px`,
                  height: `${canvasHeight * (zoom / 100)}px`,
                  backgroundImage: backgroundImage
                    ? `url(${backgroundImage})`
                    : showGrid
                    ? `radial-gradient(circle, #e0e0e0 1px, transparent 1px)`
                    : 'none',
                  backgroundSize: backgroundImage
                    ? 'cover'
                    : showGrid
                    ? `${15 * (zoom / 100)}px ${15 * (zoom / 100)}px`
                    : 'auto',
                  backgroundPosition: 'center',
                  cursor: activeTool === 'text' ? 'crosshair' : 'default',
                }}
                ref={canvasRef}
                onClick={handleCanvasClick}
              >
                {/* Grid overlay when background image is active */}
                {backgroundImage && showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                      backgroundSize: `${15 * (zoom / 100)}px ${15 * (zoom / 100)}px`,
                    }}
                  />
                )}

                {/* Text-tool hint */}
                {activeTool === 'text' && fields.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-slate-400 text-sm font-medium bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                      Click anywhere to place text
                    </p>
                  </div>
                )}

                {/* Field elements */}
                {fields.map(field => (
                  <motion.div
                    key={field.id}
                    drag={!field.locked && activeTool === 'select'}
                    dragMomentum={false}
                    dragElastic={0}
                    onDragStart={() => {
                      setSelectedField(field.id);
                      setDraggedFieldId(field.id);
                      dragStartPosition.current = { x: field.x, y: field.y };
                    }}
                    onDragEnd={(_e, info) => {
                      if (!dragStartPosition.current) return;
                      const scale = zoom / 100;
                      const rawX = dragStartPosition.current.x + info.offset.x / scale;
                      const rawY = dragStartPosition.current.y + info.offset.y / scale;
                      const newX = snap(rawX);
                      const newY = snap(rawY);
                      const latestFields = fieldsRef.current.map(f =>
                        f.id === field.id ? { ...f, x: newX, y: newY } : f
                      );
                      setFields(latestFields);
                      addToHistoryDirect(latestFields);
                      setDraggedFieldId(null);
                      dragStartPosition.current = null;
                    }}
                    whileHover={!field.locked && activeTool === 'select' ? { scale: 1.01 } : {}}
                    className={`absolute select-none ${
                      selectedField === field.id
                        ? 'ring-2 ring-indigo-500 bg-indigo-50/10'
                        : 'hover:ring-1 hover:ring-indigo-300'
                    } ${
                      field.locked
                        ? 'cursor-not-allowed opacity-80'
                        : activeTool === 'text'
                        ? 'cursor-crosshair'
                        : 'cursor-grab active:cursor-grabbing'
                    } ${draggedFieldId === field.id ? 'z-10' : ''}`}
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
                      border: selectedField === field.id ? 'none' : '1px dashed #cbd5e1',
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      if (activeTool === 'select') setSelectedField(field.id);
                    }}
                  >
                    {field.type === 'qr' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white border border-slate-200">
                        <Grid className="w-1/2 h-1/2 text-slate-300" />
                        <span className="text-[8px] uppercase font-bold text-slate-400 mt-1">
                          QR Code
                        </span>
                      </div>
                    ) : (
                      <span className="truncate px-2 text-center leading-tight">
                        {getPreviewText(field)}
                      </span>
                    )}

                    {/* Quick-delete handle */}
                    {selectedField === field.id && !field.locked && (
                      <button
                        className="absolute -top-6 -right-1 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white shadow-xl transition-colors"
                        onClick={e => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </ScrollArea>
        </main>

        {/* ── Right Inspector Panel ─────────────────────────────────────────── */}
        <aside
          className="relative border-l border-white/5 bg-[#121217] flex flex-col z-40 shrink-0 transition-all duration-300 overflow-hidden"
          style={{ width: isRightPanelOpen ? 320 : 40 }}
        >
          {/* Panel toggle button */}
          <button
            onClick={() => setIsRightPanelOpen(o => !o)}
            className="absolute top-4 left-2 z-10 w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
            title={isRightPanelOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isRightPanelOpen ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>

          <AnimatePresence>
            {isRightPanelOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 overflow-y-auto pt-12 pb-4 px-5"
                style={{ width: 320 }}
              >
                {selectedFieldData ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Inspector
                      </h2>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-wider bg-white/5 border-white/10 text-slate-500 py-0 h-5"
                      >
                        {selectedFieldData.customText !== undefined ? 'text' : selectedFieldData.type}
                      </Badge>
                    </div>

                    {/* Field identity */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Settings2 className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate">
                          {selectedFieldData.customText !== undefined
                            ? `"${selectedFieldData.customText || 'Custom Text'}"`
                            : selectedFieldData.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Geometry & Positioning
                        </p>
                      </div>
                    </div>

                    {/* Custom text input */}
                    {selectedFieldData.customText !== undefined && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">
                          Text Content
                        </Label>
                        <Input
                          value={selectedFieldData.customText}
                          onChange={e =>
                            updateField(selectedFieldData.id, { customText: e.target.value })
                          }
                          disabled={selectedFieldData.locked}
                          placeholder="Enter text…"
                          className="h-9 bg-[#18181f] border-white/10 text-xs focus-visible:ring-indigo-600"
                        />
                      </div>
                    )}

                    {/* Position */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'X', key: 'x' as const, max: canvasWidth },
                        { label: 'Y', key: 'y' as const, max: canvasHeight },
                        { label: 'W', key: 'width' as const, max: canvasWidth },
                        { label: 'H', key: 'height' as const, max: canvasHeight },
                      ].map(({ label, key, max }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">
                            {label}
                          </Label>
                          <Input
                            type="number"
                            value={Math.round(selectedFieldData[key])}
                            onChange={e => {
                              const fn = key === 'x' || key === 'y' ? validatePosition : validateDimension;
                              updateField(selectedFieldData.id, {
                                [key]: fn(e.target.value, 0, max),
                              });
                            }}
                            disabled={selectedFieldData.locked}
                            className="h-9 bg-[#18181f] border-white/10 text-xs focus-visible:ring-indigo-600"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Alignment */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">
                          Alignment
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <InspectorAlignBtn icon={<AlignLeft className="w-3.5 h-3.5" />} label="Align Left" disabled={selectedFieldData.locked} onClick={() => alignField('left')} />
                        <InspectorAlignBtn icon={<AlignCenter className="w-3.5 h-3.5" />} label="Align Center" disabled={selectedFieldData.locked} onClick={() => alignField('center-h')} />
                        <InspectorAlignBtn icon={<AlignRight className="w-3.5 h-3.5" />} label="Align Right" disabled={selectedFieldData.locked} onClick={() => alignField('right')} />
                        <InspectorAlignBtn icon={<AlignVerticalJustifyStart className="w-3.5 h-3.5" />} label="Align Top" disabled={selectedFieldData.locked} onClick={() => alignField('top')} />
                        <InspectorAlignBtn icon={<AlignVerticalJustifyCenter className="w-3.5 h-3.5" />} label="Align Middle" disabled={selectedFieldData.locked} onClick={() => alignField('middle-v')} />
                        <InspectorAlignBtn icon={<AlignVerticalJustifyEnd className="w-3.5 h-3.5" />} label="Align Bottom" disabled={selectedFieldData.locked} onClick={() => alignField('bottom')} />
                      </div>
                    </div>

                    {/* Typography */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">
                          Typography
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>

                      <div className="space-y-4">
                        {/* Font family */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">
                            Font
                          </Label>
                          <Select
                            value={selectedFieldData.fontFamily}
                            onValueChange={v => updateField(selectedFieldData.id, { fontFamily: v })}
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
                              <SelectItem value="Georgia">Georgia (Classic)</SelectItem>
                              <SelectItem value="Arial">Arial (Universal)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Font size + color */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">
                              Size
                            </Label>
                            <Input
                              type="number"
                              value={selectedFieldData.fontSize}
                              onChange={e =>
                                updateField(selectedFieldData.id, {
                                  fontSize: validateFontSize(e.target.value),
                                })
                              }
                              disabled={selectedFieldData.locked}
                              className="h-9 bg-[#18181f] border-white/10 text-xs focus-visible:ring-indigo-600"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">
                              Color
                            </Label>
                            <div className="flex items-center gap-2 h-9 px-2 bg-[#18181f] border border-white/10 rounded-md">
                              <input
                                type="color"
                                value={normalizeHexColor(selectedFieldData.color)}
                                onChange={e =>
                                  updateField(selectedFieldData.id, {
                                    color: normalizeHexColor(e.target.value),
                                  })
                                }
                                disabled={selectedFieldData.locked}
                                className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
                              />
                              <span className="text-[10px] font-mono text-slate-400 uppercase">
                                {normalizeHexColor(selectedFieldData.color)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Font weight */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase ml-0.5">
                            Weight
                          </Label>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { value: '400', label: 'Reg' },
                              { value: '500', label: 'Med' },
                              { value: '600', label: 'Semi' },
                              { value: '700', label: 'Bold' },
                            ].map(({ value, label }) => (
                              <button
                                key={value}
                                onClick={() =>
                                  !selectedFieldData.locked &&
                                  updateField(selectedFieldData.id, { fontWeight: value })
                                }
                                disabled={selectedFieldData.locked}
                                className={`h-9 text-xs rounded-md border transition-all ${
                                  selectedFieldData.fontWeight === value
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-[#18181f] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs border-white/10 hover:bg-white/5 text-slate-400"
                        onClick={duplicateFieldAction}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 h-8 text-xs border-white/10 hover:bg-white/5 ${
                          selectedFieldData.locked ? 'text-amber-400' : 'text-slate-400'
                        }`}
                        onClick={toggleLock}
                      >
                        {selectedFieldData.locked ? (
                          <><Unlock className="w-3.5 h-3.5 mr-1.5" />Unlock</>
                        ) : (
                          <><Lock className="w-3.5 h-3.5 mr-1.5" />Lock</>
                        )}
                      </Button>
                    </div>

                    {/* Protected notice */}
                    {selectedFieldData.locked && (
                      <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 flex flex-col items-center text-center gap-2">
                        <Shield className="w-6 h-6 text-indigo-400 opacity-50" />
                        <p className="text-[11px] font-semibold text-indigo-300">
                          Protected Field
                        </p>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          This element is locked. Unlock it to make changes.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No selection state */
                  <div className="space-y-6">
                    <div className="flex flex-col items-center text-center py-8 px-2">
                      <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                        <MousePointer2 className="h-5 w-5 text-slate-700" />
                      </div>
                      <h3 className="text-xs font-semibold text-slate-500 mb-1">No Selection</h3>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        Click any element on the canvas to inspect and edit its properties.
                      </p>
                    </div>

                    {/* Canvas info */}
                    <div className="space-y-2">
                      <div className="h-px bg-white/5" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-0.5">
                        Canvas
                      </p>
                      {[
                        { label: 'Size', value: `${canvasWidth} × ${canvasHeight} px` },
                        { label: 'Orientation', value: pageOrientation.charAt(0).toUpperCase() + pageOrientation.slice(1) },
                        { label: 'Zoom', value: `${zoom}%` },
                        { label: 'Layers', value: `${fields.length}` },
                        { label: 'Grid', value: showGrid ? 'On' : 'Off' },
                        { label: 'Snap', value: snapToGrid ? 'On' : 'Off' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-600">{label}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    <div className="space-y-2">
                      <div className="h-px bg-white/5" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-0.5">
                        Shortcuts
                      </p>
                      {[
                        { key: 'V', desc: 'Select tool' },
                        { key: 'T', desc: 'Text tool' },
                        { key: 'G', desc: 'Toggle grid' },
                        { key: 'Del', desc: 'Delete selected' },
                        { key: 'Ctrl+D', desc: 'Duplicate' },
                        { key: 'Ctrl+Z', desc: 'Undo' },
                        { key: 'Esc', desc: 'Deselect' },
                      ].map(({ key, desc }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-600">{desc}</span>
                          <kbd className="text-[9px] text-slate-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">
                            {key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      {/* ── Status Bar ────────────────────────────────────────────────────────── */}
      <footer className="h-8 border-t border-white/5 bg-[#0a0a0c] flex items-center justify-between px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Ready</span>
          </div>
          <Separator orientation="vertical" className="h-2.5 bg-white/10" />
          <span>EduCreds Designer v2</span>
          {activeTool === 'text' && (
            <>
              <Separator orientation="vertical" className="h-2.5 bg-white/10" />
              <span className="text-indigo-400">Text Tool Active — click canvas to place</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{fields.length} Layer{fields.length !== 1 ? 's' : ''}</span>
          <Separator orientation="vertical" className="h-2.5 bg-white/10" />
          <div className="flex items-center gap-1 text-indigo-400 font-bold">
            <Maximize2 className="w-3 h-3" />
            <span>{canvasWidth} × {canvasHeight} PX</span>
          </div>
        </div>
      </footer>

      {/* ── Preview Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl bg-[#121217] border-white/10 text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Certificate Preview
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Rendered with sample data. Download to save as SVG.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div
              ref={previewRef}
              className="bg-white shadow-2xl overflow-hidden"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                zoom: 0.65,
              }}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="border-white/10 hover:bg-white/5 text-slate-300"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  try {
                    const blob = new Blob([previewSvg], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `certificate-preview-${Date.now()}.svg`;
                    document.body.appendChild(a);
                    a.dispatchEvent(new MouseEvent('click'));
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                  } catch {
                    alert('Download failed');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download SVG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Save / Publish Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="max-w-md bg-[#121217] border-white/10 text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-indigo-400" />
              Save Template
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Name your template before saving. Published templates appear in the issuance library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Template Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={saveForm.name}
                onChange={e => setSaveForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Academic Excellence Certificate"
                className="bg-[#18181f] border-white/10 text-sm focus-visible:ring-indigo-600 placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Description
              </Label>
              <Textarea
                value={saveForm.description}
                onChange={e => setSaveForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Briefly describe this template's purpose…"
                rows={3}
                className="bg-[#18181f] border-white/10 text-sm resize-none focus-visible:ring-indigo-600 placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Template Type
              </Label>
              <Select
                value={saveForm.type}
                onValueChange={v => setSaveForm(f => ({ ...f, type: v }))}
              >
                <SelectTrigger className="bg-[#18181f] border-white/10 text-sm focus:ring-indigo-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181f] border-white/10 text-slate-200">
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="degree">Degree</SelectItem>
                  <SelectItem value="badge">Achievement Badge</SelectItem>
                  <SelectItem value="transcript">Transcript</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-[10px] text-slate-600 leading-relaxed">
              <strong className="text-slate-500">Save Draft</strong> — keeps the template private for internal use.{' '}
              <strong className="text-slate-500">Publish</strong> — makes it available in the bulk issuance and template libraries.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-row justify-end">
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
              className="border-white/10 hover:bg-white/5 text-slate-400"
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSaveConfirm('draft')}
              disabled={isPublishing || !saveForm.name.trim()}
              className="border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400"
            >
              <Save className="w-4 h-4 mr-2" />
              {isPublishing ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button
              onClick={() => handleSaveConfirm('publish')}
              disabled={isPublishing || !saveForm.name.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-0"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing…' : 'Publish to Library'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateDesigner;
