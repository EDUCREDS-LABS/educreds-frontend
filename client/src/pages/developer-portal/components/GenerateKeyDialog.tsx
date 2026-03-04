import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { developerPortalApi, ApiKey } from "@/lib/developerPortalApi";
import { Loader2, Copy, Check, Shield, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name too long"),
    expiry: z.enum(["12h", "78h", "never"]),
});

interface GenerateKeyDialogProps {
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function GenerateKeyDialog({ onSuccess, trigger }: GenerateKeyDialogProps) {
    const [open, setOpen] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            expiry: "12h",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);
            const newKey = await developerPortalApi.generateKey(values);
            setGeneratedKey(newKey);
            setHasCopied(false);
            onSuccess(); // Refresh list in parent immediately
            toast({
                title: "API Key Generated",
                description: "Your new API key is ready. Please copy it now.",
            });
        } catch (error: any) {
            console.error("Failed to generate key:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to generate API key. Limit reached?",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedKey?.apiKey) {
            navigator.clipboard.writeText(generatedKey.apiKey);
            toast({
                title: "Copied securely",
                description: "API Key copied to clipboard",
            });
            setHasCopied(true);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setTimeout(() => {
            setGeneratedKey(null);
            form.reset();
            setHasCopied(false);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => val ? setOpen(true) : handleClose()}>
            <DialogTrigger asChild>
                {trigger || <Button>Generate New Key</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] gap-0 p-0 overflow-hidden border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl opacity-100">
                {!generatedKey ? (
                    <div className="bg-white dark:bg-neutral-950 opacity-100">
                        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-b border-neutral-200 dark:border-neutral-800">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Generate API Key</DialogTitle>
                                <DialogDescription className="text-base mt-2 text-neutral-600 dark:text-neutral-400">
                                    Create a secure credential for accessing the EduCreds API.
                                    <br />
                                    This key will carry your institution's permissions.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="p-6 bg-white dark:bg-neutral-950">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Key Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Production Server, CI/CD Pipeline" className="h-11 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-primary" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-neutral-500">
                                                    A friendly name to identify where this key is used.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="expiry"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Expiration</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700">
                                                            <SelectValue placeholder="Select expiration" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl">
                                                        <SelectItem value="12h">
                                                            <span className="font-medium">12 Hours</span> <span className="text-muted-foreground ml-2">- For temporary testing</span>
                                                        </SelectItem>
                                                        <SelectItem value="78h">
                                                            <span className="font-medium">78 Hours</span> <span className="text-muted-foreground ml-2">- For short-term projects</span>
                                                        </SelectItem>
                                                        <SelectItem value="never">
                                                            <span className="font-medium text-amber-600">Never Expires</span> <span className="text-muted-foreground ml-2">- For production services</span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription className="text-neutral-500">
                                                    We recommend rotating keys periodically for better security.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-start gap-4 text-sm text-blue-800 dark:text-blue-300 shadow-sm">
                                        <div className="bg-blue-100 dark:bg-blue-800/40 p-2 rounded-lg">
                                            <Shield className="h-5 w-5 shrink-0" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="font-bold text-base">Scope & Permissions</p>
                                            <ul className="list-disc list-inside opacity-90 space-y-1">
                                                <li>Read/Write access to Certificates</li>
                                                <li>Read-only access to Institution Profile</li>
                                                <li>Verification API access</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <DialogFooter className="gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6">
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isLoading} className="h-11 px-8 gap-2 font-bold shadow-lg shadow-primary/20">
                                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Create Secret Key
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-neutral-950 opacity-100">
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 border-b border-emerald-100 dark:border-emerald-900/50">
                            <DialogHeader>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                        <Check className="h-7 w-7" />
                                    </div>
                                    <DialogTitle className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Key Generated</DialogTitle>
                                </div>
                                <DialogDescription className="text-emerald-800 dark:text-emerald-300 ml-16 text-base">
                                    Your API key has been created. Use this key to authenticate your requests to the EduCreds API.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="p-8 space-y-8 bg-white dark:bg-neutral-950">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">Secret Key</p>
                                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 flex items-center gap-1.5 py-1">
                                        <Info className="h-3.5 w-3.5" />
                                        Visible only once
                                    </Badge>
                                </div>

                                <div className="relative group">
                                    <div className="bg-neutral-950 py-5 px-6 pr-14 rounded-xl border border-neutral-800 font-mono text-base text-neutral-200 break-all shadow-2xl overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-900/10 to-transparent pointer-events-none opacity-50 transition-opacity group-hover:opacity-100" />
                                        {generatedKey.apiKey}
                                    </div>
                                    <Button
                                        size="icon"
                                        className="absolute top-3 right-3 h-10 w-10 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all shadow-lg border border-neutral-700"
                                        onClick={handleCopy}
                                    >
                                        {hasCopied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                                    </Button>
                                </div>

                                {hasCopied ? (
                                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1 px-1">
                                        <Check className="h-4 w-4" /> Copied to clipboard successfully
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 px-1 font-medium italic">
                                        Click the copy icon to secure your key before closing.
                                    </p>
                                )}
                            </div>

                            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 p-5 rounded-xl shadow-sm">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <AlertTitle className="text-red-900 dark:text-red-300 font-bold text-base">Security Warning</AlertTitle>
                                <AlertDescription className="text-red-800 dark:text-red-400 mt-2 text-sm leading-relaxed">
                                    For your security, we cannot show this key again. Store it in a secure password manager or environment variable. If lost, you must revoke it and issue a new one.
                                </AlertDescription>
                            </Alert>

                            <div className="flex items-start space-x-3 pt-2 bg-neutral-50 dark:bg-neutral-900/30 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <Checkbox
                                    id="copied-check"
                                    checked={hasCopied}
                                    onCheckedChange={(c) => {
                                        // Implicitly handled by copy button but could be manual
                                    }}
                                    disabled={true}
                                    className="mt-1"
                                />
                                <label
                                    htmlFor="copied-check"
                                    className="text-sm font-semibold leading-relaxed text-neutral-700 dark:text-neutral-300 peer-disabled:cursor-not-allowed"
                                >
                                    I confirm that I have copied and stored this secret key in a secure location.
                                </label>
                            </div>

                            <DialogFooter className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <Button
                                    onClick={handleClose}
                                    className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                    disabled={!hasCopied}
                                    variant={hasCopied ? "default" : "secondary"}
                                >
                                    {hasCopied ? "Finalize & Close" : "Copy Secret Key to Continue"}
                                </Button>
                            </DialogFooter>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
