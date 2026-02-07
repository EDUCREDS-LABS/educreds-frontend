import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { developerPortalApi } from "@/lib/developerPortalApi";
import { ApiKeyCard } from "./components/ApiKeyCard";
import { GenerateKeyDialog } from "./components/GenerateKeyDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, RefreshCw, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthenticatedRequest } from "@/lib/auth-security"; // Wait, frontend cannot import from server/lib
// Front-end types are defined in developerPortalApi.ts

export default function DeveloperPortalPage() {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: keys = [], isLoading: isKeysLoading } = useQuery({
        queryKey: ["api-keys"],
        queryFn: developerPortalApi.getKeys,
        enabled: isAuthenticated,
    });

    const { data: subscription, isLoading: isSubLoading } = useQuery({
        queryKey: ["subscription-status"],
        queryFn: developerPortalApi.getSubscriptionStatus,
        enabled: isAuthenticated,
    });

    const handleRevoke = async (id: string) => {
        try {
            await developerPortalApi.revokeKey(id);
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            toast({
                title: "API Key Revoked",
                description: "The API key has been successfully revoked.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to revoke API key. Please try again.",
                variant: "destructive",
            });
        }
    };

    const activeKeys = keys.filter(k => k.isActive);
    const revokedKeys = keys.filter(k => !k.isActive);

    if (isAuthLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // ProtectedRoute should handle this, but as a fallback
        return (
            <div className="container py-10 text-center">
                <h1 className="text-2xl font-bold">Authentication Required</h1>
                <p className="text-muted-foreground mt-2">Please log in to access the Developer Portal.</p>
                <Button className="mt-4" onClick={() => window.location.href = "/auth"}>Log In</Button>
            </div>
        );
    }

    return (
        <div className="container py-8 space-y-8 max-w-5xl">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Developer Portal</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your API keys and access integration resources.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href="https://docs.educreds.xyz/educreds/api-documentation" target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Documentation
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Subscription Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">
                            {isSubLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                subscription?.plan || "Free"
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {subscription?.active ? "Active Subscription" : "No Active Subscription"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Keys
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isKeysLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                `${activeKeys.length} / 3`
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Available slots: {3 - activeKeys.length}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Analytics coming soon
                        </p>
                    </CardContent>
                </Card>
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
                            <Button disabled={activeKeys.length >= 3 || isKeysLoading || isSubLoading}>
                                Generate New Key
                            </Button>
                        }
                    />
                </div>

                {isKeysLoading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2].map(i => (
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
                                You haven't generated any API keys yet. Create one to start building with EduCreds API.
                            </p>
                            <GenerateKeyDialog
                                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["api-keys"] })}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        {activeKeys.map(key => (
                            <ApiKeyCard key={key.id} apiKey={key} onRevoke={handleRevoke} />
                        ))}
                    </div>
                )}

                {revokedKeys.length > 0 && (
                    <div className="pt-8">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Revoked Keys</h3>
                        <div className="grid gap-4 md:grid-cols-2 opacity-60">
                            {revokedKeys.map(key => (
                                <ApiKeyCard key={key.id} apiKey={key} onRevoke={() => { }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
