import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Wallet, 
  ChevronDown,
  Globe,
  Moon,
  Sun,
  User
} from "lucide-react";
import { useState } from "react";

interface ModernHeaderProps {
  onStudentPortalClick: () => void;
}

export default function ModernHeader({ onStudentPortalClick }: ModernHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navigation = [
    { name: 'Features', href: '#features' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Docs', href: '#docs' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="url(#logo-gradient)" />
                  <path d="M10 22L16 10L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366F1" />
                      <stop offset="1" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-cyan-500 transition-all duration-300">
                  EduCreds
                </h1>
                <div className="text-xs text-neutral-500 -mt-1">Blockchain Certificates</div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button variant="ghost" className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50">
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="hidden sm:flex"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Language Selector */}
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Globe className="w-4 h-4 mr-1" />
              EN
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={onStudentPortalClick}>
                <User className="w-4 h-4 mr-2" />
                Student Portal
              </Button>
              <Link href="/verify">
                <Button variant="outline" size="sm">
                  <Wallet className="w-4 h-4 mr-2" />
                  Verify
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-neutral-600 hover:text-neutral-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
              
              <div className="border-t border-neutral-200 pt-3 mt-3 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => { onStudentPortalClick(); setIsMobileMenuOpen(false); }}>
                  <User className="w-4 h-4 mr-2" />
                  Student Portal
                </Button>
                <Link href="/verify">
                  <Button variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Verify Certificate
                  </Button>
                </Link>
                
                <Link href="/login">
                  <Button variant="ghost" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Button>
                </Link>
                
                <Link href="/register">
                  <Button className="w-full bg-gradient-to-r from-primary to-purple-600" onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white text-center py-2 text-sm">
        <div className="flex items-center justify-center space-x-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            New
          </Badge>
          <span>🎉 Template Marketplace now live! Create and sell certificate designs.</span>
          <Link href="/marketplace" className="underline hover:no-underline">
            Explore →
          </Link>
        </div>
      </div>
    </header>
  );
}