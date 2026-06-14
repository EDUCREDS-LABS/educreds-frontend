import React from 'react';
import { InfoPageLayout } from '@/components/InfoPageLayout';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Globe, Shield } from "lucide-react";
import { Link } from "wouter";

const tiers = [
  {
    name: "Starter Node",
    price: "$29",
    period: "/mo",
    badge: "For Individual Educators",
    icon: Zap,
    features: [
      "Up to 200 credentials / mo",
      "Standard DID integration",
      "Public Registry listing",
      "Email support (24h)",
    ],
    cta: "Choose Starter",
    color: "border-blue-100"
  },
  {
    name: "Enterprise Node",
    price: "$99",
    period: "/mo",
    badge: "For Accredited Institutions",
    icon: Globe,
    popular: true,
    features: [
      "Up to 2,000 credentials / mo",
      "Advanced Template Designer",
      "Batch Issuance Engine",
      "Custom PoIC scoring",
      "Priority Support (4h)",
    ],
    cta: "Scale with Pro",
    color: "border-indigo-200"
  },
  {
    name: "Network Authority",
    price: "Custom",
    period: "",
    badge: "For Governments & Agencies",
    icon: Shield,
    features: [
      "Unlimited throughput",
      "White-label Trust Agent",
      "On-premise HSM integration",
      "Governance DAO seat",
      "24/7 Dedicated Ops",
    ],
    cta: "Contact Architecture",
    color: "border-emerald-100"
  },
];

export default function PricingPage() {
  return (
    <InfoPageLayout 
      title="Protocol Access" 
      subtitle="Scalable infrastructure tiers designed for every institutional requirement, from individual nodes to national registries."
      badge="Pricing Tiers"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <Card key={tier.name} className={`flex flex-col relative rounded-[40px] shadow-2xl border-none bg-white transition-all duration-500 hover:-translate-y-2 overflow-hidden ${tier.popular ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-white' : ''}`}>
            {tier.popular && (
              <div className="absolute top-0 right-0 p-6">
                <Badge className="bg-blue-600 text-white border-none px-3 py-1 font-black uppercase text-[8px] tracking-widest">Recommended</Badge>
              </div>
            )}
            <CardHeader className="p-10 pb-6 border-b border-neutral-50">
              <div className="size-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-blue-600 mb-4">
                <tier.icon className="size-6" />
              </div>
              <CardTitle className="text-2xl font-black text-neutral-900 leading-none">{tier.name}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-neutral-400 mt-2">{tier.badge}</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8 flex-grow">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-neutral-900 tracking-tighter">{tier.price}</span>
                <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{tier.period}</span>
              </div>
              <ul className="space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm font-medium text-neutral-600">
                    <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-10 pt-0">
              <Link href="/register" className="w-full">
                <Button className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${tier.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
                  {tier.cta} <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </InfoPageLayout>
  );
}
