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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

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
                className={`group cursor-pointer transition-all duration-300 rounded-3xl overflow-hidden relative border-2 ${selectedMethod === method.id
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-2xl'
                    : 'border-white bg-white hover:border-neutral-200'
                  }`}
                onClick={() => setSelectedMethod(method.id as any)}
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
                {selectedMethod === 'template' && (
                  <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:bg-indigo-50">
                    Manage Specs <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="max-w-4xl">
                {selectedMethod === 'quick' && <QuickIssuanceForm />}
                {selectedMethod === 'template' && <TemplateBasedIssuance templates={templates} />}
                {selectedMethod === 'bulk' && <BulkCertificateIssuance />}
                {selectedMethod === 'pdf' && <PdfCertificateUpload />}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const QuickIssuanceForm: React.FC = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    courseName: '',
    grade: '',
    completionDate: '',
    agreedToTerms: false
  });
  const { toast } = useToast();

  const handleDownloadAgreement = () => {
    window.open('/docs/issuance%20aggrement.md', '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/standard/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Institution-ID': 'demo-id'
        },
        body: JSON.stringify({
          student: { id: formData.studentEmail, name: formData.studentName },
          course: { name: formData.courseName },
          achievement: {
            grade: formData.grade,
            completionDate: formData.completionDate,
            certificateType: 'completion'
          }
        })
      });

      if (response.ok) {
        toast({
          title: "Credential Issued",
          description: `Successfully deployed to ${formData.studentEmail}`,
        });
        setFormData({
          studentName: '',
          studentEmail: '',
          courseName: '',
          grade: '',
          completionDate: '',
          agreedToTerms: false
        });
      }
    } catch (error) {
      toast({
        title: "Issuance Failed",
        description: "An error occurred while connecting to the blockchain.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Recipient Identity</Label>
          <Input
            placeholder="Legal Full Name"
            value={formData.studentName}
            onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
            className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus-visible:ring-indigo-200"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Delivery Endpoint</Label>
          <Input
            type="email"
            placeholder="Official Email Address"
            value={formData.studentEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, studentEmail: e.target.value }))}
            className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus-visible:ring-indigo-200"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Credential Name</Label>
          <Input
            placeholder="Degree or certification title"
            value={formData.courseName}
            onChange={(e) => setFormData(prev => ({ ...prev, courseName: e.target.value }))}
            className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus-visible:ring-indigo-200"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Rating</Label>
            <Input
              placeholder="A+, 4.0, etc"
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus-visible:ring-indigo-200"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Date</Label>
            <Input
              type="date"
              value={formData.completionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
              className="h-12 rounded-xl bg-neutral-50 border-neutral-100 focus-visible:ring-indigo-200 px-4"
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4">
        <h4 className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          Protocol Compliance
        </h4>
        <div className="flex items-start space-x-3">
          <div className="pt-1">
            <input
              type="checkbox"
              id="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
              className="h-4 w-4 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          <label htmlFor="agreedToTerms" className="text-sm text-neutral-600 leading-relaxed cursor-pointer">
            I confirm that I have verified the recipient's identity and that this issuance complies with the
            <button type="button" onClick={handleDownloadAgreement} className="text-indigo-600 font-bold mx-1 hover:underline underline-offset-4">
              Issuance Protocol Agreement
            </button>
            and global GDPR standards.
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={!formData.agreedToTerms}
          className="h-14 px-12 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full font-black text-lg shadow-xl shadow-neutral-900/10 group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity" />
          Deploy Credential <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </form>
  );
};

const TemplateBasedIssuance: React.FC<{ templates: Template[] }> = ({ templates }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Select Specification</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-2 p-12 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
              <Sparkles className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">No approved specs found in your library.</p>
              <Button variant="link" className="text-indigo-600 font-bold mt-2">Initialize Store</Button>
            </div>
          ) : (
            templates.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedTemplate === t.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-neutral-100 hover:border-neutral-300 bg-white'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-neutral-900">{t.name}</p>
                    <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-bold">{t.type}</p>
                  </div>
                  <Badge className="bg-neutral-900">{t.usageCount}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedTemplate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 border-t border-neutral-100">
          <QuickIssuanceForm />
        </motion.div>
      )}
    </div>
  );
};

const Calendar: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export default CertificateIssuanceDashboard;