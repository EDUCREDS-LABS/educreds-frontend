import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Layers, 
  Type, 
  Square, 
  Circle, 
  Image, 
  Palette, 
  Download,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer,
  Pen,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2
} from 'lucide-react';

interface Layer {
  id: string;
  name: string;
  type: 'text' | 'shape' | 'image' | 'group';
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  properties: Record<string, any>;
}

interface DesignState {
  layers: Layer[];
  selectedLayerId: string | null;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  zoom: number;
  tool: string;
}

export const AdvancedDesignEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [designState, setDesignState] = useState<DesignState>({
    layers: [],
    selectedLayerId: null,
    canvas: { width: 800, height: 600, backgroundColor: '#ffffff' },
    zoom: 100,
    tool: 'select'
  });
  
  const [showAI, setShowAI] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'image', icon: Image, label: 'Image' }
  ];

  const handleToolSelect = (toolId: string) => {
    setDesignState(prev => ({ ...prev, tool: toolId }));
  };

  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    setDesignState(prev => {
      let newZoom = prev.zoom;
      if (direction === 'in') newZoom = Math.min(prev.zoom + 25, 500);
      else if (direction === 'out') newZoom = Math.max(prev.zoom - 25, 25);
      else newZoom = 100; // fit to screen
      return { ...prev, zoom: newZoom };
    });
  };

  const addLayer = (type: Layer['type']) => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${designState.layers.length + 1}`,
      type,
      visible: true,
      locked: false,
      opacity: 1,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 50 : 100,
      rotation: 0,
      properties: type === 'text' 
        ? { text: 'Sample Text', fontSize: 16, fontFamily: 'Arial', color: '#000000' }
        : type === 'shape'
        ? { fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 2 }
        : {}
    };

    setDesignState(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      selectedLayerId: newLayer.id
    }));
  };

  const toggleLayerVisibility = (layerId: string) => {
    setDesignState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    }));
  };

  const toggleLayerLock = (layerId: string) => {
    setDesignState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    }));
  };

  const deleteLayer = (layerId: string) => {
    setDesignState(prev => ({
      ...prev,
      layers: prev.layers.filter(layer => layer.id !== layerId),
      selectedLayerId: prev.selectedLayerId === layerId ? null : prev.selectedLayerId
    }));
  };

  const duplicateLayer = (layerId: string) => {
    const layer = designState.layers.find(l => l.id === layerId);
    if (layer) {
      const newLayer = {
        ...layer,
        id: `layer_${Date.now()}`,
        name: `${layer.name} Copy`,
        x: layer.x + 20,
        y: layer.y + 20
      };
      setDesignState(prev => ({
        ...prev,
        layers: [...prev.layers, newLayer],
        selectedLayerId: newLayer.id
      }));
    }
  };

  const selectedLayer = designState.layers.find(l => l.id === designState.selectedLayerId);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EduDesign Pro
            </h1>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* File Operations */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="ghost" size="sm">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Tools */}
          <div className="flex items-center space-x-1">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={designState.tool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolSelect(tool.id)}
                title={tool.label}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Animation Controls */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleZoom('out')}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleZoom('fit')}
              className="w-16 text-sm"
            >
              {designState.zoom}%
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleZoom('in')}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* AI Assistant */}
          <Button 
            variant={showAI ? "default" : "ghost"} 
            size="sm"
            onClick={() => setShowAI(!showAI)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>

          {/* Export */}
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col shadow-sm">
          <Tabs defaultValue="layers" className="flex-1">
            <TabsList className="grid w-full grid-cols-4 m-2">
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="collab">Team</TabsTrigger>
            </TabsList>
            
            <TabsContent value="layers" className="flex-1 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Layers</h3>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => addLayer('text')}>
                    <Type className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => addLayer('shape')}>
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => addLayer('image')}>
                    <Image className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {designState.layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      designState.selectedLayerId === layer.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setDesignState(prev => ({ ...prev, selectedLayerId: layer.id }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerVisibility(layer.id);
                            }}
                          >
                            {layer.visible ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerLock(layer.id);
                            }}
                          >
                            {layer.locked ? (
                              <Lock className="w-3 h-3 text-gray-400" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <span className="text-sm font-medium truncate">{layer.name}</span>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateLayer(layer.id);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-6 h-6 p-0 text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLayer(layer.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {layer.type} • {Math.round(layer.width)}×{Math.round(layer.height)}
                    </div>
                  </div>
                ))}
                
                {designState.layers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No layers yet</p>
                    <p className="text-xs">Add elements to get started</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="tools" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Quick Tools</h3>
                <div className="grid grid-cols-2 gap-2">
                  {tools.map((tool) => (
                    <Button
                      key={tool.id}
                      variant={designState.tool === tool.id ? "default" : "outline"}
                      className="h-16 flex-col"
                      onClick={() => handleToolSelect(tool.id)}
                    >
                      <tool.icon className="w-6 h-6 mb-1" />
                      <span className="text-xs">{tool.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="assets" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Asset Library</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-4 h-20 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Image className="w-8 h-8 text-gray-400" />
                  </Card>
                  <Card className="p-4 h-20 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Palette className="w-8 h-8 text-gray-400" />
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="collab" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Collaboration</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">You (Online)</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-700">
            {/* Canvas Container */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="bg-white shadow-2xl rounded-lg overflow-hidden"
                style={{
                  width: `${designState.canvas.width * (designState.zoom / 100)}px`,
                  height: `${designState.canvas.height * (designState.zoom / 100)}px`,
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={designState.canvas.width}
                  height={designState.canvas.height}
                  className="w-full h-full"
                  style={{ backgroundColor: designState.canvas.backgroundColor }}
                />
              </div>
            </div>

            {/* Canvas Info */}
            <div className="absolute top-4 left-4">
              <Card className="p-3 bg-white/90 backdrop-blur-sm">
                <div className="text-sm text-gray-600">
                  Canvas: {designState.canvas.width} × {designState.canvas.height}px
                </div>
                <div className="text-xs text-gray-500">
                  Zoom: {designState.zoom}% • Tool: {designState.tool}
                </div>
              </Card>
            </div>

            {/* Grid Toggle */}
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm">
                Grid
              </Button>
            </div>
          </div>

          {/* Bottom Timeline */}
          <div className="h-32 bg-white dark:bg-gray-800 border-t">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Timeline</h3>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Play className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-gray-500">0:00 / 5:00</span>
                </div>
              </div>
              <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-sm text-gray-500">Animation timeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l shadow-sm">
          <Tabs defaultValue="properties" className="h-full">
            <TabsList className="grid w-full grid-cols-2 m-2">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>
            
            <TabsContent value="properties" className="flex-1 p-4">
              {selectedLayer ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Layer Properties</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input 
                        type="text" 
                        value={selectedLayer.name}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        onChange={(e) => {
                          setDesignState(prev => ({
                            ...prev,
                            layers: prev.layers.map(layer =>
                              layer.id === selectedLayer.id 
                                ? { ...layer, name: e.target.value }
                                : layer
                            )
                          }));
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">X</label>
                        <input 
                          type="number" 
                          value={Math.round(selectedLayer.x)}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Y</label>
                        <input 
                          type="number" 
                          value={Math.round(selectedLayer.y)}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Width</label>
                        <input 
                          type="number" 
                          value={Math.round(selectedLayer.width)}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Height</label>
                        <input 
                          type="number" 
                          value={Math.round(selectedLayer.height)}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Opacity</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1"
                        value={selectedLayer.opacity}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Square className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No layer selected</p>
                  <p className="text-xs">Select a layer to edit properties</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="ai" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">AI Assistant</h3>
                </div>
                
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <p className="text-sm text-gray-600 mb-3">
                    Get AI-powered suggestions for your design
                  </p>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full justify-start">
                      <Palette className="w-4 h-4 mr-2" />
                      Suggest Colors
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start">
                      <Type className="w-4 h-4 mr-2" />
                      Improve Typography
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start">
                      <Layers className="w-4 h-4 mr-2" />
                      Auto Layout
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDesignEditor;