import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertCircle,
  X,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedTemplate } from '@/store/editorStore';
import { API_CONFIG } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';

interface Recipient {
  name: string;
  email: string;
  walletAddress: string;
  placeholders: Record<string, string>;
}

interface BulkIssuanceFormProps {
  selectedTemplate: EnhancedTemplate | null;
  onTemplateSelect: () => void;
  onIssuanceComplete: (results: any) => void;
}

export function BulkIssuanceForm({ 
  selectedTemplate, 
  onTemplateSelect, 
  onIssuanceComplete 
}: BulkIssuanceFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState<string | null>(null);
  const [results, setResults] = useState<{
    completed: number;
    failed: number;
    total: number;
    errors: string[];
  } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      parseCSV(csv);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Expected headers: name, email, walletAddress, and template placeholders
    const requiredHeaders = ['name', 'email', 'walletAddress'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      toast({
        title: 'Invalid CSV Format',
        description: `Missing required columns: ${missingHeaders.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    const parsedRecipients: Recipient[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length < 3) continue;
      
      const recipient: Recipient = {
        name: values[headers.indexOf('name')] || '',
        email: values[headers.indexOf('email')] || '',
        walletAddress: values[headers.indexOf('walletAddress')] || '',
        placeholders: {}
      };
      
      // Parse template placeholders
      if (selectedTemplate?.placeholders) {
        selectedTemplate.placeholders.forEach(placeholder => {
          const headerIndex = headers.indexOf(placeholder.key);
          if (headerIndex !== -1 && values[headerIndex]) {
            recipient.placeholders[placeholder.key] = values[headerIndex];
          }
        });
      }
      
      parsedRecipients.push(recipient);
    }
    
    setRecipients(parsedRecipients);
    toast({
      title: 'CSV Imported',
      description: `${parsedRecipients.length} recipients imported successfully`,
    });
  };

  const addRecipient = () => {
    setRecipients([...recipients, {
      name: '',
      email: '',
      walletAddress: '',
      placeholders: {}
    }]);
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    const updated = [...recipients];
    if (field === 'placeholders') {
      // Handle placeholder updates
      return;
    }
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const updatePlaceholder = (index: number, key: string, value: string) => {
    const updated = [...recipients];
    updated[index].placeholders[key] = value;
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const downloadTemplate = () => {
    if (!selectedTemplate) return;
    
    const headers = ['name', 'email', 'walletAddress'];
    if (selectedTemplate.placeholders) {
      headers.push(...selectedTemplate.placeholders.map(p => p.key));
    }
    
    const csvContent = [
      headers.join(','),
      // Add example row
      ['John Doe', 'john@example.com', '0x1234...', ...selectedTemplate.placeholders.map(() => 'Example Value')].join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.name}-template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateRecipients = (): string[] => {
    const errors: string[] = [];
    
    if (recipients.length === 0) {
      errors.push('No recipients added');
      return errors;
    }
    
    recipients.forEach((recipient, index) => {
      if (!recipient.name.trim()) {
        errors.push(`Row ${index + 1}: Name is required`);
      }
      if (!recipient.email.trim()) {
        errors.push(`Row ${index + 1}: Email is required`);
      } else if (!/\S+@\S+\.\S+/.test(recipient.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`);
      }
      if (!recipient.walletAddress.trim()) {
        errors.push(`Row ${index + 1}: Wallet address is required`);
      }
      
      // Validate required placeholders
      if (selectedTemplate?.placeholders) {
        selectedTemplate.placeholders.forEach(placeholder => {
          if (!recipient.placeholders[placeholder.key]) {
            errors.push(`Row ${index + 1}: ${placeholder.label} is required`);
          }
        });
      }
    });
    
    return errors;
  };

  const startBulkIssuance = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'No Template Selected',
        description: 'Please select a template first',
        variant: 'destructive',
      });
      return;
    }
    
    const errors = validateRecipients();
    if (errors.length > 0) {
      toast({
        title: 'Validation Errors',
        description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setProgress(0);
      setResults(null);

      const authHeaders = getAuthHeaders();
      const entries = recipients.map((recipient) => ({
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        recipientWalletAddress: recipient.walletAddress,
        templateId: selectedTemplate.id,
        placeholders: recipient.placeholders,
      }));

      const response = await fetch(`${API_CONFIG.CERT}/issuance/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(entries),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCurrentJob(data.jobId);
        pollJobStatus(data.jobId);
        toast({
          title: 'Bulk Issuance Started',
          description: `Processing ${recipients.length} certificates`,
        });
      } else {
        throw new Error(data.message || 'Failed to start bulk issuance');
      }
    } catch (error) {
      console.error('Error starting bulk issuance:', error);
      toast({
        title: 'Error',
        description: 'Failed to start bulk issuance',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`${API_CONFIG.CERT}/issuance/jobs/${jobId}`);
        const data = await response.json();
        
        if (response.ok) {
          const progressValue = typeof data.progress === 'number' ? data.progress : 0;
          setProgress(progressValue);

          if (data.state === 'completed') {
            const resultsArray = Array.isArray(data.result) ? data.result : [];
            const completed = resultsArray.filter((r: any) => r?.success).length;
            const failed = resultsArray.filter((r: any) => !r?.success).length;
            const errors = resultsArray
              .filter((r: any) => !r?.success)
              .map((r: any) => r?.error)
              .filter(Boolean);

            setResults({
              completed,
              failed,
              total: resultsArray.length,
              errors,
            });
            setIsProcessing(false);
            setCurrentJob(null);
            onIssuanceComplete(data);
            toast({
              title: 'Bulk Issuance Complete',
              description: `${completed} certificates issued successfully`,
            });
          } else if (data.state === 'failed') {
            setIsProcessing(false);
            setCurrentJob(null);
            toast({
              title: 'Bulk Issuance Failed',
              description: 'An error occurred during processing',
              variant: 'destructive',
            });
          } else {
            // Continue polling
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setIsProcessing(false);
        setCurrentJob(null);
      }
    };
    
    poll();
  };

  const cancelIssuance = async () => {
    if (currentJob) {
      try {
        setIsProcessing(false);
        setCurrentJob(null);
        setProgress(0);
        toast({
          title: 'Issuance Cancelled',
          description: 'Bulk issuance has been cancelled locally',
        });
      } catch (error) {
        console.error('Error cancelling issuance:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Template Selection</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTemplate ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                  {selectedTemplate.previewImages?.thumbnail ? (
                    <img
                      src={selectedTemplate.previewImages.thumbnail}
                      alt={selectedTemplate.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedTemplate.placeholders?.length || 0} required fields
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={onTemplateSelect}>
                Change Template
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
              <p className="text-gray-600 mb-4">Select a template to start bulk issuance</p>
              <Button onClick={onTemplateSelect}>
                Select Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipients Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recipients ({recipients.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedTemplate}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                disabled={!selectedTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addRecipient}
                disabled={!selectedTemplate}
              >
                <Users className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {recipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>No recipients added yet</p>
              <p className="text-sm">Import a CSV file or add recipients manually</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recipients.map((recipient, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Recipient {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`name-${index}`}>Name *</Label>
                      <Input
                        id={`name-${index}`}
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`email-${index}`}>Email *</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`wallet-${index}`}>Wallet Address *</Label>
                      <Input
                        id={`wallet-${index}`}
                        value={recipient.walletAddress}
                        onChange={(e) => updateRecipient(index, 'walletAddress', e.target.value)}
                        placeholder="0x1234..."
                      />
                    </div>
                  </div>
                  
                  {selectedTemplate?.placeholders && selectedTemplate.placeholders.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Template Fields</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {selectedTemplate.placeholders.map((placeholder) => (
                          <div key={placeholder.key}>
                            <Label htmlFor={`${placeholder.key}-${index}`} className="text-sm">
                              {placeholder.label} *
                            </Label>
                            <Input
                              id={`${placeholder.key}-${index}`}
                              value={recipient.placeholders[placeholder.key] || ''}
                              onChange={(e) => updatePlaceholder(index, placeholder.key, e.target.value)}
                              placeholder={`Enter ${placeholder.label.toLowerCase()}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Certificates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Issuing certificates to {recipients.length} recipients...
              </p>
              <Button variant="outline" size="sm" onClick={cancelIssuance}>
                <Pause className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Issuance Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{results.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            
            {results.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Errors encountered:</p>
                    {results.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))}
                    {results.errors.length > 5 && (
                      <p className="text-sm">... and {results.errors.length - 5} more</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-center">
              <Button onClick={() => {
                setResults(null);
                setRecipients([]);
                setProgress(0);
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Start New Issuance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isProcessing && !results && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={startBulkIssuance}
            disabled={!selectedTemplate || recipients.length === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Bulk Issuance ({recipients.length} recipients)
          </Button>
        </div>
      )}
    </div>
  );
}
