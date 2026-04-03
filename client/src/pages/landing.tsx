import ModernHeader from '../components/modern/ModernHeader';
import HeroSection from '../components/modern/HeroSection';
import FeaturesSection from '../components/modern/FeaturesSection';
import ModernFooter from '../components/modern/ModernFooter';
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  Palette,
  Shield,
  ShoppingBag,
  Wallet,
  User,
  Brain,
  Zap,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function Landing() {
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [documentationOpen, setDocumentationOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fix: roadmapText should be a string, not a code block or template literal with unescaped newlines
const roadmapText = `EDUCREDS PROJECT ROADMAP: A DETAILED BREAKDOWN\n\nEducreds is developing a blockchain-based platform for secure, verifiable, and accessible academic certificates. This roadmap outlines the project's phased development and future expansion.\n\nPHASE 1: FOUNDATION (Q1 2025)\nThis foundational phase focuses on establishing the core technical components of the Educreds platform.\n\n  - Smart Contract Development (Q2 2025):\n    Creation and testing of an NFT-based certificate contract (ERC721).\n    Implementation of logic for issuing, verifying, and revoking academic certificates.\n\n  - Frontend MVP and Backend Deployment (Q2 2025):\n    Development of a user interface (UI) for institutions to issue certificates.\n    Development of a UI for verifiers (employers, parents) to check certificate authenticity.\n\n  - Testnet Deployment (Q4 2026):\n    Deployment of the smart contract to Base Testnet or Sepolia.\n    Execution of functional tests for minting and viewing certificates.\n\nPHASE 2: BETA RELEASE (Q1-Q3 2026)\nThis phase involves public testing and the integration of key features to enhance platform functionality.\n\n  - Launch Web App Publicly (Testnet):\n    Invitation for real schools to test the platform.\n    Inclusion of institution registration and simple verification functionalities.\n\n  - PDF Generation & IPFS Integration (Q3 2026):\n    Automated generation of PDF versions of certificates with all associated metadata.\n    Storage of PDF hashes on IPFS, with links to the corresponding NFTs.\n\n  - Role Management (Q3 2026):\n    Addition of frontend separation for "Issuer" and "Verifier" views.\n\n  - Gather Feedback:\n    Onboarding of early testers to collect crucial user experience (UX) and functionality feedback.\n\nPHASE 3: TOKEN INTEGRATION & MAINNET (Q4 2026)\nThis crucial phase marks the introduction of the native token and the transition to the mainnet.\n\n  - Launch $EDUC Token (ERC20):\n    Deployment of the project's native utility token for subscriptions, access fees, or verification credits.\n\n  - Subscription System:\n    Institutions will pay monthly or per-certificate fees using the $EDUC token.\n    Verifiers (employers) will pay small, gas-free fees for deep verification access.\n\n  - Smart Contract Upgrade:\n    Inclusion of token-based access controls and advanced metadata formats.\n\n  - Deploy to Base or Polygon Mainnet:\n    Migration of tested contracts and data to the production environment.\n\nPHASE 4: EXPANSION & ECOSYSTEM (2026+)\nThis phase focuses on broad expansion and ecosystem development to maximize Educreds's utility and reach.\n\n  - API + SDK for Integration:\n    Allowing third parties, such as universities and EdTech platforms, to integrate via API.\n\n  - Mobile App:\n    Enabling on-the-go verification and certificate scanning.\n\n  - ZK/Privacy Layer:\n    Integrating zero-knowledge proofs for privacy-compliant certificate verification.\n\n  - Partner Onboarding:\n    Collaborating with government bodies, schools, and recruiters to foster adoption.\n\n  - Token Utility Expansion:\n    Introducing a reward system, staking for trusted institutions, gas subsidies, and other token-related utilities.\n\n  - Certificate Templates Marketplace:\n    Purchase custom certificate styles using $EDUC.\n\n  - Graduate Badges:\n    NFTs representing student milestones.\n\n  - AI Detection for Certificate Fraud:\n    Implementing AI to combat certificate fraud.`;

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
  return (
    <div className="min-h-screen bg-white">
      {/* Modern Header */}
      <ModernHeader onStudentPortalClick={() => setLocation("/student-portal")} />

      {/* Modern Hero Section */}
      <HeroSection />

      {/* Modern Features Section */}
      <FeaturesSection />

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

      {/* Keep existing sections for now - will modernize incrementally */}

      {/* Marketplace Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Certificate Template Marketplace
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-8">
              Discover professional certificate templates created by talented designers. 
              Choose from a variety of styles and customize them for your institution.
            </p>
            <Link href="/marketplace">
              <Button size="lg" className="min-w-[200px]">
                Browse Marketplace
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Professional Designs
              </h3>
              <p className="text-neutral-600">
                High-quality certificate templates designed by professional graphic designers with attention to detail and modern aesthetics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-secondary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Easy Customization
              </h3>
              <p className="text-neutral-600">
                Templates are easily customizable with your institution's branding, colors, and content while maintaining professional quality.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-accent-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Fair Pricing
              </h3>
              <p className="text-neutral-600">
                Choose from free templates or premium designs at competitive prices. Support talented designers while getting quality templates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Modernized with PoIC Flow */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 border-blue-200 text-blue-700 bg-blue-50/50 px-3 py-1">
                Protocol Workflow
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-heading text-neutral-900 mb-6">
                How It Works
              </h2>
              <p className="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
                Legacy credential systems rely on fragile centralized trust. EduCreds infrastructure enforces 
                <span className="font-semibold text-neutral-900"> issuer-first credibility</span> through its rigorous PoIC evaluation process.
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Off-chain Application",
                desc: "Institutions submit legal documentation, institutional domains, and official accreditation proofs for review.",
                icon: Shield,
                color: "bg-blue-500"
              },
              {
                step: "02",
                title: "ETA AI Analysis",
                desc: "The EduCreds Trust Agent (ETA) performs consistency checks, registry verification, and risk assessment to generate a recommended PoIC score.",
                icon: Brain,
                color: "bg-indigo-500"
              },
              {
                step: "03",
                title: "Governance Proposal",
                desc: "A DAO proposal is generated to approve the institution, including IIN minting parameters and initial PoIC assignment.",
                icon: Palette,
                color: "bg-purple-500"
              },
              {
                step: "04",
                title: "DAO Consensus Vote",
                desc: "Verified IIN holders and the Foundation participate in a reputation-weighted vote (≥60% approval required).",
                icon: CheckCircle,
                color: "bg-emerald-500"
              },
              {
                step: "05",
                title: "On-chain Activation",
                desc: "The Institutional Identity NFT (IIN) is minted and the initial PoIC is recorded in the immutable on-chain PoIC Registry.",
                icon: Zap,
                color: "bg-amber-500"
              },
              {
                step: "06",
                title: "Dynamic PoIC Updates",
                desc: "PoIC dynamically updates (0–100) based on issuance behavior, verification feedback, and governance history.",
                icon: ArrowRight,
                color: "bg-rose-500"
              }
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg shadow-neutral-200/50 bg-white relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${item.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white shadow-lg`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="text-4xl font-black text-neutral-100 group-hover:text-neutral-200 transition-colors">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* PoIC Weighting Callout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-16 p-8 rounded-3xl bg-neutral-900 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="text-2xl font-bold mb-4">PoIC Score Weighting</h4>
                <p className="text-neutral-400 text-sm mb-6">
                  Only high-PoIC institutions issue tamper-proof credentials bound to decentralized DIDs on Base.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "25% Legal & Accreditation",
                    "20% Operational Authenticity",
                    "25% Issuance Quality",
                    "15% Market Feedback",
                    "15% Governance History"
                  ].map(stat => (
                    <div key={stat} className="flex items-center gap-2 text-xs font-medium text-neutral-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {stat}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                    0–100
                  </div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">PoIC Range</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Revolutionize Educational Certificates?
          </h2>
          <p className="text-xl text-neutral-300 mb-8">
            Join thousands of institutions already using EduCreds to issue secure, verifiable certificates.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="min-w-[200px] bg-primary hover:bg-primary/90">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="min-w-[200px] border-white text-white hover:bg-white hover:text-neutral-900">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <ModernFooter />
    </div>
  );
}