import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Calendar, Clock, Eye, RefreshCw } from "lucide-react";
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
    onRotate?: (id: string) => Promise<ApiKey | null>;
}

function formatLastUsed(iso?: string): string {
    if (!iso) return "Never used";
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    return format(new Date(iso), "d MMM yyyy");
}

export function ApiKeyCard({ apiKey, onRevoke, onRotate }: ApiKeyCardProps) {
    const { toast } = useToast();
    const [revealed, setRevealed] = useState(false);
    const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
    const secret = rotatedSecret ?? apiKey.apiKey;
    const displayValue = revealed && secret ? secret : `${apiKey.prefix}••••••••••••••••`;
    const scopes = apiKey.scopes?.length ? apiKey.scopes : [];
    const isExpired = Boolean(apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date());
    const environment = apiKey.environment
        ?? (apiKey.name.toLowerCase().includes("sandbox") || apiKey.prefix.toLowerCase().includes("test")
            ? "sandbox"
            : "production");

    const handleCopy = () => {
        const text = revealed && secret ? secret : apiKey.prefix;
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard",
            description: revealed && secret ? "API key copied" : "Key prefix copied. The full secret was shown only at creation.",
        });
    };

    const handleRotate = async () => {
        if (!onRotate) return;
        const next = await onRotate(apiKey.id);
        if (next?.apiKey) {
            setRotatedSecret(next.apiKey);
            setRevealed(true);
        }
    };

    return (
        <Card className="w-full transition-all hover:shadow-md border-border/60">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base font-semibold">{apiKey.name}</CardTitle>
                            <Badge variant="secondary">{environment === "sandbox" ? "Sandbox Key" : "Production Key"}</Badge>
                            {isExpired ? (
                                <Badge variant="destructive">Expired</Badge>
                            ) : apiKey.isActive ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">Active</Badge>
                            ) : (
                                <Badge variant="secondary">Revoked</Badge>
                            )}
                        </div>
                        <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded-md w-fit break-all">
                            {displayValue}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> Created
                        </span>
                        <p className="font-medium">{format(new Date(apiKey.createdAt), "d MMM yyyy")}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Last used
                        </span>
                        <p className="font-medium">{formatLastUsed(apiKey.lastUsedAt)}</p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Scopes</p>
                    <div className="flex flex-wrap gap-1.5">
                        {scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="font-mono text-[10px]">
                                {scope}
                            </Badge>
                        ))}
                    </div>
                </div>

                {apiKey.isActive && !isExpired && (
                    <div className="flex flex-wrap gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                    {revealed ? "Hide" : "Show"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reveal this key?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {secret
                                            ? "The full secret will be shown on this card until you hide it."
                                            : "The full secret was shown only when the key was created. Confirming will show the masked prefix. Rotate the key if you need a new secret."}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => setRevealed(true)}>Reveal</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy
                        </Button>

                        {onRotate && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                        Rotate
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Rotate API Key</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This keeps the same key and replaces only the secret. The old secret stops working immediately. Copy the new secret if one is returned. This does not delete the key.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => void handleRotate()}>Rotate Key</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive">
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Revoke
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Applications using {apiKey.name} will lose access immediately. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onRevoke(apiKey.id)} className="bg-destructive text-destructive-foreground">
                                        Yes, Revoke Key
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
