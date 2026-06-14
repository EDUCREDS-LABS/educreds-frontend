import React from 'react';
import { InfoPageLayout } from '@/components/InfoPageLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Briefcase } from "lucide-react";

const jobs = [
  {
    title: "Blockchain Protocol Engineer",
    type: "Full-time",
    location: "Remote",
    dept: "Engineering",
    desc: "Help build the core smart contracts and decentralized registry for global academic trust."
  },
  {
    title: "AI Trust Agent Architect",
    type: "Full-time",
    location: "Hybrid (Remote/Uganda)",
    dept: "Data Science",
    desc: "Design and implement the next generation of ETA (EduCreds Trust Agent) risk analysis models."
  },
  {
    title: "Institutional Partnerships Lead",
    type: "Full-time",
    location: "Remote (EMEA)",
    dept: "Growth",
    desc: "Onboard universities and government agencies to the EduCreds decentralized network."
  }
];

export default function CareersPage() {
  return (
    <InfoPageLayout 
      title="Careers" 
      subtitle="Join the team establishing the global standard for decentralized academic verification."
      badge="Join the Mission"
    >
      <div className="space-y-12">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-lg text-neutral-600 font-medium">
            We are looking for visionary thinkers, protocol engineers, and academic dreamers to help us eliminate credential fraud and return academic ownership to learners.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">Open Positions</h2>
          <div className="grid gap-6">
            {jobs.map((job, i) => (
              <Card key={i} className="border-none shadow-lg shadow-neutral-200/40 bg-neutral-50/50 rounded-3xl overflow-hidden hover:bg-white transition-all duration-300">
                <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-neutral-900">{job.title}</h3>
                      <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase px-2 h-5">
                        {job.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5"><MapPin className="size-3" /> {job.location}</div>
                      <div className="flex items-center gap-1.5"><Briefcase className="size-3" /> {job.dept}</div>
                    </div>
                    <p className="text-neutral-500 font-medium text-sm mt-2 max-w-xl">{job.desc}</p>
                  </div>
                  <Button className="rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest bg-neutral-900 text-white hover:bg-neutral-800">
                    Apply Now <ArrowRight className="size-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
}
