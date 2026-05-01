import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CanvasPreview, PreviewField } from './CanvasPreview';

/**
 * IssuancePreviewModal - Pre-issuance validation and preview
 * Features:
 * - Live certificate preview with actual form data
 * - Data binding validation (required fields check)
 * - Element overlap detection
 * - QR code verification
 * - Conditional logic rules evaluation
 * - Field mapping error display
 */

export interface IssuanceField {
  name: string;
  value: string;
  required: boolean;
  type: 'text' | 'date' | 'number' | 'qr' | 'signature';
}

export interface IssuanceValidationError {
  fieldName: string;
  type: 'missing' | 'overlap' | 'qr-invalid' | 'rule-failed';
  message: string;
}

interface IssuancePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => Promise<void>;
  templateName: string;
  fields: PreviewField[];
  formData: Record<string, string>;
  templateDimensions: { width: number; height: number };
  backgroundImage?: string | null;
  conditionalRules?: Array<{ condition: Record<string, any>; action: 'show' | 'hide'; targetFields: string[] }>;
}

export const IssuancePreviewModal: React.FC<IssuancePreviewModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  templateName,
  fields,
  formData,
  templateDimensions,
  backgroundImage,
  conditionalRules = [],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedError, setHighlightedError] = useState<string | null>(null);

  // Validate data binding
  const validationErrors = useMemo<IssuanceValidationError[]>(() => {
    const errors: IssuanceValidationError[] = [];

    // 1. Check required fields are populated
    fields.forEach(field => {
      if (field.customText !== undefined) return; // Skip static text fields

      const value = formData[field.name]?.trim();
      if (!value) {
        errors.push({
          fieldName: field.name,
          type: 'missing',
          message: `${field.name} is required but not provided`,
        });
      }
    });

    // 2. Detect overlapping elements
    const sortedFields = [...fields].sort((a, b) => a.x - b.x);
    for (let i = 0; i < sortedFields.length; i++) {
      for (let j = i + 1; j < sortedFields.length; j++) {
        const f1 = sortedFields[i];
        const f2 = sortedFields[j];
        
        const overlap =
          f1.x < f2.x + f2.width &&
          f1.x + f1.width > f2.x &&
          f1.y < f2.y + f2.height &&
          f1.y + f1.height > f2.y;

        if (overlap && f1.visible !== false && f2.visible !== false) {
          errors.push({
            fieldName: `${f1.name} & ${f2.name}`,
            type: 'overlap',
            message: `Elements "${f1.name}" and "${f2.name}" overlap on certificate`,
          });
        }
      }
    }

    // 3. Verify QR code fields
    const qrFields = fields.filter(f => f.type === 'qr');
    qrFields.forEach(qr => {
      if (!formData['certificateId']?.trim()) {
        errors.push({
          fieldName: 'qrCode',
          type: 'qr-invalid',
          message: 'QR code cannot be generated: certificateId is missing',
        });
      }
    });

    // 4. Evaluate conditional rules
    conditionalRules.forEach((rule, idx) => {
      // Simple json-logic-js style evaluation (basic implementation)
      try {
        const conditions = Object.entries(rule.condition);
        let ruleMatch = true;
        
        for (const [field, expectedValue] of conditions) {
          const actualValue = formData[field];
          if (actualValue !== expectedValue) {
            ruleMatch = false;
            break;
          }
        }

        if (ruleMatch && rule.action === 'show') {
          const hiddenFields = rule.targetFields.filter(
            fname => !formData[fname]?.trim()
          );
          if (hiddenFields.length > 0) {
            errors.push({
              fieldName: hiddenFields.join(', '),
              type: 'rule-failed',
              message: `Conditional rule #${idx + 1} requires fields: ${hiddenFields.join(', ')}`,
            });
          }
        }
      } catch (e) {
        console.error('Rule evaluation error:', e);
      }
    });

    return errors;
  }, [fields, formData, conditionalRules]);

  const hasErrors = validationErrors.length > 0;
  const previewFields: PreviewField[] = fields.map(f => ({
    ...f,
    color: formData[f.name]?.trim() ? f.color : '#ccc',
  }));

  const handleProceed = async () => {
    if (hasErrors) {
      setHighlightedError(validationErrors[0].fieldName);
      return;
    }

    setIsProcessing(true);
    try {
      await onProceed();
      onClose();
    } catch (err) {
      alert(`Issuance failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col gap-0 bg-[#0a0a0c] border-white/10">
        <DialogHeader className="border-b border-white/5 px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-slate-100">
            Review & Issue Certificate
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400 mt-1">
            Template: <span className="font-medium text-slate-300">{templateName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4 p-6">
          {/* Left: Preview */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <CanvasPreview
              fields={previewFields}
              width={templateDimensions.width}
              height={templateDimensions.height}
              backgroundImage={backgroundImage}
              sampleData={formData}
              title="Certificate Preview"
            />
          </div>

          {/* Right: Validation */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-2">Data Validation</h3>
              <Badge
                className={`${
                  hasErrors
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-green-500/20 text-green-400 border-green-500/30'
                } border`}
              >
                {hasErrors ? '❌ Validation Errors' : '✅ All Fields Valid'}
              </Badge>
            </div>

            <ScrollArea className="flex-1 rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <div className="space-y-3">
                {validationErrors.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                      All validations passed. Ready to issue!
                    </p>
                  </div>
                ) : (
                  <>
                    {validationErrors.map((error, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          highlightedError === error.fieldName
                            ? 'bg-indigo-500/10 border-indigo-500/50'
                            : error.type === 'missing'
                            ? 'bg-red-500/5 border-red-500/20'
                            : error.type === 'overlap'
                            ? 'bg-yellow-500/5 border-yellow-500/20'
                            : 'bg-orange-500/5 border-orange-500/20'
                        }`}
                        onClick={() => setHighlightedError(error.fieldName)}
                      >
                        <div className="flex items-start gap-2">
                          {error.type === 'missing' ? (
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          ) : error.type === 'overlap' ? (
                            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-100 truncate">
                              {error.fieldName}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {error.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Field Mapping Summary */}
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs font-medium text-slate-300 mb-2">Field Summary</p>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Total Fields:</span>
                  <span className="text-slate-200 font-medium">{fields.length}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Required:</span>
                  <span className="text-slate-200 font-medium">
                    {fields.filter(f => f.customText === undefined).length}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Populated:</span>
                  <span className="text-slate-200 font-medium">
                    {fields.filter(f => formData[f.name]?.trim()).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-white/5 px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="border-white/10 text-slate-300 hover:bg-white/5"
          >
            ← Edit Template
          </Button>
          <Button
            onClick={handleProceed}
            disabled={isProcessing}
            className={`${
              hasErrors
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
          >
            {isProcessing ? 'Processing...' : 'Proceed to Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
