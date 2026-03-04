import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Palette,
  ShoppingBag,
  CheckCircle,
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

export default function EduCredsLabsLanding() {
  const [, setLocation] = useLocation();

  const products = [
    {
      title: "EduCreds Infrastructure",
      description: "Enterprise-grade issuance and verification engine. Built for scale, security, and seamless integration with existing SIS.",
      icon: Shield,
      href: "/infra",
      image: "https://pixabay.com/get/g3514debddf13f148847d1d4cd204ac071856dec52635aa84f36d1a7c7e51cfb75ad1e6b2f8f5bde93ccdc3e83b1d7f76.svg",
      color: "from-blue-600 to-indigo-700",
      features: ["Tamper-proof Storage", "Instant Global Verification", "Blockchain-Anchored Security"]
    },
    {
      title: "EduDesign Studio",
      description: "Professional credential design suite. Create stunning, branded certificates with our intuitive drag-and-drop interface.",
      icon: Palette,
      href: "/designer",
      image: "https://pixabay.com/get/g43d00a41b9a85a964822ca2c79f607a3bb00f9812b8774b703c8da9f8e5557430877de845367810a4c51a12f4af17d54.svg",
      color: "from-purple-600 to-pink-700",
      features: ["Institutional Templates", "Smart Variable Mapping", "Brand Asset Management"]
    },
    {
      title: "Talent Marketplace",
      description: "Connect with certified professionals and top-tier designers. A trusted ecosystem for academic talent and creative assets.",
      icon: ShoppingBag,
      href: "/marketplace",
      image: "https://pixabay.com/get/g8063e5ff8afffe6f97b609390a2472cfd6c7e64055339a981c7f4a3d1ea1cb1ae4a777288925282c459a7e061e5333a6.svg",
      color: "from-cyan-600 to-teal-700",
      features: ["Verified Talent Pool", "Secure Transactions", "Global Designer Network"]
    }
  ];

  const stats = [
    { label: "Uptime Guarantee", value: "99.9%", icon: Activity },
    { label: "Credentials Secured", value: "1M+", icon: FileCheck },
    { label: "Global Reach", value: "150+ Countries", icon: Globe },
    { label: "Institutional Partners", value: "50+", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/20">
      <ModernHeader onStudentPortalClick={() => setLocation("/student-portal")} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Aurora Mesh Background - Refined for Enterprise feel (subtler) */}
        <div className="absolute inset-0 -z-10 overflow-hidden bg-neutral-50">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-blue-200/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-indigo-200/30 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-cyan-200/30 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

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
              <Link href="/register">
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
      <section className="py-12 bg-white border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </section>

      {/* DAO Participant Voting Entry */}
      <section className="py-16 bg-neutral-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border border-neutral-200 bg-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-bl-full -z-0 opacity-50" />
            <CardContent className="p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative z-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 mb-4 text-sm font-bold text-blue-600 uppercase tracking-wider">
                  <Flag className="w-4 h-4" />
                  Governance
                </div>
                <h3 className="text-2xl md:text-3xl font-bold font-heading text-neutral-900 mb-4">
                  Decentralized Governance Portal
                </h3>
                <p className="text-neutral-600 text-lg leading-relaxed">
                  Participate in the future of EduCreds. Eligible verifiers and auditors can vote on protocol proposals and sponsored initiatives through our secure DAO interface.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link href="/governance/public-vote">
                  <Button size="lg" className="rounded-full px-8 h-12 bg-white border-2 border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm">
                    Access Voting
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Products Bento Grid */}
      <section id="products" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-neutral-900 mb-6">Enterprise Solutions</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              A comprehensive suite of blockchain-enabled tools designed for the modern educational landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {products.map((product, idx) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full overflow-hidden border border-neutral-100 shadow-xl shadow-neutral-200/50 bg-white group transition-all hover:shadow-2xl hover:shadow-blue-900/5">
                  <div className={`h-48 bg-gradient-to-br ${product.color} relative overflow-hidden p-8`}>
                    <img
                      src={product.image}
                      alt={product.title}
                      className="absolute bottom-[-20%] right-[-10%] w-48 opacity-20 group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="relative z-10 bg-white/10 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center border border-white/20">
                      <product.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold font-heading mb-4 text-neutral-900">{product.title}</h3>
                    <p className="text-neutral-600 mb-8 leading-relaxed">{product.description}</p>
                    <ul className="space-y-4 mb-8">
                      {product.features.map(f => (
                        <li key={f} className="flex items-center text-sm font-medium text-neutral-700">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={product.href}>
                      <Button className="w-full group/btn bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-200" variant="ghost">
                        Learn More
                        <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-24 relative overflow-hidden bg-neutral-900 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
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
                  src="https://freepngimg.com/svg/164839-improved-perspective-grid"
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

      {/* Mission & Vision Bento */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-neutral-50 border-neutral-200 p-10 hover:border-blue-200 transition-colors">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold font-heading text-neutral-900">Our Mission</h3>
              </div>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Empower educational institutions, learners, and employers by leveraging blockchain technology to issue academic certificates as verifiable digital assets, ensuring data integrity and instant transparency.
              </p>
            </Card>
            <Card className="bg-neutral-50 border-neutral-200 p-10 hover:border-purple-200 transition-colors">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold font-heading text-neutral-900">Our Vision</h3>
              </div>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Restoring confidence in academic credentials worldwide through a standard that is trustless and portal-owned by the learner, eliminating fraud forever.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <div className="bg-neutral-50 border-t border-neutral-200">
        <SystemArchitecture />
      </div>

      <ModernFooter />
    </div>
  );
}
