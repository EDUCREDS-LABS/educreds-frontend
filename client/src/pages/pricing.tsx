import ModernHeader from '../components/modern/ModernHeader';
import ModernFooter from '../components/modern/ModernFooter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "wouter";

const tiers = [
  {
    name: "Free",
    price: "$0",
    features: [
      "50 Certificate Issuances per year",
      "Basic Certificate Templates",
      "Student Self-Service Portal",
      "Basic Analytics",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$99",
    features: [
      "1000 Certificate Issuances per year",
      "Premium Certificate Templates",
      "Advanced Certificate Designer",
      "Advanced Analytics",
      "Priority Support",
    ],
    cta: "Upgrade to Pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited Certificate Issuances",
      "Custom Certificate Templates",
      "Dedicated Account Manager",
      "API Access",
      "On-Premise Deployment Option",
    ],
    cta: "Contact Us",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <ModernHeader />
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Find the perfect plan for your institution
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Whether you're a small school or a large university, we have a plan that fits your needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Card key={tier.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.price}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button className="w-full">{tier.cta}</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <ModernFooter />
    </div>
  );
}
