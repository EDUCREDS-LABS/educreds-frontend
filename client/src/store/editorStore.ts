import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createTemplate, updateTemplate, getTemplates } from '@/lib/templates-api';

export interface EditorState {
  editor: any; // GrapesJS editor instance
  isLoading: boolean;
  isDirty: boolean;
  currentTemplate: EnhancedTemplate | null;
  templates: EnhancedTemplate[];
  canvasSize: { width: number; height: number };
  selectedElement: any;
  history: {
    canUndo: boolean;
    canRedo: boolean;
  };
  previewMode: boolean;
}

export interface EnhancedTemplate {
  id?: string;
  name: string;
  description: string;
  htmlContent: string;
  cssContent: string;
  placeholders: { key: string; label: string }[];
  price?: number;
  currency?: string;
  creatorId?: string;
  thumbnailUrl?: string;
  licenseType?: 'single-use' | 'multi-use' | 'unlimited' | 'seat-based';
  tags: string[];
  licenseDetails?: {
    maxUses?: number;
    maxSeats?: number;
    validUntil?: Date;
  };
  isPublished?: boolean;
  // Enhanced marketplace fields
  grapesJsData?: object;
  fabricJsData?: object;
  previewImages?: {
    thumbnail: string;
    medium: string;
    large: string;
  };
  designMetadata?: {
    canvasSize: { width: number; height: number };
    layers: number;
    elements: number;
    fonts: string[];
    colors: string[];
  };
  templateType?: 'certificate' | 'logo' | 'banner' | 'other';
  isFeatured?: boolean;
  analytics?: {
    views: number;
    downloads: number;
    likes: number;
    rating: number;
  };
  // Analytics properties
  salesCount?: number;
  viewCount?: number;
  downloadCount?: number;
  likeCount?: number;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface EditorActions {
  setEditor: (editor: any) => void;
  setLoading: (loading: boolean) => void;
  setDirty: (dirty: boolean) => void;
  setCurrentTemplate: (template: EnhancedTemplate | null) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setSelectedElement: (element: any) => void;
  updateHistory: (canUndo: boolean, canRedo: boolean) => void;
  setPreviewMode: (preview: boolean) => void;
  saveTemplate: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadTemplate: (template: EnhancedTemplate) => void;
  exportTemplate: (format: 'html' | 'json' | 'png' | 'pdf') => Promise<string | Blob>;
  undo: () => void;
  redo: () => void;
  clearEditor: () => void;
}

export const useEditorStore = create<EditorState & EditorActions>()(
  devtools(
    (set, get) => ({
      // State
      editor: null,
      isLoading: false,
      isDirty: false,
      currentTemplate: null,
      templates: [],
      canvasSize: { width: 800, height: 600 },
      selectedElement: null,
      history: {
        canUndo: false,
        canRedo: false,
      },
      previewMode: false,

      // Actions
      setEditor: (editor) => set({ editor }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setDirty: (dirty) => set({ isDirty: dirty }),
      
      setCurrentTemplate: (template) => set({ currentTemplate: template }),
      
      setCanvasSize: (size) => set({ canvasSize: size }),
      
      setSelectedElement: (element) => set({ selectedElement: element }),
      
      updateHistory: (canUndo, canRedo) => 
        set({ history: { canUndo, canRedo } }),
      
      setPreviewMode: (preview) => set({ previewMode: preview }),

      loadTemplates: async () => {
        try {
          set({ isLoading: true });
          const templates = await getTemplates();
          set({ templates });
        } catch (error) {
          console.error('Error loading templates:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      saveTemplate: async () => {
        const { editor, currentTemplate } = get();
        if (!editor) return;

        try {
          set({ isLoading: true });
          
          const html = editor.getHtml();
          const css = editor.getCss();
          const grapesJsData = editor.getProjectData();
          
          // Update current template with editor data
          const updatedTemplateData = {
            ...currentTemplate,
            htmlContent: html,
            cssContent: css,
            grapesJsData,
            designMetadata: {
              canvasSize: get().canvasSize,
              layers: editor.getComponents().length,
              elements: editor.getComponents().length,
              fonts: extractFonts(css),
              colors: extractColors(css),
            }
          };

          let savedTemplate;
          if (updatedTemplateData.id) {
            savedTemplate = await updateTemplate(updatedTemplateData.id, updatedTemplateData);
          } else {
            savedTemplate = await createTemplate(updatedTemplateData);
          }

          set({ currentTemplate: savedTemplate, isDirty: false });
          
          console.log('Template saved:', savedTemplate);
        } catch (error) {
          console.error('Error saving template:', error);
        } finally {
          set({ isLoading: false });
        }
      },


      loadTemplate: (template) => {
        const { editor } = get();
        if (!editor) return;

        try {
          set({ isLoading: true });
          
          // Load HTML and CSS
          editor.setComponents(template.htmlContent || '');
          editor.setStyle(template.cssContent || '');
          
          // Load GrapesJS data if available
          if (template.grapesJsData) {
            editor.loadProjectData(template.grapesJsData);
          }
          
          // Set canvas size
          if (template.designMetadata?.canvasSize) {
            set({ canvasSize: template.designMetadata.canvasSize });
          }
          
          set({ 
            currentTemplate: template, 
            isDirty: false,
            previewMode: false 
          });
        } catch (error) {
          console.error('Error loading template:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      exportTemplate: async (format) => {
        const { editor } = get();
        if (!editor) return '';

        try {
          set({ isLoading: true });
          
          switch (format) {
            case 'html':
              return editor.getHtml();
            case 'json':
              return JSON.stringify(editor.getProjectData(), null, 2);
            case 'png':
              return await editor.runCommand('export-template', { format: 'png' });
            case 'pdf':
              return await editor.runCommand('export-template', { format: 'pdf' });
            default:
              return '';
          }
        } catch (error) {
          console.error('Error exporting template:', error);
          return '';
        } finally {
          set({ isLoading: false });
        }
      },

      undo: () => {
        const { editor } = get();
        if (editor) {
          editor.runCommand('core:undo');
        }
      },

      redo: () => {
        const { editor } = get();
        if (editor) {
          editor.runCommand('core:redo');
        }
      },

      clearEditor: () => {
        const { editor } = get();
        if (editor) {
          editor.setComponents('');
          editor.setStyle('');
        }
        set({ 
          currentTemplate: null, 
          isDirty: false, 
          selectedElement: null,
          previewMode: false 
        });
      },
    }),
    {
      name: 'editor-store',
    }
  )
);

// Helper functions
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
