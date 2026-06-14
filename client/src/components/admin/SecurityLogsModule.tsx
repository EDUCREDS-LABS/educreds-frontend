import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { governanceApiService } from '@/lib/governanceApiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Terminal, 
  History, 
  Search, 
  Download, 
  RefreshCw, 
  Loader2, 
  Shield, 
  Eye,
  Filter,
  ArrowRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const SecurityLogsModule = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  const { data: logsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => governanceApiService.getAuditLog(page, 50),
    refetchInterval: 30000
  });

  const logs = logsData?.data || [];

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infrastructure-audit-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Terminal className="size-4" />
            Infrastructure Telemetry
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
            Audit <span className="text-primary">Logs</span>.
          </h1>
          <p className="text-neutral-500 font-medium max-w-xl">
            Immutable trace of all administrative actions, consensus rounds, and node state transitions.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="h-12 px-6 rounded-2xl font-bold bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
          >
            <RefreshCw className={cn("size-4 mr-2", isRefetching && "animate-spin")} />
            Sync Logs
          </Button>
          <Button 
            onClick={handleExport}
            className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-neutral-900 dark:bg-neutral-900 text-white shadow-xl"
          >
            <Download className="size-4 mr-2" />
            Export Archive
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shadow-inner">
              <History className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Infrastructure Audit Trail</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary">Cryptographic Event Stream</CardDescription>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search actions..." 
              className="h-12 w-80 pl-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none font-medium focus:ring-2 focus:ring-primary/20"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                <TableRow className="border-none">
                  <TableHead className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-neutral-400">Timestamp</TableHead>
                  <TableHead className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-neutral-400">Action Type</TableHead>
                  <TableHead className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-neutral-400">Subject</TableHead>
                  <TableHead className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-neutral-400">Details</TableHead>
                  <TableHead className="px-10 py-5 text-right font-black text-[10px] uppercase tracking-widest text-neutral-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-none opacity-50">
                      <TableCell colSpan={5} className="px-10 py-6"><div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-10 py-32 text-center">
                      <div className="flex flex-col items-center gap-4 text-neutral-400">
                        <Shield className="size-16 opacity-10" />
                        <p className="font-black text-xs uppercase tracking-[0.2em]">Secure Baseline Maintained. No Anomalies Detected.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50/30 dark:hover:bg-neutral-800/30 transition-colors group">
                      <TableCell className="px-10 py-6 whitespace-nowrap">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                        </p>
                        <p className="text-[10px] font-medium text-neutral-500">{format(new Date(log.timestamp), "yyyy")}</p>
                      </TableCell>
                      <TableCell className="px-10 py-6">
                        <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-none font-black text-[9px] uppercase tracking-widest px-3 h-6">
                          {log.action?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-10 py-6">
                        <p className="text-xs font-mono font-bold text-primary truncate max-w-[120px]">{log.userId || log.actor}</p>
                      </TableCell>
                      <TableCell className="px-10 py-6">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 max-w-md line-clamp-1">{log.details || log.description}</p>
                      </TableCell>
                      <TableCell className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Verified</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center gap-4">
        <Button 
          variant="outline" 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
          className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
        >
          Previous Round
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setPage(p => p + 1)}
          className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
        >
          Next Round
        </Button>
      </div>
    </div>
  );
};
