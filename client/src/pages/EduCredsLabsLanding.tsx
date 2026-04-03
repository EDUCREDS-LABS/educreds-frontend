import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Zap,
  Lock,
  Target,
  Eye,
  Flag,
  FileCheck,
  Globe,
  Server,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import ModernHeader from "@/components/modern/ModernHeader";
import ModernFooter from "@/components/modern/ModernFooter";
import SystemArchitecture from "@/components/SystemArchitecture";
import PartnersSection from "@/components/PartnersSection";
import VerificationSection from "@/components/VerificationSection";

export default function EduCredsLabsLanding() {
  const [, setLocation] = useLocation();

  const stats = [
    { label: "Uptime Guarantee", value: "99.9%", icon: Activity },
    { label: "Credentials Secured", value: "1M+", icon: FileCheck },
    { label: "Global Reach", value: "150+ Countries", icon: Globe },
    { label: "Institutional Partners", value: "50+", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/20 relative overflow-hidden">
      {/* Global Background Image */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-neutral-50">
        <div 
          className="absolute inset-0 opacity-[0.45] pointer-events-none mix-blend-normal"
          style={{ 
            backgroundImage: "url('https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775209679/conny-schneider-xuTJZ7uD7PI-unsplash_arilhb.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-blue-200/20 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-indigo-200/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-cyan-200/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775209680/robynne-o-HOrhCnQsxnQ-unsplash_xganji.jpg')] opacity-20"></div>
      </div>

      <ModernHeader onStudentPortalClick={() => setLocation("/student-portal")} />

      {/* Hero + Stats Background */}
      <section className="relative overflow-hidden">

        {/* Hero Section */}
        <section className="pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-8 bg-white/50 backdrop-blur-md text-neutral-600 border-neutral-200 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 inline-block animate-pulse"></span>
                The Future of Digital Credentialing
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold font-heading text-neutral-900 mb-8 leading-tight tracking-tight">
                Trustless Verification for <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Modern Education
                </span>
              </h1>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                EduCreds bridges the gap between traditional institutions and blockchain technology. 
                Issue tamper-proof, globally verifiable credentials that empower learners and streamline verification for employers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/infra">
                  <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-blue-900/10 bg-neutral-900 hover:bg-neutral-800 text-white transition-all hover:scale-105">
                    Start Issuing
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#products">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-2 bg-white/50 backdrop-blur-sm hover:bg-white transition-all">
                    View Solutions
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-neutral-200/60 bg-white/55 backdrop-blur-sm shadow-sm px-6 py-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, idx) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</h4>
                    <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>

      <VerificationSection />

      {/* Problem & Solution */}
      <section className="py-24 relative overflow-hidden bg-neutral-900/95 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-6 border-neutral-700 text-neutral-300 px-4 py-1">Why EduCreds?</Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-heading mb-8 leading-tight">
                Eliminating Credential Fraud with Blockchain Technology
              </h2>
              <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-3 text-white">The Challenge</h4>
                    <p className="text-neutral-400 leading-relaxed">
                      Manual verification is slow, costly, and prone to error. Credential fraud undermines the integrity of educational institutions and puts employers at risk.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-3 text-white">The Solution</h4>
                    <p className="text-neutral-400 leading-relaxed">
                      We anchor credentials on the blockchain, creating a permanent, tamper-proof record. Employers can verify qualifications instantly, without intermediaries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-neutral-800 overflow-hidden relative border border-neutral-700 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay"></div>
                <img
                  src="https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775209680/robynne-o-HOrhCnQsxnQ-unsplash_xganji.jpg"
                  alt="Futuristic Grid Perspective"
                  className="w-full h-full object-cover opacity-30 scale-150"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <p className="text-white font-medium italic text-lg">
                      "EduCreds transforms certificates from static documents into dynamic, verifiable digital assets owned by the learner."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About CTA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-neutral-200/70 bg-white/70 backdrop-blur-md shadow-lg">
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />

            <div className="relative p-10 sm:p-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-blue-600">
                  About EduCreds
                </div>
                <h3 className="mt-4 text-3xl sm:text-4xl font-bold text-neutral-900">
                  Learn the mission, vision, and people building the protocol.
                </h3>
                <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
                  Get the full story behind the EduCreds ecosystem, including our governance approach and roadmap.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link href="/about">
                  <Button size="lg" className="rounded-full px-8 h-12 bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-900/10">
                    Visit About Page
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <div className="bg-neutral-50 border-t border-neutral-200">
        <SystemArchitecture />
      </div>

      <PartnersSection />

      <ModernFooter />
    </div>
  );
}
