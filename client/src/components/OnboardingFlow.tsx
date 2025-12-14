import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to EduCreds',
    description: 'Your journey to secure digital certificates begins here',
    icon: Award,
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
          <Award className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold">Welcome to EduCreds!</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          We'll help you get started with creating and managing secure, blockchain-verified certificates in just a few steps.
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
    )
  },
  {
    id: 'setup',
    title: 'Institution Setup',
    description: 'Configure your institution profile',
    icon: Users,
    content: (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Set Up Your Institution</h3>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Institution Information</h4>
            <p className="text-sm text-gray-600">Add your institution name, logo, and contact details</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Branding</h4>
            <p className="text-sm text-gray-600">Customize colors and styling for your certificates</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Verification Settings</h4>
            <p className="text-sm text-gray-600">Configure how recipients can verify their certificates</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'templates',
    title: 'Choose Templates',
    description: 'Select from our professional certificate templates',
    icon: Award,
    content: (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Choose Your Templates</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Academic Certificate', popular: true },
            { name: 'Professional Training', popular: false },
            { name: 'Achievement Award', popular: true },
            { name: 'Completion Certificate', popular: false }
          ].map((template, index) => (
            <div key={index} className="relative p-4 border rounded-lg hover:border-blue-500 cursor-pointer">
              {template.popular && (
                <Badge className="absolute -top-2 -right-2 bg-orange-500">Popular</Badge>
              )}
              <div className="w-full h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded mb-2"></div>
              <p className="font-medium text-sm">{template.name}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          You can customize these templates or browse our marketplace for more options later.
        </p>
      </div>
    )
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start issuing certificates',
    icon: CheckCircle,
    content: (
      <div className="text-center space-y-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold">Congratulations!</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Your EduCreds account is ready. You can now start creating and issuing secure digital certificates.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Button variant="outline" className="w-full">
            Browse Templates
          </Button>
          <Button className="w-full">
            Issue First Certificate
          </Button>
        </div>
      </div>
    )
  }
];

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl"
      >
        <Card className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10"
          >
            <X className="w-4 h-4" />
          </Button>

          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline">
                Step {currentStep + 1} of {onboardingSteps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Tour
              </Button>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <onboardingSteps[currentStep].icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl">{onboardingSteps[currentStep].title}</h2>
                <p className="text-sm text-gray-600 font-normal">
                  {onboardingSteps[currentStep].description}
                </p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[300px] flex items-center"
              >
                {onboardingSteps[currentStep].content}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8">
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
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button onClick={nextStep} className="flex items-center space-x-2">
                <span>{currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};