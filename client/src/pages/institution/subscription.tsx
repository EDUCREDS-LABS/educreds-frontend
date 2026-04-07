import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  Download,
  CreditCard,
  Zap,
  Users,
  Database,
  Star,
  AlertCircle,
  TrendingUp,
  History,
  Rocket,
  ShieldCheck,
  Layers,
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
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

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

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('stripe');
  const [paymentStep, setPaymentStep] = useState<'method-selection' | 'payment-form'>('method-selection');

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription/current"],
    enabled: !!user,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/subscription/payments"],
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelSubscription(),
    onSuccess: () => {
      toast({ title: "Subscription cancelled", description: "Successfully updated status." });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    },
  });

  const handleSubscribe = (plan: Plan) => {
    setSelectedPlan(plan);
    setPaymentStep('method-selection');
    setPaymentMethod('stripe');
    setShowPaymentModal(true);
  };

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      currency: 'USD',
      description: 'Evaluating decentralized credentials at scale.',
      features: ['200 certificates/month', 'Standard templates', 'API access', 'Email support'],
      limits: { certificatesPerMonth: 200, storageGB: 5, apiCalls: 20000 },
    },
    {
      id: 'pro',
      name: 'Pro Infrastructure',
      price: 99,
      currency: 'USD',
      description: 'For growing institutions and high-volume issuance.',
      features: ['1,000 certificates/month', '20 GB storage', 'Advanced analytics', 'Priority support', 'Bulk issuance'],
      limits: { certificatesPerMonth: 1000, storageGB: 20, apiCalls: 100000 },
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Global Enterprise',
      price: 499,
      currency: 'USD',
      description: 'Unlimited nodes and custom governance protocols.',
      features: ['Unlimited issuance', 'Custom storage', 'SSO integration', 'Dedicated account manager', 'SLA guarantees'],
      limits: { certificatesPerMonth: -1, storageGB: 100, apiCalls: -1 },
    },
  ];

  const currentSubscription = (subscriptionData as any)?.subscription;
  const usage = (subscriptionData as any)?.usage || {};
  const payments = (paymentsData as any)?.payments || [];

  const usageHistory = useMemo(() => [
    { month: 'Oct', issued: 45 },
    { month: 'Nov', issued: 120 },
    { month: 'Dec', issued: 80 },
    { month: 'Jan', issued: 150 },
    { month: 'Feb', issued: 190 },
    { month: 'Mar', issued: usage.certificatesThisMonth || 210 },
  ], [usage.certificatesThisMonth]);

  if (subscriptionLoading) {
    return (
      <div className="space-y-12 max-w-7xl mx-auto py-8">
        <Skeleton className="h-64 w-full rounded-[40px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[500px] rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Layers className="size-4" />
            Infrastructure Billing
          </div>
          <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
            Subscription <span className="text-primary">Console</span>.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg font-medium">
            Manage your network capacity, audit resource utilization, and scale your institutional issuance authority.
          </p>
        </div>
      </div>

      {/* Resource Utilization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight">Issuance Velocity</CardTitle>
                <CardDescription className="font-medium">Certificates issued across the last 6 cycles.</CardDescription>
              </div>
              <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <TrendingUp className="size-6" />
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageHistory}>
                    <defs>
                      <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1560BD" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1560BD" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="issued" 
                      stroke="#1560BD" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorIssued)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-neutral-900 rounded-[40px] overflow-hidden text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap className="size-32 rotate-12" />
            </div>
            <CardHeader className="p-10 pb-4 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <Badge className="bg-green-500/20 text-green-400 border-none px-3 py-1 rounded-full font-black text-[10px] uppercase">Active Node</Badge>
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShieldCheck className="size-6" />
                </div>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter">
                {plans.find(p => p.id === (currentSubscription?.planId || 'starter'))?.name}
              </CardTitle>
              <CardDescription className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Strategic Plan Status</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-8 relative z-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    <span>Issuance Capacity</span>
                    <span className="text-white">{usage.certificatesThisMonth || 0} / {currentSubscription?.planId === 'enterprise' ? '∞' : (plans.find(p => p.id === currentSubscription?.planId)?.limits.certificatesPerMonth || 200)}</span>
                  </div>
                  <Progress value={(usage.certificatesThisMonth || 0) / (plans.find(p => p.id === currentSubscription?.planId)?.limits.certificatesPerMonth || 200) * 100} className="h-2 bg-neutral-800" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    <span>Infrastructure Storage</span>
                    <span className="text-white">{usage.storageUsed || 0}GB / {plans.find(p => p.id === currentSubscription?.planId)?.limits.storageGB || 5}GB</span>
                  </div>
                  <Progress value={(usage.storageUsed || 0) / (plans.find(p => p.id === currentSubscription?.planId)?.limits.storageGB || 5) * 100} className="h-2 bg-neutral-800" />
                </div>
              </div>
              <Button className="w-full h-14 bg-white text-neutral-900 hover:bg-neutral-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                Manage Node Resources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black tracking-tight">Scale Your <span className="text-primary">Authority</span>.</h2>
          <p className="text-neutral-500 font-medium max-w-xl mx-auto">Choose a plan that aligns with your institutional issuance volume and security requirements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={cn(
                "border-none shadow-xl rounded-[40px] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]",
                plan.highlighted 
                  ? "bg-primary text-white shadow-primary/20 ring-4 ring-primary/10" 
                  : "bg-white dark:bg-neutral-900 shadow-neutral-200/40 dark:shadow-black/20"
              )}
            >
              <CardContent className="p-12 space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", plan.highlighted ? "text-primary-foreground/60" : "text-neutral-400")}>{plan.name}</p>
                    {plan.id === currentSubscription?.planId && (
                      <Badge className="bg-green-500 text-white border-none rounded-full px-3 text-[9px] font-black uppercase">Active</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter">${plan.price}</span>
                    <span className={cn("text-xs font-bold", plan.highlighted ? "text-primary-foreground/60" : "text-neutral-400")}>/cycle</span>
                  </div>
                  <p className={cn("text-sm font-medium leading-relaxed", plan.highlighted ? "text-primary-foreground/80" : "text-neutral-500")}>
                    {plan.description}
                  </p>
                </div>

                <Separator className={plan.highlighted ? "bg-white/10" : "bg-neutral-100 dark:bg-neutral-800"} />

                <ul className="space-y-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className={cn("size-5 rounded-full flex items-center justify-center", plan.highlighted ? "bg-white text-primary" : "bg-primary/10 text-primary")}>
                        <Check className="size-3 stroke-[4]" />
                      </div>
                      <span className={cn("text-sm font-bold", plan.highlighted ? "text-white" : "text-neutral-600 dark:text-neutral-300")}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={cn(
                    "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl",
                    plan.highlighted 
                      ? "bg-white text-primary hover:bg-neutral-100 shadow-white/5" 
                      : "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90"
                  )}
                  onClick={() => handleSubscribe(plan)}
                  disabled={plan.id === currentSubscription?.planId}
                >
                  {plan.id === currentSubscription?.planId ? "Current Protocol" : "Select Infrastructure"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Registry */}
      {payments.length > 0 && (
        <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
          <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400">
                <History className="size-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Audit Trail</CardTitle>
                <CardDescription className="font-medium">Historical billing logs and transaction receipts.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {payments.map((payment: any, i: number) => (
                <div key={i} className="group p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-all flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="size-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 font-black text-xs uppercase group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      REC
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black dark:text-neutral-100">{plans.find(p => p.id === payment.planId)?.name} Cycle</p>
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{format(new Date(payment.createdAt), "MMMM dd, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-lg font-black tracking-tighter dark:text-neutral-100">${payment.amount}</p>
                      <Badge className="bg-green-50 text-green-600 border-green-100 text-[9px] font-black uppercase px-2 h-5 rounded-full">Success</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="size-12 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-primary">
                      <Download className="size-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Infrastructure Dialog */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-[40px] dark:bg-neutral-900">
          <div className="p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Deployment Wizard</p>
                <h2 className="text-3xl font-black tracking-tight dark:text-neutral-100">Initialize Infrastructure.</h2>
              </div>
              <div className="size-14 bg-neutral-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400">
                <Rocket className="size-8" />
              </div>
            </div>

            {selectedPlan && (
              <div className="p-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-[32px] border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-neutral-400 tracking-widest">Target Configuration</p>
                  <p className="text-xl font-black dark:text-neutral-100">{selectedPlan.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tracking-tighter text-primary">${selectedPlan.price}</p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">Per Month</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {paymentStep === 'method-selection' ? (
                <div className="space-y-8">
                  <PaymentMethodSelector selectedMethod={paymentMethod} onSelect={setPaymentMethod} />
                  <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-neutral-400" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                    <Button className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" onClick={() => setPaymentStep('payment-form')}>Deploy Infrastructure</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Button variant="ghost" className="text-xs font-black uppercase text-neutral-400 hover:text-primary p-0" onClick={() => setPaymentStep('method-selection')}>← Change Method</Button>
                  {paymentMethod === 'stripe' && (
                    <StripeProvider>
                      <StripeCardPaymentForm planId={selectedPlan!.id} planName={selectedPlan!.name} amount={selectedPlan!.price} onSuccess={() => setShowPaymentModal(false)} />
                    </StripeProvider>
                  )}
                  {/* Other payment components here... */}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
