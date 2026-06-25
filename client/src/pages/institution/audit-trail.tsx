import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Search,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Key,
  Trash2,
  Edit,
  Eye,
  Upload,
  Lock,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  resource: string;
  resourceId: string;
  details: string;
  severity: "info" | "warning" | "critical";
  ipAddress: string;
}

const MOCK_EVENTS: AuditEvent[] = [
  { id: "1", timestamp: new Date(Date.now() - 120000).toISOString(), action: "certificate.issued", actor: "admin@university.edu", resource: "Certificate", resourceId: "CERT-2026-0847", details: "Issued BSc Computer Science credential to student wallet 0x7f3a...c4d2", severity: "info", ipAddress: "192.168.1.45" },
  { id: "2", timestamp: new Date(Date.now() - 3600000).toISOString(), action: "certificate.revoked", actor: "registrar@university.edu", resource: "Certificate", resourceId: "CERT-2026-0291", details: "Revoked credential due to academic misconduct finding", severity: "critical", ipAddress: "192.168.1.12" },
  { id: "3", timestamp: new Date(Date.now() - 7200000).toISOString(), action: "settings.updated", actor: "admin@university.edu", resource: "Institution Settings", resourceId: "INST-001", details: "Updated institution display name and verification contact email", severity: "info", ipAddress: "192.168.1.45" },
  { id: "4", timestamp: new Date(Date.now() - 14400000).toISOString(), action: "api_key.created", actor: "dev@university.edu", resource: "API Key", resourceId: "KEY-0092", details: "Generated new developer portal API key with read-only scope", severity: "warning", ipAddress: "10.0.0.88" },
  { id: "5", timestamp: new Date(Date.now() - 28800000).toISOString(), action: "batch.completed", actor: "system", resource: "Batch Operation", resourceId: "BATCH-0041", details: "Bulk issuance of 127 certificates completed successfully (0 failures)", severity: "info", ipAddress: "internal" },
  { id: "6", timestamp: new Date(Date.now() - 43200000).toISOString(), action: "user.login", actor: "admin@university.edu", resource: "Session", resourceId: "SESS-8821", details: "Institutional admin login via email/password from Chrome/MacOS", severity: "info", ipAddress: "192.168.1.45" },
  { id: "7", timestamp: new Date(Date.now() - 86400000).toISOString(), action: "governance.vote", actor: "admin@university.edu", resource: "Proposal", resourceId: "PROP-0015", details: "Voted YES on proposal to update minimum PoIC threshold to 65", severity: "info", ipAddress: "192.168.1.45" },
  { id: "8", timestamp: new Date(Date.now() - 172800000).toISOString(), action: "certificate.verified", actor: "external-verifier", resource: "Certificate", resourceId: "CERT-2026-0601", details: "External verification request from employer domain hr.techcorp.com", severity: "info", ipAddress: "203.45.12.8" },
  { id: "9", timestamp: new Date(Date.now() - 259200000).toISOString(), action: "template.created", actor: "designer@university.edu", resource: "Template", resourceId: "TMPL-0033", details: "Created new certificate template 'MSc Data Science 2026'", severity: "info", ipAddress: "192.168.1.67" },
  { id: "10", timestamp: new Date(Date.now() - 345600000).toISOString(), action: "security.password_changed", actor: "admin@university.edu", resource: "Account", resourceId: "USR-001", details: "Administrative password changed via settings panel", severity: "warning", ipAddress: "192.168.1.45" },
];

const ACTION_ICONS: Record<string, typeof Shield> = {
  "certificate.issued": CheckCircle,
  "certificate.revoked": Trash2,
  "certificate.verified": Eye,
  "settings.updated": Edit,
  "api_key.created": Key,
  "batch.completed": Upload,
  "user.login": User,
  "governance.vote": FileText,
  "template.created": FileText,
  "security.password_changed": Lock,
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  critical: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AuditTrailPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: auditData, isLoading } = useQuery({
    queryKey: ["audit-trail"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_CONFIG.CERT}/api/institutions/audit-trail`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
      } catch {
        return null;
      }
    },
    staleTime: 30000,
  });

  const events: AuditEvent[] = auditData?.events ?? MOCK_EVENTS;

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !searchQuery ||
        event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.resourceId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
      const matchesAction = actionFilter === "all" || event.action.startsWith(actionFilter);
      return matchesSearch && matchesSeverity && matchesAction;
    });
  }, [events, searchQuery, severityFilter, actionFilter]);

  const severityCounts = useMemo(() => {
    const counts = { info: 0, warning: 0, critical: 0 };
    events.forEach((e) => counts[e.severity]++);
    return counts;
  }, [events]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[32px]" />)}
        </div>
        <Skeleton className="h-[500px] w-full rounded-[40px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
            Audit Trail
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            Complete activity log for compliance and security monitoring
          </p>
        </div>
        <Button variant="outline" className="rounded-xl border-neutral-200 dark:border-neutral-700 font-bold text-xs uppercase tracking-widest gap-2">
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg shadow-blue-100/50 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{severityCounts.info}</p>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Info Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg shadow-amber-100/50 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{severityCounts.warning}</p>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Warnings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg shadow-red-100/50 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <Shield className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{severityCounts.critical}</p>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Critical</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Search events, actors, or resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-40 rounded-xl border-neutral-200 dark:border-neutral-700">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl border-neutral-200 dark:border-neutral-700">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="certificate">Certificates</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="api_key">API Keys</SelectItem>
                <SelectItem value="batch">Batch Ops</SelectItem>
                <SelectItem value="user">Auth</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Event List */}
      <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
            Activity Log
          </CardTitle>
          <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            {filteredEvents.length} events{searchQuery || severityFilter !== "all" || actionFilter !== "all" ? " (filtered)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="size-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">No events match your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const Icon = ACTION_ICONS[event.action] || FileText;
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                  >
                    <div className={cn("size-10 rounded-xl flex items-center justify-center flex-shrink-0", SEVERITY_STYLES[event.severity])}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {event.action.replace(/\./g, " / ").replace(/_/g, " ")}
                        </span>
                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", SEVERITY_STYLES[event.severity])}>
                          {event.severity}
                        </Badge>
                        <span className="text-[10px] font-mono text-neutral-400">{event.resourceId}</span>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 truncate">{event.details}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><User className="size-3" /> {event.actor}</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {formatRelativeTime(event.timestamp)}</span>
                        <span className="hidden sm:flex items-center gap-1">{event.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
