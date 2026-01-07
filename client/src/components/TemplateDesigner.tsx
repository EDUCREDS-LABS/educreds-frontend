import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Move, Type, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  placeholder?: string;
}

interface TemplateDesignerProps {
  pdfUrl?: string;
  initialFields?: FieldMapping[];
  onSave: (fields: FieldMapping[]) => void;
}

export const TemplateDesigner: React.FC<TemplateDesignerProps> = ({
  pdfUrl,
  initialFields = [],
  onSave
}) => {
  const [fields, setFields] = useState<FieldMapping[]>(initialFields);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const availableFields = [
    { name: 'studentName', label: 'Student Name', required: true, locked: false },
    { name: 'institutionName', label: 'Institution Name', required: true, locked: true },
    { name: 'courseName', label: 'Course Name', required: true, locked: false },
    { name: 'grade', label: 'Grade', required: true, locked: false },
    { name: 'issueDate', label: 'Issue Date', required: true, locked: true, type: 'date' },
    { name: 'completionDate', label: 'Completion Date', required: true, locked: false, type: 'date' },
    { name: 'certificateType', label: 'Certificate Type', required: true, locked: false },
    { name: 'ipfsHash', label: 'IPFS Hash', required: true, locked: true },
    { name: 'certificateId', label: 'Certificate ID (Token ID)', required: true, locked: true },
    { name: 'qrCode', label: 'QR Code', required: true, locked: true, type: 'qr' },
    { name: 'verificationUrl', label: 'Verification URL', required: true, locked: true },
    { name: 'blockchainAddress', label: 'Blockchain Address', required: true, locked: true }
  ];

  const addField = (fieldName: string) => {
    const fieldInfo = availableFields.find(f => f.name === fieldName);
    if (!fieldInfo) return;

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
      type: fieldInfo.type || 'text',
      placeholder: fieldInfo.label
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
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on existing field
    const clickedField = fields.find(field => 
      x >= field.x && x <= field.x + field.width &&
      y >= field.y && y <= field.y + field.height
    );

    if (clickedField) {
      setSelectedField(clickedField.id);
    } else {
      setSelectedField(null);
    }
  };

  const handleFieldDrag = useCallback((fieldId: string, newX: number, newY: number) => {
    updateField(fieldId, { x: newX, y: newY });
  }, []);

  const validateTemplate = (): boolean => {
    const requiredFields = availableFields.filter(f => f.required).map(f => f.name);
    const mappedFields = fields.map(f => f.name);
    
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Missing required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (validateTemplate()) {
      onSave(fields);
      toast({
        title: "Template Saved",
        description: "Template configuration saved successfully"
      });
    }
  };

  const selectedFieldData = selectedField ? fields.find(f => f.id === selectedField) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
      {/* Field Library */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Available Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {availableFields.map(field => (
            <Button
              key={field.name}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addField(field.name)}
              disabled={fields.some(f => f.name === field.name)}
            >
              <Type className="h-3 w-3 mr-2" />
              {field.label}
              {field.required && <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>}
              {field.locked && <Badge variant="secondary" className="ml-2 text-xs">Locked</Badge>}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Canvas Area */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Template Designer</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={canvasRef}
            className="relative border-2 border-dashed border-gray-300 bg-white"
            style={{ width: '595px', height: '842px', minHeight: '600px' }} // A4 dimensions
            onClick={handleCanvasClick}
          >
            {/* PDF Background */}
            {pdfUrl && (
              <img
                src={pdfUrl}
                alt="Template background"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50"
              />
            )}

            {/* Field Overlays */}
            {fields.map(field => (
              <div
                key={field.id}
                className={`absolute border-2 cursor-move ${
                  selectedField === field.id 
                    ? 'border-blue-500 bg-blue-100' 
                    : 'border-gray-400 bg-gray-100'
                } ${field.locked ? 'border-red-400 bg-red-50' : ''}`}
                style={{
                  left: field.x,
                  top: field.y,
                  width: field.width,
                  height: field.height,
                  fontSize: field.fontSize,
                  fontFamily: field.fontFamily,
                  fontWeight: field.fontWeight,
                  color: field.color
                }}
                onMouseDown={(e) => {
                  setDraggedField(field.id);
                  setSelectedField(field.id);
                }}
              >
                <div className="p-1 text-xs truncate">
                  {showPreview ? (field.placeholder || field.name) : field.name}
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
        </CardContent>
      </Card>

      {/* Properties Panel */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Field Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedFieldData ? (
            <>
              <div>
                <Label>Field Name</Label>
                <Input value={selectedFieldData.name} disabled />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>X Position</Label>
                  <Input
                    type="number"
                    value={selectedFieldData.x}
                    onChange={(e) => updateField(selectedFieldData.id, { x: parseInt(e.target.value) })}
                    disabled={selectedFieldData.locked}
                  />
                </div>
                <div>
                  <Label>Y Position</Label>
                  <Input
                    type="number"
                    value={selectedFieldData.y}
                    onChange={(e) => updateField(selectedFieldData.id, { y: parseInt(e.target.value) })}
                    disabled={selectedFieldData.locked}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    value={selectedFieldData.width}
                    onChange={(e) => updateField(selectedFieldData.id, { width: parseInt(e.target.value) })}
                    disabled={selectedFieldData.locked}
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={selectedFieldData.height}
                    onChange={(e) => updateField(selectedFieldData.id, { height: parseInt(e.target.value) })}
                    disabled={selectedFieldData.locked}
                  />
                </div>
              </div>

              <div>
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={selectedFieldData.fontSize}
                  onChange={(e) => updateField(selectedFieldData.id, { fontSize: parseInt(e.target.value) })}
                  disabled={selectedFieldData.locked}
                />
              </div>

              <div>
                <Label>Font Family</Label>
                <Select
                  value={selectedFieldData.fontFamily}
                  onValueChange={(value) => updateField(selectedFieldData.id, { fontFamily: value })}
                  disabled={selectedFieldData.locked}
                >
                  <SelectTrigger>
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
                <Label>Font Weight</Label>
                <Select
                  value={selectedFieldData.fontWeight}
                  onValueChange={(value) => updateField(selectedFieldData.id, { fontWeight: value })}
                  disabled={selectedFieldData.locked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={selectedFieldData.color}
                  onChange={(e) => updateField(selectedFieldData.id, { color: e.target.value })}
                  disabled={selectedFieldData.locked}
                />
              </div>

              {selectedFieldData.locked && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700">
                    This field is locked and managed by the system.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Select a field to edit its properties
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};