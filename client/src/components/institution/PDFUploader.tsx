import { UseFormReturn } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  FileUp,
  Loader2,
  CheckCircle,
  Upload,
  Wallet,
  Calendar,
  X,
  FileText,
} from 'lucide-react';

interface PDFUploaderProps {
  form: UseFormReturn<any>;
  onSubmit: () => void;
  isLoading: boolean;
  isLimitExceeded: boolean;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
}

export function PDFUploader({
  form,
  onSubmit,
  isLoading,
  isLimitExceeded,
  uploadProgress,
  setUploadProgress,
}: PDFUploaderProps) {
  const pdfFile = form.watch('pdfFile');

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle>PDF Certificate Upload</CardTitle>
        <CardDescription>
          Upload your pre-designed PDF certificate and add recipient details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <FileUp className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Upload a completed PDF certificate. Recipient information will be
            embedded as metadata and the certificate will be anchored on the
            blockchain for verification.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-8">
            {/* PDF Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                  1
                </span>
                Upload Certificate PDF
              </h3>

              <FormField
                control={form.control}
                name="pdfFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">PDF File</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              field.onChange(file);
                              setUploadProgress(0);
                            }
                          }}
                          className="hidden"
                          id="pdf-upload-input"
                        />
                        <label
                          htmlFor="pdf-upload-input"
                          className="flex flex-col items-center justify-center w-full px-6 py-12 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          {!pdfFile ? (
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <Upload className="w-8 h-8 text-neutral-400 group-hover:text-primary transition-colors" />
                              </div>
                              <p className="text-base font-medium text-neutral-900 mb-1">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-sm text-neutral-600">
                                PDF files only, maximum 10MB
                              </p>
                            </div>
                          ) : (
                            <div className="w-full">
                              <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <FileText className="w-8 h-8 text-green-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-green-900 truncate">
                                    {pdfFile.name}
                                  </p>
                                  <p className="text-xs text-green-700 mt-0.5">
                                    {(pdfFile.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    field.onChange(null);
                                    setUploadProgress(0);
                                  }}
                                  className="flex-shrink-0 text-green-700 hover:text-green-900 hover:bg-green-100"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs mt-2">
                      Supported format: PDF • Max size: 10MB • Ensure all content is
                      visible and properly formatted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Recipient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                  2
                </span>
                Recipient Information
              </h3>

              <FormField
                control={form.control}
                name="recipientWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Blockchain Address *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          {...field}
                          placeholder="0x..."
                          className="pl-10 h-11 font-mono text-sm"
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Ethereum address for certificate issuance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Recipient Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John Doe"
                        className="h-11"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      As it appears on the certificate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="completionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Completion Date *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <Input
                            {...field}
                            type="date"
                            className="pl-10 h-11"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Certificate Type *
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Course Completion">
                            Course Completion
                          </SelectItem>
                          <SelectItem value="Degree">Degree</SelectItem>
                          <SelectItem value="Diploma">Diploma</SelectItem>
                          <SelectItem value="Certification">
                            Certification
                          </SelectItem>
                          <SelectItem value="Achievement">Achievement</SelectItem>
                          <SelectItem value="Participation">
                            Participation
                          </SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Workshop">Workshop</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Optional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                3. Additional Details (Optional)
              </h3>

              <FormField
                control={form.control}
                name="courseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Course Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Advanced Web Development"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Grade / Score
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="A, 4.0 GPA, 95%, Distinction"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Description / Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional information about the certificate..."
                        className="min-h-[100px] resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional details or special notes about this certificate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-900">
                    Uploading certificate...
                  </span>
                  <span className="text-neutral-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={isLoading || isLimitExceeded || !pdfFile}
                className="flex-1 h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Issuing Certificate...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Issue Certificate
                  </>
                )}
              </Button>
              <Button
                type="reset"
                variant="outline"
                className="h-12 px-8"
                onClick={() => {
                  form.reset();
                  setUploadProgress(0);
                }}
              >
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
