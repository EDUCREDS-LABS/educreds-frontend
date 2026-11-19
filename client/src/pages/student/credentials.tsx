/**
 * Student Credentials Page — full list of a student's credentials.
 * Calls GET /student/credentials (student-portal module — works for all JWT types).
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { DualAuth } from "@/lib/dualAuth";
import { AuthType } from "@/lib/dualAuth";
import { getStudentToken } from "@/lib/authStorage";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Award, Share2, Shield, Calendar, GraduationCap, Building2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const CERT_API = API_CONFIG.CERT;

interface Credential {
  id: string;
  courseName: string;
  studentName?: string;
  institutionName?: string;
  institutionId?: string;
  issuedAt?: string;
  completionDate?: string;
  expiresAt?: string;
  grade?: string;
  status?: string;
  certificateType?: string;
  recipientEmail?: string;
  walletAddress?: string;
  tokenId?: number;
  ipfsHash?: string;
  vcHash?: string;
  studentDid?: string;
  shareUrl?: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export default function StudentCredentialsPage() {
  const { user, isLoading: authLoading, authType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCred, setSelectedCred] = useState<Credential | null>(null);

  // Guard — only redirect after auth has fully resolved.
  // Wait for both authLoading=false AND user to be non-null before checking.
  // This prevents a race condition where the component renders before
  // useAuth's useQuery resolves, incorrectly treating a valid session as unauthenticated.
  useEffect(() => {
    if (authLoading) return;
    // Extra safety: if authType is set to STUDENT but user is still resolving, wait
    if (authType === AuthType.STUDENT && !user) return;
    if (!user || authType !== AuthType.STUDENT) {
      navigate("/student/login", { replace: true });
    }
  }, [authLoading, user, authType, navigate]);

  const token = getStudentToken();

  // GET /student/credentials — student-portal module endpoint that works with all JWT types
  // (walletAddress JWTs from wallet login, and identity JWTs from email OTP login).
  const { data, isLoading, error } = useQuery<Credential[]>({
    queryKey: ["student-credentials", user?.email],
    queryFn: async () => {
      const res = await fetch(`${CERT_API}/student/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        // Token rejected — throw so React Query can retry.
        // Don't auto-logout here: the guard above will handle it if auth is truly gone.
        throw new Error("401: session expired");
      }
      if (!res.ok) throw new Error("Failed to load credentials. Please try again.");
      const json = await res.json();
      // Response is an array of credential objects
      return Array.isArray(json) ? json : (json?.certificates ?? []);
    },
    enabled: !!token && !!user,
    staleTime: 2 * 60 * 1000,
  });

  const credentials = data ?? [];

  const handleShare = (cred: Credential) => {
    navigate(`/student-portal/share/${cred.id}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    });
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Award className="size-5 text-neutral-500" />
          <span className="text-sm text-neutral-500 font-medium">My Credentials</span>
        </div>
        <h1 className="text-2xl font-bold">My Credentials</h1>
        <p className="text-sm text-neutral-500 mt-1">
          All credentials issued to your EduCreds account.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-red-500 text-sm">
            Failed to load credentials. Please try again.
          </CardContent>
        </Card>
      ) : credentials.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Shield className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium mb-1">No credentials yet</p>
          <p className="text-sm">Your institution will issue credentials to this account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="border rounded-xl p-4 bg-white dark:bg-neutral-950 hover:shadow-md transition-shadow cursor-pointer space-y-3"
              onClick={() => setSelectedCred(cred)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Award className="size-5 text-blue-600" />
                </div>
                <Badge
                  variant={cred.status === "revoked" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {cred.status === "revoked" ? "Revoked" : "Active"}
                </Badge>
              </div>

              <div>
                <p className="font-semibold text-sm line-clamp-2">{cred.courseName}</p>
                {(cred.institutionName || cred.institutionId) && (
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="size-3 text-neutral-400" />
                    <p className="text-xs text-neutral-500">{cred.institutionName || cred.institutionId}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Calendar className="size-3" />
                <span>Issued {formatDate(cred.issuedAt || cred.completionDate)}</span>
              </div>

              {cred.grade && (
                <div className="flex items-center gap-1">
                  <GraduationCap className="size-3 text-neutral-400" />
                  <span className="text-xs text-neutral-500">Grade: {cred.grade}</span>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(cred);
                }}
              >
                <Share2 className="size-3" /> Share
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Credential Detail Modal */}
      <Dialog open={!!selectedCred} onOpenChange={(open) => { if (!open) setSelectedCred(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="size-5 text-blue-600" />
              {selectedCred?.courseName}
            </DialogTitle>
            <DialogDescription>Credential details and actions</DialogDescription>
          </DialogHeader>
          {selectedCred && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(selectedCred.institutionName || selectedCred.institutionId) && (
                  <div>
                    <p className="text-xs text-neutral-400 font-medium">Institution</p>
                    <p className="font-medium">{selectedCred.institutionName || selectedCred.institutionId}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-neutral-400 font-medium">Status</p>
                  <Badge
                    variant={selectedCred.status === "revoked" ? "destructive" : "secondary"}
                    className="text-xs mt-0.5"
                  >
                    {selectedCred.status === "revoked" ? "Revoked" : "Active"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 font-medium">Issued</p>
                  <p className="font-medium">{formatDate(selectedCred.issuedAt || selectedCred.completionDate)}</p>
                </div>
                {selectedCred.expiresAt && (
                  <div>
                    <p className="text-xs text-neutral-400 font-medium">Expires</p>
                    <p className="font-medium">{formatDate(selectedCred.expiresAt)}</p>
                  </div>
                )}
                {selectedCred.grade && (
                  <div>
                    <p className="text-xs text-neutral-400 font-medium">Grade</p>
                    <p className="font-medium">{selectedCred.grade}</p>
                  </div>
                )}
                {selectedCred.tokenId !== undefined && (
                  <div>
                    <p className="text-xs text-neutral-400 font-medium">Token ID</p>
                    <p className="font-medium font-mono">#{selectedCred.tokenId}</p>
                  </div>
                )}
              </div>

              {selectedCred.ipfsHash && (
                <div>
                  <p className="text-xs text-neutral-400 font-medium mb-1">IPFS Hash</p>
                  <button
                    className="text-xs font-mono text-blue-600 hover:underline break-all text-left"
                    onClick={() => copyToClipboard(selectedCred.ipfsHash!, "IPFS Hash")}
                  >
                    {selectedCred.ipfsHash}
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-1"
                  onClick={() => { setSelectedCred(null); handleShare(selectedCred); }}
                  disabled={selectedCred.status === "revoked"}
                >
                  <Share2 className="size-4" /> Share
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCred(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
