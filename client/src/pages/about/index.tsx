import React from 'react';
import { useLocation } from "wouter";
import ModernHeader from '../../components/modern/ModernHeader';
import ModernFooter from '../../components/modern/ModernFooter';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Globe, 
  Cpu, 
  Scale, 
  CheckCircle, 
  Zap, 
  Users, 
  Building2,
  Network,
  Lock,
  FileCheck,
  Search,
  Target,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/20">
      <ModernHeader onStudentPortalClick={() => setLocation("/student-portal")} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 bg-white/80 backdrop-blur text-blue-700 border-blue-200 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
              Verifiable Education Network
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-neutral-900 mb-6 leading-tight tracking-tight uppercase">
              Decentralized Trust for <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Academic Credentials
              </span>
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed font-medium">
              EduCreds is a protocol-level system where academic institutions, learners, employers, and governments can issue, verify, and govern credentials with cryptographic certainty.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 bg-white border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-neutral-900 mb-6">
                Why We Exist
              </h2>
              <div className="prose prose-lg text-neutral-500 font-medium leading-relaxed">
                <p className="mb-6">
                  We believe education credentials are one of the most critical forms of trust infrastructure in the digital world. Degrees, certificates, and academic records underpin employment, migration, funding, and social mobility—yet today they remain fragmented, opaque, and vulnerable to fraud.
                </p>
                <p>
                  EduCreds introduces a programmable, verifiable alternative powered by decentralized identity, onchain credentials, and AI-assisted governance. We target the multi-billion-dollar global education market to bring composable, interoperable credential infrastructure to the Internet’s trust layer.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Globe, label: "Global Reach", desc: "Cross-border systems.", color: "text-blue-600", bg: "bg-blue-50" },
                { icon: Network, label: "Interoperable", desc: "Composable trust.", color: "text-indigo-600", bg: "bg-indigo-50" },
                { icon: Shield, label: "Secure", desc: "Cryptographic certainty.", color: "text-purple-600", bg: "bg-purple-50" },
                { icon: Cpu, label: "AI-Assisted", desc: "Intelligent resolution.", color: "text-cyan-600", bg: "bg-cyan-50" }
              ].map((item, i) => (
                <Card key={i} className="border-none shadow-none bg-neutral-50 rounded-3xl group hover:bg-white hover:shadow-xl transition-all duration-500">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className={`size-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon className="size-6" />
                    </div>
                    <h3 className="font-bold text-neutral-900">{item.label}</h3>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team and Mission sections continue... */}
      <section className="py-20 bg-neutral-900 text-white rounded-[64px] my-20 mx-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-20 opacity-10">
          <Zap className="size-96 rotate-12 text-blue-500" />
        </div>
        <div className="max-w-7xl mx-auto px-10 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">Our Mission</h2>
            <p className="text-xl text-neutral-400 max-w-4xl mx-auto font-medium leading-relaxed italic">
              "To empower educational institutions, learners, and employers by leveraging blockchain technology to issue academic certificates as verifiable digital assets, ensuring data integrity and return absolute ownership to the learner."
            </p>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}
