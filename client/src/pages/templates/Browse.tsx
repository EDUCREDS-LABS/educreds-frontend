import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Grid as GridIcon,
  List,
  Filter,
  ArrowUpRight,
  Star,
  Layers,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from 'wouter';
import { defaultTemplates } from '../../../../shared/templates/default-templates';

const BrowseTemplatesPage = () => {
  const [, setLocation] = useLocation();

  const handleUseTemplate = (id: string) => {
    setLocation(`/institution/templates/designer?templateId=${id}`);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">Template Marketplace</h1>
            <p className="text-neutral-500 mt-2 text-lg">Choose a professional foundation for your credentials</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <Button variant="ghost" size="icon" className="h-9 w-9 bg-white shadow-sm border border-neutral-200">
                <GridIcon className="w-4 h-4 text-neutral-900" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-500">
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" className="rounded-xl border-neutral-200">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors" />
          <Input
            className="h-14 pl-12 rounded-2xl border-neutral-200 bg-white shadow-sm text-lg focus-visible:ring-primary/20 transition-all"
            placeholder="Search by category, style, or industry..."
          />
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {defaultTemplates.map((template, index) => (
            <motion.div
              key={template.metadata.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-3xl bg-white">
                <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
                  {/* Visual representation of the template */}
                  <div
                    className="absolute inset-0 p-4 origin-top-left scale-[0.35] pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: template.design }}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                    <Button
                      className="bg-white text-neutral-900 hover:bg-neutral-100 font-bold px-8 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                      onClick={() => handleUseTemplate(template.metadata.id)}
                    >
                      Use Template
                    </Button>
                    <Button
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/10 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                    >
                      Full Preview
                    </Button>
                  </div>

                  <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur text-neutral-900 border-none px-3 py-1 font-bold">
                    {template.metadata.category.toUpperCase()}
                  </Badge>

                  {index === 0 && (
                    <div className="absolute top-4 right-4 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow-lg">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-800">{template.metadata.name}</h3>
                      <p className="text-neutral-500 text-sm mt-1 line-clamp-1">{template.metadata.description}</p>
                    </div>
                    <div className="flex items-center text-primary font-bold text-sm">
                      Free <ArrowUpRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <Layers className="w-4 h-4" />
                      <span className="text-xs font-semibold">{template.metadata.fields.length} Fields</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <Award className="w-4 h-4" />
                      <span className="text-xs font-semibold">SVG Optimized</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowseTemplatesPage;
