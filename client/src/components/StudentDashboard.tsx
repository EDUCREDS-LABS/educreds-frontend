import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { CertificateCard } from '@/components/CertificateCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  Award,
  Share2,
  Eye,
  LogOut,
  ShieldCheck,
  Zap,
  Globe,
  Fingerprint,
  TrendingUp,
  Download,
  Search,
  Grid,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function StudentDashboard() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);
        setConnected(true);
        await api.connectWallet(address);
        await loadCertificates(address);
      } catch (error: any) {
        setError(`Failed to connect wallet: ${error.message}`);
      }
    } else {
      alert('Please install MetaMask to connect your wallet');
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setWalletAddress('');
    setCertificates([]);
    setError('');
  };

  const loadCertificates = async (address: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getCertificatesByWallet(address);
      const normalized = Array.isArray(result) ? result : (result?.certificates || []);
      setCertificates(normalized);
    } catch (error: any) {
      setError(`Failed to load certificates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = useMemo(() => {
    return certificates.filter(c => 
      c.certificateType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.institutionName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [certificates, searchQuery]);

  return (
    <div className="min-h-screen space-y-12 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Globe className="size-4" />
            Universal Credential Wallet
          </div>
          <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
            Student <span className="text-primary">Interface</span>.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg font-medium">
            Manage your cryptographic academic credentials, share verified proofs, and audit your educational achievements on the blockchain.
          </p>
        </div>
        {!connected && (
          <Button 
            onClick={connectWallet} 
            className="h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-2xl shadow-neutral-900/20 hover:scale-[1.02] transition-all"
          >
            <Wallet className="size-5 mr-3" />
            Initialize Wallet
          </Button>
        )}
      </div>

      {!connected ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-10">
          <div className="relative">
            <div className="size-32 bg-primary/10 rounded-[40px] flex items-center justify-center text-primary relative z-10">
              <ShieldCheck className="size-16" />
            </div>
            <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 rounded-full" />
          </div>
          <div className="space-y-4 max-w-md mx-auto">
            <h3 className="text-3xl font-black tracking-tight dark:text-neutral-100">Secure Access Point.</h3>
            <p className="text-neutral-500 font-medium">Connect your decentralized wallet to retrieve your verified academic proofs from the EduCreds protocol.</p>
          </div>
          <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] p-8 max-w-sm w-full">
            <CardContent className="p-0 space-y-6 text-left">
              <div className="flex items-center gap-4">
                <div className="size-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500"><ShieldCheck className="size-5" /></div>
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Cryptographic Proofs</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><Globe className="size-5" /></div>
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Global Portability</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500"><Fingerprint className="size-5" /></div>
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Owner-controlled Data</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Identity & Profile Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <Card className="lg:col-span-8 border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
              <CardContent className="p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
                  <div className="flex items-center gap-6">
                    <div className="size-20 bg-neutral-100 dark:bg-neutral-800 rounded-[28px] flex items-center justify-center text-neutral-400">
                      <Fingerprint className="size-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active Identity</p>
                      <h2 className="text-2xl font-black dark:text-neutral-100">{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</h2>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-50 text-green-600 border-none px-2 h-5 rounded-full text-[9px] font-black uppercase">Mainnet Connected</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 md:border-l border-neutral-100 dark:border-neutral-800 md:pl-8">
                    <div className="space-y-1 text-center md:text-left">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Repository</p>
                      <p className="text-3xl font-black text-primary tracking-tighter">{certificates.length}</p>
                      <p className="text-[9px] font-bold text-neutral-500 uppercase">Proofs Found</p>
                    </div>
                    <div className="space-y-1 text-center md:text-left">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Immutable</p>
                      <p className="text-3xl font-black text-green-500 tracking-tighter">{certificates.filter(c => c.isMinted).length}</p>
                      <p className="text-[9px] font-bold text-neutral-500 uppercase">On-chain</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-primary rounded-[40px] overflow-hidden text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Award className="size-32 rotate-12" /></div>
              <CardContent className="p-10 flex flex-col justify-between h-full relative z-10">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight leading-tight">Secure Your Achievements.</h3>
                  <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">Instantly share verified proofs with employers or academic institutions worldwide.</p>
                </div>
                <Button variant="secondary" className="mt-8 h-12 rounded-xl bg-white text-primary hover:bg-neutral-100 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10">Manage Permissions</Button>
              </CardContent>
            </Card>
          </div>

          {/* Certificates Repository */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight dark:text-neutral-100">Asset Registry</h3>
                <p className="text-neutral-500 font-medium">Search and manage your verified credentials.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search credentials..." 
                    className="h-12 w-64 rounded-xl border-none bg-neutral-100/80 dark:bg-neutral-800/80 pl-11 text-sm font-medium focus:bg-white dark:focus:bg-neutral-800 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800 font-bold px-6" onClick={() => loadCertificates(walletAddress)}>
                  <TrendingUp className={cn("size-4 mr-2", loading && "animate-spin")} />
                  Refresh
                </Button>
                <Button variant="ghost" size="icon" className="size-12 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={disconnectWallet}>
                  <LogOut className="size-5" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-[32px]" />)}
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-[40px] p-20 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                <Award className="size-16 text-neutral-200 dark:text-neutral-700 mx-auto mb-6" />
                <h4 className="text-xl font-bold text-neutral-400">Repository Empty</h4>
                <p className="text-neutral-500 text-sm mt-2 max-w-sm mx-auto font-medium">No certificates matched your criteria or were found for this wallet address.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCertificates.map((cert) => (
                  <div key={cert.id} className="group transition-all duration-500 hover:scale-[1.02]">
                    <CertificateCard 
                      certificate={cert}
                      showActions={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Protocol Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Verifiable Credentials", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", desc: "W3C standard compliant identity objects for interoperability." },
              { title: "On-chain Integrity", icon: Award, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", desc: "Cryptographic anchoring on Base protocol ensures immutability." },
              { title: "Universal Discovery", icon: Globe, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", desc: "Globally accessible verification endpoints for instant audit." },
            ].map((f, i) => (
              <Card key={i} className="border-none shadow-xl shadow-neutral-200/20 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <div className={cn("size-12 rounded-2xl flex items-center justify-center", f.bg, f.color)}>
                    <f.icon className="size-6" />
                  </div>
                  <h4 className="text-lg font-black dark:text-neutral-100">{f.title}</h4>
                  <p className="text-neutral-500 text-sm font-medium leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
