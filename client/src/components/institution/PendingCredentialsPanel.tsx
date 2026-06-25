import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  Wallet,
  Link2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PendingCertificate {
  id: string;
  studentName?: string | null;
  studentAddress?: string | null;
  courseName?: string | null;
  ipfsHash?: string | null;
  tokenId?: number | null;
  blockchainTxHash?: string | null;
  issuedAt?: string | null;
}

const shorten = (value?: string | null, lead = 6, tail = 4): string => {
  if (!value) return "—";
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
};

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const reasonFor = (cert: PendingCertificate): { label: string; hint: string } => {
  if (cert.tokenId && !cert.blockchainTxHash) {
    return {
      label: "On-chain token unconfirmed",
      hint: "A token id exists but the mint was never confirmed. Reconcile to match the on-chain record.",
    };
  }
  if (cert.blockchainTxHash && !cert.tokenId) {
    return {
      label: "Transaction unconfirmed",
      hint: "A transaction was submitted but not confirmed. Reconcile using the recorded transaction hash.",
    };
  }
  return {
    label: "Awaiting signature",
    hint: "No signed transaction was recorded. Retry the mint from your institutional wallet.",
  };
};

export function PendingCredentialsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reconcileTarget, setReconcileTarget] = useState<PendingCertificate | null>(null);
  const [reconcileTxHash, setReconcileTxHash] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const pendingQuery = useQuery({
    queryKey: ["certificates-pending-onchain"],
    queryFn: () => api.getPendingCertificates(100),
  });

  const certificates: PendingCertificate[] = Array.isArray(pendingQuery.data?.certificates)
    ? pendingQuery.data.certificates
    : [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["certificates-pending-onchain"] });
    queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
  };

  const retryMutation = useMutation({
    mutationFn: (certificateId: string) => api.retryMintCertificate(certificateId),
    onMutate: (certificateId: string) => setBusyId(certificateId),
    onSuccess: (result: any) => {
      toast({
        title: "Credential finalized",
        description: result?.tokenId
          ? `Minted on-chain as token #${result.tokenId}.`
          : "The on-chain mint completed successfully.",
      });
      refresh();
    },
    onError: (error: unknown) => {
      toast({
        title: "Retry failed",
        description: error instanceof Error ? error.message : "Could not complete the mint.",
        variant: "destructive",
      });
    },
    onSettled: () => setBusyId(null),
  });

  const reconcileMutation = useMutation({
    mutationFn: ({ certificateId, txHash }: { certificateId: string; txHash?: string }) =>
      api.reconcileCertificate(certificateId, txHash),
    onMutate: ({ certificateId }) => setBusyId(certificateId),
    onSuccess: (result: any) => {
      toast({
        title: "Credential reconciled",
        description:
          result?.status === "already_minted"
            ? "This credential was already confirmed on-chain."
            : result?.tokenId
              ? `Confirmed on-chain as token #${result.tokenId}.`
              : "The credential was confirmed against the on-chain record.",
      });
      setReconcileTarget(null);
      setReconcileTxHash("");
      refresh();
    },
    onError: (error: unknown) => {
      toast({
        title: "Reconcile failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not reconcile this credential. Provide the mint transaction hash and try again.",
        variant: "destructive",
      });
    },
    onSettled: () => setBusyId(null),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending On-Chain Confirmation
          </CardTitle>
          <CardDescription>
            Credentials saved to your registry that are not yet confirmed on the blockchain.
            Retry the mint from your wallet, or reconcile a transaction that already completed.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={pendingQuery.isFetching}
          className="shrink-0"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${pendingQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {pendingQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : pendingQuery.isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load pending credentials.
            </p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : certificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium">All credentials are confirmed on-chain</p>
            <p className="text-sm text-muted-foreground">
              Nothing is waiting for blockchain confirmation right now.
            </p>
          </div>
        ) : (
          <TooltipProvider>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Credential</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => {
                    const reason = reasonFor(cert);
                    const isBusy = busyId === cert.id;
                    return (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <div className="font-medium">
                            {cert.studentName || "Unknown student"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {shorten(cert.studentAddress)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{cert.courseName || "Credential"}</div>
                          <div className="text-xs text-muted-foreground">
                            {shorten(cert.ipfsHash, 8, 6)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300"
                              >
                                {reason.label}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {reason.hint}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {cert.tokenId ? `#${cert.tokenId}` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(cert.issuedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => retryMutation.mutate(cert.id)}
                              disabled={isBusy}
                            >
                              {isBusy && retryMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Wallet className="mr-2 h-4 w-4" />
                              )}
                              Retry mint
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReconcileTarget(cert);
                                setReconcileTxHash(cert.blockchainTxHash || "");
                              }}
                              disabled={isBusy}
                            >
                              <Link2 className="mr-2 h-4 w-4" />
                              Reconcile
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        )}
      </CardContent>

      <Dialog
        open={Boolean(reconcileTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setReconcileTarget(null);
            setReconcileTxHash("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconcile credential</DialogTitle>
            <DialogDescription>
              Confirm a mint that already happened on-chain. Paste the mint transaction
              hash if you have it. If a token id is already recorded, you can leave it
              blank and we will match the on-chain record automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction hash (optional)</label>
            <Input
              placeholder="0x…"
              value={reconcileTxHash}
              onChange={(event) => setReconcileTxHash(event.target.value.trim())}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReconcileTarget(null);
                setReconcileTxHash("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                reconcileTarget &&
                reconcileMutation.mutate({
                  certificateId: reconcileTarget.id,
                  txHash: reconcileTxHash || undefined,
                })
              }
              disabled={reconcileMutation.isPending}
            >
              {reconcileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Reconcile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default PendingCredentialsPanel;
