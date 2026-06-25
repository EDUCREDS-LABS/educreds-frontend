// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { governanceApiService } from '@/lib/governanceApiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Users, ShieldCheck, Mail, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const adminSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(2, "Name is required"),
  role: z.string().min(1, "Role is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminFormValues = z.infer<typeof adminSchema>;

export const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddAddModalOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => governanceApiService.getAdminUsers()
  });

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { email: '', name: '', role: 'admin', password: '' },
  });

  const createMutation = useMutation({
    mutationFn: (data: AdminFormValues) => governanceApiService.createAdminUser(data),
    onSuccess: () => {
      toast({ title: "Admin Created", description: "Strategic administrative access granted." });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsAddAddModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Provisioning Failed", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Administrative Team</h2>
          <p className="text-neutral-500 font-medium tracking-tight">Manage root authority access and strategic permissions.</p>
        </div>
        <Button 
          onClick={() => setIsAddAddModalOpen(true)}
          className="h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest px-8 shadow-xl shadow-primary/20 transition-all hover:scale-105"
        >
          <UserPlus className="size-4 mr-2" />
          Provision Admin
        </Button>
      </div>

      <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Users className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Access Registry</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-neutral-400">Authenticated Node Administrators</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Retrieving Registry State...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                  <TableRow className="border-none">
                    <TableHead className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-neutral-400">Identity</TableHead>
                    <TableHead className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-neutral-400">Role</TableHead>
                    <TableHead className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-neutral-400">Status</TableHead>
                    <TableHead className="px-10 py-5 text-right font-black text-[10px] uppercase tracking-widest text-neutral-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(users) ? users.map((user: any) => (
                    <TableRow key={user.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50/30 dark:hover:bg-neutral-800/30 transition-colors">
                      <TableCell className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-black text-xs text-neutral-400">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{user.name}</p>
                            <p className="text-xs font-medium text-neutral-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-6">
                        <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-black text-[9px] uppercase tracking-widest px-3 h-6">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <div className={cn("size-2 rounded-full", user.isActive ? "bg-emerald-500" : "bg-neutral-300")} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-6 text-right">
                        <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase text-primary hover:bg-primary/5 transition-all">
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-xs font-black uppercase tracking-widest text-neutral-400">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provision Admin Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddAddModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-neutral-900 rounded-[40px] p-0 overflow-hidden shadow-2xl border-none">
          <div className="bg-primary p-12 text-center relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck className="size-32 rotate-12" /></div>
            <div className="size-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/10 shadow-xl">
              <UserPlus className="size-8 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase">Provision Authority.</DialogTitle>
            <DialogDescription className="text-blue-100/70 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Initialize Strategic Administrative Access</DialogDescription>
          </div>

          <div className="p-12 pt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 px-2">Administrator Name</FormLabel>
                      <FormControl><Input {...field} placeholder="Full Name" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-medium px-6" /></FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500 px-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 px-2">Institutional Email</FormLabel>
                      <FormControl><Input {...field} type="email" placeholder="admin@educreds.xyz" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-medium px-6" /></FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500 px-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 px-2">Strategic Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold uppercase text-[10px] tracking-widest px-6">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-neutral-100 dark:border-neutral-800">
                          <SelectItem value="admin" className="font-bold text-xs">Full Administrator</SelectItem>
                          <SelectItem value="operator" className="font-bold text-xs">Node Operator</SelectItem>
                          <SelectItem value="viewer" className="font-bold text-xs">Audit Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-bold text-red-500 px-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 px-2">Access Key</FormLabel>
                      <FormControl><Input {...field} type="password" placeholder="••••••••••••" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-medium px-6" /></FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500 px-2" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 mt-4 transition-all hover:scale-[1.02]"
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin size-6 mr-2" /> : <ShieldCheck className="size-6 mr-2" />}
                  Commit Authority
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
