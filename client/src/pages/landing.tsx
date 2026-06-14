import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Cpu,
  Globe,
  Database,
  Activity,
  Zap,
  Lock,
  Server,
  Network,
  CheckCircle2,
  Terminal,
  Layers,
  FileCode,
  Share2
} from "lucide-react";
import ModernHeader from '../components/modern/ModernHeader';
import ModernFooter from '../components/modern/ModernFooter';
import SystemArchitecture from '@/components/SystemArchitecture';
import { cn } from "@/lib/utils";

const NetworkStat = ({ label, value, sub, icon: Icon, trend }: any) => (
  <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-[24px] group hover:bg-neutral-800/50 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
        <Icon className="size-5" />
      </div>
      {trend && (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] font-black uppercase font-mono">
          {trend}
        </Badge>
      )}
    </div>
    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">
      {label}
    </p>
    <p className="text-3xl font-black text-white tracking-tighter">
      {value}
    </p>
    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1.5">
      {sub}
    </p>
  </div>
);

const InfraModule = ({ title, desc, icon: Icon, features, color }: any) => (
  <Card className="border-none shadow-2xl bg-neutral-900/80 backdrop-blur-md overflow-hidden group border border-white/5">
    <div className={cn("h-1 w-full bg-gradient-to-r", color)} />
    <CardContent className="p-10 space-y-8">
      <div className="flex items-center gap-6">
        <div className={cn("size-16 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform", color.replace('from-', 'bg-').split(' ')[0] + '/20')}>
          <Icon className={cn("size-8", color.replace('from-blue-600', 'text-cyan-400').replace('from-purple-600', 'text-purple-400').replace('from-emerald-600', 'text-emerald-400'))} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight leading-none">{title}</h3>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mt-2">Protocol Layer v2.4</p>
        </div>
      </div>
      <p className="text-neutral-400 text-sm font-medium leading-relaxed">{desc}</p>
      <ul className="space-y-4 pt-2">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-center gap-3 text-xs font-bold text-neutral-300 tracking-tight">
            <div className="size-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            {f}
          </li>
        ))}
      </ul>
      <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 text-white font-black text-[10px] uppercase tracking-widest transition-all">
        Technical Specs <ArrowRight className="size-3 ml-2" />
      </Button>
    </CardContent>
  </Card>
);

export default function Landing() {
  const [, setLocation] = useLocation();

  const modules = [
    {
      title: "Issuance Engine",
      desc: "High-throughput credential generator capable of anchoring thousands of unique identifiers per block with cryptographic finality.",
      icon: Zap,
      color: "from-blue-600 to-indigo-600",
      features: ["W3C Verifiable Credentials", "Zero-Knowledge Proofs", "Batch Processing API"]
    },
    {
      title: "Trust Agent (ETA)",
      desc: "AI-orchestrated security layer that analyzes institutional behavior and generates dynamic legitimacy scores (PoIC).",
      icon: Cpu,
      color: "from-purple-600 to-pink-600",
      features: ["Risk Analysis Engine", "Automated Compliance", "Consensus Orchestration"]
    },
    {
      title: "DID Registry",
      desc: "Decentralized identity repository on Base, providing a tamper-proof source of truth for global academic authority.",
      icon: Database,
      color: "from-emerald-600 to-teal-600",
      features: ["Soulbound Token Identity", "Global Interoperability", "Immutable Audit Trail"]
    }
  ];

  const pipeline = [
    { label: "Request", desc: "Data ingestion via REST API / CSV", icon: FileCode },
    { label: "Verify", desc: "ETA legitimacy & PoIC validation", icon: Shield },
    { label: "Sign", desc: "Institutional private key signature", icon: Lock },
    { label: "Anchor", desc: "On-chain state finalization on Base", icon: Network },
    { label: "Distribute", desc: "Wallet-ready credential delivery", icon: Share2 }
  ];

  const roadmap = [
    { phase: "Q1-Q2 2025", title: "Foundation", items: ["NFT Certificate Core (ERC721)", "Institution Registry MVP", "Testnet Alpha Deployment"] },
    { phase: "Q3-Q4 2025", title: "Scale", items: ["W3C Verifiable Credentials", "EduCreds Trust Agent (ETA)", "DID Registry Integration"] },
    { phase: "Q1-Q2 2026", title: "Autonomy", items: ["DAO Governance Launch", "PoIC Scoring Engine v2", "Mainnet Genesis"] },
    { phase: "Q3-Q4 2026", title: "Ecosystem", items: ["Native $EDUC Token Utility", "Multi-Chain Expansion", "Global Verification API"] }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden font-sans">
      <ModernHeader onStudentPortalClick={() => setLocation("/student-portal")} />

      {/* Industrial Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-neutral-950" />
          <div className="absolute inset-0 opacity-[0.15]" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
              backgroundSize: '40px 40px' 
            }} 
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
          {/* Moving Laser Line */}
          <motion.div 
            className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8">
              Protocol Infrastructure v2.4
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
              THE <span className="text-cyan-400">BACKBONE</span> OF <br />
              ACADEMIC TRUST.
            </h1>
            <p className="text-xl text-neutral-500 max-w-3xl mx-auto font-medium leading-relaxed">
              Industrial-grade blockchain infrastructure for the next generation of academic certification. 
              Secure, scalable, and cryptographically provable.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105">
              Access Documentation <Terminal className="ml-3 size-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-white/10 hover:bg-white/5 font-black text-xs uppercase tracking-[0.2em]">
              Request SDK <Cpu className="ml-3 size-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Network Health Dashboard */}
      <section className="pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-3 mb-4 px-4">
            <Activity className="size-4 text-blue-500 animate-pulse" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Real-Time Network Integrity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NetworkStat label="Nodes Online" value="512" sub="Global Validated Nodes" icon={Server} trend="+12" />
            <NetworkStat label="Issuance Speed" value="1.2s" sub="Avg Finality Time" icon={Zap} trend="-0.4s" />
            <NetworkStat label="Secured Assets" value="2.4M" sub="On-Chain Credentials" icon={Database} trend="+240k" />
            <NetworkStat label="Uptime Score" value="99.99%" sub="Protocol Availability" icon={Globe} />
          </div>
        </div>
      </section>

      {/* System Architecture Visualization */}
      <div className="border-y border-white/5">
        <SystemArchitecture />
      </div>

      {/* Infrastructure Modules */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">Modular Core.</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto font-medium">Decentralized architecture designed for institutional sovereignty and cryptographic precision.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {modules.map((m, i) => <InfraModule key={i} {...m} />)}
          </div>
        </div>
      </section>

      {/* Protocol Pipeline */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 space-y-4">
            <h2 className="text-4xl font-black uppercase">The Pipeline.</h2>
            <p className="text-neutral-500 font-medium">The end-to-end lifecycle of a blockchain-anchored credential.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
             {/* Desktop Connector Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-neutral-800 -translate-y-1/2 z-0" />
            
            {pipeline.map((step, i) => (
              <div key={i} className="relative z-10 space-y-6 group">
                <div className="size-20 rounded-[24px] bg-neutral-900 border border-white/5 flex items-center justify-center text-cyan-400 shadow-2xl group-hover:bg-cyan-500 group-hover:text-black transition-all mx-auto md:mx-0">
                  <step.icon className="size-8" />
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-black text-white">{step.label}</h4>
                  <p className="text-xs text-neutral-500 font-medium mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Roadmap */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto">
           <div className="mb-20 text-center space-y-4">
            <h2 className="text-5xl font-black uppercase tracking-tighter">Protocol Roadmap.</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">Strategic technical milestones for the global expansion of the EduCreds network.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roadmap.map((phase, i) => (
              <div key={i} className="space-y-6 relative p-8 bg-black border border-white/5 rounded-[32px] hover:border-blue-500/30 transition-colors">
                <div className="flex justify-between items-start">
                  <Badge className="bg-blue-500/10 text-blue-500 border-none font-black text-[9px] uppercase px-3 py-1">
                    {phase.phase}
                  </Badge>
                  <Layers className="size-4 text-neutral-700" />
                </div>
                <h4 className="text-2xl font-black tracking-tight">{phase.title}</h4>
                <ul className="space-y-3">
                  {phase.items.map((item, j) => (
                    <li key={j} className="text-xs font-bold text-neutral-500 flex items-center gap-2">
                      <div className="size-1 rounded-full bg-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Call to Action */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-[48px] bg-blue-600 p-12 md:p-20 text-center space-y-10 group">
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Network className="size-64 rotate-12" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none uppercase">READY TO <span className="text-cyan-300">DEPLOY?</span></h2>
            <p className="text-xl text-blue-100/80 max-w-2xl mx-auto font-medium">Join the infrastructure layer of global education. Start your institutional node deployment today.</p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button size="lg" className="h-16 px-12 rounded-2xl bg-white text-blue-900 hover:bg-neutral-100 font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                Initialize Integration <ArrowRight className="ml-3 size-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl border-white/20 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.2em]">
              Developer Portal
            </Button>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}
