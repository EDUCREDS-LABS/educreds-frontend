import React from 'react';

const partners = [
  { name: "University of Technology", logo: "https://i.pravatar.cc/100?u=uni1" },
  { name: "Global Blockchain Alliance", logo: "https://i.pravatar.cc/100?u=gba" },
  { name: "Future Ed Solutions", logo: "https://i.pravatar.cc/100?u=future" },
  { name: "Digital Credential Labs", logo: "https://i.pravatar.cc/100?u=dcl" },
  { name: "Apex Certification Body", logo: "https://i.pravatar.cc/100?u=apex" },
  { name: "EduTech Pioneers", logo: "https://i.pravatar.cc/100?u=edutech" },
  { name: "Modern Learning Institute", logo: "https://i.pravatar.cc/100?u=mli" },
  { name: "Smart Verify Systems", logo: "https://i.pravatar.cc/100?u=svs" },
];

export default function PartnersSection() {
  return (
    <section className="py-12 bg-neutral-50 overflow-hidden border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Trusted by leading institutions worldwide
        </p>
      </div>
      
      <div className="relative">
        <div className="flex space-x-12 scroll-left hover:[animation-play-state:paused]">
          {/* Double the list for infinite scroll */}
          {[...partners, ...partners].map((partner, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center min-w-[200px] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-neutral-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-neutral-500">
                  {partner.name[0]}
                </div>
                <span className="text-lg font-bold text-neutral-700 whitespace-nowrap">
                  {partner.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
