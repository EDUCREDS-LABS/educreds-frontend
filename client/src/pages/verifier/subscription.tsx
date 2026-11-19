import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertCircle, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { InfoPageLayout } from "@/components/InfoPageLayout";

type CatalogPlan = {
  planKey: string;
  name: string;
  price: number | null;
  currency: string;
  interval: string;
  contactSales: boolean;
  features: string[];
};

export default function VerifierSubscriptionPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["commercial-plans", "verifier"],
    queryFn: () => api.listCommercialPlans("verifier"),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["commercial-subscription", "verifier"],
    queryFn: () => api.getCommercialSubscription("verifier"),
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: usageData } = useQuery({
    queryKey: ["commercial-usage", "verifier"],
    queryFn: () => api.getCommercialUsage("verifier"),
    enabled: isAuthenticated,
    retry: false,
  });

  const plans: CatalogPlan[] = (plansData as any)?.plans || [];
  const subscription = (subscriptionData as any)?.subscription;
  const usage = (usageData as any)?.usage;
  const status = subscription?.status as string | undefined;

  const checkoutMutation = useMutation({
    mutationFn: (planKey: string) =>
      api.createCommercialCheckout({ workspace: "verifier", planKey }),
    onSuccess: (result: any, planKey) => {
      const checkout = result?.checkout;
      toast({
        title: checkout?.contactSales ? "Contact sales" : "Checkout started",
        description: checkout?.requiresPayment
          ? "Invoice created — complete payment when Stripe is configured."
          : `Plan ${planKey} initialized.`,
      });
      queryClient.invalidateQueries({ queryKey: ["commercial-subscription", "verifier"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Checkout failed",
        description: err.message.includes("Unauthorized") || err.message.includes("token")
          ? "Sign in with a verifier credential to subscribe."
          : err.message,
        variant: "destructive",
      });
    },
    onSettled: () => setCheckingOut(null),
  });

  return (
    <InfoPageLayout
      title="Verifier Plans"
      subtitle="Community through enterprise verification capacity from the commercial catalog."
      badge="Verifier Billing"
    >
      {status === "past_due" || status === "suspended" || status === "pending" ? (
        <Alert className="mb-10 rounded-2xl border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-black capitalize">{status.replace("_", " ")}</AlertTitle>
          <AlertDescription>
            {status === "suspended"
              ? "New verifications against billable meters are blocked until payment recovers."
              : status === "past_due"
                ? "Update payment before the grace period ends."
                : "Provisioning in progress."}
          </AlertDescription>
        </Alert>
      ) : null}

      {usage && (
        <Card className="mb-10 rounded-[32px] border-none shadow-xl">
          <CardHeader>
            <CardTitle className="font-black">Usage</CardTitle>
            <CardDescription>
              Period {usage.billingPeriod} ·{" "}
              {usage.meters?.verifications ?? 0} /{" "}
              {usage.limits?.verifications < 0 ? "∞" : usage.limits?.verifications ?? "—"} verifications
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isAuthenticated && (
        <p className="text-center text-sm text-neutral-500 mb-8 font-medium">
          Browse plans freely. Checkout requires a verifier session ({user ? "current session is not verifier" : "not signed in"}).
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-96 rounded-[32px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.planKey === subscription?.planKey && status === "active";
            const price =
              plan.contactSales || plan.price == null
                ? "Custom"
                : Number(plan.price) === 0
                  ? "Free"
                  : `$${Number(plan.price).toLocaleString()}`;

            return (
              <Card key={plan.planKey} className="rounded-[32px] border-none shadow-xl flex flex-col">
                <CardHeader className="space-y-3">
                  <div className="size-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-primary">
                    <Search className="size-5" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-xl font-black">{plan.name}</CardTitle>
                    {isCurrent && (
                      <Badge className="bg-green-500 text-white border-none text-[9px] font-black uppercase">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter">{price}</span>
                    {!plan.contactSales && plan.price != null && Number(plan.price) > 0 && (
                      <span className="text-xs font-bold text-neutral-400">/{plan.interval}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-6">
                  <ul className="space-y-3 flex-1">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                        <Check className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn("w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest")}
                    disabled={isCurrent || checkingOut === plan.planKey}
                    onClick={() => {
                      setCheckingOut(plan.planKey);
                      checkoutMutation.mutate(plan.planKey);
                    }}
                  >
                    {isCurrent
                      ? "Current plan"
                      : plan.contactSales
                        ? "Contact sales"
                        : checkingOut === plan.planKey
                          ? "Starting…"
                          : "Select plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </InfoPageLayout>
  );
}
