import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import ModernHeader from '@/components/modern/ModernHeader';

export default function MarketplacePage() {
  const [, setLocation] = useLocation();

  return (
    <>
      <ModernHeader onStudentPortalClick={() => setLocation('/student-portal')} />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-block mb-6">
            <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="text-sm font-medium text-blue-300">Coming Soon</span>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Certificate Template
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Marketplace
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
            We're building a comprehensive marketplace for certificate templates. Coming together in the next phase, you'll be able to discover, customize, and deploy professionally designed templates for your institution.
          </p>

          {/* Features list */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-colors">
              <div className="text-2xl mb-3">🎨</div>
              <h3 className="text-white font-semibold mb-2">Design Templates</h3>
              <p className="text-slate-400 text-sm">Pre-designed certificate templates ready to customize</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 transition-colors">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Quick Deploy</h3>
              <p className="text-slate-400 text-sm">One-click deployment of templates to your account</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/30 transition-colors">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="text-white font-semibold mb-2">Verified & Secure</h3>
              <p className="text-slate-400 text-sm">All templates verified and compliant with standards</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="px-8 py-6 border-slate-600 text-white hover:bg-slate-800/50 hover:border-slate-500"
            >
              Back to Home
            </Button>
            <Button
              onClick={() => setLocation('/templates')}
              className="px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2"
            >
              Explore Templates
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Newsletter signup */}
          <div className="mt-16 pt-12 border-t border-slate-700/50">
            <p className="text-slate-400 mb-4">Get notified when the marketplace launches</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                Notify Me
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
