// Compat: template selection removed in credential rendering architecture update
type EnhancedTemplate = { id: string; name: string; category: string };

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Plus, 
  Users, 
  FileText, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Settings,
  User,
  Edit,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BulkIssuanceForm } from '../issuance/BulkIssuanceForm';
import { Link } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';

interface InstitutionDashboardProps {
  institutionId: string;
}

interface IssuanceStats {
  totalIssued: number;
  thisMonth: number;
  pendingIssuance: number;
  completedIssuance: number;
}

export function InstitutionDashboard({ institutionId }: InstitutionDashboardProps) {
  const { toast } = useToast();
  const [issuanceStats, setIssuanceStats] = useState<IssuanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedTemplate | null>(null);
  const [showBulkIssuance, setShowBulkIssuance] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [institutionId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load issuance stats
      const statsResponse = await fetch(`${API_CONFIG.CERT}/api/stats?institutionId=${encodeURIComponent(institutionId)}`);
      const statsData = await statsResponse.json();
      
      if (statsResponse.ok) {
        setIssuanceStats({
          totalIssued: statsData?.totalCertificates ?? 0,
          thisMonth: 0,
          pendingIssuance: 0,
          completedIssuance: statsData?.mintedCertificates ?? 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: EnhancedTemplate) => {
    setSelectedTemplate(template);
    setShowBulkIssuance(true);
  };

  const handleBulkIssuanceComplete = (results: any) => {
    setShowBulkIssuance(false);
    setSelectedTemplate(null);
    loadDashboardData(); // Refresh stats
    toast({
      title: 'Bulk Issuance Complete',
      description: `${results.completed} certificates issued successfully`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (showBulkIssuance) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Certificate Issuance</h1>
            <p className="text-gray-600">Issue certificates to multiple recipients at once</p>
          </div>
          <Button variant="outline" onClick={() => setShowBulkIssuance(false)}>
            Back to Dashboard
          </Button>
        </div>
        
        <BulkIssuanceForm
          selectedTemplate={selectedTemplate}
          onTemplateSelect={() => setShowBulkIssuance(false)}
          onIssuanceComplete={handleBulkIssuanceComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Institution Dashboard</h1>
          <p className="text-gray-600">Manage your certificate templates and issuance</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/institution/profile">
            <Button variant="outline">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          <Link to="/institution/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button onClick={() => setShowBulkIssuance(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Bulk Issuance
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {issuanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Issued</p>
                  <p className="text-2xl font-bold text-gray-900">{issuanceStats.totalIssued}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{issuanceStats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{issuanceStats.pendingIssuance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{issuanceStats.completedIssuance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">My Templates</TabsTrigger>
          <TabsTrigger value="issuance">Issuance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowBulkIssuance(true)}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium mb-2">Bulk Issuance</h3>
                <p className="text-sm text-gray-600">Issue certificates to multiple recipients</p>
              </CardContent>
            </Card>

            <Link to="/institution/issuance">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">Single Issuance</h3>
                  <p className="text-sm text-gray-600">Issue a certificate to one recipient</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/template-designer">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Edit className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">Template Designer</h3>
                  <p className="text-sm text-gray-600">Create and design certificate templates</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/institution/certificates">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-medium mb-2">Manage Certificates</h3>
                  <p className="text-sm text-gray-600">View and manage issued certificates</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Issue credentials from the{" "}
                <Link to="/institution/issue" className="text-blue-600 hover:underline">
                  issuance workspace
                </Link>{" "}
                or design new templates in the{" "}
                <Link to="/institution/manage-specs" className="text-blue-600 hover:underline">
                  Credential Designer
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Credential Designer entry point */}
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Design your own credential templates</h3>
            <p className="text-gray-600 mb-4">
              Create branded certificate templates in the Credential Designer and issue them directly to students.
            </p>
            <Link to="/institution/manage-specs">
              <Button>Open Credential Designer</Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="issuance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/institution/issuance">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Unified Certificate Issuance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Complete certificate issuance workflow with templates</p>
                  <Button className="w-full">Start Issuance</Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/pdf-certificates">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    PDF Certificate Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Upload and manage PDF certificate templates</p>
                  <Button className="w-full" variant="outline">Upload PDFs</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issuance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Analytics dashboard coming soon</p>
                <p className="text-sm">Track your certificate issuance performance and insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
