import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Copy,
    Trash2,
    Settings,
    Calendar,
    Clock,
    ShieldAlert,
    Hash
} from "lucide-react";
import { ApiKey } from "@/lib/developerPortalApi";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ApiKeyCardProps {
    apiKey: ApiKey;
    onRevoke: (id: string) => void;
}

export function ApiKeyCard({ apiKey, onRevoke }: ApiKeyCardProps) {
    const { toast } = useToast();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard",
            description: "API Key prefix copied to clipboard",
        });
    };

    const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();

    return (
        <Card className="w-full transition-all hover:shadow-md border-border/60 group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold text-foreground">{apiKey.name}</CardTitle>
                            {isExpired ? (
                                <Badge variant="destructive" className="px-2 py-0.5 text-xs font-medium">Expired</Badge>
                            ) : apiKey.isActive ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20 px-2 py-0.5 text-xs font-medium dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                    Active
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">Revoked</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-md w-fit">
                            <Hash className="h-3.5 w-3.5" />
                            <span>{apiKey.prefix}••••••••••••••••</span>
                        </div>
                    </div>

                    {apiKey.isActive && !isExpired && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to revoke <span className="font-semibold text-foreground">{apiKey.name}</span>?
                                        <br /><br />
                                        Applications using this key will immediately lose access to the API. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onRevoke(apiKey.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Yes, Revoke Key
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> Created
                        </span>
                        <p className="font-medium">{format(new Date(apiKey.createdAt), "MMM d, yyyy")}</p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Expires
                        </span>
                        <p className="font-medium">
                            {apiKey.expiresAt
                                ? format(new Date(apiKey.expiresAt), "MMM d, yyyy")
                                : "Never expires"}
                        </p>
                    </div>

                    <div className="space-y-1 col-span-2 pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Settings className="h-3 w-3" /> Last Used
                        </span>
                        <p className="font-medium">
                            {apiKey.lastUsedAt
                                ? format(new Date(apiKey.lastUsedAt), "PPP p")
                                : "Never used"}
                        </p>
                    </div>
                </div>

                <div className="pt-4 mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-background hover:bg-accent/50 border-dashed"
                        onClick={() => handleCopy(apiKey.prefix)}
                        disabled={!apiKey.isActive}
                    >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Copy Key Prefix
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
