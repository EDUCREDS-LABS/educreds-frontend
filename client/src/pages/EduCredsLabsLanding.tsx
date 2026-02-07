import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Shield, 
  Palette, 
  ShoppingBag, 
  CheckCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Zap,
  Lock,
  Target,
  Eye,
  Flag
} from "lucide-react";
import { motion } from "framer-motion";
import ModernHeader from "@/components/modern/ModernHeader";
import ModernFooter from "@/components/modern/ModernFooter";
import { useState } from "react";
import StudentPortalModal from "@/components/StudentPortalModal";

export default function EduCredsLabsLanding() {
  const [studentPortalOpen, setStudentPortalOpen] = useState(false);

  const products = [
    {
      title: "EduCreds Infrastructure",
      description: "Digital credential issuance and verification infrastructure designed for institutional security.",
      icon: Shield,
      href: "/infra",
      image: "https://pixabay.com/get/g3514debddf13f148847d1d4cd204ac071856dec52635aa84f36d1a7c7e51cfb75ad1e6b2f8f5bde93ccdc3e83b1d7f76.svg",
      color: "from-blue-500 to-indigo-600",
      features: ["Tamper-proof storage", "Instant Verification", "Blockchain-anchored"]
    },
    {
      title: "EduDesign",
      description: "A native Canva-like designer portal for creating professional academic credentials.",
      icon: Palette,
      href: "/designer",
      image: "https://pixabay.com/get/g43d00a41b9a85a964822ca2c79f607a3bb00f9812b8774b703c8da9f8e5557430877de845367810a4c51a12f4af17d54.svg",
      color: "from-purple-500 to-pink-600",
      features: ["Custom Templates", "Intuitive Editor", "Institutional Branding"]
    },
    {
      title: "Marketplace",
      description: "A curated marketplace connecting talented designers with educational institutions.",
      icon: ShoppingBag,
      href: "/marketplace",
      image: "https://pixabay.com/get/g8063e5ff8afffe6f97b609390a2472cfd6c7e64055339a981c7f4a3d1ea1cb1ae4a777288925282c459a7e061e5333a6.svg",
      color: "from-cyan-500 to-teal-600",
      features: ["Premium Designs", "Fair Pricing", "Global Designer Network"]
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/20">
      <ModernHeader onStudentPortalClick={() => setStudentPortalOpen(true)} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Aurora Mesh Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-400/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-cyan-400/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full">
              EduCreds Labs Ecosystem
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold font-heading text-neutral-900 mb-8 leading-tight tracking-tight">
              Revolutionizing <br />
              <span className="bg-gradient-to-r from-primary via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                Academic Certificates
              </span>
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              EduCreds provides a secure, tamper-proof, and globally verifiable digital credential infrastructure. 
              We empower institutions to issue certificates as verifiable digital assets while ensuring instant trust for employers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-105">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#products">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-2 hover:bg-neutral-50 transition-all">
                  Explore Products
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Bento Grid */}
      <section id="products" className="py-24 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-neutral-900 mb-4">Our Products</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              A comprehensive suite of tools for the modern educational landscape.
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
                <Card className="h-full overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm group transition-all">
                  <div className={`h-48 bg-gradient-to-br ${product.color} relative overflow-hidden p-6`}>
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      className="absolute bottom-[-20%] right-[-10%] w-48 opacity-20 group-hover:scale-110 transition-transform duration-500"
                    />
                    <product.icon className="w-12 h-12 text-white relative z-10" />
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold font-heading mb-4">{product.title}</h3>
                    <p className="text-neutral-600 mb-6 leading-relaxed">{product.description}</p>
                    <ul className="space-y-3 mb-8">
                      {product.features.map(f => (
                        <li key={f} className="flex items-center text-sm text-neutral-700">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={product.href}>
                      <Button className="w-full group/btn" variant="ghost">
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
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold font-heading mb-8">The Challenge & Our Solution</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">The Problem</h4>
                    <p className="text-neutral-600">Manual verification is slow and unreliable. Fraud and forgery are widespread, undermining trust in qualifications worldwide.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">The EduCreds Solution</h4>
                    <p className="text-neutral-600">We anchor authenticity on the blockchain, allowing instant verification by employers without contacting institutions. Trustless and transparent.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-neutral-100 overflow-hidden relative border-8 border-white shadow-2xl">
                 <img 
                    src="https://pixabay.com/get/gf7d32a0671a23133472c72cbc3658192983b6823b044a974aec1f55423addbe7bb5e6cec6171485627864b7c8f5573bd.svg" 
                    alt="Futuristic Grid Perspective" 
                    className="w-full h-full object-cover opacity-80"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
                 <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur p-6 rounded-2xl shadow-xl">
                    <p className="text-neutral-900 font-medium italic">"To become the global standard for academic credential verification, where every qualification is trustless, portable, and owned by the learner."</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Bento */}
      <section className="py-24 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-neutral-800 border-neutral-700 p-10 text-white">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-3xl font-bold font-heading">Our Mission</h3>
              </div>
              <p className="text-xl text-neutral-400 leading-relaxed">
                Empower educational institutions, learners, and employers by leveraging blockchain technology to issue academic certificates as verifiable digital assets, ensuring data integrity and instant transparency.
              </p>
            </Card>
            <Card className="bg-neutral-800 border-neutral-700 p-10 text-white">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-3xl font-bold font-heading">Our Vision</h3>
              </div>
              <p className="text-xl text-neutral-400 leading-relaxed">
                Restoring confidence in academic credentials worldwide through a standard that is trustless and portal-owned by the learner, eliminating fraud forever.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact & Location Strip */}
      <section className="py-12 bg-white border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">Location</p>
                <p className="text-neutral-900 font-medium">Kampala, Uganda</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">Email</p>
                <p className="text-neutral-900 font-medium">admin@educreds.xyz</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">Contact</p>
                <p className="text-neutral-900 font-medium">+256 757 282 316 / +256 757 788 503</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">Web</p>
                <p className="text-neutral-900 font-medium">educreds.xyz</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModernFooter />
      <StudentPortalModal open={studentPortalOpen} onOpenChange={setStudentPortalOpen} />
    </div>
  );
}