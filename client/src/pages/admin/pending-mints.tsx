import { useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  Link2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAdminPendingMints, useReconcilePendingMint } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

interface AdminPendingMint {
  id: string;
  institutionId: string;
  institutionName?: string;
  studentName?: string;
  studentAddress?: string;
  courseName?: string;
  ipfsHash?: string;
  tokenId?: number | null;
  blockchainTxHash?: string | null;
  issuedAt?: string;
  pendingReason?: string;
}

const REASON_LABELS: Record<string, string> = {
  token_recorded_unconfirmed: "Token unconfirmed",
  tx_submitted_unconfirmed: "Transaction unconfirmed",
  awaiting_signature: "Awaiting signature",
};

const shorten = (value?: string | null, lead = 6, tail = 4): string => {
  if (!value) return "—";
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
};

const formatDate = (value?: string): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

export default function AdminPendingMints() {
  const { toast } = useToast();
  const pendingQuery = useAdminPendingMints();
  const reconcileMutation = useReconcilePendingMint();
  const [target, setTarget] = useState<AdminPendingMint | null>(null);
  const [txHash, setTxHash] = useState("");

  const items: AdminPendingMint[] = Array.isArray(pendingQuery.data?.pending)
    ? pendingQuery.data.pending
    : [];

  const submitReconcile = () => {
    if (!target) return;
    reconcileMutation.mutate(
      { certificateId: target.id, txHash: txHash || undefined },
      {
        onSuccess: (result: any) => {
          toast({
            title: "Credential reconciled",
            description:
              result?.status === "already_minted"
                ? "Already confirmed on-chain."
                : result?.tokenId
                  ? `Confirmed as token #${result.tokenId}.`
                  : "Confirmed against the on-chain record.",
          });
          setTarget(null);
          setTxHash("");
        },
        onError: (error: unknown) => {
          toast({
            title: "Reconcile failed",
            description:
              error instanceof Error
                ? error.message
                : "Could not reconcile. Provide the mint transaction hash and try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Pending On-Chain Mints
          </h2>
          <p className="text-slate-400 mt-1">
            Credentials across all institutions that are saved but not yet confirmed on
            the blockchain. Reconcile completed transactions to finalize them.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 shrink-0"
          onClick={() => pendingQuery.refetch()}
          disabled={pendingQuery.isFetching}
        >
          <RefreshCw size={14} className={pendingQuery.isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Pending Queue
          </CardTitle>
          <Badge variant="outline" className="border-amber-400/40 text-amber-300">
            {items.length} pending
          </Badge>
        </CardHeader>
        <CardContent>
          {pendingQuery.isLoading ? (
            <p className="py-10 text-center text-sm text-slate-400">Loading pending mints…</p>
          ) : pendingQuery.isError ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-slate-400">Could not load pending mints.</p>
              <Button variant="outline" size="sm" onClick={() => pendingQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="text-sm font-medium text-white">No pending mints</p>
              <p className="text-sm text-slate-400">
                Every credential is confirmed on-chain.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Credential</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.institutionName || shorten(item.institutionId)}
                      </TableCell>
                      <TableCell>
                        <div>{item.studentName || "Unknown"}</div>
                        <div className="text-xs text-slate-500">
                          {shorten(item.studentAddress)}
                        </div>
                      </TableCell>
                      <TableCell>{item.courseName || "Credential"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-amber-400/40 text-amber-300">
                          {REASON_LABELS[item.pendingReason || ""] || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.tokenId ? `#${item.tokenId}` : "—"}</TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {formatDate(item.issuedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTarget(item);
                            setTxHash(item.blockchainTxHash || "");
                          }}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Reconcile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null);
            setTxHash("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconcile credential</DialogTitle>
            <DialogDescription>
              Confirm a mint that already happened on-chain. Paste the mint transaction
              hash, or leave it blank to match an existing on-chain token id automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction hash (optional)</label>
            <Input
              placeholder="0x…"
              value={txHash}
              onChange={(event) => setTxHash(event.target.value.trim())}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTarget(null);
                setTxHash("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={submitReconcile} disabled={reconcileMutation.isPending}>
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
    </div>
  );
}
