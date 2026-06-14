import React from 'react';
import { InfoPageLayout } from '@/components/InfoPageLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, User } from "lucide-react";

const blogPosts = [
  {
    title: "Why Academic Fraud Is Getting Worse — And How Blockchain Stops It",
    category: "Insights",
    author: "Protocol Foundation",
    date: "May 15, 2026",
    readTime: "8 min read",
    desc: "A deep dive into the rising tide of credential fraud and why legacy verification methods are no longer sufficient."
  },
  {
    title: "Introducing the EduCreds Certificate Marketplace",
    category: "Announcements",
    author: "Design Team",
    date: "May 10, 2026",
    readTime: "5 min read",
    desc: "Discover professional templates and connect with top-tier credential designers in our new global ecosystem."
  },
  {
    title: "How AI Helps Institutions Verify Students Faster",
    category: "Technology",
    author: "ETA Labs",
    date: "May 05, 2026",
    readTime: "6 min read",
    desc: "Exploring the role of AI-driven analytics in automating institutional legitimacy and speeding up DAO governance."
  }
];

export default function BlogPage() {
  return (
    <InfoPageLayout 
      title="Ecosystem Blog" 
      subtitle="Insights, updates, and deep dives into the future of decentralized academic verification."
      badge="Network Intelligence"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {blogPosts.map((post, i) => (
          <Card key={i} className="border-none shadow-xl shadow-neutral-200/50 bg-neutral-50/50 rounded-[32px] overflow-hidden group hover:bg-white hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-10 space-y-6">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-600 text-white border-none text-[9px] font-black uppercase px-3 py-1">
                  {post.category}
                </Badge>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold uppercase">
                  <Clock className="size-3" /> {post.readTime}
                </div>
              </div>
              <h3 className="text-2xl font-black text-neutral-900 leading-tight group-hover:text-blue-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-neutral-500 font-medium leading-relaxed">
                {post.desc}
              </p>
              <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-neutral-200 flex items-center justify-center">
                    <User className="size-3 text-neutral-500" />
                  </div>
                  <span className="text-xs font-bold text-neutral-600">{post.author}</span>
                </div>
                <Button variant="ghost" className="p-0 h-auto font-black text-[10px] uppercase tracking-widest text-blue-600 hover:no-underline group-hover:translate-x-1 transition-transform">
                  Read Article <ArrowRight className="size-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </InfoPageLayout>
  );
}
