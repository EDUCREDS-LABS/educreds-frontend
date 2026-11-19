import { Link } from "react-router-dom";
import { Mail, Twitter, Github, Linkedin, Shield } from "lucide-react";

export default function ModernFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
                <img src="/logo.svg" alt="EduCreds" className="h-full w-full object-contain" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white">EduCreds</h3>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Verifiable Education Network</p>
              </div>
            </div>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
              The global standard for trusted academic credential verification.
            </p>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-600">
              <Shield className="w-3 h-3 text-emerald-500" />
              SOC 2 Compliant
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-black text-[9px] uppercase tracking-widest text-neutral-600 mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-neutral-400">
              <li><Link to="/access" className="hover:text-white transition-colors">Sign In Portal</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Institution Login</Link></li>
              <li><Link to="/student/login" className="hover:text-white transition-colors">Student Portal</Link></li>
              <li><Link to="/verify" className="hover:text-white transition-colors">Verify Credential</Link></li>
              <li><Link to="/developer-portal" className="hover:text-white transition-colors">Developer API</Link></li>
              <li><Link to="/trust-registry" className="hover:text-white transition-colors">Trust Registry</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-black text-[9px] uppercase tracking-widest text-neutral-600 mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-neutral-400">
              <li><a href="https://educreds.xyz/about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="https://educreds.xyz/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="https://educreds.xyz/careers" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="https://educreds.xyz/pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="https://data-room.educreds.xyz" className="hover:text-white transition-colors">Investor Relations</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-black text-[9px] uppercase tracking-widest text-neutral-600 mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-neutral-400">
              <li><a href="https://docs.educreds.xyz" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="https://docs.educreds.xyz" className="hover:text-white transition-colors">API Reference</a></li>
              <li><Link to="/governance/public-vote" className="hover:text-white transition-colors">Governance</Link></li>
              <li><a href="mailto:support@educreds.xyz" className="hover:text-white transition-colors">Support</a></li>
              <li><a href="mailto:partnerships@educreds.xyz" className="hover:text-white transition-colors">Partnerships</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-5 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
            <span>&copy; {currentYear} EduCreds Labs Co. Ltd.</span>
            <a href="https://educreds.xyz/terms" className="hover:text-neutral-400 transition-colors">Terms</a>
            <a href="https://educreds.xyz/privacy" className="hover:text-neutral-400 transition-colors">Privacy</a>
          </div>
          <div className="flex items-center gap-4">
            {[
              { icon: Twitter, href: "https://twitter.com/EduCreds_cert", label: "X" },
              { icon: Linkedin, href: "https://linkedin.com/company/educreds-labs", label: "LinkedIn" },
              { icon: Github, href: "https://github.com/EDUCREDS-LABS", label: "GitHub" },
              { icon: Mail, href: "mailto:partnerships@educreds.xyz", label: "Email" },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="text-neutral-600 hover:text-white transition-colors">
                <s.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
