import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Upload,
  Zap,
  Settings,
  Users,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { BulkCertificateIssuance } from '../components/BulkCertificateIssuance';
import { PdfCertificateUpload } from '../components/PdfCertificateUpload';
import QuickIssuance from '@/components/institution/QuickIssuance';
import ManageSpecs from '@/components/institution/ManageSpecs';
import { useLocation } from 'wouter';

interface Template {
  id: string;
  name: string;
  type: string;
  status: 'approved' | 'draft' | 'pending';
  usageCount: number;
}

interface IssuanceStats {
  totalCertificates: number;
  thisMonth: number;
  templates: number;
  successRate: number;
}

export const CertificateIssuanceDashboard: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<IssuanceStats>({
    totalCertificates: 1240,
    thisMonth: 85,
    templates: 12,
    successRate: 99.8
  });
  const [selectedMethod, setSelectedMethod] = useState<'quick' | 'template' | 'bulk' | 'pdf'>('quick');
  const [location, setLocation] = useLocation();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [templatesRes, statsRes] = await Promise.all([
        fetch('/api/templates?status=approved'),
        fetch('/api/certificates/stats')
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const issuanceMethodCards = [
    {
      id: 'quick',
      title: 'Quick Issuance',
      description: 'Single-click issuance with standard protocols',
      icon: Zap,
      gradient: 'from-amber-400 to-orange-500',
      recommended: false
    },
    {
      id: 'template',
      title: 'Template-Based',
      description: 'Use your custom institutional designs',
      icon: FileText,
      gradient: 'from-indigo-500 to-purple-600',
      recommended: true
    },
    {
      id: 'bulk',
      title: 'Bulk Protocol',
      description: 'Deploy thousands via CSV or JSON batch',
      icon: Users,
      gradient: 'from-emerald-400 to-teal-600',
      recommended: false
    },
    {
      id: 'pdf',
      title: 'Legacy PDF',
      description: 'Secure existing documents with DIDs',
      icon: Upload,
      gradient: 'from-blue-500 to-cyan-500',
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">Issuance Command</h1>
            <p className="text-neutral-500 mt-2 text-lg font-medium">Official credential deployment portal</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-700 border-none px-4 py-1.5 rounded-full font-bold">
              <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              GDPR Compliant
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Issued', value: stats.totalCertificates, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'This Month', value: stats.thisMonth, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Active Specs', value: stats.templates, icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Integrity Rate', value: `${stats.successRate}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-neutral-900 leading-none">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {issuanceMethodCards.map((method, idx) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
            >
              <Card
                className={`group cursor-pointer transition-all duration-300 rounded-3xl overflow-hidden relative border-2 ${
                    (location.startsWith('/certificate-issuance/') ? location.split('/')[2] : 'quick') === method.id
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-2xl'
                    : 'border-white bg-white hover:border-neutral-200'
                  }`}
                onClick={() => setLocation(`/certificate-issuance/${method.id}`)}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${method.gradient} opacity-[0.05] rounded-bl-full`} />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${method.gradient} text-white shadow-lg`}>
                      <method.icon className="h-5 w-5" />
                    </div>
                    {method.recommended && (
                      <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold text-[10px] uppercase">
                        Protocol Priority
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold mb-1 tracking-tight">{method.title}</h3>
                  <p className={`text-sm font-medium ${selectedMethod === method.id ? 'text-white/60' : 'text-neutral-400'}`}>
                    {method.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Interface */}
        <motion.div
          key={selectedMethod}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="rounded-[40px] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${issuanceMethodCards.find(m => m.id === selectedMethod)?.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {React.createElement(issuanceMethodCards.find(m => m.id === selectedMethod)!.icon, { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-neutral-900 tracking-tight">
                      {issuanceMethodCards.find(m => m.id === selectedMethod)?.title}
                    </CardTitle>
                    <p className="text-sm font-medium text-neutral-400 uppercase tracking-widest mt-0.5">Configuration Panel</p>
                  </div>
                </div>
                {((location.startsWith('/certificate-issuance/') ? location.split('/')[2] : 'quick') === 'template') && (
                  <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:bg-indigo-50" onClick={() => setLocation('/certificate-issuance/manage-specs')}>
                    Manage Specs <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="max-w-4xl">
                {(() => {
                  const method = location.startsWith('/certificate-issuance/') ? location.split('/')[2] : 'quick';
                  if (method === 'manage-specs') return <ManageSpecs />;
                  if (method === 'bulk') return <BulkCertificateIssuance />;
                  if (method === 'pdf') return <PdfCertificateUpload />;
                  // default: quick/template both use the unified QuickIssuance component
                  return <QuickIssuance />;
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};


const Calendar: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export default CertificateIssuanceDashboard;