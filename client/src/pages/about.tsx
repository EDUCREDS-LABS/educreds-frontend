import React from 'react';
import { useLocation } from "wouter";
import ModernHeader from '../components/modern/ModernHeader';
import ModernFooter from '../components/modern/ModernFooter';
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
            <h1 className="text-4xl md:text-6xl font-bold font-heading text-neutral-900 mb-6 leading-tight tracking-tight">
              Decentralized Trust for <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Academic Credentials
              </span>
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              EduCreds is a protocol-level system where academic institutions, learners, employers, and governments can issue, verify, and govern credentials with cryptographic certainty.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold font-heading text-neutral-900 mb-6">
                Why We Exist
              </h2>
              <div className="prose prose-lg text-neutral-600">
                <p className="mb-6">
                  We believe education credentials are one of the most critical forms of trust infrastructure in the digital world. Degrees, certificates, and academic records underpin employment, migration, funding, and social mobility—yet today they remain fragmented, opaque, and vulnerable to fraud.
                </p>
                <p>
                  EduCreds introduces a programmable, verifiable alternative powered by decentralized identity, onchain credentials, and AI-assisted governance. We target the multi-billion-dollar global education market to bring composable, interoperable credential infrastructure to the Internet’s trust layer.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-blue-50 border-none shadow-none">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-neutral-900 mb-2">Global Reach</h3>
                  <p className="text-sm text-neutral-600">Cross-border qualification recognition systems.</p>
                </CardContent>
              </Card>
              <Card className="bg-indigo-50 border-none shadow-none">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                    <Network className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-neutral-900 mb-2">Interoperable</h3>
                  <p className="text-sm text-neutral-600">Composable infrastructure for the trust layer.</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-none shadow-none">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-neutral-900 mb-2">Secure</h3>
                  <p className="text-sm text-neutral-600">Cryptographic certainty and transparency.</p>
                </CardContent>
              </Card>
              <Card className="bg-cyan-50 border-none shadow-none">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4 text-cyan-600">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-neutral-900 mb-2">AI-Assisted</h3>
                  <p className="text-sm text-neutral-600">Intelligent governance and dispute resolution.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Overview */}
      <section className="py-20 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-neutral-700 text-neutral-300">Architecture</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">Technical Overview</h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              EduCreds is a modular, intelligence-driven credential protocol designed from first principles for institutional verification, credential issuance, and dispute resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 text-blue-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Onchain Immutability</h3>
                <p className="text-neutral-400 leading-relaxed">
                  The protocol is composed of tightly integrated layers that combine onchain immutability with decentralized identity standards.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 text-purple-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Offchain Intelligence</h3>
                <p className="text-neutral-400 leading-relaxed">
                  Leveraging offchain computation and AI to enhance verification processes without compromising decentralized principles.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 text-green-400">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Proof of Institutional Credibility</h3>
                <p className="text-neutral-400 leading-relaxed">
                  A PoIC framework, enforced by smart contracts and governed by a DAO, determines who can issue credentials and under what conditions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Objective */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">Our Mission</h3>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                To empower educational institutions, learners, and employers by leveraging blockchain technology to issue academic certificates as verifiable digital assets, ensure data integrity and privacy, enable instant and transparent verification, and reduce fraud, administrative overhead, and dependence on centralized authorities.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">Our Vision</h3>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                To become the global standard for academic credential verification, where every qualification is trustless, portable, and owned by the learner, eliminating certificate fraud and restoring confidence in academic credentials worldwide.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">Objective</h3>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                To provide a secure, tamper-proof, and globally verifiable academic credential infrastructure that enables institutions to issue certificates digitally while allowing employers and third parties to verify authenticity instantly without intermediaries. Credentials can be verified without contacting the issuing institution, ensuring trust, transparency, and speed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}