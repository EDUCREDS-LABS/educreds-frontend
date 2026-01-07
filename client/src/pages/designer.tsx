import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Save, Eye, Upload, Grid, Type } from 'lucide-react';

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
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  const availableFields = [
    { name: 'studentName', label: 'Student Name', required: true, locked: false },
    { name: 'institutionName', label: 'Institution Name', required: true, locked: true },
    { name: 'courseName', label: 'Course Name', required: true, locked: false },
    { name: 'grade', label: 'Grade', required: true, locked: false },
    { name: 'completionDate', label: 'Completion Date', required: true, locked: false, type: 'date' },
    { name: 'certificateType', label: 'Certificate Type', required: true, locked: false },
    { name: 'issueDate', label: 'Issue Date', required: true, locked: true, type: 'date' },
    { name: 'certificateId', label: 'Certificate ID', required: true, locked: true },
    { name: 'qrCode', label: 'QR Code', required: true, locked: true, type: 'qr' },
    { name: 'verificationUrl', label: 'Verification URL', required: true, locked: true }
  ];

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
      fontSize: 12,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      required: fieldInfo.required,
      locked: fieldInfo.locked,
      type: fieldInfo.type || 'text'
    };

    setFields(prev => [...prev, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<FieldMapping>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const removeField = (fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (100 / zoom);
    const y = (event.clientY - rect.top) * (100 / zoom);

    const clickedField = fields.find(field => 
      x >= field.x && x <= field.x + field.width &&
      y >= field.y && y <= field.y + field.height
    );

    setSelectedField(clickedField ? clickedField.id : null);
  };

  const selectedFieldData = selectedField ? fields.find(f => f.id === selectedField) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Template Designer</h1>
          <p className="text-gray-600 mt-2">
            Design certificate templates with field mapping and validation
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Field Library */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Library</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableFields.map(field => (
                  <Button
                    key={field.name}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => addField(field.name)}
                    disabled={fields.some(f => f.name === field.name)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="flex gap-1 mt-1">
                          {field.required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                          {field.locked && (
                            <Badge variant="outline" className="text-xs">System</Badge>
                          )}
                        </div>
                      </div>
                      <Type className="h-4 w-4 text-gray-400" />
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Canvas Area */}
          <div className="col-span-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Design Canvas</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="zoom" className="text-sm">Zoom:</Label>
                      <Select value={zoom.toString()} onValueChange={(value) => setZoom(parseInt(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="75">75%</SelectItem>
                          <SelectItem value="100">100%</SelectItem>
                          <SelectItem value="125">125%</SelectItem>
                          <SelectItem value="150">150%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGrid(!showGrid)}
                    >
                      <Grid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 bg-white overflow-auto">
                  <div
                    ref={canvasRef}
                    className="relative bg-white"
                    style={{ 
                      width: `${595 * (zoom / 100)}px`, 
                      height: `${842 * (zoom / 100)}px`,
                      backgroundImage: showGrid ? 
                        `radial-gradient(circle, #e5e7eb 1px, transparent 1px)` : 'none',
                      backgroundSize: showGrid ? `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px` : 'auto'
                    }}
                    onClick={handleCanvasClick}
                  >
                    {/* Field Overlays */}
                    {fields.map(field => (
                      <div
                        key={field.id}
                        className={`absolute border-2 cursor-move select-none ${
                          selectedField === field.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : field.locked 
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-400 bg-gray-50'
                        }`}
                        style={{
                          left: field.x * (zoom / 100),
                          top: field.y * (zoom / 100),
                          width: field.width * (zoom / 100),
                          height: field.height * (zoom / 100),
                          fontSize: field.fontSize * (zoom / 100),
                          fontFamily: field.fontFamily,
                          fontWeight: field.fontWeight,
                          color: field.color
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedField(field.id);
                        }}
                      >
                        <div className="p-1 text-xs truncate">
                          {field.name}
                        </div>
                        {selectedField === field.id && !field.locked && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(field.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFieldData ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Field Name</Label>
                      <Input value={selectedFieldData.name} disabled className="mt-1" />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">X Position</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.x}
                          onChange={(e) => updateField(selectedFieldData.id, { x: parseInt(e.target.value) || 0 })}
                          disabled={selectedFieldData.locked}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Y Position</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.y}
                          onChange={(e) => updateField(selectedFieldData.id, { y: parseInt(e.target.value) || 0 })}
                          disabled={selectedFieldData.locked}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Width</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.width}
                          onChange={(e) => updateField(selectedFieldData.id, { width: parseInt(e.target.value) || 0 })}
                          disabled={selectedFieldData.locked}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Height</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.height}
                          onChange={(e) => updateField(selectedFieldData.id, { height: parseInt(e.target.value) || 0 })}
                          disabled={selectedFieldData.locked}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium">Font Size</Label>
                      <Input
                        type="number"
                        value={selectedFieldData.fontSize}
                        onChange={(e) => updateField(selectedFieldData.id, { fontSize: parseInt(e.target.value) || 12 })}
                        disabled={selectedFieldData.locked}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Font Family</Label>
                      <Select
                        value={selectedFieldData.fontFamily}
                        onValueChange={(value) => updateField(selectedFieldData.id, { fontFamily: value })}
                        disabled={selectedFieldData.locked}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Courier">Courier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Font Weight</Label>
                      <Select
                        value={selectedFieldData.fontWeight}
                        onValueChange={(value) => updateField(selectedFieldData.id, { fontWeight: value })}
                        disabled={selectedFieldData.locked}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Color</Label>
                      <Input
                        type="color"
                        value={selectedFieldData.color}
                        onChange={(e) => updateField(selectedFieldData.id, { color: e.target.value })}
                        disabled={selectedFieldData.locked}
                        className="mt-1 h-10"
                      />
                    </div>

                    {selectedFieldData.locked && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">
                          This field is managed by the system and cannot be modified.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Type className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Select a field to edit its properties</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDesigner;