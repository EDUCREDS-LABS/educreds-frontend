import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const partners = [
  {
    name: "Microsoft for Startups",
    type: "Founders Hub",
    tagline: "Global program for high-growth startups",
    accent: "from-blue-500/15 to-blue-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1780222140/MS_Startups_Celebration_Badge_Dark_k1w3aa.png",
  },
  {
    name: "LvlUp Ventures",
    type: "Venture Capital",
    tagline: "Investing in the next generation of founders",
    accent: "from-purple-500/15 to-purple-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1780222139/lvlup_xmdijz.webp",
  },
  {
    name: "The Pitch by Deel",
    type: "Global Ecosystem",
    tagline: "Connecting startups with world-class opportunities",
    accent: "from-cyan-500/15 to-cyan-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1780222139/151803-DeelxThePitch_jvvbvl.avif",
  },
  {
    name: "National ICT Innovation Hub",
    type: "Innovation Hub",
    tagline: "Uganda's national digital home for innovation",
    accent: "from-emerald-500/15 to-emerald-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775206400/1775118481411_mozly3.png",
  },
  {
    name: "Science Technology and Innovation",
    type: "Government Agency",
    tagline: "Coordinating STI initiatives in Uganda",
    accent: "from-sky-500/15 to-sky-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775206979/1775118405736_ce1vzu.png",
  },
  {
    name: "ABQ Sovereign Cloud",
    type: "Cloud Provider",
    tagline: "Secure and compliant African cloud services",
    accent: "from-indigo-500/15 to-indigo-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775206979/1775118309097_y1vjlm.jpg",
  },
  {
    name: "Base",
    type: "Blockchain",
    tagline: "Ethereum L2 for scalable transactions",
    accent: "from-blue-500/15 to-blue-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775210988/1_gjdfln.png",
  },
  {
    name: "AfriCred Consortium",
    type: "Ecosystem",
    tagline: "Regional trust framework for Africa",
    accent: "from-lime-500/15 to-lime-500/5",
    logo: "",
  },
];

// Duplicate for continuous scroll
const duplicatedPartners = [...partners, ...partners, ...partners];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

export default function PartnersSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-600 text-xs font-black uppercase tracking-widest mb-6">
          Strategic Network
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight uppercase">
          Trusted Partners & <span className="text-blue-600">Ecosystem</span>.
        </h2>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium mt-4">
          Empowering institutions and learners through a global network of technology and governance partners.
        </p>
      </div>

      <div className="relative group">
        {/* Edge Fades */}
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <motion.div 
          className="flex gap-8"
          animate={{
            x: ["0%", "-33.33%"]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            }
          }}
          style={{ width: "fit-content" }}
        >
          {duplicatedPartners.map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className={`w-[320px] shrink-0 rounded-[32px] border border-neutral-100 bg-neutral-50 p-8 shadow-sm transition-all duration-500 group-hover:grayscale-[0.5] hover:!grayscale-0 hover:!bg-white hover:shadow-xl hover:-translate-y-2 relative overflow-hidden`}
            >
              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-gradient-to-br ${partner.accent} opacity-50 blur-2xl group-hover:opacity-100 transition-opacity`} />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="size-20 rounded-2xl bg-white flex items-center justify-center p-3 shadow-inner border border-neutral-50 overflow-hidden">
                    {partner.logo ? (
                      <img
                        src={partner.logo}
                        alt={`${partner.name} logo`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xl font-black tracking-tight text-neutral-300">
                        {getInitials(partner.name)}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-neutral-200 text-neutral-400 bg-white">
                    {partner.type}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-neutral-900 tracking-tight mb-1">
                    {partner.name}
                  </h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed line-clamp-2">
                    {partner.tagline}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
