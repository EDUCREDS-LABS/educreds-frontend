import React from 'react';
import { InfoPageLayout } from '@/components/InfoPageLayout';
import { Button } from "@/components/ui/button";
import { ExternalLink, Terminal, Code2, ShieldCheck, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ApiReferencePage() {
  return (
    <InfoPageLayout 
      title="API Reference" 
      subtitle="Comprehensive technical documentation for the EduCreds Protocol REST and GraphQL interfaces."
      badge="Developer Access"
    >
      <div className="space-y-16">
        <section className="space-y-8">
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">Endpoints Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Issuance API", icon: Terminal, desc: "REST endpoints for automated certificate generation and batch anchoring." },
              { title: "Verification API", icon: ShieldCheck, desc: "Public endpoints for instant multi-chain credential validation." },
              { title: "Identity API", icon: Database, desc: "Manage institutional DIDs and learner identity associations." },
              { title: "Governance API", icon: Code2, desc: "Interface with DAO proposals, PoIC voting, and protocol metrics." }
            ].map((item, i) => (
              <Card key={i} className="border-none shadow-md bg-neutral-50/50 rounded-2xl overflow-hidden hover:bg-white transition-all">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <item.icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-neutral-900">{item.title}</h3>
                    <p className="text-xs text-neutral-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="p-12 rounded-[40px] bg-neutral-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <Terminal className="size-64 rotate-12" />
          </div>
          <div className="max-w-2xl relative z-10 space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Interactive <span className="text-cyan-400">Documentation</span></h2>
            <p className="text-neutral-400 font-medium leading-relaxed">
              Access our Swagger UI and full technical specifications on our documentation portal. 
              Initialize your institutional node integration with our ready-to-use SDKs.
            </p>
            <a href="https://docs.educreds.xyz" target="_blank" rel="noopener noreferrer" className="inline-block">
              <Button className="h-14 px-10 rounded-xl bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-widest shadow-2xl">
                Open Documentation <ExternalLink className="ml-3 size-4" />
              </Button>
            </a>
          </div>
        </section>
      </div>
    </InfoPageLayout>
  );
}
