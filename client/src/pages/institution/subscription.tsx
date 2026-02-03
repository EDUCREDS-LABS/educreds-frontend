import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Check, 
  Download, 
  CreditCard, 
  Zap, 
  Users, 
  Database, 
  Phone, 
  Star,
  AlertCircle,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  PaymentMethodSelector, 
  StripeCardPaymentForm, 
  StripeProvider,
  PayPalPayment,
  CryptoPayment 
} from "@/components/payment";
import type { PaymentMethodType } from "@/components/payment/PaymentMethodSelector";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  limits: {
    certificatesPerMonth: number;
    storageGB: number;
    apiCalls: number;
  };
  highlighted?: boolean;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('stripe');

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription/current"],
    enabled: !!user,
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription/plans"],
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/subscription/payments"],
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: (data: { planId: string; paymentMethod: string }) => api.subscribe(data),
    onSuccess: () => {
      toast({
        title: "Subscription updated",
        description: "Your subscription has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelSubscription(),
    onSuccess: () => {
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    queryClient.invalidateQueries({ queryKey: ["/api/subscription/payments"] });
  };

  const handlePaymentError = (error: Error) => {
    toast({
      title: "Payment Failed",
      description: error.message || "An error occurred during payment processing.",
      variant: "destructive",
    });
  };

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      currency: 'USD',
      description: 'Perfect for small and mid-sized institutions evaluating EduCreds at scale',
      features: [
        'Up to 200 certificates/month',
        'Standard certificate templates',
        'Standard EduCreds API access',
        'Email support',
      ],
      limits: {
        certificatesPerMonth: 200,
        storageGB: 5,
        apiCalls: 20_000,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      currency: 'USD',
      description: 'Best for growing institutions and multi-campus deployments',
      features: [
        'Up to 1,000 certificates/month',
        '20 GB storage',
        '100,000 API calls/month',
        'Batch issuance',
        'Advanced analytics dashboard',
        'Priority support',
      ],
      limits: {
        certificatesPerMonth: 1_000,
        storageGB: 20,
        apiCalls: 100_000,
      },
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 499,
      currency: 'USD',
      description: 'For large university systems, ministries, and national platforms',
      features: [
        'Unlimited certificates (fair use)',
        'Custom storage & retention',
        'Unlimited API calls (fair use)',
        'Dedicated success & solutions team',
        'Custom integrations & SSO',
        'Enterprise SLA & governance reporting',
      ],
      limits: {
        certificatesPerMonth: -1,
        storageGB: 100,
        apiCalls: -1,
      },
    },
  ];

  const currentSubscription = (subscriptionData as any)?.subscription;
  const usage = (subscriptionData as any)?.usage || {};
  const payments = (paymentsData as any)?.payments || [];

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.planId === planId;
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900" data-testid="page-title">
          Subscription Management
        </h1>
        <p className="text-neutral-600">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2" data-testid="current-plan-name">
                  {plans.find(p => p.id === currentSubscription.planId)?.name || 'Unknown'} Plan
                </h3>
                <p className="text-neutral-600 mb-4">
                  {plans.find(p => p.id === currentSubscription.planId)?.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Monthly Price:</span>
                    <span className="font-semibold text-neutral-900" data-testid="current-plan-price">
                      ${plans.find(p => p.id === currentSubscription.planId)?.price || 0}/month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Next Billing:</span>
                    <span className="text-neutral-900">
                      {format(new Date(currentSubscription.currentPeriodEnd), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Status:</span>
                    <span className="text-green-600 capitalize">{currentSubscription.status}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-neutral-900 mb-3">Usage This Month</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Certificates Issued</span>
                      <span data-testid="usage-certificates">
                        {usage.certificatesThisMonth || 0}/
                        {currentSubscription.planId === 'enterprise' ? 'âˆž' : 
                         plans.find(p => p.id === currentSubscription.planId)?.limits.certificatesPerMonth || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(
                        usage.certificatesThisMonth || 0,
                        plans.find(p => p.id === currentSubscription.planId)?.limits.certificatesPerMonth || 100
                      )} 
                      className="h-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage Used</span>
                      <span data-testid="usage-storage">
                        {(usage.storageUsed || 0).toFixed(1)}/
                        {plans.find(p => p.id === currentSubscription.planId)?.limits.storageGB || 1} GB
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(
                        usage.storageUsed || 0,
                        plans.find(p => p.id === currentSubscription.planId)?.limits.storageGB || 1
                      )} 
                      className="h-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>API Calls</span>
                      <span data-testid="usage-api">
                        {usage.apiCallsThisMonth || 0}/
                        {currentSubscription.planId === 'enterprise' ? '50,000' :
                         (plans.find(p => p.id === currentSubscription.planId)?.limits.apiCalls || 1000).toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(
                        usage.apiCallsThisMonth || 0,
                        plans.find(p => p.id === currentSubscription.planId)?.limits.apiCalls || 1000
                      )} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Button data-testid="button-manage-billing">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
              <Button variant="outline" data-testid="button-download-invoice">
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
              {currentSubscription.status === 'active' && (
                <Button 
                  variant="destructive" 
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  data-testid="button-cancel-subscription"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative border ${plan.highlighted ? 'border-2 border-primary' : ''} ${
                isCurrentPlan(plan.id) ? 'ring-2 ring-green-500 ring-offset-2' : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              
              {isCurrentPlan(plan.id) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 text-white">Current Plan</Badge>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="text-center mb-6 mt-3">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">
                    ${plan.price}
                    <span className="text-lg font-normal text-neutral-500">/month</span>
                  </div>
                  <p className="text-neutral-600">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className="w-full"
                  variant={isCurrentPlan(plan.id) ? "outline" : "default"}
                  disabled={isCurrentPlan(plan.id) || subscribeMutation.isPending}
                  onClick={() => handleSubscribe(plan.id)}
                  data-testid={`button-select-${plan.id}`}
                >
                  {isCurrentPlan(plan.id) ? "Current Plan" : 
                   subscribeMutation.isPending ? "Processing..." : 
                   currentSubscription ? "Upgrade" : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {payments.map((payment: any, index: number) => (
                    <tr key={payment.id || index}>
                      <td className="py-3 px-4 text-neutral-900">
                        {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-neutral-900">
                        {plans.find(p => p.id === payment.planId)?.name || payment.planId} Plan - Monthly
                      </td>
                      <td className="py-3 px-4 text-neutral-900">
                        ${payment.amount}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800 capitalize">
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" data-testid={`download-invoice-${index}`}>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscribe to {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-6">
              {/* Amount Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Subscription</span>
                  <span className="text-2xl font-bold">
                    ${selectedPlan.price}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onSelect={(method) => setPaymentMethod(method)}
              />

              {/* Payment Form */}
              {paymentMethod === 'stripe' && (
                <StripeProvider>
                  <StripeCardPaymentForm
                    planId={selectedPlan.id}
                    planName={selectedPlan.name}
                    amount={selectedPlan.price}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={() => setShowPaymentModal(false)}
                  />
                </StripeProvider>
              )}

              {paymentMethod === 'paypal' && (
                <PayPalPayment
                  planId={selectedPlan.id}
                  planName={selectedPlan.name}
                  amount={selectedPlan.price}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={() => setShowPaymentModal(false)}
                />
              )}

              {paymentMethod === 'crypto' && (
                <CryptoPayment
                  planId={selectedPlan.id}
                  planName={selectedPlan.name}
                  amount={selectedPlan.price}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={() => setShowPaymentModal(false)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
