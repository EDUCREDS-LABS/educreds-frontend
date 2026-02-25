import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Copy,
    Check,
    Calendar,
    Clock,
    AlertTriangle,
    Info,
    Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface JwtTokenInfo {
    token: string;
    expiresAt: Date | null;
    isExpired: boolean;
    email: string;
}

export function JwtTokenDisplay() {
    const { toast } = useToast();
    const [tokenInfo, setTokenInfo] = useState<JwtTokenInfo | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const [showToken, setShowToken] = useState(false);

    useEffect(() => {
        try {
            const token = localStorage.getItem('institution_token');
            if (!token) {
                setTokenInfo(null);
                return;
            }

            // Decode JWT to get expiration and email
            const parts = token.split('.');
            if (parts.length !== 3) {
                setTokenInfo(null);
                return;
            }

            const decoded = JSON.parse(atob(parts[1]));
            const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
            const isExpired = expiresAt ? expiresAt < new Date() : false;

            setTokenInfo({
                token,
                expiresAt,
                isExpired,
                email: decoded.email || 'Unknown'
            });
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            setTokenInfo(null);
        }
    }, []);

    const handleCopy = () => {
        if (tokenInfo?.token) {
            navigator.clipboard.writeText(tokenInfo.token);
            toast({
                title: "Copied to clipboard",
                description: "JWT token copied to clipboard",
            });
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
        }
    };

    if (!tokenInfo) {
        return null;
    }

    const displayToken = tokenInfo.token.length > 50
        ? `${tokenInfo.token.substring(0, 50)}...`
        : tokenInfo.token;

    const tokenStatus = tokenInfo.isExpired
        ? { label: 'Expired', color: 'bg-red-500/15 text-red-600 border-red-500/20 dark:bg-red-500/10 dark:text-red-400' }
        : { label: 'Active', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' };

    return (
        <Card className="w-full transition-all hover:shadow-md border-border/60">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                JWT Bearer Token
                            </CardTitle>
                            <Badge className={`${tokenStatus.color} px-2 py-0.5 text-xs font-medium border`}>
                                {tokenStatus.label}
                            </Badge>
                        </div>
                        <CardDescription>
                            Use this token to authenticate requests to the EduCreds API
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {tokenInfo.isExpired && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Token Expired</AlertTitle>
                        <AlertDescription>
                            Your JWT token has expired. Please log out and log back in to refresh your token.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Token Display */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground">Secret Token</label>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowToken(!showToken)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            {showToken ? 'Hide' : 'Show'}
                        </Button>
                    </div>

                    <div className="relative group">
                        <div className="bg-neutral-950 dark:bg-neutral-900 py-3 px-4 pr-12 rounded-lg border border-neutral-700 dark:border-neutral-800 font-mono text-sm text-neutral-200 break-all overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-900/10 to-transparent pointer-events-none opacity-50 transition-opacity group-hover:opacity-100" />
                            {showToken ? tokenInfo.token : displayToken}
                        </div>
                        <Button
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all shadow-lg border border-neutral-700"
                            onClick={handleCopy}
                        >
                            {hasCopied ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {hasCopied && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Copied to clipboard
                        </p>
                    )}
                </div>

                {/* Token Info */}
                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-border/50">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Expires At
                        </span>
                        <p className="font-medium">
                            {tokenInfo.expiresAt
                                ? format(tokenInfo.expiresAt, "PPP p")
                                : "Never"}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Email</span>
                        <p className="font-medium text-xs break-all">{tokenInfo.email}</p>
                    </div>
                </div>

                {/* Security Alert */}
                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-900 dark:text-amber-300">Security Notice</AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-400 text-xs mt-1">
                        Never share this token publicly. Keep it secure in environment variables or password managers. Anyone with this token can access your institution's API.
                    </AlertDescription>
                </Alert>

                {/* Usage Info */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900/50">
                    <div className="flex gap-2 text-xs text-blue-800 dark:text-blue-300">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-1">Usage</p>
                            <p className="font-mono text-[0.7rem] text-blue-700 dark:text-blue-400">
                                Authorization: Bearer {'<token>'}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
