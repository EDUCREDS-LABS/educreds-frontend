import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Copy, ExternalLink, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { CredentialStatusBadge, type CredentialState } from "@/components/institution/CredentialStatusBadge";

/** Verification link, QR code and revocation for one credential. */
export function CredentialActions({ id, state }: { id: string; state: CredentialState }) {
  const { toast } = useToast();
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const verifyUrl = `${window.location.origin}/verify/${id}`;

  const revoke = useMutation({
    mutationFn: () => api.revokeCertificate(id, { reasonCode: 0, reasonText: reason.trim(), detailsUri: "" }),
    onSuccess: () => {
      toast({ title: "Credential revoked", description: "Verifiers will now see this credential as revoked." });
      client.invalidateQueries({ queryKey: ["institution-credential-detail-list"] });
      client.invalidateQueries({ queryKey: ["credential-pipeline", id] });
      client.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
    },
    onError: (e: Error) => toast({ title: "Revocation failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card data-testid="credential-actions">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Share & lifecycle</CardTitle>
        <CredentialStatusBadge state={state} />
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="rounded-xl border p-3 bg-white w-fit" data-testid="credential-qr">
          <QRCodeSVG value={verifyUrl} size={132} />
        </div>
        <div className="space-y-4 min-w-0">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Public verification link — anyone can check authenticity, issuer and status here.</p>
            <code className="block break-all rounded-lg bg-muted px-3 py-2 text-xs" data-testid="credential-verify-url">{verifyUrl}</code>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" data-testid="credential-copy-link"
              onClick={() => navigator.clipboard.writeText(verifyUrl).then(() => toast({ title: "Link copied" })).catch(() => toast({ title: "Could not copy", variant: "destructive" }))}>
              <Copy className="h-4 w-4 mr-2" />Copy link
            </Button>
            <Button asChild variant="outline" size="sm" data-testid="credential-open-verify">
              <a href={verifyUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Open verification page</a>
            </Button>
            {state !== "revoked" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" data-testid="credential-revoke-btn">
                    <Ban className="h-4 w-4 mr-2" />Revoke
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke this credential?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Revocation is permanent and recorded in your audit trail. Anyone verifying this credential will see it as revoked.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    placeholder="Reason for revocation (required)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    data-testid="credential-revoke-reason"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="credential-revoke-cancel">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={reason.trim().length < 5 || revoke.isPending}
                      onClick={() => revoke.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid="credential-revoke-confirm"
                    >
                      Revoke credential
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
