import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Wand2,
    Zap,
    Search,
    ArrowRight,
    CheckCircle2,
    RefreshCcw,
    Layout,
    Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

const SmartAIPage = () => {
    const [, setLocation] = useLocation();
    const [isGenerating, setIsGenerating] = useState(false);

    const aiFeatures = [
        {
            title: "Instant Generation",
            description: "Describe your needs and let AI craft a complete template specification.",
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-50"
        },
        {
            title: "Design Optimization",
            description: "Analyze and improve your current templates for better security and aesthetics.",
            icon: Cpu,
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "Smart Placeholders",
            description: "Automatically detect and map dynamic fields from your institution's data.",
            icon: Layout,
            color: "text-blue-500",
            bg: "bg-blue-50"
        }
    ];

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            // In a real app, this would route to designer with AI context
            setLocation("/institution/templates/designer");
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-neutral-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest shadow-sm">
                        <Sparkles className="w-4 h-4" />
                        Empowered by EduCreds AI
                    </div>
                    <h1 className="text-5xl font-extrabold text-neutral-900 tracking-tight">
                        Design at the Speed of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Thought</span>
                    </h1>
                    <p className="text-neutral-500 text-lg max-w-2xl mx-auto font-medium">
                        Our Smart AI engine helps you create high-security, professional certificates in seconds. No design skills required.
                    </p>
                </div>

                {/* AI Action Card */}
                <Card className="border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-12 space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-neutral-900">What are we creating today?</h2>
                                    <p className="text-neutral-500">Provide a few keywords about your certificate's purpose.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            className="h-16 pl-12 rounded-2xl border-neutral-100 bg-neutral-50 text-lg focus-visible:ring-primary/20 shadow-inner"
                                            placeholder="e.g. Master's Degree in Quantum Ethics..."
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Modern Academic', 'Executive Pro', 'Minimalist', 'High Security'].map(tag => (
                                            <Badge key={tag} variant="secondary" className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 cursor-pointer transition-colors text-neutral-600 font-semibold border-none">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCcw className="w-6 h-6 mr-3 animate-spin" />
                                            Our AI is designing...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-6 h-6 mr-3" />
                                            Generate Custom Design
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="bg-gradient-to-br from-primary to-indigo-700 p-12 text-white flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-700" />
                                <div className="relative z-10 space-y-6">
                                    {aiFeatures.map((feature, idx) => (
                                        <motion.div
                                            key={feature.title}
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group/item"
                                        >
                                            <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center shadow-lg transform group-hover/item:rotate-12 transition-transform`}>
                                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg">{feature.title}</h4>
                                                <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Recommendations */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-neutral-800">Trending AI Layouts</h3>
                        <Button variant="ghost" className="text-primary font-bold hover:text-primary/80">
                            View All <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="group cursor-pointer rounded-3xl border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden bg-white">
                                <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center relative">
                                    <Layout className="w-12 h-12 text-neutral-300" />
                                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" className="font-bold rounded-full">Apply Layout</Button>
                                    </div>
                                    <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur text-primary border-none font-bold">
                                        RELIABILITY SCORE: 98%
                                    </Badge>
                                </div>
                                <CardContent className="p-6">
                                    <h4 className="font-bold text-neutral-800 text-lg">Academic Excellence v{i}.0</h4>
                                    <p className="text-neutral-500 text-sm mt-1">Multi-layered SVG pattern with hidden watermark technology.</p>
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex items-center gap-1.5 text-green-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Optimized</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                            1.2s Render
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartAIPage;
