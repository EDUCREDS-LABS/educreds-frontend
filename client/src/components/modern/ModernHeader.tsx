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

import { useThemeStore } from "@/store/themeStore";

interface ModernHeaderProps {
  onStudentPortalClick?: () => void;
}

export default function ModernHeader({ onStudentPortalClick }: ModernHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  const navigation = [
    { name: 'Labs', href: '/' },
    { name: 'Infrastructure', href: '/infra' },
    { name: 'Registry', href: '/trust-registry' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Designer', href: '/designer' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-white/90 dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-700 shadow-sm flex items-center justify-center">
                  <img
                    src="https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775824626/logo_sftena.png"
                    alt="EduCreds"
                    className="h-6 w-6 object-contain drop-shadow-sm"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-cyan-500 transition-all duration-300">
                  EduCreds
                </h1>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 -mt-1">Blockchain Certificates</div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="outline"
                  className="rounded-full border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                >
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
              onClick={toggleTheme}
              className="hidden sm:flex text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Language Selector */}
            <Button variant="ghost" size="sm" className="hidden sm:flex text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Globe className="w-4 h-4 mr-1" />
              EN
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="outline" size="sm" className="rounded-full border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={onStudentPortalClick}>
                <User className="w-4 h-4 mr-2" />
                Student Portal
              </Button>
              <Link href="/verification-portal">
                <Button variant="outline" size="sm" className="rounded-full border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <Wallet className="w-4 h-4 mr-2" />
                  Verify
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="outline" size="sm" className="rounded-full border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  Sign In
                </Button>
              </Link>

              <Link href="/register">
                <Button size="sm" className="rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="secondary"
                    className="w-full justify-start rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 mt-3 space-y-2">
                <Button variant="secondary" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 shadow-sm" onClick={() => { onStudentPortalClick?.(); setIsMobileMenuOpen(false); }}>
                  <User className="w-4 h-4 mr-2" />
                  Student Portal
                </Button>
                <Link href="/verification-portal">
                  <Button variant="secondary" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 shadow-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Verify Certificate
                  </Button>
                </Link>

                <Link href="/login">
                  <Button variant="secondary" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 shadow-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Button>
                </Link>

                <Link href="/register">
                  <Button className="w-full rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md" onClick={() => setIsMobileMenuOpen(false)}>
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
          <span>📋</span>
          <span>our public registry is live track your onchain transactions.</span>
            <Link href="/trust-registry" className="underline text-yellow-400 hover:no-underline hover:text-yellow-300">
            Explore →
            </Link>
        </div>
      </div>
    </header>
  );
}
