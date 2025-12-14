import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUpload: (files: File[], types: string[], descriptions: string[]) => void;
  isUploading?: boolean;
  acceptedFileTypes?: string;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

interface FileWithMetadata {
  file: File;
  type: string;
  description: string;
  id: string;
}

const documentTypes = [
  { value: "Registration Certificate", label: "Registration Certificate" },
  { value: "Accreditation Certificate", label: "Accreditation Certificate" },
  { value: "Identity Verification", label: "Identity Verification" },
  { value: "Tax Documents", label: "Tax Documents" },
  { value: "Other", label: "Other" },
];

export default function FileUpload({
  onUpload,
  isUploading = false,
  acceptedFileTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithMetadata[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Maximum size is ${(maxFileSize / 1024 / 1024).toFixed(1)}MB.`;
    }

    // Check file type
    const allowedExtensions = acceptedFileTypes.split(',').map(ext => ext.trim().toLowerCase());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return `File "${file.name}" has an unsupported format. Allowed types: ${acceptedFileTypes}`;
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList) => {
    const newFiles: FileWithMetadata[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Check if we've reached the max files limit
      if (selectedFiles.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum of ${maxFiles} files allowed.`);
        return;
      }

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        return;
      }

      // Check for duplicates
      const isDuplicate = selectedFiles.some(f => f.file.name === file.name && f.file.size === file.size) ||
                         newFiles.some(f => f.file.name === file.name && f.file.size === file.size);
      
      if (isDuplicate) {
        errors.push(`File "${file.name}" is already selected.`);
        return;
      }

      newFiles.push({
        file,
        type: documentTypes[0].value,
        description: "",
        id: Math.random().toString(36).substr(2, 9),
      });
    });

    if (errors.length > 0) {
      toast({
        title: "File validation errors",
        description: errors.join(" "),
        variant: "destructive",
      });
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, [selectedFiles, maxFiles, maxFileSize, acceptedFileTypes, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event triggered', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      console.log('Files selected:', e.target.files.length);
      handleFiles(e.target.files);
      // Reset input value to allow uploading the same file again
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileMetadata = (id: string, field: 'type' | 'description', value: string) => {
    setSelectedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    const files = selectedFiles.map(f => f.file);
    const types = selectedFiles.map(f => f.type);
    const descriptions = selectedFiles.map(f => f.description);

    onUpload(files, types, descriptions);
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-neutral-300 hover:border-primary"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Upload verification documents</h3>
        <p className="text-neutral-500 mb-4">
          Drag and drop files here, or click to browse
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          onChange={handleInputChange}
          className="hidden"
          id="file-upload-input"
          data-testid="file-upload-input"
        />
        <Button 
          type="button" 
          variant="outline"
          disabled={isUploading || selectedFiles.length >= maxFiles}
          data-testid="button-choose-files"
          className="relative z-10"
          onClick={() => {
            console.log('Choose Files button clicked');
            if (fileInputRef.current) {
              fileInputRef.current.click();
            } else {
              console.error('File input ref not found');
            }
          }}
        >
          Choose Files
        </Button>
        
        <p className="text-sm text-neutral-500 mt-2">
          Accepted formats: {acceptedFileTypes} (max {(maxFileSize / 1024 / 1024).toFixed(1)}MB each)
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-neutral-900">Selected Files ({selectedFiles.length})</h4>
          
          <div className="space-y-3">
            {selectedFiles.map((fileData) => (
              <Card key={fileData.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-neutral-100 rounded-lg flex-shrink-0">
                      <FileText className="w-6 h-6 text-neutral-600" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-neutral-900" data-testid={`file-name-${fileData.id}`}>
                            {fileData.file.name}
                          </h5>
                          <p className="text-sm text-neutral-500">
                            {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileData.id)}
                          disabled={isUploading}
                          data-testid={`remove-file-${fileData.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">Document Type</Label>
                          <Select
                            value={fileData.type}
                            onValueChange={(value) => updateFileMetadata(fileData.id, 'type', value)}
                            disabled={isUploading}
                          >
                            <SelectTrigger data-testid={`select-type-${fileData.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {documentTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Description (Optional)</Label>
                          <Input
                            placeholder="Additional details..."
                            value={fileData.description}
                            onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                            disabled={isUploading}
                            data-testid={`input-description-${fileData.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please ensure all documents are clear, legible, and contain all necessary information. 
              Processing may take 3-5 business days after submission.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full"
            data-testid="button-upload-documents"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Document${selectedFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}
