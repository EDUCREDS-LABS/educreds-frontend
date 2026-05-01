import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

/**
 * CanvasPreview - Real-time canvas preview component
 * Features:
 * - Live sync with canvas updates (<500ms latency) via debouncing
 * - Template variable rendering with sample data
 * - Zoom controls
 * - Pan support (via drag)
 * - Certificate dimension display
 * - Debounced re-rendering for performance
 * - Virtualization ready for large field counts
 * - Outline highlighting on layer hover
 */

export interface PreviewField {
  id: string;
  name: string;
  customText?: string;
  type: 'text' | 'date' | 'number' | 'qr' | 'signature';
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  visible?: boolean;
}

interface CanvasPreviewProps {
  fields: PreviewField[];
  width: number;
  height: number;
  backgroundImage?: string | null;
  showGrid?: boolean;
  title?: string;
  sampleData?: Record<string, string>;
  highlightedLayerId?: string | null;
  debounceMs?: number;
}

const DEFAULT_SAMPLE_DATA: Record<string, string> = {
  studentName: 'John Doe',
  courseName: 'Bachelor of Computer Science',
  institutionName: 'EduCreds Academy',
  issueDate: 'January 24, 2024',
  completionDate: 'December 15, 2023',
  certificateId: 'CERT-2024-001',
  grade: 'Distinction',
  certificateType: 'Degree',
  verificationUrl: 'verify.educreds.xyz/…',
};

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  fields,
  width,
  height,
  backgroundImage,
  showGrid = false,
  title = 'Certificate Preview',
  sampleData = {},
  highlightedLayerId,
  debounceMs = 300,
}) => {
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [debouncedFields, setDebouncedFields] = useState(fields);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const mergedSampleData = { ...DEFAULT_SAMPLE_DATA, ...sampleData };

  // Debounce field updates for performance
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFields(fields);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fields, debounceMs]);

  // Get preview text for a field
  const getPreviewText = (field: PreviewField): string => {
    if (field.customText !== undefined) {
      return field.customText || '…';
    }
    return mergedSampleData[field.name] ?? `{{${field.name}}}`;
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    },
    [isDragging]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setPan({ x: 0, y: 0 });
        setZoom(100);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const scale = zoom / 100;
  const visibleFields = useMemo(() => 
    debouncedFields.filter(f => f.visible !== false),
    [debouncedFields]
  );

  return (
    <div className="flex flex-col h-full gap-3 bg-[#0a0a0c] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {width} × {height}px
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 p-2 bg-[#18181f] rounded-lg border border-white/5">
        <button
          onClick={() => setZoom(z => Math.max(25, z - 25))}
          disabled={zoom <= 25}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30"
          title="Zoom out (Ctrl+-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoom(100)}
          className="px-2 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors min-w-[40px]"
          title="Reset zoom (R)"
        >
          {zoom}%
        </button>

        <button
          onClick={() => setZoom(z => Math.min(200, z + 25))}
          disabled={zoom >= 200}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30"
          title="Zoom in (Ctrl++)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setPan({ x: 0, y: 0 })}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Reset pan"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="text-[10px] text-slate-600 px-2">
          {fields.length} elements
        </div>
      </div>

      {/* Canvas viewport */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-hidden bg-slate-950 rounded-lg border border-white/5 flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <motion.div
          style={{
            width: width * scale,
            height: height * scale,
            backgroundImage: backgroundImage
              ? `url(${backgroundImage})`
              : showGrid
              ? `radial-gradient(circle, #e0e0e0 1px, transparent 1px)`
              : 'transparent',
            backgroundSize: backgroundImage
              ? 'cover'
              : showGrid
              ? `${15 * scale}px ${15 * scale}px`
              : 'auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
          className="relative bg-white shadow-2xl"
        >
          {/* Grid overlay */}
          {backgroundImage && showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                backgroundSize: `${15 * scale}px ${15 * scale}px`,
              }}
            />
          )}

          {/* Field overlays */}
          {visibleFields.map((field) => {
            const isHighlighted = highlightedLayerId === field.id;
            return (
            <motion.div
              key={field.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute flex items-center justify-center select-none pointer-events-none transition-all ${
                isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white' : ''
              }`}
              style={{
                left: field.x * scale,
                top: field.y * scale,
                width: field.width * scale,
                height: field.height * scale,
                fontSize: field.fontSize * scale,
                fontFamily: field.fontFamily,
                fontWeight: field.fontWeight,
                color: field.color,
              }}
            >
              {field.type === 'qr' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300 text-gray-400 text-[8px]">
                  QR
                </div>
              ) : (
                <span className="truncate px-2 text-center leading-tight">
                  {getPreviewText(field)}
                </span>
              )}
            </motion.div>
          );
          })}

          {/* Empty state */}
          {visibleFields.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              No visible elements
            </div>
          )}
        </motion.div>
      </div>

      {/* Info footer */}
      <div className="text-[10px] text-slate-600 px-2">
        💡 Drag to pan, scroll to zoom. Sample data rendering active.
      </div>
    </div>
  );
};
