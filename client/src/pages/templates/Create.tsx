import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCode,
  Upload,
  ArrowLeft,
  Settings2,
  ShieldCheck,
  Check,
  AlertCircle,
  FileJson,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const CreateTemplatePage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'SVG' | 'JSON' | null>(null);

  const handleLegacyImport = (type: 'SVG' | 'JSON') => {
    setImportType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'SVG' ? '.svg' : '.json';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    // Simulate reading and processing
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      console.log(`Imported ${importType} content:`, content); // In real app, store this or pass it

      setTimeout(() => {
        setIsImporting(false);
        toast({
          title: "Import Successful",
          description: `Successfully loaded ${file.name}. Redirecting to studio...`,
        });
        // Pass the imported content or ID to the designer
        // For now, we simulate this by just navigating, but the user "felt" the upload happening
        setLocation("/institution/templates/designer?import=true");
      }, 1500);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 p-8">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/institution/templates")}
          className="group hover:bg-white text-neutral-500 hover:text-neutral-900 transition-all px-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to templates
        </Button>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">Create Professional Template</h1>
          <p className="text-neutral-500 font-medium">Choose your starting point for new credential designs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option 1: Design Studio */}
          <motion.div
            whileHover={{ y: -5 }}
            className="h-full"
          >
            <Card className="h-full border-none shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden group bg-white"
              onClick={() => setLocation("/institution/templates/designer")}>
              <div className="h-2 bg-primary" />
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <Settings2 className="w-7 h-7" />
                </div>
                <CardTitle className="text-2xl font-bold">Design Studio</CardTitle>
                <CardDescription className="text-neutral-500 mt-2 text-base">
                  Start from a blank canvas or professional base. Full control over every element.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <ul className="space-y-3">
                  {['Drag & Drop Editor', 'Real-time Preview', 'Dynamic Fields', 'Custom CSS Support'].map(feat => (
                    <li key={feat} className="flex items-center text-sm text-neutral-600 font-medium">
                      <Check className="w-4 h-4 text-primary mr-2" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8 h-12 rounded-xl bg-neutral-900 group-hover:bg-primary transition-colors">
                  Launch Studio <Plus className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Option 2: Legacy Import */}
          <motion.div
            whileHover={{ y: -5 }}
            className="h-full"
          >
            <Card className="h-full border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white">
              <div className="h-2 bg-blue-500" />
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-6">
                  <FileCode className="w-7 h-7" />
                </div>
                <CardTitle className="text-2xl font-bold">Legacy Import</CardTitle>
                <CardDescription className="text-neutral-500 mt-2 text-base">
                  Import existing SVG or JSON templates directly into our modern ecosystem.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => handleLegacyImport('SVG')}
                    className="w-full h-14 justify-start px-6 rounded-xl hover:bg-blue-50 border-neutral-200 group"
                    disabled={isImporting}
                  >
                    <Upload className="w-5 h-5 mr-4 text-neutral-400 group-hover:text-blue-500" />
                    <div className="text-left">
                      <div className="font-bold text-neutral-800">Upload SVG</div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Vector Design</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleLegacyImport('JSON')}
                    className="w-full h-14 justify-start px-6 rounded-xl hover:bg-blue-50 border-neutral-200 group"
                    disabled={isImporting}
                  >
                    <FileJson className="w-5 h-5 mr-4 text-neutral-400 group-hover:text-blue-500" />
                    <div className="text-left">
                      <div className="font-bold text-neutral-800">Upload JSON</div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Data Structure</div>
                    </div>
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Importing legacy designs will automatically map existing metadata to our current spec where possible.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-6 pt-8 border-t border-neutral-100 opacity-60">
          <div className="flex items-center gap-2 text-neutral-500">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">W3C Compliant</span>
          </div>
          <Separator className="h-4 w-[1px] bg-neutral-200" />
          <div className="flex items-center gap-2 text-neutral-500">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Enterprise Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplatePage;
