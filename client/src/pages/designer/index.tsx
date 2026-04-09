import { ArrowRight, Zap, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import ModernHeader from '@/components/modern/ModernHeader';

export default function DesignerPage() {
  const [, setLocation] = useLocation();

  return (
    <>
      <ModernHeader onStudentPortalClick={() => setLocation('/student-portal')} />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-block mb-6">
            <div className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <span className="text-sm font-medium text-purple-300">Coming Soon</span>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Certificate Design
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
              Studio
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
            Professional certificate design tools are on the way. Create stunning, customizable certificates with our intuitive drag-and-drop designer and advanced templating features.
          </p>

          {/* Features list */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 transition-colors">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="text-white font-semibold mb-2">Drag & Drop Editor</h3>
              <p className="text-slate-400 text-sm">Intuitive interface for designing certificates without coding</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/30 transition-colors">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-white font-semibold mb-2">Rich Customization</h3>
              <p className="text-slate-400 text-sm">Colors, fonts, logos, and layouts tailored to your brand</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-red-500/30 transition-colors">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-slate-400 text-sm">Track template usage, downloads, and engagement metrics</p>
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
              className="px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center gap-2"
            >
              Browse Templates
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Newsletter signup */}
          <div className="mt-16 pt-12 border-t border-slate-700/50">
            <p className="text-slate-400 mb-4">Be the first to know when the designer launches</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
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
