import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Trash2,
  Edit3,
  MoreVertical,
  Calendar,
  Layers,
  Search,
  Plus
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from 'wouter';
import { useEditorStore } from '@/store/editorStore';
import { deleteTemplate } from '@/lib/templates-api';
import { useToast } from '@/hooks/use-toast';

const MyTemplatesPage = () => {
  const { templates, loadTemplates } = useEditorStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(id);
        loadTemplates();
        toast({
          title: "Template deleted",
          description: "The template has been removed successfully.",
        });
      } catch (error) {
        console.error('Error deleting template:', error);
        toast({
          title: "Error",
          description: "Failed to delete template.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">Institutional Library</h1>
            <p className="text-neutral-500 mt-2 text-lg">Manage and deploy your custom credential designs</p>
          </div>
          <Button
            onClick={() => setLocation("/template-designer")}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors" />
            <Input
              className="h-12 pl-12 rounded-xl border-neutral-200 bg-white shadow-sm focus-visible:ring-primary/20"
              placeholder="Search your library..."
            />
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-900">{templates.length}</span>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Saved</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-2">
              <span className="text-sm font-bold text-green-600">Active</span>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</span>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-neutral-200 p-24 text-center">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-neutral-300" />
            </div>
            <h3 className="text-xl font-bold text-neutral-800">Library is Empty</h3>
            <p className="text-neutral-500 mt-2 max-w-sm mx-auto">
              You haven't saved any custom templates yet. Start from scratch or use a library foundation.
            </p>
            <div className="flex justify-center gap-3 mt-8">
              <Button variant="outline" onClick={() => setLocation("/institution/templates/browse")} className="rounded-xl">
                Browse Marketplace
              </Button>
              <Button onClick={() => setLocation("/template-designer")} className="rounded-xl">
                Open Studio
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl bg-white border border-neutral-100">
                  <div className="aspect-video bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                    <div className="opacity-20 absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />
                    <FileText className="w-16 h-16 text-white/10" />

                    <div className="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full"
                        onClick={() => setLocation(`/institution/templates/designer?templateId=${template.id}`)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" /> Edit
                      </Button>
                    </div>

                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id!);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary transition-colors">
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase border-none">
                            Version 1.0
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-neutral-300">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Jan 24, 2024</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <Layers className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">6 Layers</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTemplatesPage;
