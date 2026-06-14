import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Twitter,
  Github,
  Linkedin,
  ArrowRight,
  Shield,
  Globe
} from "lucide-react";

export default function ModernFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-white border-t border-white/5">
      {/* Newsletter Section */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-black mb-3 tracking-tighter uppercase">Stay <span className="text-cyan-400">Integrated</span>.</h3>
              <p className="text-neutral-500 font-medium max-w-md">
                Receive technical updates, protocol milestones, and ecosystem alerts directly to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="infrastructure@institution.edu"
                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
              />
              <Button className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-widest shadow-xl">
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">

          {/* Company Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center space-x-4">
              <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center p-2 overflow-hidden border border-white/10 shadow-inner">
                <img 
                  src="https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775824626/logo_sftena.png" 
                  alt="EduCreds" 
                  className="h-full w-full object-contain brightness-0 invert" 
                />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tighter uppercase text-white">EduCreds</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Protocol Infrastructure</p>
              </div>
            </div>

            <p className="text-neutral-500 mb-8 max-w-sm text-sm font-medium leading-relaxed">
              Establishing the global standard for decentralized academic verification. 
              Secure, tamper-proof, and cryptographically anchored credentials for the digital age.
            </p>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-white/10 text-neutral-400 bg-white/5 px-3 py-1 font-bold text-[9px] uppercase tracking-widest">
                <Shield className="w-3 h-3 mr-1.5 text-emerald-500" />
                SOC 2 Compliant
              </Badge>
              <Badge variant="outline" className="border-white/10 text-neutral-400 bg-white/5 px-3 py-1 font-bold text-[9px] uppercase tracking-widest">
                <Globe className="w-3 h-3 mr-1.5 text-cyan-400" />
                Global Network
              </Badge>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-8">Product</h4>
            <ul className="space-y-4 text-sm font-bold text-neutral-400">
              <li><Link href="/infra" className="hover:text-cyan-400 transition-colors">Infrastructure</Link></li>
              <li><Link href="/marketplace" className="hover:text-cyan-400 transition-colors">Marketplace</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-400 transition-colors">Enterprise Pricing</Link></li>
              <li><Link href="/verification-portal" className="hover:text-cyan-400 transition-colors">Verification Node</Link></li>
              <li><Link href="/developer-portal" className="hover:text-cyan-400 transition-colors">Developer Portal</Link></li>
            </ul>
          </div>

          {/* Network */}
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-8">Network</h4>
            <ul className="space-y-4 text-sm font-bold text-neutral-400">
              <li><Link href="/about" className="hover:text-cyan-400 transition-colors">About Protocol</Link></li>
              <li><Link href="/careers" className="hover:text-cyan-400 transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-cyan-400 transition-colors">Ecosystem Blog</Link></li>
              <li><Link href="/press" className="hover:text-cyan-400 transition-colors">Press Kit</Link></li>
              <li><Link href="/trust-registry" className="hover:text-cyan-400 transition-colors">Trust Registry</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-8">Resources</h4>
            <ul className="space-y-4 text-sm font-bold text-neutral-400">
              <li><a href="https://docs.educreds.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
              <li><Link href="/api-reference" className="hover:text-cyan-400 transition-colors">API Reference</Link></li>
              <li><Link href="/governance/public-vote" className="hover:text-cyan-400 transition-colors">DAO Governance</Link></li>
              <li><a href="mailto:support@educreds.xyz" className="hover:text-cyan-400 transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">

            {/* Copyright */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-[11px] font-black uppercase tracking-widest text-neutral-600">
              <span>&copy; {currentYear} EduCreds Protocol.</span>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-6">
              {[
                { icon: Twitter, href: "https://twitter.com/educreds_cert" },
                { icon: Linkedin, href: "https://linkedin.com/company/educreds" },
                { icon: Github, href: "https://github.com/educreds" },
                { icon: Mail, href: "mailto:support@educreds.xyz" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-cyan-400 transition-all hover:scale-110"
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
