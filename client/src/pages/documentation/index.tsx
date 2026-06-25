import React from 'react';
import { InfoPageLayout } from '@/components/InfoPageLayout';
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Code2, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DocumentationPage() {
  return (
    <InfoPageLayout 
      title="Documentation" 
      subtitle="Explore the technical specifications, integration guides, and protocol standards of the EduCreds network."
      badge="Technical Hub"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { title: "Getting Started", icon: Zap, desc: "Quick-start guide for institutional node deployment and API integration." },
          { title: "Protocol Standards", icon: ShieldCheck, desc: "Detailed breakdown of W3C Verifiable Credentials and DID implementation." },
          { title: "API Reference", icon: Code2, desc: "REST and GraphQL endpoint documentation for automated credential issuance." },
          { title: "Governance Guide", icon: BookOpen, desc: "Understanding PoIC scoring, DAO voting, and consensus mechanics." }
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-lg shadow-neutral-200/40 dark:shadow-black/20 bg-neutral-50/50 dark:bg-neutral-900 rounded-3xl overflow-hidden hover:bg-white dark:hover:bg-neutral-800 transition-all duration-300">
            <CardContent className="p-8 space-y-4">
              <div className="size-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <item.icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{item.title}</h3>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 p-12 rounded-[48px] bg-neutral-900 text-white text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <BookOpen className="size-64 rotate-12" />
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-black uppercase tracking-tight">Access Central Docs</h2>
          <p className="text-neutral-400 font-medium max-w-xl mx-auto">
            Our comprehensive developer and institutional documentation is hosted on our dedicated knowledge base.
          </p>
        </div>
        <a href="https://docs.educreds.xyz" target="_blank" rel="noopener noreferrer" className="inline-block relative z-10">
          <Button size="lg" className="h-16 px-12 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
            Go to Docs <ExternalLink className="ml-3 size-4" />
          </Button>
        </a>
      </div>
    </InfoPageLayout>
  );
}
