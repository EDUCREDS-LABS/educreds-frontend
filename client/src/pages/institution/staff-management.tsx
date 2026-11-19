/**
 * Institution Staff Management — /institution/admin/staff
 *
 * OWNER or ADMIN can:
 *  - View all staff (active / invited / disabled)
 *  - Approve pending (invited) staff with role + tab assignment
 *  - Reject/disable staff members
 *  - Update roles and allowed navigation tabs for existing active staff
 *  - Invite new staff members by email
 */
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getInstitutionToken } from "@/lib/authStorage";
import { API_CONFIG } from "@/config/api";

const API = API_CONFIG.CERT.replace(/\/$/, "");

const ROLE_OPTIONS = ["OWNER", "ADMIN", "REGISTRAR", "ISSUER", "VIEWER"] as const;
type Role = (typeof ROLE_OPTIONS)[number];
type Status = "active" | "invited" | "disabled";

const AVAILABLE_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'students', label: 'Students' },
  { id: 'enrollment', label: 'Enrollment' },
  { id: 'programs', label: 'Programs' },
  { id: 'cohorts', label: 'Cohorts' },
  { id: 'issue', label: 'Issue Credentials' },
  { id: 'bulk-issue', label: 'Bulk Issue' },
  { id: 'lms-import', label: 'LMS Import' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'verification', label: 'Verification' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'audit-trail', label: 'Audit Trail' },
  { id: 'api-access', label: 'API Access' },
  { id: 'settings', label: 'Settings' },
];

interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  displayName?: string | null;
  status: Status;
  roles: Role[];
  allowedTabs: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

function statusBadge(status: Status) {
  const map: Record<Status, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    invited: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    disabled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function authHeaders(): Record<string, string> {
  const token = getInstitutionToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "invited">("invited");

  // Edit / Approve dialog
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(["VIEWER"]);
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  async function fetchStaff() {
    const token = getInstitutionToken();
    if (!token) {
      setLoading(false);
      setError("No institution session found. Please log in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/institutions/users`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const raw: any[] = data.users ?? data.staff ?? data;
      setStaff(
        raw.map((m: any) => ({
          ...m,
          name: m.name ?? m.displayName ?? null,
          displayName: m.name ?? m.displayName ?? null,
          allowedTabs: m.allowedTabs ?? [],
        })),
      );
    } catch (e: any) {
      setLoading(false);
      setError("Could not load staff. Check your session.");
      toast.error("Failed to load staff: " + (e.message ?? "unknown error"));
      return;
    }
    setLoading(false);
  }

  useEffect(() => { fetchStaff(); }, []);

  async function handleApproveOrUpdate() {
    if (!editTarget) return;
    setActionLoading(true);
    try {
      const rolesRes = await fetch(
        `${API}/api/institutions/users/${editTarget.id}/roles`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ roles: selectedRoles }),
        },
      );
      if (!rolesRes.ok) throw new Error(await rolesRes.text());

      const tabsRes = await fetch(
        `${API}/api/institutions/users/${editTarget.id}/tabs`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ allowedTabs: selectedTabs }),
        },
      );
      if (!tabsRes.ok) throw new Error(await tabsRes.text());

      toast.success(
        `${editTarget.email} updated — roles: ${selectedRoles.join(", ")}, tabs: ${selectedTabs.length}`,
      );
      setEditTarget(null);
      fetchStaff();
    } catch (e: any) {
      toast.error("Update failed: " + (e.message ?? "unknown error"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(member: StaffMember) {
    if (!confirm(`Reject access for ${member.email}?`)) return;
    try {
      const res = await fetch(
        `${API}/api/institutions/users/${member.id}`,
        { method: "DELETE", headers: authHeaders() },
      );
      if (!res.ok) throw new Error(await res.text());
      toast.success(`${member.email} removed.`);
      fetchStaff();
    } catch (e: any) {
      toast.error("Failed: " + (e.message ?? "unknown error"));
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Email is required.");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch(`${API}/api/institutions/users/invite`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: inviteEmail.trim(), name: inviteName.trim() || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Invitation sent to ${inviteEmail.trim()}.`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      fetchStaff();
    } catch (e: any) {
      toast.error("Invite failed: " + (e.message ?? "unknown error"));
    } finally {
      setInviteLoading(false);
    }
  }

  function openEdit(member: StaffMember) {
    setEditTarget(member);
    setSelectedRoles(member.roles.length ? member.roles : ["VIEWER"]);
    setSelectedTabs(member.allowedTabs ?? []);
  }

  const activeStaff   = staff.filter((s) => s.status === "active");
  const invitedStaff  = staff.filter((s) => s.status === "invited");
  const disabledStaff = staff.filter((s) => s.status === "disabled");
  const filtered      = tab === "invited" ? invitedStaff : staff;
  const pendingCount  = invitedStaff.length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Staff Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage staff access, roles, and navigation permissions for your institution.
          </p>
        </div>
        {/* Invite button — shown to institution owners/admins */}
        <Button onClick={() => setInviteOpen(true)} size="sm">
          + Invite Staff Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(["invited", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t === "invited"
              ? `Pending Approval${pendingCount ? ` (${pendingCount})` : ""}`
              : "All Staff"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading staff...</div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500 font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchStaff}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : tab === "invited" ? (
        /* ── Pending Approval tab ── */
        invitedStaff.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              No pending approval requests.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invitedStaff.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onApprove={() => openEdit(member)}
                onReject={() => handleReject(member)}
              />
            ))}
          </div>
        )
      ) : (
        /* ── All Staff tab ── */
        <div className="space-y-6">
          {/* Active */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Active ({activeStaff.length})
            </h2>
            {activeStaff.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-slate-500 text-sm">
                  No active staff members yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeStaff.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onEdit={() => openEdit(member)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Invited/Pending */}
          {invitedStaff.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Pending Approval ({invitedStaff.length})
              </h2>
              <div className="space-y-3">
                {invitedStaff.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onApprove={() => openEdit(member)}
                    onReject={() => handleReject(member)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Disabled */}
          {disabledStaff.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Disabled ({disabledStaff.length})
              </h2>
              <div className="space-y-3">
                {disabledStaff.map((member) => (
                  <MemberCard key={member.id} member={member} disabled />
                ))}
              </div>
            </section>
          )}

          {staff.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No staff members found. Invite someone to get started.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Approve / Edit dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget?.status === "invited" ? "Approve Staff Member" : "Edit Staff Access"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-400">{editTarget?.email}</p>

          {/* Roles */}
          <div className="space-y-3 mt-4">
            <Label className="text-sm font-semibold">Assign Roles</Label>
            {ROLE_OPTIONS.map((role) => (
              <div key={role} className="flex items-center gap-2">
                <Checkbox
                  id={`role-${role}`}
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={(checked) =>
                    setSelectedRoles((prev) =>
                      checked ? [...prev, role] : prev.filter((r) => r !== role),
                    )
                  }
                />
                <Label htmlFor={`role-${role}`} className="text-sm cursor-pointer">{role}</Label>
              </div>
            ))}
          </div>

          {/* Tab Permissions */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Navigation Tab Access</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setSelectedTabs(AVAILABLE_TABS.map((t) => t.id))}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setSelectedTabs([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">Leave empty to allow access to all tabs (unrestricted).</p>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TABS.map((tabDef) => (
                <div key={tabDef.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`tab-${tabDef.id}`}
                    checked={selectedTabs.includes(tabDef.id)}
                    onCheckedChange={(checked) =>
                      setSelectedTabs((prev) =>
                        checked ? [...prev, tabDef.id] : prev.filter((t) => t !== tabDef.id),
                      )
                    }
                  />
                  <Label htmlFor={`tab-${tabDef.id}`} className="text-xs cursor-pointer">
                    {tabDef.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveOrUpdate}
              disabled={actionLoading || selectedRoles.length === 0}
            >
              {actionLoading
                ? "Saving..."
                : editTarget?.status === "invited"
                ? "Approve"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invite dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) { setInviteEmail(""); setInviteName(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Send an invitation to a new staff member. They'll be added in "Pending Approval" state.
          </p>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="invite-email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="staff@institution.edu"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div>
              <Label htmlFor="invite-name" className="text-sm font-medium">
                Name <span className="text-slate-400 text-xs">(optional)</span>
              </Label>
              <Input
                id="invite-name"
                type="text"
                placeholder="Full name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail.trim()}>
              {inviteLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Shared MemberCard component ──────────────────────────────────────────────

interface MemberCardProps {
  member: StaffMember;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
}

function MemberCard({ member, onApprove, onReject, onEdit, disabled }: MemberCardProps) {
  const displayName = member.name ?? member.displayName ?? null;
  return (
    <Card className={disabled ? "opacity-60" : ""}>
      <CardContent className="py-4 flex items-start justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">
            {displayName ?? member.email}
          </p>
          {displayName && (
            <p className="text-xs text-slate-500 truncate">{member.email}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {statusBadge(member.status)}
            {member.roles.map((r) => (
              <span
                key={r}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded px-2 py-0.5 text-xs"
              >
                {r}
              </span>
            ))}
            {disabled && (
              <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded px-2 py-0.5 text-xs font-medium">
                Disabled
              </span>
            )}
          </div>
          {member.allowedTabs && member.allowedTabs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.allowedTabs.slice(0, 6).map((tabId) => {
                const tabDef = AVAILABLE_TABS.find((t) => t.id === tabId);
                return tabDef ? (
                  <span
                    key={tabId}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {tabDef.label}
                  </span>
                ) : null;
              })}
              {member.allowedTabs.length > 6 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                  +{member.allowedTabs.length - 6} more
                </span>
              )}
            </div>
          )}
          {member.allowedTabs && member.allowedTabs.length === 0 && member.status === "active" && (
            <span className="text-[10px] text-slate-400 italic mt-1 block">All tabs (unrestricted)</span>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Joined {new Date(member.createdAt).toLocaleDateString()}
            {member.lastLoginAt &&
              ` · Last login ${new Date(member.lastLoginAt).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {member.status === "invited" && (
            <>
              <Button size="sm" onClick={onApprove}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={onReject}>
                Reject
              </Button>
            </>
          )}
          {member.status === "active" && onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit Access
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
