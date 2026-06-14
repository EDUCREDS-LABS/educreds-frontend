import React from 'react';
import { InfoPageLayout } from '@/components/InfoPageLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";

export default function PressKitPage() {
  return (
    <InfoPageLayout 
      title="Press Kit" 
      subtitle="Official resources, brand assets, and protocol background for media and institutional use."
      badge="Media Center"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Card className="border-none shadow-xl shadow-neutral-200/40 bg-neutral-50/50 rounded-[32px] overflow-hidden">
          <CardContent className="p-10 space-y-6">
            <div className="size-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
              <ImageIcon className="size-6" />
            </div>
            <h3 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Brand Assets</h3>
            <p className="text-neutral-500 font-medium leading-relaxed">
              Official logos, institutional badge templates, and protocol icons in multiple formats (PNG, SVG, AI).
            </p>
            <Button className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest bg-neutral-900 text-white hover:bg-neutral-800">
              Download Logos (.zip) <Download className="size-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-neutral-200/40 bg-neutral-50/50 rounded-[32px] overflow-hidden">
          <CardContent className="p-10 space-y-6">
            <div className="size-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="size-6" />
            </div>
            <h3 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Executive Summary</h3>
            <p className="text-neutral-500 font-medium leading-relaxed">
              Technical whitepapers, protocol architecture summaries, and the official mission statement.
            </p>
            <Button variant="outline" className="w-full h-12 rounded-xl border-neutral-200 font-black text-xs uppercase tracking-widest hover:bg-white">
              Download Media Deck <Download className="size-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-xl shadow-neutral-200/40 bg-neutral-900 rounded-[32px] overflow-hidden text-white">
          <CardContent className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tight text-blue-400">Looking for an Interview?</h3>
              <p className="text-neutral-400 font-medium max-w-xl">
                Our protocol architects and founders are available for insights into the future of decentralized education and blockchain infrastructure.
              </p>
            </div>
            <Button className="rounded-xl h-14 px-10 font-black text-xs uppercase tracking-widest bg-white text-black hover:bg-neutral-200">
              Contact Press Team <ExternalLink className="size-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </InfoPageLayout>
  );
}
