/**
 * Student Identity Page — DID viewer, wallet address, copy & download.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import { getStudentToken } from "@/lib/authStorage";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Copy, Download, ChevronDown, ChevronUp, Wallet, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CERT_API = API_CONFIG.CERT;

interface StudentIdentity {
  did?: string;
  walletAddress?: string;
  email?: string;
  name?: string;
  didDocument?: Record<string, unknown>;
}

export default function StudentIdentityPage() {
  const { user, isLoading: authLoading, authType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [didDocOpen, setDidDocOpen] = useState(false);

  // Guard
  useEffect(() => {
    if (authLoading) return;
    if (!user || authType !== AuthType.STUDENT) {
      navigate("/student/login", { replace: true });
    }
  }, [authLoading, user, authType, navigate]);

  const token = getStudentToken();

  const { data: identity, isLoading } = useQuery<StudentIdentity>({
    queryKey: ["student-identity", user?.id],
    queryFn: async () => {
      const res = await fetch(`${CERT_API}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load identity");
      return res.json();
    },
    enabled: !!token && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    });
  };

  const downloadIdentity = () => {
    const doc = identity?.didDocument ?? {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: identity?.did ?? `did:educreds:student:${identity?.walletAddress ?? "unknown"}`,
      verificationMethod: [],
      authentication: [],
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `educreds-identity-${(identity?.did ?? "did").replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !user) return null;

  const did = identity?.did
    ?? (identity?.walletAddress ? `did:educreds:student:${identity.walletAddress}` : undefined)
    ?? user.eduCredsId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <User className="size-5 text-neutral-500" />
          <span className="text-sm text-neutral-500 font-medium">My Identity</span>
        </div>
        <h1 className="text-2xl font-bold">My Identity</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Your decentralized identifier (DID) and associated wallet address.
        </p>
      </div>

      {/* Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-blue-600" />
            EduCreds Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-400 font-medium mb-1">Name</p>
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <p className="text-sm font-medium">{identity?.name || user.name || "—"}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium mb-1">Email</p>
              {isLoading ? (
                <Skeleton className="h-5 w-40" />
              ) : (
                <p className="text-sm font-medium">{identity?.email || user.email}</p>
              )}
            </div>
          </div>

          {/* DID */}
          <div>
            <p className="text-xs text-neutral-400 font-medium mb-2">Decentralized Identifier (DID)</p>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : did ? (
              <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 border">
                <code className="text-xs font-mono text-neutral-700 dark:text-neutral-300 flex-1 break-all">
                  {did}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(did, "DID")}
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No DID assigned yet.</p>
            )}
          </div>

          {/* Wallet Address */}
          <div>
            <p className="text-xs text-neutral-400 font-medium mb-2">Wallet Address</p>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (identity?.walletAddress || user.walletAddress) ? (
              <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 border">
                <Wallet className="size-4 text-neutral-400 shrink-0" />
                <code className="text-xs font-mono text-neutral-700 dark:text-neutral-300 flex-1 break-all">
                  {identity?.walletAddress ?? user.walletAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(
                    identity?.walletAddress ?? user.walletAddress ?? "",
                    "Wallet Address"
                  )}
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No wallet address linked.</p>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Shield className="size-3" /> Verified Identity
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* DID Document Viewer */}
      {(identity?.didDocument || did) && (
        <Card>
          <CardContent className="pt-4">
            <button
              className="flex items-center justify-between w-full text-sm font-medium py-2"
              onClick={() => setDidDocOpen((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <Shield className="size-4 text-neutral-500" />
                DID Document
              </span>
              {didDocOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {didDocOpen && (
              <pre className="mt-3 text-xs bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 overflow-auto max-h-64 border font-mono text-neutral-700 dark:text-neutral-300">
                {JSON.stringify(
                  identity?.didDocument ?? {
                    "@context": ["https://www.w3.org/ns/did/v1"],
                    id: did,
                    verificationMethod: [],
                    authentication: [],
                  },
                  null,
                  2
                )}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {did && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => copyToClipboard(did, "DID")}
          >
            <Copy className="size-4" /> Copy DID
          </Button>
        )}
        <Button
          variant="outline"
          className="gap-2"
          onClick={downloadIdentity}
          disabled={isLoading}
        >
          <Download className="size-4" /> Download Identity
        </Button>
      </div>
    </div>
  );
}
