import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { developerPortalApi } from "@/lib/developerPortalApi";
import { ApiKeyCard } from "./components/ApiKeyCard";
import { GenerateKeyDialog } from "./components/GenerateKeyDialog";
import { JwtTokenDisplay } from "./components/JwtTokenDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, RefreshCw, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatMetric(value: number | null | undefined): string {
    if (value == null) return "—";
    return value.toLocaleString();
}

function isSandboxKey(name: string, environment?: string, prefix?: string): boolean {
    if (environment === "sandbox") return true;
    if (environment === "production") return false;
    const haystack = `${name} ${prefix ?? ""}`.toLowerCase();
    return haystack.includes("sandbox") || haystack.includes("test") || haystack.includes("ec_test");
}

export default function DeveloperPortalPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: keys = [], isLoading: isKeysLoading } = useQuery({
        queryKey: ["api-keys"],
        queryFn: developerPortalApi.getKeys,
        enabled: isAuthenticated,
    });

    const { data: usage } = useQuery({
        queryKey: ["developer-usage"],
        queryFn: developerPortalApi.getUsage,
        enabled: isAuthenticated,
    });

    const { data: apiHealth, isLoading: isHealthLoading } = useQuery({
        queryKey: ["developer-api-health"],
        queryFn: developerPortalApi.getApiHealth,
        enabled: isAuthenticated,
        refetchInterval: 60_000,
    });

    const handleRevoke = async (id: string) => {
        try {
            await developerPortalApi.revokeKey(id);
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            toast({
                title: "API Key Revoked",
                description: "The API key has been successfully revoked.",
            });
        } catch {
            toast({
                title: "Error",
                description: "Failed to revoke API key. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRotate = async (id: string) => {
        try {
            const rotated = await developerPortalApi.rotateKey(id);
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            toast({
                title: "API Key Rotated",
                description: rotated.apiKey
                    ? "Copy the new secret now. It will not be shown again."
                    : "The previous secret is no longer valid.",
            });
            return rotated;
        } catch {
            toast({
                title: "Could not rotate key",
                description: "Rotation failed. The existing key was left unchanged.",
                variant: "destructive",
            });
            return null;
        }
    };

    const activeKeys = keys.filter((k) => k.isActive);
    const revokedKeys = keys.filter((k) => !k.isActive);
    const productionKeys = activeKeys.filter((k) => !isSandboxKey(k.name, k.environment, k.prefix));
    const sandboxKeys = activeKeys.filter((k) => isSandboxKey(k.name, k.environment, k.prefix));

    if (isAuthLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="container py-10 text-center">
                <h1 className="text-2xl font-bold">Authentication Required</h1>
                <p className="text-muted-foreground mt-2">Please log in to access the Developer Portal.</p>
                <Button className="mt-4" onClick={() => (window.location.href = "/login")}>Log In</Button>
            </div>
        );
    }

    const healthLabel =
        apiHealth === "operational" ? "Operational" : apiHealth === "degraded" ? "Degraded" : apiHealth === "down" ? "Down" : "—";
    const healthDot =
        apiHealth === "operational" ? "bg-emerald-500" : apiHealth === "degraded" ? "bg-amber-500" : apiHealth === "down" ? "bg-red-500" : "bg-neutral-300";

    return (
        <div className="container py-8 space-y-8 max-w-5xl">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        API health, applications, and keys for your integration.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <a href="https://docs.educreds.xyz/educreds/api-documentation" target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Documentation
                    </a>
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">API Health</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`inline-block size-2.5 rounded-full ${healthDot}`} />
                        <span className="text-2xl font-bold">
                            {isHealthLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : healthLabel}
                        </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/developer-portal/usage">View status →</Link>
                    </Button>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h2 className="text-xl font-semibold">Your Applications</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Production</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{isKeysLoading ? "—" : productionKeys.length}</p>
                            <p className="text-xs text-muted-foreground mt-1">Live keys</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Sandbox</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{isKeysLoading ? "—" : sandboxKeys.length}</p>
                            <p className="text-xs text-muted-foreground mt-1">Test keys</p>
                        </CardContent>
                    </Card>
                    <Card className="flex items-center justify-center border-dashed">
                        <CardContent className="py-6">
                            <GenerateKeyDialog
                                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["api-keys"] })}
                                trigger={<Button disabled={activeKeys.length >= 3}>+ Create Application</Button>}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-xl font-semibold">This Month</h2>
                <p className="text-xs text-muted-foreground">
                    Live values from GET /api/developer-portal/usage (institution API key counters). Em dash means that metric is not tracked yet.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">API Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMetric(usage?.requests)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Errors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMetric(usage?.errors)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Latency p99</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {usage?.latencyP99Ms == null ? "—" : `${usage.latencyP99Ms} ms`}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Authentication Credentials</h2>
                <JwtTokenDisplay />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        API Keys
                    </h2>
                    <GenerateKeyDialog
                        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["api-keys"] })}
                        trigger={
                            <Button disabled={activeKeys.length >= 3 || isKeysLoading}>
                                Create API Key
                            </Button>
                        }
                    />
                </div>

                {isKeysLoading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                        ))}
                    </div>
                ) : activeKeys.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="rounded-full bg-primary/10 p-3 mb-4">
                                <RefreshCw className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold text-lg">No Active Keys</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                                Create a production or sandbox key to start calling the API.
                            </p>
                            <GenerateKeyDialog
                                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["api-keys"] })}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {activeKeys.map((key) => (
                            <ApiKeyCard
                                key={key.id}
                                apiKey={key}
                                onRevoke={handleRevoke}
                                onRotate={handleRotate}
                            />
                        ))}
                    </div>
                )}

                {revokedKeys.length > 0 && (
                    <div className="pt-8">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Revoked Keys</h3>
                        <div className="grid gap-4 md:grid-cols-2 opacity-60">
                            {revokedKeys.map((key) => (
                                <ApiKeyCard key={key.id} apiKey={key} onRevoke={() => {}} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
