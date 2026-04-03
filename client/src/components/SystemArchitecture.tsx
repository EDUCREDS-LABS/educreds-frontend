import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Fingerprint, 
  Award, 
  Scale, 
  Brain,
  CheckCircle,
  Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";

const layers = [
  {
    id: "identity",
    title: "Identity Layer",
    subtitle: "DIDs",
    icon: Fingerprint,
    color: "from-blue-500 to-indigo-600",
    glow: "rgba(59, 130, 246, 0.5)",
    features: [
      "Decentralized identifiers for institutions, learners, and governance actors",
      "Non-transferable (soulbound) identity NFTs for institutions",
      "Cryptographically provable and persistent ownership"
    ]
  },
  {
    id: "credential",
    title: "Credential Layer",
    subtitle: "W3C VC + NFT Status",
    icon: Award,
    color: "from-purple-500 to-pink-600",
    glow: "rgba(168, 85, 247, 0.5)",
    features: [
      "Credentials issued as W3C Verifiable Credentials",
      "Onchain credential status tracking (active, revoked, frozen)",
      "Soulbound to recipients, preventing transfer or resale",
      "Third-party verification without contacting issuer"
    ]
  },
  {
    id: "governance",
    title: "Governance Layer",
    subtitle: "DAO + PoIC",
    icon: Scale,
    color: "from-cyan-500 to-teal-600",
    glow: "rgba(13, 148, 136, 0.5)",
    features: [
      "DAO governs issuer eligibility, disputes, and revocations",
      "Non-tokenized governance power from institutional credibility",
      "Transparent, auditable decisions via smart contracts"
    ]
  },
  {
    id: "intelligence",
    title: "Intelligence Layer",
    subtitle: "EduCreds Trust Agent (ETA)",
    icon: Brain,
    color: "from-orange-500 to-red-600",
    glow: "rgba(249, 115, 22, 0.5)",
    features: [
      "Analytical support for governance processes",
      "Institutional legitimacy and behavioral risk evaluation",
      "Explainable PoIC recommendations and alerts",
      "Non-executive - does not override governance"
    ]
  }
];

export default function SystemArchitecture() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  // Auto-rotation logic
  useEffect(() => {
    if (hoveredIndex !== null) return;
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.15) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [hoveredIndex]);

  return (
    <section className="py-32 bg-slate-950 relative overflow-hidden text-slate-200">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(15,23,42,1),_rgba(2,6,23,1))]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        {/* Animated Glows */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none"
          animate={{
            backgroundColor: hoveredIndex !== null ? layers[hoveredIndex].glow : "rgba(30, 58, 138, 0.1)",
            scale: hoveredIndex !== null ? 1.3 : 1,
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3 fill-current" />
              <span>Modular Protocol</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black font-heading tracking-tight text-white mb-6">
              System <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Architecture</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
              A high-integrity stack of four specialized layers designed to automate trust and verification globally.
            </p>
          </motion.div>
        </div>

        {/* Desktop Interactive Layout */}
        <div className="hidden lg:block relative min-h-[720px] mt-10">
          
          {/* Orbital Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* SVG Connectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {layers.map((_, index) => {
                const angle = (index * 90 + rotation) * (Math.PI / 180);
                const r = 320; 
                const x2 = 50 + (Math.cos(angle) * r) / 10;
                const y2 = 50 + (Math.sin(angle) * r) / 10;
                
                const isHovered = hoveredIndex === index;
                
                return (
                  <motion.line
                    key={index}
                    x1="50%"
                    y1="50%"
                    x2={`${50 + (Math.cos(angle) * 32.5)}%`}
                    y2={`${50 + (Math.sin(angle) * 32.5)}%`}
                    stroke={isHovered ? "white" : "rgba(255,255,255,0.08)"}
                    strokeWidth={isHovered ? 2.5 : 1}
                    strokeDasharray={isHovered ? "6 6" : "none"}
                    animate={isHovered ? { strokeDashoffset: [0, -24] } : {}}
                    transition={isHovered ? { repeat: Infinity, duration: 0.8, ease: "linear" } : {}}
                    filter={isHovered ? "url(#lineGlow)" : "none"}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                  />
                );
              })}
            </svg>

            {/* Core */}
            <motion.div
              className="relative z-20"
              animate={{ 
                scale: hoveredIndex !== null ? 1.08 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-60 h-60 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-[0_0_100px_rgba(30,58,138,0.5)] relative overflow-hidden group">
                {/* Dynamic Core Overlay */}
                <motion.div 
                  className="absolute inset-0 blur-3xl opacity-30"
                  animate={{
                    backgroundColor: hoveredIndex !== null ? layers[hoveredIndex].glow : "rgba(30,58,138,0.2)",
                  }}
                  transition={{ duration: 0.5 }}
                />
                
                {/* Core Rings */}
                <motion.div 
                  className="absolute inset-4 rounded-full border border-blue-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-10 rounded-full border border-cyan-500/15"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                />
                
                <div className="text-center relative z-10 px-8">
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-400 mb-2">Protocol</p>
                  <h3 className="text-3xl font-black text-white font-heading tracking-tight leading-tight mb-2">EduCreds</h3>
                  <div className="h-0.5 w-14 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full mb-3" />
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Trust Engine v2.4</p>
                </div>
              </div>

              {/* Core Pulse Effect */}
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-blue-500/20 -z-10"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeOut" }}
              />
            </motion.div>

            {/* Orbiting Layer Cards */}
            <div className="absolute inset-0">
              {layers.map((layer, index) => {
                const angle = index * 90 + rotation;
                const isHovered = hoveredIndex === index;
                const isAnyHovered = hoveredIndex !== null;

                return (
                  <motion.div
                    key={layer.id}
                    className="absolute left-1/2 top-1/2 cursor-pointer origin-center"
                    style={{ 
                      x: `calc(${Math.cos(angle * (Math.PI / 180)) * 340}px - 50%)`,
                      y: `calc(${Math.sin(angle * (Math.PI / 180)) * 340}px - 50%)`,
                      zIndex: isHovered ? 50 : 10
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <motion.div
                      animate={{ 
                        scale: isHovered ? 1.08 : 1,
                        opacity: isAnyHovered && !isHovered ? 0.3 : 1,
                        filter: isAnyHovered && !isHovered ? "blur(2px) grayscale(0.5)" : "blur(0px) grayscale(0)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Card className={`w-[360px] border-white/10 bg-slate-900/90 backdrop-blur-xl overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 ${isHovered ? 'ring-2 ring-blue-500/40 shadow-blue-500/10' : ''}`}>
                        <div className={`h-1.5 bg-gradient-to-r ${layer.color} transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-30'}`} />
                        <div className="p-7">
                          <div className="flex items-center gap-5 mb-6">
                            <motion.div 
                              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${layer.color} flex items-center justify-center flex-shrink-0 shadow-xl`}
                              animate={isHovered ? { rotate: [0, 5, -5, 0] } : {}}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <layer.icon className="w-7 h-7 text-white" />
                            </motion.div>
                            <div>
                              <h4 className="text-xl font-black text-white tracking-tight leading-none mb-1.5">{layer.title}</h4>
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{layer.subtitle}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3.5">
                            {layer.features.map((feature, idx) => (
                              <motion.div 
                                key={idx} 
                                className="flex items-start gap-3.5"
                                initial={{ opacity: 0.6 }}
                                animate={{ 
                                  opacity: isHovered ? 1 : 0.6,
                                  x: isHovered ? 4 : 0
                                }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors duration-300 ${isHovered ? 'text-blue-400' : 'text-slate-700'}`} />
                                <span className="text-[13px] text-slate-400 leading-snug font-medium">{feature}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile View - Enhanced Scroll Experience */}
        <div className="lg:hidden space-y-10">
          <div className="flex justify-center mb-16">
            <motion.div 
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="w-52 h-52 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 blur-2xl" />
                <div className="text-center relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1.5">Core</p>
                  <h3 className="text-3xl font-black text-white tracking-tight">EduCreds</h3>
                </div>
              </div>
              <motion.div 
                className="absolute inset-0 rounded-full border border-blue-500/20"
                animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
            </motion.div>
          </div>

          {layers.map((layer, index) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <Card className="border-white/10 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xl">
                <div className={`h-2 bg-gradient-to-r ${layer.color}`} />
                <div className="p-7">
                  <div className="flex items-center gap-5 mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${layer.color} flex items-center justify-center shadow-lg`}>
                      <layer.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight">{layer.title}</h4>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{layer.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {layer.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-4 text-sm text-slate-400 leading-relaxed">
                        <CheckCircle className="w-4 h-4 text-blue-500/40 mt-1 flex-shrink-0" />
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          className="mt-32 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-slate-700 to-transparent mx-auto mb-10" />
          <p className="text-sm text-slate-500 italic max-w-4xl mx-auto font-light leading-loose tracking-wide px-4">
            "EduCreds architecture represents the pinnacle of decentralized academic verification, 
            bridging the gap between legacy credentials and future-proof digital identities through 
            a modular, high-integrity protocol stack."
          </p>
        </motion.div>
      </div>
    </section>
  );
}
