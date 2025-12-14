import VerificationSection from '../components/VerificationSection';
import ModernHeader from '../components/modern/ModernHeader';
import HeroSection from '../components/modern/HeroSection';
import FeaturesSection from '../components/modern/FeaturesSection';
import ModernFooter from '../components/modern/ModernFooter';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Wallet,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StudentPortalModal from '../components/StudentPortalModal';

export default function Landing() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [documentationOpen, setDocumentationOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [studentPortalOpen, setStudentPortalOpen] = useState(false);
  
  const images = [
    {
      src: "/images/Picture1.png",
      alt: "Student holding an EduCreds certificate",
      title: "Student Certificate Verification"
    },
    {
      src: "/images/Picture3.png", 
      alt: "Tierd certificate due to old system of issuing certificates",
      title: "Blockchain Certificate Management"
    },
    {
      src: "/images/Picture2.png",
      alt: "A certificate in wallet", 
      title: "Digital Wallet Integration"
    }
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Auto-advance slides every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fix: roadmapText should be a string, not a code block or template literal with unescaped newlines
const roadmapText = `EDUCREDS PROJECT ROADMAP: A DETAILED BREAKDOWN\n\nEducreds is developing a blockchain-based platform for secure, verifiable, and accessible academic certificates. This roadmap outlines the project's phased development and future expansion.\n\nPHASE 1: FOUNDATION (Q1 2025)\nThis foundational phase focuses on establishing the core technical components of the Educreds platform.\n\n  - Smart Contract Development (Q2 2025):\n    Creation and testing of an NFT-based certificate contract (ERC721).\n    Implementation of logic for issuing, verifying, and revoking academic certificates.\n\n  - Frontend MVP and Backend Deployment (Q2 2025):\n    Development of a user interface (UI) for institutions to issue certificates.\n    Development of a UI for verifiers (employers, parents) to check certificate authenticity.\n\n  - Testnet Deployment (Q4 2026):\n    Deployment of the smart contract to Base Testnet or Sepolia.\n    Execution of functional tests for minting and viewing certificates.\n\nPHASE 2: BETA RELEASE (Q1-Q3 2026)\nThis phase involves public testing and the integration of key features to enhance platform functionality.\n\n  - Launch Web App Publicly (Testnet):\n    Invitation for real schools to test the platform.\n    Inclusion of institution registration and simple verification functionalities.\n\n  - PDF Generation & IPFS Integration (Q3 2026):\n    Automated generation of PDF versions of certificates with all associated metadata.\n    Storage of PDF hashes on IPFS, with links to the corresponding NFTs.\n\n  - Role Management (Q3 2026):\n    Addition of frontend separation for "Issuer" and "Verifier" views.\n\n  - Gather Feedback:\n    Onboarding of early testers to collect crucial user experience (UX) and functionality feedback.\n\nPHASE 3: TOKEN INTEGRATION & MAINNET (Q4 2026)\nThis crucial phase marks the introduction of the native token and the transition to the mainnet.\n\n  - Launch $EDUC Token (ERC20):\n    Deployment of the project's native utility token for subscriptions, access fees, or verification credits.\n\n  - Subscription System:\n    Institutions will pay monthly or per-certificate fees using the $EDUC token.\n    Verifiers (employers) will pay small, gas-free fees for deep verification access.\n\n  - Smart Contract Upgrade:\n    Inclusion of token-based access controls and advanced metadata formats.\n\n  - Deploy to Base or Polygon Mainnet:\n    Migration of tested contracts and data to the production environment.\n\nPHASE 4: EXPANSION & ECOSYSTEM (2026+)\nThis phase focuses on broad expansion and ecosystem development to maximize Educreds's utility and reach.\n\n  - API + SDK for Integration:\n    Allowing third parties, such as universities and EdTech platforms, to integrate via API.\n\n  - Mobile App:\n    Enabling on-the-go verification and certificate scanning.\n\n  - ZK/Privacy Layer:\n    Integrating zero-knowledge proofs for privacy-compliant certificate verification.\n\n  - Partner Onboarding:\n    Collaborating with government bodies, schools, and recruiters to foster adoption.\n\n  - Token Utility Expansion:\n    Introducing a reward system, staking for trusted institutions, gas subsidies, and other token-related utilities.\n\n  - Certificate Templates Marketplace:\n    Purchase custom certificate styles using $EDUC.\n\n  - Graduate Badges:\n    NFTs representing student milestones.\n\n  - AI Detection for Certificate Fraud:\n    Implementing AI to combat certificate fraud.`;
  return (
    <div className="min-h-screen bg-white">
      {/* Modern Header */}
      <ModernHeader onStudentPortalClick={() => setStudentPortalOpen(true)} />

      {/* Modern Hero Section */}
      <HeroSection />

      {/* Modern Features Section */}
      <FeaturesSection />

      <VerificationSection />

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

      {/* Image Carousel Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              See EduCreds in Action
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Discover how our platform transforms educational certificate management
            </p>
          </div>
          
          <div className="relative">
            {/* Main Image Container */}
            <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white">
              <div className="relative h-[500px] md:h-[600px] lg:h-[700px]">
                <img
                  src={images[currentImageIndex].src}
                  alt={images[currentImageIndex].alt}
                  className="w-full h-full object-contain transition-all duration-700 ease-in-out"
                />
                
                {/* Image Overlay with Title */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {images[currentImageIndex].title}
                  </h3>
                  <p className="text-white/90 text-lg">
                    {images[currentImageIndex].alt}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'bg-primary scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>

            {/* Image Counter */}
            <div className="text-center mt-4 text-sm text-gray-600">
              {currentImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Simple, secure, and efficient certificate management in three easy steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Institution Registration
              </h3>
              <p className="text-neutral-600">
                Educational institutions register and get verified on our platform with secure credentials and documentation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-secondary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Certificate Issuance
              </h3>
              <p className="text-neutral-600">
                Verified institutions issue certificates directly to students' blockchain wallets with all relevant details.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-accent-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Instant Verification
              </h3>
              <p className="text-neutral-600">
                Students and employers can instantly verify certificates using our platform or blockchain explorers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              The brilliant minds behind EduCreds, revolutionizing educational certificates through blockchain technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {/* Team Member 1 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src="/images/CEO.jpg" 
                    alt="Team Member 1" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '';
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                  CEO & Founder
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">KYOTOYINZE ABDULMAJID</h3>
              <p className="text-neutral-600 mb-4 text-sm">
                Blockchain architect and education technology visionary
              </p>
              <div className="flex justify-center space-x-3">
                <a href="https://linkedin.com/in/kyotoyinze-abdulmajid" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com/256cryptok41587" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="https://github.com/shabantiger" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 4.624-5.479 4.92.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src="/images/t3.jpg" 
                    alt="Team Member 2" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '';
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-secondary text-white px-3 py-1 rounded-full text-sm font-medium">
                  CTO
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">MUDEBO SAMUSI</h3>
              <p className="text-neutral-600 mb-4 text-sm">
                Full-stack developer and blockchain specialist
              </p>
              <div className="flex justify-center space-x-3">
                <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com/Denzam1872489" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 4.624-5.479 4.92.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src="/images/t1.jpg" 
                    alt="Team Member 3" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face';
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-accent text-white px-3 py-1 rounded-full text-sm font-medium">
                  Lead Developer
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">SSEKIZIYIVU PAUL</h3>
              <p className="text-neutral-600 mb-4 text-sm">
                Network communications and UI/UX specialist
              </p>
              <div className="flex justify-center space-x-3">
                <a href="https://linkedin.com/in/michaelrodriguez" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com/michaelrodriguez" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="https://github.com/michaelrodriguez" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 4.624-5.479 4.92.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>

            {/* Team Member 4 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src="/images/t2.jpg" 
                    alt="Team Member 4" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face';
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Blockchain Engineer
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">NABASIRYE SEANICE</h3>
              <p className="text-neutral-600 mb-4 text-sm">
                Smart contract developer and DeFi expert
              </p>
              <div className="flex justify-center space-x-3">
                <a href="https://linkedin.com/in/emmathompson" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com/emmathompson" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="https://github.com/emmathompson" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 4.624-5.479 4.92.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>

            {/* Team Member 5 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src="/images/t4.jpg" 
                    alt="t4" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face';
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Product Manager
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">BALAMAGA EXPERITO</h3>
              <p className="text-neutral-600 mb-4 text-sm">
                Product strategy and user experience expert
              </p>
              <div className="flex justify-center space-x-3">
                <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                </a>
                <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="https://github.com/davidkim" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 4.624-5.479 4.92.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>
          </div>
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

      <Dialog open={roadmapOpen} onOpenChange={setRoadmapOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>EduCreds Project Roadmap</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-sm text-neutral-800">{roadmapText}</pre>
        </DialogContent>
      </Dialog>
<Dialog open={documentationOpen} onOpenChange={setDocumentationOpen}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Documentation</DialogTitle>
    </DialogHeader>
    <div className="text-sm text-neutral-800 space-y-6">
      <section>
        <h3 className="font-bold text-lg mb-2">EduCreds: Your Blockchain-Based Academic Certificate Platform</h3>
        <p>
          EduCreds is a revolutionary blockchain-powered platform designed to transform how academic certificates are issued, verified, and managed.
        </p>
      </section>
      <section>
        <h4 className="font-semibold mt-4 mb-1">What is EduCreds?</h4>
        <ul className="list-disc list-inside ml-4">
          <li>Allows educational institutions to issue academic certificates as Non-Fungible Tokens (NFTs).</li>
          <li>Enables employers, students, and third parties to instantly verify the authenticity of certificates.</li>
          <li>Eliminates certificate fraud, expedites verification, and provides a transparent, permanent record of achievements.</li>
        </ul>
      </section>
      <section>
        <h4 className="font-semibold mt-4 mb-1">Technologies Used</h4>
        <ul className="list-disc list-inside ml-4">
          <li><b>Frontend:</b>
            <ul className="list-disc list-inside ml-6">
              <li>React 18 with TypeScript, Vite build tool</li>
              <li>Shadcn/UI components (Radix UI), styled with Tailwind CSS</li>
              <li>TanStack React Query for server state management</li>
              <li>Wouter for client-side routing</li>
              <li>React Hook Form + Zod for form validation</li>
              <li>JWT-based authentication with local storage</li>
            </ul>
          </li>
          <li><b>Backend:</b>
            <ul className="list-disc list-inside ml-6">
              <li>Express.js with TypeScript on Node.js</li>
              <li>RESTful API with middleware for logging and error handling</li>
              <li>Custom Vite integration for hot module replacement</li>
              <li>Modular route organization and storage abstraction</li>
            </ul>
          </li>
          <li><b>Smart Contract Layer:</b>
            <ul className="list-disc list-inside ml-6">
              <li>Solidity for NFT certificate contracts</li>
              <li>Deployed on Base Network (Ethereum L2 by Coinbase)</li>
              <li>Ethers.js for frontend smart contract interaction</li>
              <li>MetaMask wallet connection support</li>
            </ul>
          </li>
          <li><b>Storage & Metadata:</b>
            <ul className="list-disc list-inside ml-6">
              <li>MongoDB for user and institution data</li>
              <li>IPFS/Pinata for certificate metadata storage</li>
              <li>JWT for stateless authentication</li>
              <li>Route-level authentication guards</li>
              <li>Separate flows for institutions and students</li>
            </ul>
          </li>
        </ul>
      </section>
      <section>
        <h4 className="font-semibold mt-4 mb-1">How It Works</h4>
        <ol className="list-decimal list-inside ml-4 space-y-2">
          <li>
            <b>Institution Registration & Certificate Issuance</b>
            <ul className="list-disc list-inside ml-6">
              <li>Institutions apply to join and submit required documentation (registration license, trading license, government approval, etc.).</li>
              <li>EduCreds team reviews and approves applications before granting issuing rights.</li>
              <li>Institutions fill out a form with student details; the smart contract mints an NFT certificate to the student's wallet.</li>
            </ul>
          </li>
          <li>
            <b>Certificate Verification (Employer / Third Party)</b>
            <ul className="list-disc list-inside ml-6">
              <li>Employers enter the certificate ID or student's wallet address.</li>
              <li>The smart contract fetches certificate details directly from the blockchainâ€”no middlemen, no forgery possible.</li>
            </ul>
          </li>
        </ol>
      </section>
      <section>
        <h4 className="font-semibold mt-4 mb-1">Key Benefits</h4>
        <ul className="list-disc list-inside ml-4">
          <li>Fraud-Proof: Certificates cannot be faked or altered.</li>
          <li>Instant Verification: Employers can verify certificates in seconds without contacting institutions.</li>
          <li>Global Recognition: Certificates are accessible worldwide.</li>
          <li>Permanence: Certificates are stored permanently, independent of the issuing institution's server.</li>
        </ul>
      </section>
      <section>
        <p className="italic text-xs mt-4">This documentation provides a comprehensive overview of the EduCreds platform.</p>
      </section>
    </div>
  </DialogContent>
</Dialog>
<Dialog open={contactOpen} onOpenChange={setContactOpen}>
  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Connect with EduCreds</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 text-neutral-800">
      <div className="flex items-center space-x-2">
        <span className="font-semibold">Twitter/X:</span>
        <a href="https://x.com/educreds_cert" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">x.com/educreds_cert</a>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-semibold">Gmail:</span>
        <a href="admin@educreds.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Gmail</a>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-semibold">Discord:</span>
        <span className="text-neutral-500">coming soon</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-semibold">Telegram:</span>
        <span className="text-neutral-500">coming soon</span>
      </div>
    </div>
  </DialogContent>
</Dialog>

      <StudentPortalModal open={studentPortalOpen} onOpenChange={setStudentPortalOpen} />
    </div>
  );
}
