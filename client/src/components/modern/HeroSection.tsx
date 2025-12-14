import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe,
  CheckCircle,
  Play,
  Star
} from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-neutral-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Star className="w-3 h-3 mr-1" />
                Trusted by 500+ Institutions
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                <CheckCircle className="w-3 h-3 mr-1" />
                Blockchain Verified
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
                The Future of
                <span className="block bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  Academic Certificates
                </span>
                is Here
              </h1>
              
              <p className="text-xl text-neutral-600 max-w-2xl leading-relaxed">
                Issue, verify, and manage educational certificates with blockchain technology. 
                Eliminate fraud, ensure authenticity, and provide instant global verification.
              </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-neutral-700">100% Fraud-Proof</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-neutral-700">Instant Verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-neutral-700">Global Recognition</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-2 hover:bg-neutral-50"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-neutral-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">
                  <AnimatedCounter end={50000} suffix="+" />
                </div>
                <div className="text-sm text-neutral-600">Certificates Issued</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">
                  <AnimatedCounter end={500} suffix="+" />
                </div>
                <div className="text-sm text-neutral-600">Institutions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">
                  <AnimatedCounter end={99} suffix="%" />
                </div>
                <div className="text-sm text-neutral-600">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            {/* Main Visual Container */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-neutral-200">
              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-dashed border-primary/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-neutral-900">EduCreds Certificate</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="h-4 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 bg-neutral-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2 animate-pulse" />
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-neutral-500">Blockchain ID: 0x1a2b3c...</div>
                  <div className="w-16 h-16 bg-neutral-200 rounded animate-pulse" />
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-primary text-white p-3 rounded-full shadow-lg animate-bounce">
                <CheckCircle className="w-6 h-6" />
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-green-500 text-white p-2 rounded-full shadow-lg">
                <Shield className="w-4 h-4" />
              </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoPlaying && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg max-w-4xl w-full aspect-video">
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute -top-12 right-0 text-white hover:text-neutral-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full h-full bg-neutral-100 rounded-lg flex items-center justify-center">
              <p className="text-neutral-600">Demo video would be embedded here</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}