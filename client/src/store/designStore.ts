import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Layer {
  id: string;
  name: string;
  type: 'text' | 'shape' | 'image' | 'group' | 'vector';
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  properties: Record<string, any>;
  animations?: Animation[];
}

interface Animation {
  id: string;
  property: string;
  keyframes: Keyframe[];
  duration: number;
  easing: string;
}

interface Keyframe {
  time: number;
  value: any;
  easing?: string;
}

interface CanvasState {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  grid: {
    enabled: boolean;
    size: number;
    color: string;
  };
  guides: {
    enabled: boolean;
    lines: Array<{ type: 'horizontal' | 'vertical'; position: number }>;
  };
}

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  tool: string;
  selectedLayerIds: string[];
  clipboard: Layer[];
  showRulers: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
}

interface HistoryState {
  past: DesignSnapshot[];
  present: DesignSnapshot;
  future: DesignSnapshot[];
  canUndo: boolean;
  canRedo: boolean;
}

interface DesignSnapshot {
  layers: Layer[];
  canvas: CanvasState;
  timestamp: number;
}

interface CollaborationState {
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
    cursor?: { x: number; y: number };
    selection?: string[];
    color: string;
  }>;
  comments: Array<{
    id: string;
    userId: string;
    x: number;
    y: number;
    text: string;
    timestamp: number;
    resolved: boolean;
  }>;
}

interface AIState {
  suggestions: Array<{
    id: string;
    type: 'layout' | 'color' | 'typography' | 'content';
    title: string;
    description: string;
    preview?: string;
    confidence: number;
  }>;
  isProcessing: boolean;
  lastAnalysis?: {
    timestamp: number;
    results: any;
  };
}

interface DesignStore {
  // State
  layers: Layer[];
  canvas: CanvasState;
  view: ViewState;
  history: HistoryState;
  collaboration: CollaborationState;
  ai: AIState;
  
  // Canvas Operations
  initializeCanvas: (element: HTMLCanvasElement) => void;
  updateCanvas: (updates: Partial<CanvasState>) => void;
  resizeCanvas: (width: number, height: number) => void;
  
  // Layer Operations
  addLayer: (layer: Omit<Layer, 'id' | 'zIndex'>) => string;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => string;
  reorderLayer: (id: string, newIndex: number) => void;
  groupLayers: (layerIds: string[]) => string;
  ungroupLayer: (groupId: string) => void;
  
  // Selection Operations
  selectLayer: (id: string, addToSelection?: boolean) => void;
  selectLayers: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Transform Operations
  moveLayer: (id: string, deltaX: number, deltaY: number) => void;
  resizeLayer: (id: string, width: number, height: number) => void;
  rotateLayer: (id: string, angle: number) => void;
  scaleLayer: (id: string, scaleX: number, scaleY: number) => void;
  
  // View Operations
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  pan: (deltaX: number, deltaY: number) => void;
  setTool: (tool: string) => void;
  
  // History Operations
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
  
  // Clipboard Operations
  copy: () => void;
  paste: () => void;
  cut: () => void;
  
  // Export Operations
  exportDesign: (format: 'json' | 'svg' | 'png' | 'pdf') => Promise<string | Blob>;
  importDesign: (data: string | File) => Promise<void>;
  
  // AI Operations
  analyzeDesign: () => Promise<void>;
  applySuggestion: (suggestionId: string) => void;
  generateLayout: (prompt: string) => Promise<void>;
  optimizeColors: () => Promise<void>;
  
  // Collaboration Operations
  addUser: (user: CollaborationState['users'][0]) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, x: number, y: number) => void;
  addComment: (x: number, y: number, text: string) => void;
  resolveComment: (commentId: string) => void;
  
  // Animation Operations
  addAnimation: (layerId: string, animation: Omit<Animation, 'id'>) => void;
  updateAnimation: (layerId: string, animationId: string, updates: Partial<Animation>) => void;
  deleteAnimation: (layerId: string, animationId: string) => void;
  playAnimation: () => void;
  pauseAnimation: () => void;
}

const initialCanvas: CanvasState = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  grid: {
    enabled: false,
    size: 20,
    color: '#e5e7eb'
  },
  guides: {
    enabled: true,
    lines: []
  }
};

const initialView: ViewState = {
  zoom: 100,
  panX: 0,
  panY: 0,
  tool: 'select',
  selectedLayerIds: [],
  clipboard: [],
  showRulers: true,
  showGrid: false,
  snapToGrid: false,
  snapToObjects: true
};

const createSnapshot = (layers: Layer[], canvas: CanvasState): DesignSnapshot => ({
  layers: JSON.parse(JSON.stringify(layers)),
  canvas: JSON.parse(JSON.stringify(canvas)),
  timestamp: Date.now()
});

export const useDesignStore = create<DesignStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      layers: [],
      canvas: initialCanvas,
      view: initialView,
      history: {
        past: [],
        present: createSnapshot([], initialCanvas),
        future: [],
        canUndo: false,
        canRedo: false
      },
      collaboration: {
        users: [],
        comments: []
      },
      ai: {
        suggestions: [],
        isProcessing: false
      },

      // Canvas Operations
      initializeCanvas: (element) => {
        // Initialize WebGL or Canvas 2D context
        const ctx = element.getContext('2d');
        if (ctx) {
          ctx.fillStyle = get().canvas.backgroundColor;
          ctx.fillRect(0, 0, element.width, element.height);
        }
      },

      updateCanvas: (updates) => {
        set((state) => ({
          canvas: { ...state.canvas, ...updates }
        }));
        get().saveSnapshot();
      },

      resizeCanvas: (width, height) => {
        set((state) => ({
          canvas: { ...state.canvas, width, height }
        }));
        get().saveSnapshot();
      },

      // Layer Operations
      addLayer: (layerData) => {
        const id = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const layer: Layer = {
          ...layerData,
          id,
          zIndex: get().layers.length,
          scaleX: 1,
          scaleY: 1
        };

        set((state) => ({
          layers: [...state.layers, layer],
          view: { ...state.view, selectedLayerIds: [id] }
        }));
        
        get().saveSnapshot();
        return id;
      },

      updateLayer: (id, updates) => {
        set((state) => ({
          layers: state.layers.map(layer =>
            layer.id === id ? { ...layer, ...updates } : layer
          )
        }));
        get().saveSnapshot();
      },

      deleteLayer: (id) => {
        set((state) => ({
          layers: state.layers.filter(layer => layer.id !== id),
          view: {
            ...state.view,
            selectedLayerIds: state.view.selectedLayerIds.filter(selectedId => selectedId !== id)
          }
        }));
        get().saveSnapshot();
      },

      duplicateLayer: (id) => {
        const layer = get().layers.find(l => l.id === id);
        if (!layer) return '';

        const newId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const duplicatedLayer: Layer = {
          ...JSON.parse(JSON.stringify(layer)),
          id: newId,
          name: `${layer.name} Copy`,
          x: layer.x + 20,
          y: layer.y + 20,
          zIndex: get().layers.length
        };

        set((state) => ({
          layers: [...state.layers, duplicatedLayer],
          view: { ...state.view, selectedLayerIds: [newId] }
        }));
        
        get().saveSnapshot();
        return newId;
      },

      reorderLayer: (id, newIndex) => {
        set((state) => {
          const layers = [...state.layers];
          const layerIndex = layers.findIndex(l => l.id === id);
          if (layerIndex === -1) return state;

          const [layer] = layers.splice(layerIndex, 1);
          layers.splice(newIndex, 0, { ...layer, zIndex: newIndex });

          // Update z-indices
          layers.forEach((l, index) => {
            l.zIndex = index;
          });

          return { layers };
        });
        get().saveSnapshot();
      },

      groupLayers: (layerIds) => {
        const layers = get().layers.filter(l => layerIds.includes(l.id));
        if (layers.length < 2) return '';

        // Calculate group bounds
        const bounds = layers.reduce((acc, layer) => ({
          minX: Math.min(acc.minX, layer.x),
          minY: Math.min(acc.minY, layer.y),
          maxX: Math.max(acc.maxX, layer.x + layer.width),
          maxY: Math.max(acc.maxY, layer.y + layer.height)
        }), {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity
        });

        const groupId = get().addLayer({
          name: 'Group',
          type: 'group',
          visible: true,
          locked: false,
          opacity: 1,
          x: bounds.minX,
          y: bounds.minY,
          width: bounds.maxX - bounds.minX,
          height: bounds.maxY - bounds.minY,
          rotation: 0,
          properties: {
            children: layerIds
          }
        });

        return groupId;
      },

      ungroupLayer: (groupId) => {
        const group = get().layers.find(l => l.id === groupId);
        if (!group || group.type !== 'group') return;

        const childIds = group.properties.children || [];
        set((state) => ({
          layers: state.layers.filter(l => l.id !== groupId),
          view: {
            ...state.view,
            selectedLayerIds: childIds
          }
        }));
        get().saveSnapshot();
      },

      // Selection Operations
      selectLayer: (id, addToSelection = false) => {
        set((state) => ({
          view: {
            ...state.view,
            selectedLayerIds: addToSelection
              ? state.view.selectedLayerIds.includes(id)
                ? state.view.selectedLayerIds.filter(selectedId => selectedId !== id)
                : [...state.view.selectedLayerIds, id]
              : [id]
          }
        }));
      },

      selectLayers: (ids) => {
        set((state) => ({
          view: { ...state.view, selectedLayerIds: ids }
        }));
      },

      clearSelection: () => {
        set((state) => ({
          view: { ...state.view, selectedLayerIds: [] }
        }));
      },

      selectAll: () => {
        set((state) => ({
          view: { ...state.view, selectedLayerIds: state.layers.map(l => l.id) }
        }));
      },

      // Transform Operations
      moveLayer: (id, deltaX, deltaY) => {
        get().updateLayer(id, {
          x: get().layers.find(l => l.id === id)!.x + deltaX,
          y: get().layers.find(l => l.id === id)!.y + deltaY
        });
      },

      resizeLayer: (id, width, height) => {
        get().updateLayer(id, { width, height });
      },

      rotateLayer: (id, angle) => {
        get().updateLayer(id, { rotation: angle });
      },

      scaleLayer: (id, scaleX, scaleY) => {
        get().updateLayer(id, { scaleX, scaleY });
      },

      // View Operations
      setZoom: (zoom) => {
        set((state) => ({
          view: { ...state.view, zoom: Math.max(10, Math.min(500, zoom)) }
        }));
      },

      zoomIn: () => {
        const currentZoom = get().view.zoom;
        get().setZoom(currentZoom + 25);
      },

      zoomOut: () => {
        const currentZoom = get().view.zoom;
        get().setZoom(currentZoom - 25);
      },

      zoomToFit: () => {
        // Calculate zoom to fit all layers
        const layers = get().layers;
        if (layers.length === 0) {
          get().setZoom(100);
          return;
        }

        const bounds = layers.reduce((acc, layer) => ({
          minX: Math.min(acc.minX, layer.x),
          minY: Math.min(acc.minY, layer.y),
          maxX: Math.max(acc.maxX, layer.x + layer.width),
          maxY: Math.max(acc.maxY, layer.y + layer.height)
        }), {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity
        });

        const canvas = get().canvas;
        const scaleX = canvas.width / (bounds.maxX - bounds.minX);
        const scaleY = canvas.height / (bounds.maxY - bounds.minY);
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

        get().setZoom(scale * 100);
      },

      pan: (deltaX, deltaY) => {
        set((state) => ({
          view: {
            ...state.view,
            panX: state.view.panX + deltaX,
            panY: state.view.panY + deltaY
          }
        }));
      },

      setTool: (tool) => {
        set((state) => ({
          view: { ...state.view, tool }
        }));
      },

      // History Operations
      saveSnapshot: () => {
        const { layers, canvas } = get();
        const snapshot = createSnapshot(layers, canvas);
        
        set((state) => ({
          history: {
            past: [...state.history.past, state.history.present],
            present: snapshot,
            future: [],
            canUndo: true,
            canRedo: false
          }
        }));
      },

      undo: () => {
        set((state) => {
          if (state.history.past.length === 0) return state;

          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);

          return {
            layers: previous.layers,
            canvas: previous.canvas,
            history: {
              past: newPast,
              present: previous,
              future: [state.history.present, ...state.history.future],
              canUndo: newPast.length > 0,
              canRedo: true
            }
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.history.future.length === 0) return state;

          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);

          return {
            layers: next.layers,
            canvas: next.canvas,
            history: {
              past: [...state.history.past, state.history.present],
              present: next,
              future: newFuture,
              canUndo: true,
              canRedo: newFuture.length > 0
            }
          };
        });
      },

      // Clipboard Operations
      copy: () => {
        const selectedIds = get().view.selectedLayerIds;
        const selectedLayers = get().layers.filter(l => selectedIds.includes(l.id));
        
        set((state) => ({
          view: { ...state.view, clipboard: JSON.parse(JSON.stringify(selectedLayers)) }
        }));
      },

      paste: () => {
        const clipboard = get().view.clipboard;
        if (clipboard.length === 0) return;

        const newLayerIds: string[] = [];
        clipboard.forEach(layer => {
          const newId = get().addLayer({
            ...layer,
            name: `${layer.name} Copy`,
            x: layer.x + 20,
            y: layer.y + 20
          });
          newLayerIds.push(newId);
        });

        get().selectLayers(newLayerIds);
      },

      cut: () => {
        get().copy();
        const selectedIds = get().view.selectedLayerIds;
        selectedIds.forEach(id => get().deleteLayer(id));
      },

      // Export Operations
      exportDesign: async (format) => {
        const { layers, canvas } = get();
        
        switch (format) {
          case 'json':
            return JSON.stringify({ layers, canvas }, null, 2);
          
          case 'svg':
            // Generate SVG from layers
            let svg = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">`;
            svg += `<rect width="100%" height="100%" fill="${canvas.backgroundColor}"/>`;
            
            layers.forEach(layer => {
              if (!layer.visible) return;
              
              switch (layer.type) {
                case 'text':
                  svg += `<text x="${layer.x}" y="${layer.y}" font-size="${layer.properties.fontSize || 16}" fill="${layer.properties.color || '#000'}">${layer.properties.text || ''}</text>`;
                  break;
                case 'shape':
                  if (layer.properties.shape === 'rectangle') {
                    svg += `<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${layer.properties.fill || '#000'}" stroke="${layer.properties.stroke || 'none'}"/>`;
                  }
                  break;
              }
            });
            
            svg += '</svg>';
            return svg;
          
          case 'png':
          case 'pdf':
            // Would implement canvas rendering and conversion
            return new Blob([''], { type: format === 'png' ? 'image/png' : 'application/pdf' });
          
          default:
            throw new Error(`Unsupported format: ${format}`);
        }
      },

      importDesign: async (data) => {
        try {
          let designData;
          
          if (typeof data === 'string') {
            designData = JSON.parse(data);
          } else {
            // Handle file import
            const text = await data.text();
            designData = JSON.parse(text);
          }

          set({
            layers: designData.layers || [],
            canvas: { ...initialCanvas, ...designData.canvas }
          });
          
          get().saveSnapshot();
        } catch (error) {
          console.error('Failed to import design:', error);
          throw error;
        }
      },

      // AI Operations
      analyzeDesign: async () => {
        set((state) => ({
          ai: { ...state.ai, isProcessing: true }
        }));

        try {
          // Simulate AI analysis
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const suggestions = [
            {
              id: 'color_harmony',
              type: 'color' as const,
              title: 'Improve Color Harmony',
              description: 'Your design could benefit from a more cohesive color palette',
              confidence: 0.85
            },
            {
              id: 'layout_balance',
              type: 'layout' as const,
              title: 'Balance Layout',
              description: 'Consider redistributing elements for better visual balance',
              confidence: 0.72
            }
          ];

          set((state) => ({
            ai: {
              ...state.ai,
              isProcessing: false,
              suggestions,
              lastAnalysis: {
                timestamp: Date.now(),
                results: { suggestions }
              }
            }
          }));
        } catch (error) {
          set((state) => ({
            ai: { ...state.ai, isProcessing: false }
          }));
          throw error;
        }
      },

      applySuggestion: (suggestionId) => {
        const suggestion = get().ai.suggestions.find(s => s.id === suggestionId);
        if (!suggestion) return;

        // Apply suggestion based on type
        switch (suggestion.type) {
          case 'color':
            // Apply color improvements
            break;
          case 'layout':
            // Apply layout improvements
            break;
        }

        get().saveSnapshot();
      },

      generateLayout: async (prompt) => {
        set((state) => ({
          ai: { ...state.ai, isProcessing: true }
        }));

        try {
          // Simulate AI layout generation
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Generate layout based on prompt
          const generatedLayers = [
            {
              name: 'AI Generated Title',
              type: 'text' as const,
              visible: true,
              locked: false,
              opacity: 1,
              x: 50,
              y: 50,
              width: 300,
              height: 60,
              rotation: 0,
              properties: {
                text: 'AI Generated Content',
                fontSize: 24,
                fontFamily: 'Arial',
                color: '#333333'
              }
            }
          ];

          generatedLayers.forEach(layer => get().addLayer(layer));
          
          set((state) => ({
            ai: { ...state.ai, isProcessing: false }
          }));
        } catch (error) {
          set((state) => ({
            ai: { ...state.ai, isProcessing: false }
          }));
          throw error;
        }
      },

      optimizeColors: async () => {
        set((state) => ({
          ai: { ...state.ai, isProcessing: true }
        }));

        try {
          // Simulate color optimization
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Apply optimized colors to layers
          const layers = get().layers;
          layers.forEach(layer => {
            if (layer.type === 'text' && layer.properties.color) {
              get().updateLayer(layer.id, {
                properties: {
                  ...layer.properties,
                  color: '#2563eb' // Example optimized color
                }
              });
            }
          });

          set((state) => ({
            ai: { ...state.ai, isProcessing: false }
          }));
        } catch (error) {
          set((state) => ({
            ai: { ...state.ai, isProcessing: false }
          }));
          throw error;
        }
      },

      // Collaboration Operations
      addUser: (user) => {
        set((state) => ({
          collaboration: {
            ...state.collaboration,
            users: [...state.collaboration.users, user]
          }
        }));
      },

      removeUser: (userId) => {
        set((state) => ({
          collaboration: {
            ...state.collaboration,
            users: state.collaboration.users.filter(u => u.id !== userId)
          }
        }));
      },

      updateUserCursor: (userId, x, y) => {
        set((state) => ({
          collaboration: {
            ...state.collaboration,
            users: state.collaboration.users.map(user =>
              user.id === userId ? { ...user, cursor: { x, y } } : user
            )
          }
        }));
      },

      addComment: (x, y, text) => {
        const comment = {
          id: `comment_${Date.now()}`,
          userId: 'current_user', // Would be actual user ID
          x,
          y,
          text,
          timestamp: Date.now(),
          resolved: false
        };

        set((state) => ({
          collaboration: {
            ...state.collaboration,
            comments: [...state.collaboration.comments, comment]
          }
        }));
      },

      resolveComment: (commentId) => {
        set((state) => ({
          collaboration: {
            ...state.collaboration,
            comments: state.collaboration.comments.map(comment =>
              comment.id === commentId ? { ...comment, resolved: true } : comment
            )
          }
        }));
      },

      // Animation Operations
      addAnimation: (layerId, animation) => {
        const animationId = `anim_${Date.now()}`;
        const animationWithId = { ...animation, id: animationId };
        
        get().updateLayer(layerId, {
          animations: [
            ...(get().layers.find(l => l.id === layerId)?.animations || []),
            animationWithId
          ]
        });
      },

      updateAnimation: (layerId, animationId, updates) => {
        const layer = get().layers.find(l => l.id === layerId);
        if (!layer?.animations) return;

        const updatedAnimations = layer.animations.map(anim =>
          anim.id === animationId ? { ...anim, ...updates } : anim
        );

        get().updateLayer(layerId, { animations: updatedAnimations });
      },

      deleteAnimation: (layerId, animationId) => {
        const layer = get().layers.find(l => l.id === layerId);
        if (!layer?.animations) return;

        const filteredAnimations = layer.animations.filter(anim => anim.id !== animationId);
        get().updateLayer(layerId, { animations: filteredAnimations });
      },

      playAnimation: () => {
        // Implement animation playback
        console.log('Playing animations...');
      },

      pauseAnimation: () => {
        // Implement animation pause
        console.log('Pausing animations...');
      }
    }),
    {
      name: 'design-store',
      partialize: (state) => ({
        layers: state.layers,
        canvas: state.canvas,
        view: {
          zoom: state.view.zoom,
          tool: state.view.tool,
          showRulers: state.view.showRulers,
          showGrid: state.view.showGrid,
          snapToGrid: state.view.snapToGrid,
          snapToObjects: state.view.snapToObjects
        }
      })
    }
  )
);