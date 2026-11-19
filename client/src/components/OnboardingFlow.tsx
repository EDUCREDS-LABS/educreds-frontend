import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronRight,
  ChevronLeft,
  Award,
  Users,
  Shield,
  Zap,
  CheckCircle,
  X,
  Vote,
  LayoutDashboard,
  FileText,
  Palette,
  BarChart3,
  Package,
  ScrollText,
  Webhook,
  Paintbrush,
  Link2,
  Key,
  Activity,
  GitBranch,
  Cpu,
  ShieldCheck,
  Globe,
  Sparkles,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DeploymentTier = 'workspace' | 'cloud-connector' | 'enterprise-connector';

const TIER_LABELS: Record<DeploymentTier, string> = {
  workspace: 'Tier 1 · Essentials',
  'cloud-connector': 'Tier 2 · Connected',
  'enterprise-connector': 'Tier 3 · Enterprise',
};

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
}

const FeatureCard = ({ icon: Icon, title, desc }: { icon: React.ComponentType<any>; title: string; desc: string }) => (
  <div className="relative p-4 border rounded-lg bg-white dark:bg-neutral-800 hover:border-blue-500/60 transition-colors">
    <div className="flex items-center gap-3 mb-2">
      <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <Icon className="size-5" />
      </div>
      <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{title}</h4>
    </div>
    <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">{desc}</p>
  </div>
);

const getSteps = (tier: DeploymentTier): OnboardingStep[] => {
  const isConnector = tier === 'cloud-connector' || tier === 'enterprise-connector';
  const isLowerTier = tier === 'workspace' || tier === 'cloud-connector';

  const welcomeContent = (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
        <Award className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold">Welcome to EduCreds!</h3>
      <p className="text-gray-600 dark:text-neutral-400 max-w-md mx-auto">
        You're set up on the <span className="font-bold text-neutral-900 dark:text-neutral-100">{TIER_LABELS[tier]}</span> deployment. This short tour shows where to issue credentials, track their status and manage your institution's identity.
      </p>
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="text-center">
          <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Secure</p>
        </div>
        <div className="text-center">
          <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Fast</p>
        </div>
        <div className="text-center">
          <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Trusted</p>
        </div>
      </div>
    </div>
  );

  const setupContent = (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold dark:text-white">Institutional Configuration</h3>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-white dark:bg-neutral-800">
          <h4 className="font-bold mb-2 text-neutral-900 dark:text-neutral-100">Institution Information</h4>
          <p className="text-sm text-gray-600 dark:text-neutral-400">Add your institution name, email and contact details</p>
        </div>
        <div className="p-4 border rounded-lg bg-white dark:bg-neutral-800">
          <h4 className="font-bold mb-2 text-neutral-900 dark:text-neutral-100">Governance & PoIC verification</h4>
          <p className="text-sm text-gray-600 dark:text-neutral-400">Submit identity and legal information to get verified by the protocol and unlock your full voting weight</p>
        </div>
        <div className="p-4 border rounded-lg bg-white dark:bg-neutral-800">
          <h4 className="font-bold mb-2 text-neutral-900 dark:text-neutral-100">Wallet configuration & batch signing</h4>
          <p className="text-sm text-gray-600 dark:text-neutral-400">Connect a signing key so you can issue credentials in bulk, securely</p>
        </div>
      </div>
    </div>
  );

  const governanceContent = (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Vote className="size-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Governance & Compliance Workshop</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Help shape platform standards and best practices for verifiable credentials</p>
        </div>
      </div>
      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-500/5 dark:border-emerald-500/20">
        <p className="text-sm text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
          {isLowerTier
            ? `As a ${TIER_LABELS[tier]} institution you have full voting rights on every available proposal and can join the Governance Workshop — these are not restricted to higher tiers.`
            : `As an Enterprise institution you have full governance rights, including voting on proposals and the Governance Workshop.`}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FeatureCard icon={Vote} title="Governance Workspace" desc="Open the Governance menu to view active proposals and cast your vote." />
        <FeatureCard icon={ShieldCheck} title="Compliance" desc="Access Verification, Enterprise Overview, AI Intelligence and Notification Settings." />
        <FeatureCard icon={Globe} title="Collective decisions" desc="Proposals are decided by the collective of institutions — your voice counts." />
        <FeatureCard icon={Sparkles} title="Governance Workshop" desc="Collaborate on roadmap and platform improvements alongside other institutions." />
      </div>
      <p className="text-xs text-gray-500 dark:text-neutral-400">
        Find these at any time from the <span className="font-semibold">Governance</span> and <span className="font-semibold">Compliance</span> sections of the left-hand menu.
      </p>
    </div>
  );

  const featureItems = isConnector
    ? [
        { icon: FileText, title: 'Issued Credentials', desc: 'Track and verify credentials already issued through your connector.' },
        { icon: Link2, title: 'Connector Config', desc: 'Wire EduCreds into your SIS / student information system.' },
        { icon: Key, title: 'API Keys', desc: 'Generate keys to integrate issuance programmatically.' },
        { icon: GitBranch, title: 'Data Mapping', desc: 'Map your source fields to the EduCreds credential schema.' },
        { icon: ShieldCheck, title: 'Delegated Signing', desc: 'Allow the protocol to sign batches on your behalf securely.' },
        { icon: Activity, title: 'Health Dashboard', desc: 'Monitor the live status of your integration.' },
        { icon: Cpu, title: 'Compliance', desc: 'Verification, AI Intelligence and Notification Settings.' },
        { icon: Vote, title: 'Governance', desc: 'Review and vote on platform governance proposals.' },
      ]
    : [
        { icon: Zap, title: 'Issue Credentials', desc: 'Create verifiable credentials in a few clicks.' },
        { icon: FileText, title: 'Issued Credentials', desc: 'Manage and revoke credentials you have issued.' },
        { icon: Palette, title: 'Templates', desc: 'Design and reuse professional certificate templates.' },
        { icon: BarChart3, title: 'Analytics', desc: 'Track issuance, adoption and verification metrics.' },
        { icon: Package, title: 'Batch Operations', desc: 'Issue and manage credentials at scale.' },
        { icon: ScrollText, title: 'Audit Trail', desc: 'Immutable record of every action on your account.' },
        { icon: Webhook, title: 'Webhooks', desc: 'React to events like proposal.created and vote_cast.' },
        { icon: Paintbrush, title: 'White Label', desc: 'Brand the experience for your institution.' },
      ];

  const featuresContent = (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Key features for your tier</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {featureItems.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-neutral-400">
        The AI Assistant (bottom-right) can answer questions about any of these at any time.
      </p>
    </div>
  );

  const completeContent = (
    <div className="text-center space-y-6">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-2xl font-bold">Congratulations!</h3>
      <p className="text-gray-600 dark:text-neutral-400 max-w-md mx-auto">
        Your EduCreds {TIER_LABELS[tier]} workspace is ready. You can issue credentials and participate in governance whenever you like.
      </p>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Button variant="outline" className="w-full" onClick={() => window.location.assign(isConnector ? '/connect/connector' : '/institution/issue')}>
          Explore Features
        </Button>
        <Button className="w-full" onClick={() => window.location.assign('/institution/governance-workspace')}>
          Open Governance
        </Button>
      </div>
    </div>
  );

  return [
    { id: 'welcome', title: 'Welcome to EduCreds', description: 'Your journey to secure digital certificates begins here', icon: Award, content: welcomeContent },
    { id: 'setup', title: 'Set Up Your Institution', description: 'Configure your institutional authority on the network', icon: Users, content: setupContent },
    { id: 'governance', title: 'Governance & Compliance', description: 'All institutions are nodes with voting rights', icon: Vote, content: governanceContent },
    { id: 'features', title: 'Platform Features', description: 'What you can do on your tier', icon: Sparkles, content: featuresContent },
    { id: 'complete', title: "You're All Set!", description: 'Start issuing certificates', icon: CheckCircle, content: completeContent },
  ];
};

interface OnboardingFlowProps {
  tier?: DeploymentTier;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ tier = 'workspace', onComplete, onSkip }) => {
  const steps = useMemo(() => getSteps(tier), [tier]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onSkip, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl flex max-h-[95vh] sm:max-h-[90vh]"
      >
        <Card className="relative bg-white dark:bg-neutral-900 border-none shadow-2xl overflow-hidden opacity-100 w-full flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="absolute top-3 right-3 z-10"
          >
            <X className="w-4 h-4" />
          </Button>

          <CardHeader className="pb-4 shrink-0">
            <div className="flex items-center justify-between mb-4 pr-8">
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Tour
              </Button>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = steps[currentStep].icon;
                  return <Icon className="w-5 h-5 text-blue-600" />;
                })()}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl leading-tight">{steps[currentStep].title}</h2>
                <p className="text-sm text-gray-600 dark:text-neutral-400 font-normal">
                  {steps[currentStep].description}
                </p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="pb-6 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="py-1"
              >
                {steps[currentStep].content}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          <div className="flex items-center justify-between gap-2 p-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button onClick={nextStep} className="flex items-center space-x-2">
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
