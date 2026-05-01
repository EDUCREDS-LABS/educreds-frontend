import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Eye, EyeOff, Lock, Unlock, Trash2, Grid, Type, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * LayerPanel - Interactive layer management component
 * Features:
 * - Drag-to-reorder layers (z-index management)
 * - Visibility toggle per layer
 * - Lock/unlock layers
 * - Visual selection feedback
 * - Quick delete buttons
 * - Outline highlighting on hover
 */

export interface LayerPanelField {
  id: string;
  name: string;
  customText?: string;
  type: 'text' | 'date' | 'number' | 'qr' | 'signature';
  locked: boolean;
  visible: boolean;
}

interface LayerPanelProps {
  layers: LayerPanelField[];
  selectedId: string | null;
  onSelectLayer: (id: string) => void;
  onReorderLayers: (newOrder: LayerPanelField[]) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onToggleLock: (id: string, locked: boolean) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer?: (id: string) => void;
  onHighlightLayer?: (id: string | null) => void; // For outline highlighting
}

const getLayerIcon = (type: string): React.ReactNode => {
  if (type === 'qr') return <Grid className="w-4 h-4" />;
  return <Type className="w-4 h-4" />;
};

const getLayerLabel = (field: LayerPanelField): string => {
  if (field.customText !== undefined) {
    return `"${field.customText || 'Custom Text'}"`;
  }
  return field.name;
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedId,
  onSelectLayer,
  onReorderLayers,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onDuplicateLayer,
  onHighlightLayer,
}) => {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  // Reverse for display (last added = top, visually)
  const displayLayers = [...layers].reverse();

  const handleReorder = (newOrder: LayerPanelField[]) => {
    // Reverse back to maintain internal order
    onReorderLayers([...newOrder].reverse());
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          Canvas Layers
        </h3>
        <span className="text-[10px] text-slate-600 font-medium">
          {layers.length}
        </span>
      </div>

      {/* Empty state */}
      {layers.length === 0 && (
        <div className="py-8 text-center text-slate-600 text-xs italic flex-1 flex items-center justify-center">
          No active layers
        </div>
      )}

      {/* Layers list with drag-to-reorder */}
      <ScrollArea className="flex-1 -mr-2 pr-2">
        <Reorder.Group
          axis="y"
          values={displayLayers}
          onReorder={handleReorder}
          className="space-y-1"
        >
          <AnimatePresence>
            {displayLayers.map((field, idx) => {
              const isSelected = selectedId === field.id;
              const isExpanded = expandedLayer === field.id;

              return (
                <Reorder.Item
                  key={field.id}
                  value={field}
                  drag
                  dragElastic={0.2}
                  dragMomentum={false}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <motion.div
                    onClick={() => onSelectLayer(field.id)}
                    onHoverStart={() => {
                      setExpandedLayer(field.id);
                      onHighlightLayer?.(field.id);
                    }}
                    onHoverEnd={() => {
                      setExpandedLayer(null);
                      onHighlightLayer?.(null);
                    }}
                    whileHover={{ x: 2 }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Drag handle indicator */}
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="5" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" />
                        <circle cx="9" cy="19" r="1.5" />
                        <circle cx="15" cy="5" r="1.5" />
                        <circle cx="15" cy="12" r="1.5" />
                        <circle cx="15" cy="19" r="1.5" />
                      </svg>
                    </div>

                    {/* Layer icon */}
                    <div className="flex items-center justify-center text-slate-500 group-hover:text-slate-400">
                      {getLayerIcon(field.type)}
                    </div>

                    {/* Layer name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {getLayerLabel(field)}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Layer #{idx + 1}
                      </p>
                    </div>

                    {/* Visibility toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(field.id, !field.visible);
                      }}
                      className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10 text-slate-600 hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100"
                      title={field.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {field.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </motion.button>

                    {/* Lock toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock(field.id, !field.locked);
                      }}
                      className={`flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 ${
                        field.locked
                          ? 'text-yellow-500 hover:text-yellow-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={field.locked ? 'Unlock layer' : 'Lock layer'}
                    >
                      {field.locked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </motion.button>

                    {/* Delete button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(field.id);
                      }}
                      disabled={field.locked}
                      className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete layer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>

                  {/* Expandable details (on hover/select) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="ml-2 mt-1 px-2 py-1 bg-white/[0.02] rounded-md border border-white/5 text-[10px] text-slate-600 space-y-1"
                      >
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="text-slate-400 capitalize">{field.type}</span>
                        </div>
                        {field.locked && (
                          <div className="flex justify-between text-yellow-600">
                            <span>Status:</span>
                            <span>Locked</span>
                          </div>
                        )}
                        {!field.visible && (
                          <div className="flex justify-between text-slate-600">
                            <span>Visibility:</span>
                            <span>Hidden</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      </ScrollArea>

      {/* Info footer */}
      <div className="pt-2 px-1 border-t border-white/5 text-[10px] text-slate-600">
        💡 Drag layers to reorder (z-index). Lock to prevent edits.
      </div>
    </div>
  );
};
