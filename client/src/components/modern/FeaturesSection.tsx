import { 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  Users, 
  BarChart3,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Shield,
    title: "Fraud-Proof Security",
    description: "Blockchain technology ensures certificates cannot be forged or tampered with.",
    benefits: ["Immutable records", "Cryptographic verification", "Tamper-proof storage"],
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Zap,
    title: "Instant Verification",
    description: "Verify any certificate in seconds without contacting the issuing institution.",
    benefits: ["Real-time verification", "Global accessibility", "24/7 availability"],
    color: "text-yellow-600",
    bgColor: "bg-yellow-50"
  },
  {
    icon: Globe,
    title: "Global Recognition",
    description: "Certificates are recognized worldwide with standardized blockchain protocols.",
    benefits: ["International standards", "Cross-border validity", "Universal acceptance"],
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    icon: Lock,
    title: "Privacy Protected",
    description: "Advanced encryption keeps sensitive student data secure and private.",
    benefits: ["GDPR compliant", "End-to-end encryption", "Selective disclosure"],
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: Users,
    title: "Multi-Stakeholder",
    description: "Designed for institutions, students, employers, and verification services.",
    benefits: ["Role-based access", "Collaborative workflows", "Stakeholder dashboards"],
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Comprehensive analytics help institutions track and improve their programs.",
    benefits: ["Usage analytics", "Performance metrics", "Trend analysis"],
    color: "text-cyan-600",
    bgColor: "bg-cyan-50"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Platform Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Everything you need for
            <span className="block text-primary">modern certificate management</span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools institutions need to issue, 
            manage, and verify educational certificates in the digital age.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:shadow-xl">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-neutral-600 mb-4">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-neutral-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
              How EduCreds Works
            </h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Simple, secure, and efficient certificate management in three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              </div>
              <h4 className="text-xl font-semibold text-neutral-900 mb-2">
                Institution Registration
              </h4>
              <p className="text-neutral-600">
                Educational institutions register and get verified on our platform with secure credentials.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-secondary to-transparent"></div>
              </div>
              <h4 className="text-xl font-semibold text-neutral-900 mb-2">
                Certificate Issuance
              </h4>
              <p className="text-neutral-600">
                Verified institutions issue certificates directly to students' blockchain wallets.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-neutral-900 mb-2">
                Instant Verification
              </h4>
              <p className="text-neutral-600">
                Students and employers can instantly verify certificates using our platform.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}