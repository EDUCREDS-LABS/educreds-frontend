import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Layout as LayoutIcon,
  History,
  Star,
  ArrowRight,
  Sparkles,
  FileCode,
  Palette
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from 'wouter';

const TemplatesPage = () => {
  const [, setLocation] = useLocation();

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'academic', name: 'Academic' },
    { id: 'professional', name: 'Professional' },
    { id: 'creative', name: 'Creative' },
    { id: 'minimal', name: 'Minimalist' },
  ];

  const quickActions = [
    {
      title: "Design Studio",
      description: "Create a masterpiece from scratch",
      icon: Palette,
      gradient: "from-indigo-500 to-purple-600",
      link: "/institution/templates/designer"
    },
    {
      title: "Smart Templates",
      description: "Browse AI-optimized designs",
      icon: Sparkles,
      gradient: "from-amber-400 to-orange-500",
      link: "/institution/templates/smart-ai"
    },
    {
      title: "Legacy Import",
      description: "Import existing SVG or JSON",
      icon: FileCode,
      gradient: "from-blue-500 to-cyan-500",
      link: "/institution/templates/create"
    }
  ];

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto min-h-screen bg-neutral-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">Template Management</h1>
          <p className="text-neutral-500 mt-2 font-medium">Design, organize, and manage your institutional credentials</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setLocation("/institution/templates/designer")}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="group cursor-pointer border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative"
              onClick={() => setLocation(action.link)}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.gradient} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.08] transition-opacity`} />
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800">{action.title}</h3>
                <p className="text-neutral-500 text-sm mt-1">{action.description}</p>
                <div className="mt-6 flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                  Open Studio <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Categories</h4>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${cat.id === 'all'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
            <h4 className="text-lg font-bold mb-2 relative z-10">Premium Assets</h4>
            <p className="text-white/80 text-xs mb-4 relative z-10 leading-relaxed">Unlock high-security patterns and guilloche designs for your certificates.</p>
            <Button variant="secondary" size="sm" className="w-full bg-white text-indigo-700 hover:bg-white/90 font-bold relative z-10">
              Go Pro
            </Button>
          </div>
        </div>

        {/* Template Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-neutral-100">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                className="border-none bg-transparent focus-visible:ring-0 pl-10 h-10 placeholder:text-neutral-400 text-sm"
                placeholder="Search templates, designs, or keywords..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-neutral-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-primary/30 hover:bg-primary/[0.02] transition-all group">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <Plus className="w-8 h-8 text-neutral-400 group-hover:text-primary transition-colors" />
              </div>
              <h4 className="font-bold text-neutral-700">Empty Workspace</h4>
              <p className="text-sm text-neutral-500 mt-2">No custom templates found.<br />Start by creating your first design.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6 rounded-full px-6"
                onClick={() => setLocation("/institution/templates/designer")}
              >
                Launch Designer
              </Button>
            </div>

            {/* Mock Template Card */}
            <Card className="rounded-3xl overflow-hidden border-none shadow-sm group">
              <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                  <LayoutIcon className="w-12 h-12" />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setLocation("/institution/templates/designer")}>
                    Edit Design
                  </Button>
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-neutral-800">Classic Academic</h4>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-bold text-blue-600 uppercase">SVG Base</span>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase">9 Fields</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
