import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  Loader2,
  UserCheck,
  UserX,
  ShieldAlert,
  Mail,
  MoreVertical,
  Activity,
  Key,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminUser, AdminRole, ROLE_LABELS } from "@/types/admin";
import { cn } from "@/lib/utils";
import { useAdminUsers, useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser } from "@/hooks/useAdmin";

export default function UserManagement() {
  const { data: usersData, isLoading } = useAdminUsers();
  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    role: 'reviewer' as AdminRole,
    password: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'reviewer' as AdminRole,
    isActive: true
  });
  
  const { toast } = useToast();
  const users = usersData?.users || [];

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.name || !createForm.password) {
      toast({ title: "Credential Incomplete", description: "All personnel fields are mandatory.", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync(createForm);
      toast({ title: "Personnel Provisioned", description: "Administrative node access granted." });
      setShowCreateModal(false);
      setCreateForm({ email: '', name: '', role: 'reviewer', password: '' });
    } catch (error: any) {
      toast({ title: "Provisioning Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await updateMutation.mutateAsync({ userId: selectedUser.id, updates: editForm });
      toast({ title: "Identity Re-Verified", description: "Access level updated in registry." });
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Revoke all strategic access for ${user.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(user.id);
      toast({ title: "Access Decommissioned", description: "Personnel credentials revoked." });
    } catch (error: any) {
      toast({ title: "Revocation Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-[32px] bg-white/5" />)}
        </div>
        <Skeleton className="h-[500px] rounded-[40px] bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Team Infrastructure Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <ShieldCheck className="size-4" />
            Strategic Access Control
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Administrative <span className="text-primary">Team</span>.</h2>
          <p className="text-neutral-500 font-medium max-w-lg">Manage hierarchical node authority and establish role-based security clearance across the protocol.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
          <Plus className="size-5 mr-3" />
          Provision Personnel
        </Button>
      </div>

      {/* Analytics Clusters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <TeamMetricCard title="Total Assets" value={users.length} sub="Identified Nodes" icon={Users} color="blue" />
        <TeamMetricCard title="Operational" value={users.filter(u => u.isActive).length} sub="Active Sessions" icon={UserCheck} color="green" />
        <TeamMetricCard title="Audit Level" value={users.filter(u => u.role === 'reviewer').length} sub="Registry Reviewers" icon={ShieldAlert} color="amber" />
        <TeamMetricCard title="Root Power" value={users.filter(u => u.role === 'super_admin').length} sub="System Sovereignty" icon={Lock} color="purple" />
      </div>

      {/* Main Registry Table */}
      <Card className="border-none shadow-2xl shadow-black/40 bg-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-8 px-10">Personnel Identity</TableHead>
                  <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-8">Network Auth</TableHead>
                  <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-8">Clearance Level</TableHead>
                  <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-8">Linkage</TableHead>
                  <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-8 text-right px-10">Protocols</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {users.map((user, idx) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.5 }}
                      key={user.id}
                      className="bg-transparent border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <TableCell className="py-8 px-10">
                        <div className="flex items-center gap-6">
                          <div className="size-14 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center text-primary font-black text-lg shadow-xl group-hover:scale-105 transition-transform">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-lg font-black text-white tracking-tight">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-neutral-400 font-bold">
                          <Mail className="size-4 text-primary opacity-50" />
                          <span className="text-sm tracking-tight">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "rounded-full px-4 py-1.5 text-[9px] font-black tracking-[0.1em] uppercase border-none shadow-lg",
                          getRoleStyle(user.role)
                        )}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("size-2 rounded-full", user.isActive ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
                          <span className={cn("text-xs font-black uppercase tracking-widest", user.isActive ? "text-green-500" : "text-red-500")}>
                            {user.isActive ? "Online" : "Revoked"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-xl bg-white/5 border border-white/5 text-neutral-400 hover:text-primary transition-all"
                            onClick={() => { setSelectedUser(user); setEditForm({ name: user.name, role: user.role, isActive: user.isActive }); setShowEditModal(true); }}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-xl bg-white/5 border border-white/5 text-neutral-400 hover:text-red-500 transition-all"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Provisioning Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl bg-gray-950 border-white/5 text-white rounded-[40px] p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-primary to-indigo-700 p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Users className="size-48 rotate-12" /></div>
             <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Identity Protocol</p>
                <DialogTitle className="text-4xl font-black tracking-tighter">Provision Personnel.</DialogTitle>
                <DialogDescription className="text-blue-100/70 text-lg font-medium">Initialize institutional node access for new administrators.</DialogDescription>
             </div>
          </div>

          <div className="p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Personnel Legal Name</Label>
                <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Institutional Email</Label>
                <Input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} className="h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 shadow-inner" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Strategic Security Role</Label>
              <Select value={createForm.role} onValueChange={(v: AdminRole) => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="h-14 bg-neutral-900 border-white/10 rounded-2xl text-white font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-white/5 text-white">
                  {Object.entries(ROLE_LABELS).map(([r, l]) => (
                    <SelectItem key={r} value={r} className="hover:bg-primary font-black uppercase text-[10px] tracking-widest py-3">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Root Secret Key</Label>
              <div className="relative group">
                <Input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} className="h-14 bg-white/5 border-white/5 rounded-2xl pr-14 focus:ring-primary/20 shadow-inner" />
                <Key className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-neutral-600 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-neutral-500">Discard</Button>
              <Button onClick={handleCreateUser} disabled={createMutation.isPending} className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
                {createMutation.isPending ? <Loader2 className="animate-spin size-6" /> : "Authorize & Provision"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modification Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-xl bg-gray-950 border-white/5 text-white rounded-[40px] p-12 shadow-2xl">
          <DialogHeader className="mb-10">
            <div className="size-16 bg-primary/10 rounded-[24px] flex items-center justify-center text-primary mb-6">
              <ShieldCheck className="size-8" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter">Modify Node Access.</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium">Adjust security clearance for {selectedUser?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Updated Personnel Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 shadow-inner" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Strategic Security Role</Label>
              <Select value={editForm.role} onValueChange={(v: AdminRole) => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="h-14 bg-neutral-900 border-white/10 rounded-2xl text-white font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-white/5 text-white">
                  {Object.entries(ROLE_LABELS).map(([r, l]) => (
                    <SelectItem key={r} value={r} className="hover:bg-primary font-black uppercase text-[10px] tracking-widest py-3">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/5 rounded-[32px] border border-white/5 shadow-inner">
              <div className="space-y-1">
                <p className="text-sm font-black text-white">Access Protocol</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Enable/Disable Infrastructure Login</p>
              </div>
              <Switch checked={editForm.isActive} onCheckedChange={c => setEditForm(f => ({ ...f, isActive: c }))} className="data-[state=checked]:bg-primary" />
            </div>

            <div className="pt-8 flex gap-4">
               <Button variant="ghost" onClick={() => setShowEditModal(false)} className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-neutral-500">Cancel</Button>
               <Button onClick={handleUpdateUser} disabled={updateMutation.isPending} className="flex-1 h-14 bg-white text-gray-950 hover:bg-neutral-200 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.02]">
                {updateMutation.isPending ? <Loader2 className="animate-spin size-6" /> : "Commit Modification"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamMetricCard({ title, value, sub, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-primary bg-primary/10 border-primary/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <Card className="border-none shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[32px] overflow-hidden group hover:bg-white/[0.07] transition-all duration-500 relative">
      <CardContent className="p-8 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={cn("size-12 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 duration-500", colors[color])}>
            <Icon className="size-6" />
          </div>
          <Activity className="size-4 text-neutral-800 group-hover:text-primary transition-colors" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{title}</p>
          <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
          <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{sub}</p>
        </div>
      </CardContent>
      <div className="absolute top-0 right-0 size-32 bg-white/5 blur-3xl pointer-events-none group-hover:bg-white/10 transition-all duration-700" />
    </Card>
  );
}

function getRoleStyle(role: AdminRole) {
  switch (role) {
    case 'super_admin': return 'bg-red-500/20 text-red-500 shadow-red-500/10';
    case 'reviewer': return 'bg-primary/20 text-primary shadow-primary/10';
    case 'auditor': return 'bg-purple-500/20 text-purple-500 shadow-purple-500/10';
    case 'blockchain_registrar': return 'bg-indigo-500/20 text-indigo-500 shadow-indigo-500/10';
    default: return 'bg-white/10 text-neutral-400';
  }
}
