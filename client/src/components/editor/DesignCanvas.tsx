import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { createGrapesJSConfig, A4_CANVAS_SIZE, CERTIFICATE_CANVAS_SIZE } from '@/utils/grapesjs-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Undo, 
  Redo, 
  Eye, 
  Download, 
  Settings, 
  Maximize2, 
  Minimize2,
  Palette,
  Code,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DesignCanvasProps {
  template?: any;
  onSave?: (templateData: any) => void;
  onExport?: (format: string, data: any) => void;
  canvasSize?: 'A4' | 'certificate' | 'custom';
  customSize?: { width: number; height: number };
}

export function DesignCanvas({ 
  template, 
  onSave, 
  onExport, 
  canvasSize = 'certificate',
  customSize 
}: DesignCanvasProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<'blocks' | 'layers' | 'styles' | 'traits'>('blocks');
  const { toast } = useToast();
  
  const {
    editor,
    isLoading,
    isDirty,
    currentTemplate,
    canvasSize: storeCanvasSize,
    history,
    previewMode,
    setEditor,
    setLoading,
    setDirty,
    setCurrentTemplate,
    setCanvasSize,
    updateHistory,
    setPreviewMode,
    saveTemplate,
    loadTemplate,
    exportTemplate,
    undo,
    redo,
    clearEditor
  } = useEditorStore();

  // Initialize GrapesJS editor
  useEffect(() => {
    const initEditor = async () => {
      try {
        setLoading(true);
        
        // Wait for container to be available
        if (!editorRef.current) {
          console.error('Container element not available.');
          setLoading(false);
          return;
        }

        // Wait for panel containers to be available
        const waitForElement = (id: string, timeout = 5000) => {
          return new Promise<HTMLElement>((resolve, reject) => {
            const startTime = Date.now();
            const checkElement = () => {
              const element = document.getElementById(id);
              if (element) {
                resolve(element);
              } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element with id '${id}' not found within ${timeout}ms`));
              } else {
                setTimeout(checkElement, 100);
              }
            };
            checkElement();
          });
        };

        // Wait for all required elements
        try {
          await Promise.all([
            waitForElement('blocks'),
            waitForElement('layers'),
            waitForElement('traits-container'),
            waitForElement('styles-container')
          ]);
        } catch (error) {
          console.warn('Some panel containers not found, using fallback:', error);
        }
        
        // Dynamic import of GrapesJS
        const grapesjs = await import('grapesjs');
        const config = createGrapesJSConfig();
        
        // Set canvas size based on prop
        const size = canvasSize === 'A4' ? A4_CANVAS_SIZE : 
                    canvasSize === 'certificate' ? CERTIFICATE_CANVAS_SIZE :
                    customSize || CERTIFICATE_CANVAS_SIZE;
        
        setCanvasSize(size);
        
        // Create editor instance with fallback configuration
        const editorInstance = grapesjs.default ? grapesjs.default.init({
          ...config,
          container: editorRef.current,
          blockManager: {
            ...config.blockManager,
            appendTo: document.getElementById('blocks') || undefined,
          },
          layerManager: {
            ...config.layerManager,
            appendTo: document.getElementById('layers') || undefined,
          },
          traitManager: {
            ...config.traitManager,
            appendTo: document.getElementById('traits-container') || undefined,
          },
          selectorManager: {
            ...config.selectorManager,
            appendTo: document.getElementById('styles-container') || undefined,
          },
          styleManager: {
            ...config.styleManager,
            appendTo: document.getElementById('styles-container') || undefined,
          },
          panels: {}, // Panels are handled by custom UI
          canvas: {
            ...config.canvas,
            styles: [
              ...(config.canvas?.styles || []),
              `
                body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                  margin: 0;
                  padding: 0;
                }
                .certificate-frame {
                  border: 3px solid #667eea;
                  border-radius: 20px;
                  padding: 40px;
                  background: white;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                  text-align: center;
                  min-height: 400px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                }
              `
            ]
          }
        }) : grapesjs.init({
          ...config,
          container: editorRef.current,
          blockManager: {
            ...config.blockManager,
            appendTo: document.getElementById('blocks') || undefined,
          },
          layerManager: {
            ...config.layerManager,
            appendTo: document.getElementById('layers') || undefined,
          },
          traitManager: {
            ...config.traitManager,
            appendTo: document.getElementById('traits-container') || undefined,
          },
          selectorManager: {
            ...config.selectorManager,
            appendTo: document.getElementById('styles-container') || undefined,
          },
          styleManager: {
            ...config.styleManager,
            appendTo: document.getElementById('styles-container') || undefined,
          },
          panels: {}, // Panels are handled by custom UI
          canvas: {
            ...config.canvas,
            styles: [
              ...(config.canvas?.styles || []),
              `
                body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                  margin: 0;
                  padding: 0;
                }
                .certificate-frame {
                  border: 3px solid #667eea;
                  border-radius: 20px;
                  padding: 40px;
                  background: white;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                  text-align: center;
                  min-height: 400px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                }
              `
            ]
          }
        });

        // Set canvas size
        editorInstance.Canvas.setSize(size.width, size.height);

        // Event listeners
        editorInstance.on('component:add', () => {
          setDirty(true);
          updateHistory(
            editorInstance.UndoManager.hasUndo(),
            editorInstance.UndoManager.hasRedo()
          );
        });

        editorInstance.on('component:update', () => {
          setDirty(true);
          updateHistory(
            editorInstance.UndoManager.hasUndo(),
            editorInstance.UndoManager.hasRedo()
          );
        });

        editorInstance.on('component:remove', () => {
          setDirty(true);
          updateHistory(
            editorInstance.UndoManager.hasUndo(),
            editorInstance.UndoManager.hasRedo()
          );
        });

        editorInstance.on('component:selected', (component: any) => {
          // Handle component selection
        });

        // Add custom commands
        editorInstance.Commands.add('export-template', {
          run: async (editor: any, sender: any, options: any = {}) => {
            const { format = 'png' } = options;
            try {
              const data = await exportTemplate(format as any);
              if (onExport) {
                onExport(format, data);
              }
              toast({
                title: 'Export Successful',
                description: `Template exported as ${format.toUpperCase()}`,
              });
            } catch (error) {
              toast({
                title: 'Export Failed',
                description: 'Failed to export template',
                variant: 'destructive',
              });
            }
          }
        });

        setEditor(editorInstance);
        
        // Load template if provided
        if (template) {
          loadTemplate(template);
        }

      } catch (error) {
        console.error('Error initializing GrapesJS:', error);
        toast({
          title: 'Editor Error',
          description: 'Failed to initialize design editor',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    initEditor();

    // Cleanup
    return () => {
      if (editor) {
        editor.destroy();
        setEditor(null);
      }
    };
  }, []);

  // Load template when it changes
  useEffect(() => {
    if (template && editor) {
      loadTemplate(template);
    }
  }, [template, editor]);

  const handleSave = async () => {
    try {
      await saveTemplate();
      if (onSave && currentTemplate) {
        onSave(currentTemplate);
      }
      toast({
        title: 'Template Saved',
        description: 'Your template has been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'html' | 'json' | 'png' | 'pdf') => {
    try {
      const data = await exportTemplate(format);
      if (onExport) {
        onExport(format, data);
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: `Failed to export as ${format.toUpperCase()}`,
        variant: 'destructive',
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const togglePreview = () => {
    if (editor) {
      setPreviewMode(!previewMode);
      editor.runCommand('preview');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Design Editor</h2>
          {isDirty && <Badge variant="secondary">Unsaved</Badge>}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!history.canUndo}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={!history.canRedo}
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={togglePreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('png')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activePanel === 'blocks' ? 'bg-white border-b-2 border-blue-500' : 'text-gray-600'
              }`}
              onClick={() => setActivePanel('blocks')}
            >
              <Palette className="h-4 w-4 inline mr-2" />
              Blocks
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activePanel === 'layers' ? 'bg-white border-b-2 border-blue-500' : 'text-gray-600'
              }`}
              onClick={() => setActivePanel('layers')}
            >
              <Layers className="h-4 w-4 inline mr-2" />
              Layers
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activePanel === 'styles' ? 'bg-white border-b-2 border-blue-500' : 'text-gray-600'
              }`}
              onClick={() => setActivePanel('styles')}
            >
              <Code className="h-4 w-4 inline mr-2" />
              Styles
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-auto">
            {activePanel === 'blocks' && (
              <div className="p-4">
                <div id="blocks" className="space-y-2"></div>
              </div>
            )}
            {activePanel === 'layers' && (
              <div className="p-4">
                <div id="layers" className="space-y-2"></div>
              </div>
            )}
            {activePanel === 'styles' && (
              <div className="p-4">
                <div id="styles-container" className="space-y-2"></div>
              </div>
            )}
            {activePanel === 'traits' && (
              <div className="p-4">
                <div id="traits-container" className="space-y-2"></div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between p-2 border-b bg-white">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Canvas: {storeCanvasSize.width} Ã— {storeCanvasSize.height}px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* GrapesJS Canvas */}
          <div className="flex-1 relative">
            <div
              ref={editorRef}
              className="w-full h-full"
              style={{ minHeight: '500px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
