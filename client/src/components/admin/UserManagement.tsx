import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Key
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AdminUser, AdminRole, ROLE_LABELS, ROLE_PERMISSIONS } from "@/types/admin";
import { cn } from "@/lib/utils";

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminUsers();
      setUsers(response.users || []);
    } catch (error: any) {
      toast({
        title: "Session Alert",
        description: "Failed to synchronize administrative team directory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.name || !createForm.password) {
      toast({
        title: "Validation Error",
        description: "All personnel credentials must be complete.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await api.createAdminUser(createForm);
      toast({
        title: "Personnel Added",
        description: "New administrative account successfully provisioned.",
      });
      setShowCreateModal(false);
      setCreateForm({ email: '', name: '', role: 'reviewer', password: '' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Provisioning Error",
        description: error.message || "Failed to create team member entry.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await api.updateAdminUser(selectedUser.id, editForm);
      toast({
        title: "Identity Verified",
        description: "User permissions and profile updated.",
      });
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Update Reverted",
        description: error.message || "Critical error during profile modification.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    // We'll use a better confirmation in the UI later, but for now:
    if (!window.confirm(`Revoke all access for ${user.name}?`)) return;

    try {
      await api.deleteAdminUser(user.id);
      toast({
        title: "Access Revoked",
        description: "Administrative account has been decommissioned.",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Revocation Error",
        description: error.message || "Failed to delete administrative entry.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full bg-gray-900 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full bg-gray-900 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Team Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Administrative Team
          </h2>
          <p className="text-sm text-gray-500">Manage hierarchical access control and system permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold px-6 shadow-xl shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Provision User
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TeamMetricCard title="Total Personnel" value={users.length} icon={Users} color="blue" />
        <TeamMetricCard title="Verified Active" value={users.filter(u => u.isActive).length} icon={UserCheck} color="green" />
        <TeamMetricCard title="Pending Review" value={users.filter(u => u.role === 'reviewer').length} icon={ShieldAlert} color="amber" />
        <TeamMetricCard title="Super Admins" value={users.filter(u => u.role === 'super_admin').length} icon={Shield} color="purple" />
      </div>

      {/* Main Table */}
      <Card className="bg-gray-900 border-none shadow-2xl overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-950/50">
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] py-6 px-8">Full Identity</TableHead>
                  <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] py-6">Email Authority</TableHead>
                  <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] py-6">Security Clearance</TableHead>
                  <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] py-6">Operational Status</TableHead>
                  <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] py-6 text-right px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {users.map((user, idx) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={user.id}
                      className="bg-transparent border-gray-800/50 hover:bg-gray-800/20 transition-colors group"
                    >
                      <TableCell className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-bold text-white">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Mail className="w-3 h-3" />
                          <span className="text-xs">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "rounded-xl px-3 py-1 text-[10px] font-black tracking-widest uppercase border-none",
                          getRoleStyle(user.role)
                        )}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                          <span className={cn("text-xs font-bold", user.isActive ? "text-green-500" : "text-red-500")}>
                            {user.isActive ? "Active Duty" : "Revoked"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-blue-600/10 hover:text-blue-400 transition-all"
                            onClick={() => { setSelectedUser(user); setEditForm({ name: user.name, role: user.role, isActive: user.isActive }); setShowEditModal(true); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-red-600/10 hover:text-red-400 transition-all"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white rounded-3xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8">
            <DialogTitle className="text-2xl font-black">TEAM PROVISIONING</DialogTitle>
            <DialogDescription className="text-blue-100/80 font-medium">Issue high-level administrative credentials</DialogDescription>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Full Personnel Name</Label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                className="bg-gray-850 border-gray-800 h-12 rounded-xl focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Corporate Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                className="bg-gray-850 border-gray-800 h-12 rounded-xl focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Security Role</Label>
              <Select value={createForm.role} onValueChange={(v: AdminRole) => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-gray-850 border-gray-800 h-12 rounded-xl text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {Object.entries(ROLE_LABELS).map(([r, l]) => (
                    <SelectItem key={r} value={r} className="hover:bg-blue-600 focus:bg-blue-600">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Master Secret Key (Temporary)</Label>
              <div className="relative">
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className="bg-gray-850 border-gray-800 h-12 rounded-xl pr-12"
                />
                <Key className="absolute right-4 top-3.5 w-5 h-5 text-gray-600" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white">Abort</Button>
              <Button onClick={handleCreateUser} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 h-12 rounded-xl">
                {actionLoading ? <Loader2 className="animate-spin" /> : "PROVISION NOW"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white rounded-3xl p-8 shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black">MODIFY ACCESS</DialogTitle>
            <DialogDescription>Adjust security clearance for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Updated Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="bg-gray-850 border-gray-800 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">New Clearance Level</Label>
              <Select value={editForm.role} onValueChange={(v: AdminRole) => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-gray-850 border-gray-800 text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {Object.entries(ROLE_LABELS).map(([r, l]) => (
                    <SelectItem key={r} value={r} className="hover:bg-blue-600 focus:bg-blue-600">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-850 rounded-2xl border border-gray-800">
              <div className="space-y-1">
                <p className="text-xs font-bold">Access Status</p>
                <p className="text-[10px] text-gray-500 opacity-80 uppercase tracking-widest font-black">Enable/Disable Platform Login</p>
              </div>
              <Switch checked={editForm.isActive} onCheckedChange={c => setEditForm(f => ({ ...f, isActive: c }))} className="data-[state=checked]:bg-blue-600" />
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button variant="ghost" onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white">Cancel</Button>
              <Button onClick={handleUpdateUser} disabled={actionLoading} className="bg-white text-gray-900 font-black px-8 h-12 rounded-xl">
                {actionLoading ? <Loader2 className="animate-spin" /> : "APPLY CHANGES"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamMetricCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
    green: "text-green-500 bg-green-500/10 border-green-500/20 shadow-green-500/5",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
  };

  return (
    <Card className="bg-gray-900 border-none shadow-2xl overflow-hidden relative group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 rounded-xl border", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <Activity className="w-4 h-4 text-gray-800 group-hover:text-gray-600 transition-colors" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1">{title}</h3>
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      </CardContent>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl pointer-events-none group-hover:bg-white/10 transition-all duration-700" />
    </Card>
  );
}

function getRoleStyle(role: AdminRole) {
  switch (role) {
    case 'super_admin': return 'bg-red-500/10 text-red-500';
    case 'reviewer': return 'bg-blue-500/10 text-blue-500';
    case 'auditor': return 'bg-purple-500/10 text-purple-500';
    case 'blockchain_registrar': return 'bg-indigo-500/10 text-indigo-500';
    default: return 'bg-gray-800 text-gray-400';
  }
}