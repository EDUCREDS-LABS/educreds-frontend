import { motion } from "framer-motion";
import { 
  Fingerprint, 
  Award, 
  Scale, 
  Brain,
  CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";

const layers = [
  {
    id: "identity",
    title: "Identity Layer",
    subtitle: "DIDs",
    icon: Fingerprint,
    color: "from-blue-500 to-indigo-600",
    position: "top",
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
    position: "right",
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
    position: "bottom",
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
    position: "left",
    features: [
      "Analytical support for governance processes",
      "Institutional legitimacy and behavioral risk evaluation",
      "Explainable PoIC recommendations and alerts",
      "Non-executive - does not override governance"
    ]
  }
];

export default function SystemArchitecture() {
  const getPositionClasses = (position: string) => {
    switch (position) {
      case "top":
        return "lg:col-start-2 lg:row-start-1";
      case "right":
        return "lg:col-start-3 lg:row-start-2";
      case "bottom":
        return "lg:col-start-2 lg:row-start-3";
      case "left":
        return "lg:col-start-1 lg:row-start-2";
      default:
        return "";
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-neutral-50 to-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-neutral-900 mb-4">
              System Architecture
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              EduCreds is composed of four modular layers, each responsible for a distinct trust function
            </p>
          </motion.div>
        </div>

        {/* Architecture Grid */}
        <div className="relative">
          {/* Desktop Ring Layout */}
          <div className="hidden lg:grid lg:grid-cols-3 lg:grid-rows-3 gap-8 max-w-5xl mx-auto">
            {/* Center Core */}
            <motion.div
              className="lg:col-start-2 lg:row-start-2 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                {/* Connecting Lines - Decorative circles */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-dashed border-primary/20 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-dashed border-primary/10 rounded-full" />
                </div>
                
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl">
                  <div className="text-center text-white p-6">
                    <h3 className="text-2xl font-bold font-heading mb-2">EduCreds</h3>
                    <p className="text-sm opacity-90">Blockchain-Anchored Credentials</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Layer Cards */}
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                className={getPositionClasses(layer.position)}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <Card className="h-full overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all group">
                  <div className={`h-3 bg-gradient-to-r ${layer.color}`} />
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${layer.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <layer.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold font-heading text-neutral-900 mb-1">
                          {layer.title}
                        </h3>
                        <p className="text-sm font-medium text-neutral-500">{layer.subtitle}</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {layer.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-neutral-700">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Mobile Stacked Layout */}
          <div className="lg:hidden space-y-6">
            {/* Center Core */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-56 h-56 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl">
                <div className="text-center text-white p-6">
                  <h3 className="text-2xl font-bold font-heading mb-2">EduCreds</h3>
                  <p className="text-sm opacity-90">Blockchain-Anchored Credentials</p>
                </div>
              </div>
            </motion.div>

            {/* Layer Cards Stacked */}
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <div className={`h-3 bg-gradient-to-r ${layer.color}`} />
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${layer.color} flex items-center justify-center flex-shrink-0`}>
                        <layer.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold font-heading text-neutral-900 mb-1">
                          {layer.title}
                        </h3>
                        <p className="text-sm font-medium text-neutral-500">{layer.subtitle}</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {layer.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-neutral-700">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Note */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-sm text-neutral-500 italic max-w-3xl mx-auto">
            Each layer operates independently yet synergistically, ensuring a robust, transparent, 
            and tamper-proof infrastructure for academic credentials.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
