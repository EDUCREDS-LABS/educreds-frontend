import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, Search, Eye, Edit, AlertTriangle, Download, Award, Check, Clock, X, 
  ShieldCheck, History, ExternalLink, MoreVertical, Copy, FileText, 
  Filter, ListFilter, LayoutGrid, CheckCircle2, ChevronRight, Info, XCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { saveAs } from "file-saver";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import CreateCertificateModal from "@/components/CreateCertificateModal";
import { format } from "date-fns";
import type { Certificate } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type FilterPreset = {
  id: string;
  name: string;
  searchTerm: string;
  statusFilter: string;
  programFilter: string;
  sortKey: string;
  sortDir: "asc" | "desc";
  pageSize: number;
};

export default function Certificates() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState("issuedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("FRAUD");
  const [revokeDetailsUri, setRevokeDetailsUri] = useState("");
  const [revokeNotes, setRevokeNotes] = useState("");
  const [revokeRecordType, setRevokeRecordType] = useState("BOARD_RESOLUTION");
  const [revokeProofUploading, setRevokeProofUploading] = useState(false);
  const [revokeProofFileName, setRevokeProofFileName] = useState("");
  const [revokeTargetIds, setRevokeTargetIds] = useState<string[]>([]);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const presetStorageKey = "educreds.certificates.presets";

  const revokeReasons = [
    { value: "FRAUD", label: "Fraud / Misrepresentation" },
    { value: "INSTITUTION_REVOKED", label: "Institution Revoked" },
    { value: "ADMINISTRATIVE", label: "Administrative Decision" },
    { value: "DISPUTE_RESOLVED", label: "Dispute Resolved" },
    { value: "OTHER", label: "Other" },
  ];
  const recordTypes = [
    { value: "BOARD_RESOLUTION", label: "Board Resolution" },
    { value: "COURT_ORDER", label: "Court Order" },
    { value: "ACCREDITATION_ACTION", label: "Accreditation Action" },
    { value: "COMPLIANCE_REQUEST", label: "Compliance Request" },
    { value: "INTERNAL_AUDIT", label: "Internal Audit" },
    { value: "OTHER", label: "Other Official Record" },
  ];
  const revokeReasonCodes: Record<string, number> = {
    FRAUD: 0,
    INSTITUTION_REVOKED: 1,
    ADMINISTRATIVE: 2,
    DISPUTE_RESOLVED: 3,
    OTHER: 4,
  };

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(presetStorageKey) : null;
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as FilterPreset[];
      setPresets(parsed);
    } catch {
      setPresets([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(presetStorageKey, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, programFilter, sortKey, sortDir, pageSize]);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      sortBy: sortKey,
      sortDir,
      status: statusFilter !== "all" ? statusFilter : undefined,
      program: programFilter !== "all" ? programFilter : undefined,
      search: searchTerm.trim() ? searchTerm.trim() : undefined,
    }),
    [currentPage, pageSize, sortKey, sortDir, statusFilter, programFilter, searchTerm],
  );

  const { data: certificatesData, isLoading } = useQuery({
    queryKey: ["institutionCertificates", queryParams],
    queryFn: () => api.getCertificates(queryParams),
    enabled: !!user,
    refetchOnMount: true,
    staleTime: 60_000,
    keepPreviousData: true,
  });

  const certificates = certificatesData?.certificates || [];
  const serverMeta = (certificatesData as any)?.meta;
  const serverPaged = Boolean(serverMeta?.total);

  const searchValue = searchTerm.trim().toLowerCase();
  const filteredCertificates = useMemo(() => {
    if (!certificates.length) return [];
    if (serverPaged) return certificates;
    return certificates.filter((cert: Certificate) => {
      const studentName = (cert.studentName && cert.studentName !== "unknown student") ? cert.studentName.toLowerCase() : "";
      const courseName = cert.courseName?.toLowerCase() || "";
      const studentAddress = cert.studentAddress?.toLowerCase() || "";
      const matchesSearch = !searchValue || 
        studentName.includes(searchValue) || 
        courseName.includes(searchValue) ||
        studentAddress.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && cert.isValid && cert.isMinted && !(cert as any).isArchived) ||
        (statusFilter === "pending" && (!cert.isMinted || !cert.isValid) && !(cert as any).isArchived) ||
        (statusFilter === "revoked" && !cert.isValid) ||
        (statusFilter === "archived" && (cert as any).isArchived);

      const matchesProgram =
        programFilter === "all" || programFilter.toLowerCase() === courseName.toLowerCase() || courseName.toLowerCase().includes(programFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [certificates, searchValue, statusFilter, programFilter, serverPaged]);

  const programOptions = useMemo(() => {
    const values = new Set<string>();
    certificates.forEach((cert: Certificate) => {
      if (cert.courseName) values.add(cert.courseName);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [certificates]);

  const sortedCertificates = useMemo(() => {
    if (serverPaged) return filteredCertificates;
    const list = [...filteredCertificates];
    const direction = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "studentName":
          return (a.studentName || "").localeCompare(b.studentName || "") * direction;
        case "courseName":
          return (a.courseName || "").localeCompare(b.courseName || "") * direction;
        case "status": {
          const statusA = a.isValid ? (a.isMinted ? "active" : "pending") : "revoked";
          const statusB = b.isValid ? (b.isMinted ? "active" : "pending") : "revoked";
          return statusA.localeCompare(statusB) * direction;
        }
        case "issuedAt":
        default: {
          const timeA = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
          const timeB = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
          return (timeA - timeB) * direction;
        }
      }
    });
    return list;
  }, [filteredCertificates, sortDir, sortKey, serverPaged]);

  const stats = useMemo(() => {
    // Calculate stats from all certificates, not just filtered/paged ones
    const allCerts = certificates;
    const total = allCerts.length;
    let active = 0;
    let pending = 0;
    let revoked = 0;
    let archived = 0;
    allCerts.forEach((cert: Certificate) => {
      if ((cert as any).isArchived) {
        archived += 1;
      } else if (!cert.isValid) {
        revoked += 1;
      } else if (cert.status === "pending" || !cert.isMinted) {
        pending += 1;
      } else {
        active += 1;
      }
    });
    return { total, active, pending, revoked, archived };
  }, [certificates]);

  const totalCount = serverMeta?.total ?? filteredCertificates.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const pagedCertificates = useMemo(() => {
    if (serverPaged) return filteredCertificates;
    const start = (clampedPage - 1) * pageSize;
    return sortedCertificates.slice(start, start + pageSize);
  }, [filteredCertificates, clampedPage, pageSize, sortedCertificates, serverPaged]);

  const selectedPendingIds = useMemo(() => {
    if (!selectedCertificateIds.length) return [];
    return selectedCertificateIds.filter((id) => {
      const cert = certificates.find((c: Certificate) => c.id === id);
      return (cert as any)?.revocationRequestStatus === "pending";
    });
  }, [selectedCertificateIds, certificates]);

  const getStatusBadge = (certificate: Certificate) => {
    if ((certificate as any).isArchived) {
      return (
        <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-neutral-200 flex items-center gap-1.5 px-2.5 py-0.5">
          <History className="h-3 w-3" />
          Archived
        </Badge>
      );
    }
    if ((certificate as any).revocationRequestStatus === "pending") {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 flex items-center gap-1.5 px-2.5 py-0.5">
          <AlertTriangle className="h-3 w-3" />
          Revocation Pending
        </Badge>
      );
    }
    if (!certificate.isValid) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 flex items-center gap-1.5 px-2.5 py-0.5">
          <XCircle className="h-3 w-3" />
          Revoked
        </Badge>
      );
    }
    if (certificate.isMinted) {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1.5 px-2.5 py-0.5">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1.5 px-2.5 py-0.5">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVisibleCertificateIds = pagedCertificates.map(cert => cert.id);
      setSelectedCertificateIds(allVisibleCertificateIds);
    } else {
      setSelectedCertificateIds([]);
    }
  };

  const handleSelectCertificate = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCertificateIds(prev => [...prev, id]);
    } else {
      setSelectedCertificateIds(prev => prev.filter(certId => certId !== id));
    }
  };

  const handleExportCsv = () => {
    const exportSet =
      selectedCertificateIds.length > 0
        ? filteredCertificates.filter((cert) => selectedCertificateIds.includes(cert.id!))
        : filteredCertificates;

    if (exportSet.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no certificates matching your current selection to export.",
        variant: "info",
      });
      return;
    }

    const headers = [
      "ID", "Student Name", "Student Address", "Course Name", "Grade",
      "Certificate Type", "Issued At", "IPFS Hash", "Token ID", "Status"
    ];

    const csvRows = exportSet.map(cert => [
      `"${cert.id}"`,
      `"${cert.studentName}"`,
      `"${cert.studentAddress}"`,
      `"${cert.courseName}"`,
      `"${cert.grade}"`,
      `"${cert.certificateType}"`,
      `"${cert.issuedAt ? format(new Date(cert.issuedAt), "yyyy-MM-dd HH:mm:ss") : ""}"`,
      `"${cert.ipfsHash || ''}"`,
      `"${cert.tokenId || ''}"`,
      `"${(cert as any).revocationRequestStatus === "pending" ? "Revocation Pending" : cert.isValid ? "Active" : "Revoked"}"`,
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'certificates.csv');

    toast({
      title: 'Export Successful',
      description: `${exportSet.length} certificates exported to certificates.csv.`,
    });
  };

  const handleSavePreset = () => {
    const name = window.prompt("Name this view");
    if (!name) return;
    const id = `${Date.now()}`;
    const preset: FilterPreset = {
      id,
      name,
      searchTerm,
      statusFilter,
      programFilter,
      sortKey,
      sortDir,
      pageSize,
    };
    setPresets((prev) => [...prev, preset]);
    setActivePresetId(id);
    toast({ title: "View saved", description: `"${name}" has been saved.` });
  };

  const handleApplyPreset = (presetId: string) => {
    setActivePresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    setSearchTerm(preset.searchTerm);
    setStatusFilter(preset.statusFilter);
    setProgramFilter(preset.programFilter);
    setSortKey(preset.sortKey);
    setSortDir(preset.sortDir);
    setPageSize(preset.pageSize);
    setCurrentPage(1);
  };

  const handleOpenDetails = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setDetailsOpen(true);
  };

  const handleBulkArchive = async () => {
    if (selectedCertificateIds.length === 0) return;
    try {
      await api.bulkArchiveCertificates(selectedCertificateIds);
      toast({
        title: "Certificates archived",
        description: `${selectedCertificateIds.length} certificates archived successfully.`,
      });
      setSelectedCertificateIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
    } catch (error: any) {
      toast({
        title: "Archive failed",
        description: error?.message || "Failed to archive certificates.",
        variant: "destructive",
      });
    }
  };

  const resetRevokeDialog = () => {
    setRevokeReason("FRAUD");
    setRevokeDetailsUri("");
    setRevokeNotes("");
    setRevokeRecordType("BOARD_RESOLUTION");
    setRevokeProofFileName("");
    setRevokeTargetIds([]);
  };

  const handleOpenRevokeDialog = (ids: string[]) => {
    if (!ids.length) return;
    setRevokeTargetIds(ids);
    setRevokeDialogOpen(true);
  };

  const handleUploadProof = async (file: File) => {
    setRevokeProofUploading(true);
    try {
      const result = await api.uploadRevocationProof({
        file,
        recordType: revokeRecordType,
      });
      setRevokeDetailsUri(result.uri);
      setRevokeProofFileName(file.name);
      toast({
        title: "Proof uploaded",
        description: "Evidence file uploaded and linked to this revocation.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Unable to upload proof file.",
        variant: "destructive",
      });
    } finally {
      setRevokeProofUploading(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (revokeTargetIds.length === 0) return;
    if (!revokeDetailsUri.trim()) {
      toast({
        title: "Proof required",
        description: "Provide an official record or upload evidence before submitting.",
        variant: "destructive",
      });
      return;
    }

    setRevokeLoading(true);
    try {
      await api.bulkRequestRevocation({
        certificateIds: revokeTargetIds,
        reasonCode: revokeReasonCodes[revokeReason] ?? 4,
        reasonText: revokeReason,
        detailsUri: revokeDetailsUri.trim(),
        notes: revokeNotes.trim() ? revokeNotes.trim() : undefined,
        recordType: revokeRecordType,
      });
      toast({
        title: "Revocation request submitted",
        description: `${revokeTargetIds.length} request${revokeTargetIds.length > 1 ? "s" : ""} queued for approval.`,
      });
      setSelectedCertificateIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
      setRevokeDialogOpen(false);
      resetRevokeDialog();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error?.message || "Failed to submit revocation request.",
        variant: "destructive",
      });
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleApproveRevocation = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await api.bulkApproveRevocations({ certificateIds: ids });
      toast({
        title: "Revocations approved",
        description: `${ids.length} certificate${ids.length > 1 ? "s" : ""} revoked on-chain.`,
      });
      setSelectedCertificateIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error?.message || "Failed to approve revocations.",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(1, nextPage), totalPages));
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, delay = 0 }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`dashboard-card relative overflow-hidden p-6 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 ring-1 ring-inset ring-current`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs font-medium text-neutral-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Verified Lifecycle
        </span>
      </div>
      <div className={`absolute bottom-0 right-0 w-24 h-24 -mr-8 -mb-8 opacity-[0.03] rotate-12`}>
        <Icon className="w-full h-full" />
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 px-2 lg:px-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Award className="h-3.5 w-3.5" />
            Institution Dashboard
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 font-heading">
            Certificate Operations
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl leading-relaxed font-sans">
            Scale your digital credential infrastructure with enterprise-grade controls over issuance, verification, and on-chain lifecycle management.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={handleExportCsv}
                  className="bg-white border-neutral-200 hover:bg-neutral-50 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 mr-2 text-neutral-600" />
                  Export Data
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download current view as CSV</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button 
            onClick={() => setLocation('/institution/issue')} 
            className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all px-6 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Certificate
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Issued" 
          value={stats.total} 
          icon={FileText} 
          colorClass="text-blue-600 bg-blue-50"
          delay={0.1}
        />
        <StatCard 
          title="Active Credentials" 
          value={stats.active} 
          icon={CheckCircle2} 
          colorClass="text-emerald-600 bg-emerald-50"
          delay={0.2}
        />
        <StatCard 
          title="Pending Minting" 
          value={stats.pending} 
          icon={Clock} 
          colorClass="text-amber-600 bg-amber-50"
          delay={0.3}
        />
        <StatCard 
          title="Revocation Rate" 
          value={stats.revoked} 
          icon={AlertTriangle} 
          colorClass="text-red-600 bg-red-50"
          delay={0.4}
        />
      </div>

      {/* Filtering & Controls Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="space-y-6"
      >
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 lg:p-6 space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group flex-1 min-w-[320px]">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search by student, course, or program ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-6 border-neutral-200 bg-neutral-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-base rounded-xl"
                />
              </div>
              <Separator orientation="vertical" className="h-10 hidden xl:block mx-2" />
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] border-neutral-200 bg-neutral-50/50 h-11 rounded-xl">
                    <ListFilter className="w-4 h-4 mr-2 text-neutral-500" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-[200px] border-neutral-200 bg-neutral-50/50 h-11 rounded-xl">
                    <Filter className="w-4 h-4 mr-2 text-neutral-500" />
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programOptions.map((program) => (
                      <SelectItem key={program} value={program.toLowerCase()}>
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={activePresetId} onValueChange={handleApplyPreset}>
                <SelectTrigger className="w-[180px] border-neutral-200 bg-neutral-50/50 h-11 rounded-xl">
                  <LayoutGrid className="w-4 h-4 mr-2 text-neutral-500" />
                  <SelectValue placeholder="Saved Views" />
                </SelectTrigger>
                <SelectContent>
                  {presets.length === 0 && <SelectItem value="none" disabled>No saved views</SelectItem>}
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={handleSavePreset} className="text-primary hover:bg-primary/5 font-medium">
                Save Current View
              </Button>
            </div>
          </div>

          {/* Table Header / Selection Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4 bg-neutral-50 px-4 py-2.5 rounded-xl border border-neutral-200">
              <Checkbox
                id="selectAllTop"
                checked={selectedCertificateIds.length === pagedCertificates.length && pagedCertificates.length > 0}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="selectAllTop" className="text-sm font-semibold text-neutral-700 select-none">
                {selectedCertificateIds.length > 0 
                  ? `${selectedCertificateIds.length} items selected` 
                  : "Select all on page"}
              </label>
              {selectedCertificateIds.length > 0 && (
                <div className="flex items-center gap-2 ml-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 border-primary text-primary hover:bg-primary/5">
                        Bulk Actions
                        <ChevronRight className="w-3.5 h-3.5 ml-1.5 rotate-90" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleOpenRevokeDialog(selectedCertificateIds)} className="text-red-600 focus:text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Request Revocation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleApproveRevocation(selectedPendingIds)}
                        disabled={selectedPendingIds.length === 0}
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Approve Requests
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBulkArchive}>
                        <History className="w-4 h-4 mr-2" />
                        Archive Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleExportCsv}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Enterprise Control Layer Active
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span>{filteredCertificates.length} Results Found</span>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="dashboard-card overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-neutral-50/80 backdrop-blur-sm sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-b-neutral-200">
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-[300px] font-bold text-neutral-900">Student & Credential</TableHead>
                <TableHead className="font-bold text-neutral-900">Program</TableHead>
                <TableHead className="font-bold text-neutral-900">Issued On</TableHead>
                <TableHead className="font-bold text-neutral-900">Status</TableHead>
                <TableHead className="font-bold text-neutral-900">Proof Hash</TableHead>
                <TableHead className="text-right font-bold text-neutral-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div></TableCell>
                  </TableRow>
                ))
              ) : pagedCertificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-neutral-100 rounded-full text-neutral-400">
                        <FileText className="h-10 w-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-neutral-900 font-heading">No results matched your search</p>
                        <p className="text-neutral-500 max-w-sm mx-auto">Try clearing your filters or issuing a new certificate to get started.</p>
                      </div>
                      <Button variant="outline" onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setProgramFilter("all");
                      }}>Clear All Filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {pagedCertificates.map((certificate: Certificate) => (
                    <motion.tr
                      key={certificate.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group border-b border-neutral-100 hover:bg-blue-50/30 transition-all"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedCertificateIds.includes(certificate.id!)}
                          onCheckedChange={(checked: boolean) => handleSelectCertificate(certificate.id!, checked)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-neutral-200">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${certificate.studentAddress}`} />
                            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                              {certificate.studentName?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-neutral-900 group-hover:text-primary transition-colors">
                              {certificate.studentName && certificate.studentName.toLowerCase() !== "unknown student" 
                                ? certificate.studentName 
                                : certificate.studentAddress 
                                  ? `${certificate.studentAddress.slice(0, 6)}...${certificate.studentAddress.slice(-4)}`
                                  : "Unknown Student"}
                            </p>
                            <p className="text-[10px] font-mono text-neutral-400 mt-0.5 truncate max-w-[140px]">
                              {certificate.studentAddress}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-neutral-700">
                            {certificate.courseName && certificate.courseName !== 'Unknown Program'
                              ? certificate.courseName
                              : 'Unknown Program'}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                            {certificate.certificateType || 'Academic'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-neutral-600">
                          {certificate.issuedAt ? format(new Date(certificate.issuedAt), "MMM dd, yyyy") : "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(certificate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                            {certificate.ipfsHash ? `${certificate.ipfsHash.slice(0, 6)}...` : "N/A"}
                          </code>
                          {certificate.ipfsHash && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(certificate.ipfsHash!)}
                                    className="p-1 hover:bg-neutral-200 rounded transition-colors text-neutral-400 hover:text-neutral-600"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Copy Hash</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-neutral-500 hover:text-primary hover:bg-primary/5 font-semibold"
                            onClick={() => handleOpenDetails(certificate)}
                          >
                            Details
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-neutral-900">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => certificate.ipfsHash && window.open(`https://ipfs.io/ipfs/${certificate.ipfsHash}`, "_blank")}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on IPFS
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDetails(certificate)}>
                                <Info className="w-4 h-4 mr-2" />
                                Audit Log
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(certificate as any).revocationRequestStatus === "pending" && (
                                <DropdownMenuItem onClick={() => handleApproveRevocation([certificate.id!])}>
                                  <ShieldCheck className="w-4 h-4 mr-2" />
                                  Approve Revocation
                                </DropdownMenuItem>
                              )}
                              {certificate.isValid && (certificate as any).revocationRequestStatus !== "pending" && (
                                <DropdownMenuItem 
                                  onClick={() => handleOpenRevokeDialog([certificate.id!])}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Request Revocation
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Improved Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2">
          <div className="flex items-center gap-4">
            <p className="text-sm text-neutral-500 font-medium">
              Showing <span className="text-neutral-900">{(clampedPage - 1) * pageSize + 1}-{Math.min(clampedPage * pageSize, totalCount)}</span> of <span className="text-neutral-900 font-bold">{totalCount}</span> certificates
            </p>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <div className="flex items-center gap-2">
              <p className="text-xs text-neutral-400 font-bold uppercase">Per Page:</p>
              <Select value={String(pageSize)} onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[80px] h-8 border-neutral-200 bg-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(clampedPage - 1)} 
              disabled={clampedPage === 1}
              className="border-neutral-200 bg-white shadow-sm h-10 px-4"
            >
              Previous
            </Button>
            <div className="flex items-center px-4 h-10 rounded-lg border border-neutral-200 bg-white text-sm font-bold shadow-sm">
              <span className="text-primary">{clampedPage}</span>
              <span className="mx-2 text-neutral-300">/</span>
              <span className="text-neutral-500">{totalPages}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(clampedPage + 1)} 
              disabled={clampedPage === totalPages}
              className="border-neutral-200 bg-white shadow-sm h-10 px-4"
            >
              Next
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Details Drawer */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col">
          <SheetHeader className="p-6 bg-neutral-50 border-b border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold font-heading">Credential Audit</SheetTitle>
                <SheetDescription className="text-neutral-500 font-medium">Internal verification and lifecycle record.</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {selectedCertificate && (
              <>
                {/* Student Info Card */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Recipient Identity</h4>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedCertificate.studentAddress}`} />
                      <AvatarFallback className="text-lg font-bold bg-primary text-white">
                        {selectedCertificate.studentName?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-bold text-neutral-900">{selectedCertificate.studentName}</p>
                      <p className="text-sm font-mono text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-100 inline-block mt-1">
                        {selectedCertificate.studentAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="opacity-50" />

                {/* Credential Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Credential Metadata</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500 font-medium">Program Name</p>
                      <p className="text-sm font-bold text-neutral-900">{selectedCertificate.courseName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500 font-medium">Credential Type</p>
                      <p className="text-sm font-bold text-neutral-900">{selectedCertificate.certificateType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500 font-medium">Grade / Standing</p>
                      <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
                        {selectedCertificate.grade}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500 font-medium">Current Status</p>
                      <div>{getStatusBadge(selectedCertificate)}</div>
                    </div>
                  </div>
                </div>

                <Separator className="opacity-50" />

                {/* Blockchain Evidence */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Blockchain Evidence</h4>
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-500">IPFS CID</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-neutral-900">{selectedCertificate.ipfsHash || "N/A"}</span>
                          {selectedCertificate.ipfsHash && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => navigator.clipboard.writeText(selectedCertificate.ipfsHash!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-500">Token ID</span>
                        <span className="text-sm font-bold font-mono">#{selectedCertificate.tokenId || "PENDING"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Trail */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Audit Trail</h4>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                    <div className="relative">
                      <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                      <p className="text-sm font-bold text-neutral-900">Credential Issued</p>
                      <p className="text-xs text-neutral-500">
                        {selectedCertificate.issuedAt ? format(new Date(selectedCertificate.issuedAt), "PPP p") : "—"}
                      </p>
                    </div>
                    {selectedCertificate.mintedAt && (
                      <div className="relative">
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        <p className="text-sm font-bold text-neutral-900">Minted On-Chain</p>
                        <p className="text-xs text-neutral-500">{format(new Date(selectedCertificate.mintedAt), "PPP p")}</p>
                      </div>
                    )}
                    {(selectedCertificate as any).revocationRequestStatus === "pending" && (
                      <div className="relative">
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
                        <p className="text-sm font-bold text-orange-700">Revocation Requested</p>
                        <p className="text-xs text-neutral-500">
                          {(selectedCertificate as any).revocationRequestedAt
                            ? format(new Date((selectedCertificate as any).revocationRequestedAt), "PPP p")
                            : "Pending review"}
                        </p>
                        <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <p className="text-xs font-bold text-orange-800 mb-1">
                            Reason: {(selectedCertificate as any).revocationRequestReason || (selectedCertificate as any).revocationReason || "—"}
                          </p>
                          <p className="text-[10px] text-orange-700">
                            Record Type: {(selectedCertificate as any).revocationRequestRecordType || "—"}
                          </p>
                          <p className="text-[10px] text-orange-700 font-mono">
                            Proof: {(selectedCertificate as any).revocationRequestDetailsUri || "—"}
                          </p>
                        </div>
                      </div>
                    )}
                    {!selectedCertificate.isValid && (
                      <div className="relative">
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                        <p className="text-sm font-bold text-red-600">Credential Revoked</p>
                        <p className="text-xs text-neutral-500">
                          {(selectedCertificate as any).revokedAt
                            ? format(new Date((selectedCertificate as any).revokedAt), "PPP p")
                            : "Manual Action"}
                        </p>
                        <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-xs font-bold text-red-800 mb-1">Reason: {(selectedCertificate as any).revocationReason || "Revoked"}</p>
                          <p className="text-[10px] text-red-600 font-mono">Proof: {(selectedCertificate as any).revocationDetailsUri || "—"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-6 bg-neutral-50 border-t border-neutral-200">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-11 font-semibold"
                onClick={() => setDetailsOpen(false)}
              >
                Close Audit
              </Button>
              {selectedCertificate && (selectedCertificate as any).revocationRequestStatus === "pending" && (
                <Button
                  className="flex-1 h-11 font-semibold"
                  onClick={() => handleApproveRevocation([selectedCertificate.id!])}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Approve & Revoke
                </Button>
              )}
              {selectedCertificate?.isValid && !(selectedCertificate as any).isArchived && (selectedCertificate as any).revocationRequestStatus !== "pending" && (
                <Button 
                  variant="destructive" 
                  className="flex-1 h-11 font-semibold"
                  onClick={() => handleOpenRevokeDialog([selectedCertificate.id!])}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Request Revocation
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modern Revocation Dialog */}
      <Dialog
        open={revokeDialogOpen}
        onOpenChange={(open) => {
          setRevokeDialogOpen(open);
          if (!open) resetRevokeDialog();
        }}
      >
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl">
          <div className="p-6 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-red-900 font-heading">
                Security Revocation
              </DialogTitle>
            </div>
            <DialogDescription className="text-red-700 font-medium">
              Submit a revocation request for {revokeTargetIds.length} credential{revokeTargetIds.length > 1 ? "s" : ""}. Approval is required before the on-chain revoke is executed.
            </DialogDescription>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2.5">
                <label className="text-sm font-bold text-neutral-700">Official Record Type</label>
                <Select value={revokeRecordType} onValueChange={setRevokeRecordType}>
                  <SelectTrigger className="w-full py-6 rounded-xl border-neutral-200 focus:ring-red-500/20">
                    <SelectValue placeholder="Select record type" />
                  </SelectTrigger>
                  <SelectContent>
                    {recordTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2.5">
                <label className="text-sm font-bold text-neutral-700">Revocation Reason</label>
                <Select value={revokeReason} onValueChange={setRevokeReason}>
                  <SelectTrigger className="w-full py-6 rounded-xl border-neutral-200 focus:ring-red-500/20">
                    <SelectValue placeholder="Select official reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {revokeReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2.5">
                <label className="text-sm font-bold text-neutral-700">Official Evidence URI (Proof)</label>
                <Input
                  placeholder="https://records.educreds.io/audit/revocation-proof-402"
                  value={revokeDetailsUri}
                  onChange={(event) => setRevokeDetailsUri(event.target.value)}
                  className="py-6 rounded-xl border-neutral-200 focus:ring-red-500/20"
                />
                <Input
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUploadProof(file);
                  }}
                  className="py-3 rounded-xl border-neutral-200"
                />
                {revokeProofUploading && (
                  <p className="text-xs text-neutral-500">Uploading proof...</p>
                )}
                {revokeProofFileName && (
                  <p className="text-xs text-neutral-500">Attached: {revokeProofFileName}</p>
                )}
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                  Required for on-chain verification & transparency
                </p>
              </div>

              <div className="grid gap-2.5">
                <label className="text-sm font-bold text-neutral-700">Administrative Notes</label>
                <Textarea
                  value={revokeNotes}
                  onChange={(event) => setRevokeNotes(event.target.value)}
                  placeholder="Internal justification for audit purposes..."
                  className="rounded-xl border-neutral-200 focus:ring-red-500/20 min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-neutral-50 border-t border-neutral-200 flex-row gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setRevokeDialogOpen(false)} className="font-bold">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmRevoke} 
              disabled={revokeLoading}
              className="px-8 font-bold shadow-md shadow-red-200 h-11"
            >
              {revokeLoading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : "Submit Revocation Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Certificate Modal */}
      {isCertificateModalOpen && (
        <CreateCertificateModal
          open={isCertificateModalOpen}
          onOpenChange={setIsCertificateModalOpen}
        />
      )}
    </div>
  );
}
