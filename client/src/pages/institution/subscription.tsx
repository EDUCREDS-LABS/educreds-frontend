import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Check,
  Download,
  Zap,
  AlertCircle,
  History,
  Layers,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type CatalogPlan = {
  planKey: string;
  name: string;
  price: number | null;
  currency: string;
  interval: string;
  contactSales: boolean;
  features: string[];
  entitlements?: Record<string, string>;
};

const STATUS_BANNER: Record<string, { title: string; description: string; className: string }> = {
  past_due: {
    title: "Payment past due",
    description: "Update your payment method before the grace period ends to avoid suspension.",
    className: "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100",
  },
  suspended: {
    title: "Subscription suspended",
    description: "New issuance and API calls are blocked. Existing credentials remain verifiable. Restore payment to reactivate.",
    className: "border-red-200 bg-red-50 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-100",
  },
  pending: {
    title: "Provisioning in progress",
    description: "Payment received or checkout started. Access unlocks after provisioning completes.",
    className: "border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-100",
  },
};

function meterLimitLabel(limit: number | undefined) {
  if (limit == null) return "—";
  if (limit < 0) return "∞";
  return String(limit);
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["commercial-plans", "institution"],
    queryFn: () => api.listCommercialPlans("institution"),
  });

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["commercial-subscription", "institution"],
    queryFn: () => api.getCommercialSubscription("institution"),
    enabled: !!user,
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.subscription?.status;
      return status === "pending" ? 4000 : false;
    },
  });

  const { data: usageData } = useQuery({
    queryKey: ["commercial-usage", "institution"],
    queryFn: () => api.getCommercialUsage("institution"),
    enabled: !!user,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ["commercial-invoices", "institution"],
    queryFn: () => api.listCommercialInvoices("institution"),
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelCommercialSubscription("institution"),
    onSuccess: () => {
      toast({ title: "Cancellation scheduled", description: "Subscription will end at period close." });
      queryClient.invalidateQueries({ queryKey: ["commercial-subscription", "institution"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    },
  });

  const plans: CatalogPlan[] = (plansData as any)?.plans || [];
  const subscription = (subscriptionData as any)?.subscription;
  const usage = (usageData as any)?.usage;
  const invoices = (invoicesData as any)?.invoices || [];
  const status = subscription?.status as string | undefined;
  const banner = status ? STATUS_BANNER[status] : null;
  const currentPlanKey = subscription?.planKey as string | undefined;
  const currentPlan = plans.find((p) => p.planKey === currentPlanKey);

  const certUsed = usage?.meters?.certificates ?? 0;
  const certLimit = usage?.limits?.certificates;
  const apiUsed = usage?.meters?.api_calls ?? 0;
  const apiLimit = usage?.limits?.api_calls;
  const certPct = certLimit && certLimit > 0 ? Math.min((certUsed / certLimit) * 100, 100) : 0;

  const highlightedKey = useMemo(() => {
    const pro = plans.find((p) => p.planKey.includes("professional"));
    return pro?.planKey || plans[1]?.planKey;
  }, [plans]);

  const handleCheckout = async (plan: CatalogPlan) => {
    if (plan.contactSales) {
      toast({ title: "Contact sales", description: "Enterprise plans require a sales conversation." });
      return;
    }
    setCheckingOut(plan.planKey);
    try {
      const result = await api.createCommercialCheckout({
        workspace: "institution",
        planKey: plan.planKey,
      });
      const checkout = (result as any)?.checkout;
      if (checkout?.contactSales) {
        toast({ title: "Contact sales", description: "This plan is sales-assisted." });
      } else if (!checkout?.requiresPayment) {
        toast({
          title: "Checkout complete",
          description: checkout?.status === "paid"
            ? "Plan activated pending provisioning."
            : "Subscription initialized.",
        });
      } else if (checkout?.checkoutSession?.clientSecret) {
        toast({
          title: "Payment session ready",
          description: `Invoice ${checkout.invoiceId?.slice(0, 8)}… — complete payment via Stripe (client secret issued).`,
        });
      } else {
        toast({
          title: "Checkout started",
          description: "Invoice created. Configure Stripe keys to collect payment locally.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["commercial-subscription", "institution"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-invoices", "institution"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-usage", "institution"] });
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    } finally {
      setCheckingOut(null);
    }
  };

  if (plansLoading || (user && subscriptionLoading)) {
    return (
      <div className="space-y-12 max-w-7xl mx-auto py-8">
        <Skeleton className="h-64 w-full rounded-[40px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[500px] rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Layers className="size-4" />
            Commercial Billing
          </div>
          <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
            Subscription <span className="text-primary">Console</span>.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg font-medium">
            Live catalog, usage meters, and invoice history from the commercial platform.
          </p>
        </div>
      </div>

      {banner && (
        <Alert className={cn("rounded-2xl", banner.className)}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-black">{banner.title}</AlertTitle>
          <AlertDescription className="font-medium">
            {banner.description}{" "}
            <Link to="/institution/subscription" className="underline font-bold">
              Review billing
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {usage?.accessBlocked && (
        <Alert className="rounded-2xl border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-black">Degraded access</AlertTitle>
          <AlertDescription>
            Billable actions are blocked while the subscription is suspended.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="text-2xl font-black tracking-tight">Usage this period</CardTitle>
              <CardDescription className="font-medium">
                Billing period {usage?.billingPeriod || "—"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <span>Certificates</span>
                  <span>{certUsed} / {meterLimitLabel(certLimit)}</span>
                </div>
                <Progress value={certPct} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <span>API calls</span>
                  <span>{apiUsed} / {meterLimitLabel(apiLimit)}</span>
                </div>
                <Progress
                  value={apiLimit && apiLimit > 0 ? Math.min((apiUsed / apiLimit) * 100, 100) : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="border-none shadow-2xl bg-neutral-900 rounded-[40px] overflow-hidden text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap className="size-32 rotate-12" />
            </div>
            <CardHeader className="p-10 pb-4 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <Badge className="bg-green-500/20 text-green-400 border-none px-3 py-1 rounded-full font-black text-[10px] uppercase">
                  {status || "no plan"}
                </Badge>
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
                  <ShieldCheck className="size-6" />
                </div>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter">
                {currentPlan?.name || "No active plan"}
              </CardTitle>
              <CardDescription className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                {currentPlanKey || "Select a plan below"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-6 relative z-10">
              {subscription?.currentPeriodEnd && (
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-bold">
                  <Clock className="size-4" />
                  Period ends {format(new Date(subscription.currentPeriodEnd), "MMM dd, yyyy")}
                </div>
              )}
              {subscription && status !== "canceled" && (
                <Button
                  variant="secondary"
                  className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  Cancel at period end
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black tracking-tight">
            Scale Your <span className="text-primary">Authority</span>.
          </h2>
          <p className="text-neutral-500 font-medium max-w-xl mx-auto">
            Plans load from the commercial catalog. Checkout creates a pending subscription and invoice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const highlighted = plan.planKey === highlightedKey;
            const isCurrent = plan.planKey === currentPlanKey && status === "active";
            const priceLabel = plan.contactSales || plan.price == null
              ? "Custom"
              : `$${Number(plan.price).toLocaleString()}`;

            return (
              <Card
                key={plan.planKey}
                className={cn(
                  "border-none shadow-xl rounded-[40px] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]",
                  highlighted
                    ? "bg-primary text-white shadow-primary/20 ring-4 ring-primary/10"
                    : "bg-white dark:bg-neutral-900 shadow-neutral-200/40 dark:shadow-black/20",
                )}
              >
                <CardContent className="p-12 space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        highlighted ? "text-primary-foreground/60" : "text-neutral-400",
                      )}>
                        {plan.name}
                      </p>
                      {isCurrent && (
                        <Badge className="bg-green-500 text-white border-none rounded-full px-3 text-[9px] font-black uppercase">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tighter">{priceLabel}</span>
                      {!plan.contactSales && plan.price != null && (
                        <span className={cn("text-xs font-bold", highlighted ? "text-primary-foreground/60" : "text-neutral-400")}>
                          /{plan.interval || "mo"}
                        </span>
                      )}
                    </div>
                  </div>

                  <Separator className={highlighted ? "bg-white/10" : "bg-neutral-100 dark:bg-neutral-800"} />

                  <ul className="space-y-4">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-center gap-3">
                        <div className={cn(
                          "size-5 rounded-full flex items-center justify-center",
                          highlighted ? "bg-white text-primary" : "bg-primary/10 text-primary",
                        )}>
                          <Check className="size-3 stroke-[4]" />
                        </div>
                        <span className={cn("text-sm font-bold", highlighted ? "text-white" : "text-neutral-600 dark:text-neutral-300")}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl",
                      highlighted
                        ? "bg-white text-primary hover:bg-neutral-100"
                        : "bg-neutral-900 text-white hover:opacity-90",
                    )}
                    onClick={() => handleCheckout(plan)}
                    disabled={isCurrent || checkingOut === plan.planKey}
                  >
                    {isCurrent
                      ? "Current Protocol"
                      : plan.contactSales
                        ? "Contact Sales"
                        : checkingOut === plan.planKey
                          ? "Starting…"
                          : "Select Plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {invoices.length > 0 && (
        <Card className="border-none shadow-2xl bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
          <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400">
                <History className="size-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Invoices</CardTitle>
                <CardDescription className="font-medium">Commercial billing ledger for this tenant.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {invoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="group p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-all flex items-center justify-between gap-6"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-black dark:text-neutral-100">
                      Invoice {invoice.id?.slice(0, 8)}
                    </p>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                      {invoice.createdAt
                        ? format(new Date(invoice.createdAt), "MMMM dd, yyyy")
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-lg font-black tracking-tighter dark:text-neutral-100">
                        ${Number(invoice.total ?? 0).toLocaleString()}
                      </p>
                      <Badge className="bg-neutral-100 text-neutral-700 border-none text-[9px] font-black uppercase px-2 h-5 rounded-full">
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="size-12 rounded-xl text-neutral-400">
                      <Download className="size-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
