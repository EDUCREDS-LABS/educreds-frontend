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
    <footer className="bg-neutral-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
              <p className="text-neutral-400">
                Get the latest updates on blockchain certificates, new features, and industry insights.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="bg-primary hover:bg-primary/90">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="url(#footer-logo-gradient)" />
                <path d="M10 22L16 10L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="footer-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <h3 className="text-xl font-bold">EduCreds</h3>
                <p className="text-sm text-neutral-400">Blockchain Certificates</p>
              </div>
            </div>
            
            <p className="text-neutral-400 mb-6 max-w-md">
              Revolutionizing educational certificates with blockchain technology. 
              Secure, verifiable, and globally recognized credentials for the digital age.
            </p>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-green-500 text-green-400">
                <Shield className="w-3 h-3 mr-1" />
                SOC 2 Compliant
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                <Globe className="w-3 h-3 mr-1" />
                Global Coverage
              </Badge>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3 text-neutral-400">
              <li>
                <Link href="#features">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    Features
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/marketplace">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    Marketplace
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/subscription">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    Pricing
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/verify">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    Verification
                  </Button>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-neutral-400">
              <li>
                <Link href="/about">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    About Us
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/careers">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    Careers
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    Blog
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/press">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    Press Kit
                  </Button>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3 text-neutral-400">
              <li>
                <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                  Help Center
                </Button>
              </li>
              <li>
                <Link href="/documentation">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    Documentation
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/api-reference">
                  <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                    API Reference
                  </Button>
                </Link>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white">
                  Contact Us
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="flex items-center space-x-6 text-sm text-neutral-400">
              <span>&copy; {currentYear} EduCreds. All rights reserved.</span>
              <Link href="/terms">
                <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white text-sm">
                  Terms
                </Button>
              </Link>
              <Link href="/privacy">
                <Button variant="link" className="p-0 h-auto text-neutral-400 hover:text-white text-sm">
                  Privacy
                </Button>
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a 
                href="https://twitter.com/educreds_cert" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/educreds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/educreds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="mailto:support@educreds.com"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}