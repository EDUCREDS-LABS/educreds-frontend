/**
 * Institution Users — self-service user management
 * Roles: Admin / Issuer / Viewer
 * Status: Active / Invited / Suspended
 * Actions: Invite user (email + role), revoke access
 * Uses real API; shows "—" if unavailable.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { UserPlus, Loader2, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "Admin" | "Issuer" | "Viewer";
type UserStatus = "Active" | "Invited" | "Suspended";

interface InstitutionUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: UserStatus;
  joinedAt?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchUsers(): Promise<InstitutionUser[]> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_CONFIG.CERT}/api/institutions/users`, { headers });
  if (!res.ok) throw new Error("unavailable");
  const data = await res.json();
  // Backend returns { users: [...] } — unwrap
  return Array.isArray(data) ? data : (data?.users ?? []);
}

async function inviteUser(payload: { email: string; role: Role }): Promise<void> {
  const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
  const res = await fetch(`${API_CONFIG.CERT}/api/institutions/users/invite`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: payload.email, roles: [payload.role] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || "Failed to invite user");
  }
}

async function revokeUser(userId: string): Promise<void> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_CONFIG.CERT}/api/institutions/users/${userId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to revoke access");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<UserStatus, string> = {
  Active:    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Invited:   "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Suspended: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const ROLE_BADGE: Record<Role, string> = {
  Admin:  "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Issuer: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Viewer: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function InstitutionUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState<Role>("Viewer");
  const [revokeTarget, setRevokeTarget] = useState<InstitutionUser | null>(null);

  const { data: users, isLoading, isError } = useQuery<InstitutionUser[]>({
    queryKey: ["institution-users"],
    queryFn: fetchUsers,
    retry: 1,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteUser({ email, role }),
    onSuccess: () => {
      toast({ title: "Invitation sent", description: `${email} has been invited as ${role}.` });
      queryClient.invalidateQueries({ queryKey: ["institution-users"] });
      setInviteOpen(false);
      setEmail("");
      setRole("Viewer");
    },
    onError: (e: Error) => toast({ title: "Failed to invite", description: e.message, variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => revokeUser(userId),
    onSuccess: () => {
      toast({ title: "Access revoked" });
      queryClient.invalidateQueries({ queryKey: ["institution-users"] });
      setRevokeTarget(null);
    },
    onError: (e: Error) => toast({ title: "Failed to revoke", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 rounded-2xl">
            <Users className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Team Members</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Manage who has access to your institution workspace.</p>
          </div>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="gap-2 rounded-xl font-bold"
        >
          <UserPlus className="size-4" />
          Invite Member
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-50">
              <TableHead className="font-black text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Email</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Role</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="size-5 animate-spin mx-auto text-neutral-400" />
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-neutral-400 text-sm">
                  Unable to load team members. API unavailable.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && (!users || users.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-neutral-400 text-sm">
                  No team members yet. Invite someone to get started.
                </TableCell>
              </TableRow>
            )}
            {users?.map((u) => (
              <TableRow key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                <TableCell className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                  {u.name || "—"}
                </TableCell>
                <TableCell className="text-sm text-neutral-600 dark:text-neutral-400">
                  {u.email}
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs font-bold border-0 rounded-lg", ROLE_BADGE[(u.roles?.[0] ?? "Viewer") as Role])}>
                    {u.roles?.[0] ?? "Viewer"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs font-bold border-0 rounded-lg", STATUS_BADGE[u.status])}>
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 rounded-lg font-semibold"
                    onClick={() => setRevokeTarget(u)}
                  >
                    <Trash2 className="size-3.5" />
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Email address</label>
              <Input
                type="email"
                placeholder="colleague@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Role</label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin — full management access</SelectItem>
                  <SelectItem value="Issuer">Issuer — can issue credentials</SelectItem>
                  <SelectItem value="Viewer">Viewer — read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={!email || inviteMutation.isPending}
              className="rounded-xl font-bold gap-2"
            >
              {inviteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation dialog */}
      <Dialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">Revoke Access</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 py-2">
            Remove <span className="font-bold text-neutral-800 dark:text-neutral-200">{revokeTarget?.email}</span> from
            this institution? They will immediately lose access.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRevokeTarget(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
              disabled={revokeMutation.isPending}
              className="rounded-xl font-bold gap-2"
            >
              {revokeMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
