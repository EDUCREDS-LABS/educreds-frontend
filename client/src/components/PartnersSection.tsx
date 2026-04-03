const partners = [
  {
    name: "National Ict Innovation Hub",
    type: "innovation hub",
    tagline: "uganda`s national digital home for innovation",
    accent: "from-emerald-500/15 to-emerald-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775206400/1775118481411_mozly3.png",
  },
  {
    name: "Science technology and innovation-secretariat",
    type: "Government Agency",
    tagline: "STI Secretariat is responsible for coordinating and promoting science, technology, and innovation initiatives in Uganda.",
    accent: "from-sky-500/15 to-sky-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775206979/1775118405736_ce1vzu.png",
  },
  {
    name: "ABQ sovereign cloud",
    type: "Cloud Provider",
    tagline: "first sovereign cloud in uganda, providing secure and compliant cloud services tailored for the unique needs of African businesses and governments.",
    accent: "from-indigo-500/15 to-indigo-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775206979/1775118309097_y1vjlm.jpg",
  },
  {
    name: "Base",
    type: "Blockchain",
    tagline: "Ethereum L2 for low-cost, scalability and fast blockchain transactions",
    accent: "from-blue-500/15 to-blue-500/5",
    logo: "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775210988/1_gjdfln.png",
  },
  {
    name: "Polygon",
    type: "Blockchain",
    tagline: "Scalable certificate NFTs",
    accent: "from-violet-500/15 to-violet-500/5",
    logo: "",
  },
  {
    name: "Sepolia",
    type: "Testnet",
    tagline: "Audit-ready issuance",
    accent: "from-amber-500/15 to-amber-500/5",
    logo: "",
  },
  {
    name: "LearnFlow",
    type: "EdTech Platform",
    tagline: "LMS grade-to-credential",
    accent: "from-rose-500/15 to-rose-500/5",
    logo: "",
  },
  {
    name: "CampusPro",
    type: "SIS Platform",
    tagline: "Registrar automation",
    accent: "from-teal-500/15 to-teal-500/5",
    logo: "",
  },
  {
    name: "OpenSkills",
    type: "Learning Platform",
    tagline: "Micro-credential pipelines",
    accent: "from-orange-500/15 to-orange-500/5",
    logo: "",
  },
  {
    name: "AfriCred Consortium",
    type: "Ecosystem",
    tagline: "Regional trust framework",
    accent: "from-lime-500/15 to-lime-500/5",
    logo: "",
  },
];

const duplicatedPartners = [...partners, ...partners];

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
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-neutral-900 mb-3">
            Trusted Partners & Ecosystem
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Universities, blockchain networks, and learning platforms building verifiable credentials with EduCreds.
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent" />

          <div className="flex gap-6 w-max partners-scroll">
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className={`w-[240px] shrink-0 rounded-2xl border border-neutral-200 bg-gradient-to-br ${partner.accent} p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-25 w-25 items-center justify-center rounded-xl bg-white text-sm font-semibold text-neutral-800 shadow">
                    {partner.logo ? (
                      <img
                        src={partner.logo}
                        alt={`${partner.name} logo`}
                        className="h-20 w-20 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs font-bold tracking-wide text-neutral-700">
                        {getInitials(partner.name)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {partner.type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {partner.name}
                </h3>
                <p className="text-sm text-neutral-600">
                  {partner.tagline}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
