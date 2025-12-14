import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { 
  Users, 
  DollarSign, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  LogOut,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BlockchainManagement from "@/components/BlockchainManagement";
import UserManagement from "@/components/admin/UserManagement";
import { transformDocumentsForBackend } from "@/utils/documentTransform";
import { testBackendConnection, testAdminConnection, type ConnectionStatus } from "@/utils/connectionTest";

interface VerificationRequest {
  id: string;
  verificationRequestId: string;
  institutionId: string;
  institutionName: string;
  institutionEmail: string;
  registrationNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
  documents: Array<{
    type: string;
    description: string;
    url: string;
    originalName?: string;
  }>;
}

interface RevenueData {
  totalRevenue: number;
  activeSubscriptions: number;
  planBreakdown: Record<string, number>;
}

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comments: z.string().optional(),
});

type ReviewForm = z.infer<typeof reviewSchema>;

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}

function AdminDashboardContent() {
  const [, setLocation] = useLocation();
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'blockchain' | 'users' | 'audit'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [previousRequestCount, setPreviousRequestCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: 'approved',
      comments: '',
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLocation('/admin/login');
      return;
    }
    fetchAdminData(token);
  }, [setLocation]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        fetchAdminData(token, false); // Silent refresh
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Manual refresh function
  const handleRefresh = () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetchAdminData(token);
    }
  };

  // Manual connection test
  const handleConnectionTest = async () => {
    const adminEmail = localStorage.getItem('adminEmail');
    if (!adminEmail) return;
    
    const [backendTest, adminTest] = await Promise.all([
      testBackendConnection(),
      testAdminConnection(adminEmail)
    ]);
    
    setConnectionStatus(backendTest);
    
    toast({
      title: "Connection Test Results",
      description: `Backend: ${backendTest.isConnected ? `✅ ${backendTest.latency}ms` : `❌ ${backendTest.error}`}\nAdmin: ${adminTest.isConnected ? `✅ ${adminTest.latency}ms` : `❌ ${adminTest.error}`}`,
      variant: backendTest.isConnected && adminTest.isConnected ? "default" : "destructive"
    });
  };

  // Password change handler
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }
    
    setPasswordLoading(true);
    try {
      await api.changeAdminPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      toast({
        title: "Success",
        description: "Admin password changed successfully"
      });
      
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchAdminData = async (token: string, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const API_BASE = "https://educhain-backend-avmj.onrender.com";
      console.log('Admin Dashboard API_BASE:', API_BASE);
      
      // Test backend connection with detailed diagnostics
      const connectionTest = await testBackendConnection();
      setConnectionStatus(connectionTest);
      
      if (!connectionTest.isConnected) {
        console.error('Backend connection failed:', connectionTest.error);
        if (showLoading) {
          toast({
            title: "Connection Error",
            description: `Backend unreachable: ${connectionTest.error}. Retrying in 30 seconds...`,
            variant: "destructive",
          });
        }
        return;
      }
      
      console.log(`Backend connected successfully (${connectionTest.latency}ms)`);
      
      // Admin endpoints require 'admin-email' header (no Bearer token)
      const adminEmail = localStorage.getItem('adminEmail');
      if (!adminEmail) {
        throw new Error('Admin email missing. Please login again.');
      }

      const [verificationResponse, revenueResponse] = await Promise.all([
        fetch(`${API_BASE}/api/admin/verification-requests`, {
          headers: { 
            'admin-email': adminEmail,
            'Content-Type': 'application/json'
          }
        }).catch(() => new Response('{"error": "Request failed"}', { status: 500 })),
        fetch(`${API_BASE}/api/admin/revenue`, {
          headers: { 
            'admin-email': adminEmail,
            'Content-Type': 'application/json'
          }
        }).catch(() => new Response('{"error": "Request failed"}', { status: 500 }))
      ]);

      console.log('Verification response status:', verificationResponse.status);
      console.log('Verification response URL:', verificationResponse.url);
      
             // Clone the response to avoid "body stream already read" error
       const verificationResponseClone = verificationResponse.clone();
       
       if (verificationResponse.ok) {
         try {
           const verificationData = await verificationResponse.json();
           const newRequests = verificationData.verificationRequests || [];
           
           // Check for new verification requests
           if (!showLoading && newRequests.length > previousRequestCount) {
             const newCount = newRequests.length - previousRequestCount;
             toast({
               title: "New Verification Request!",
               description: `${newCount} new institution${newCount > 1 ? 's' : ''} submitted verification documents.`,
             });
           }
           
           setVerificationRequests(newRequests);
           setPreviousRequestCount(newRequests.length);
         } catch (error) {
           console.error('Failed to parse verification response:', error);
           // Log the actual response text to see what we're getting
           const responseText = await verificationResponseClone.text();
           console.error('Response text:', responseText.substring(0, 200) + '...');
           setVerificationRequests([]);
         }
       } else {
         console.error('Verification request failed:', verificationResponse.status, verificationResponse.statusText);
         // Log the actual response text to see what we're getting
         const responseText = await verificationResponseClone.text();
         console.error('Response text:', responseText.substring(0, 200) + '...');
         setVerificationRequests([]);
       }

      console.log('Revenue response status:', revenueResponse.status);
      console.log('Revenue response URL:', revenueResponse.url);
      
             // Clone the response to avoid "body stream already read" error
       const revenueResponseClone = revenueResponse.clone();
       
       if (revenueResponse.ok) {
         try {
           const revenueData = await revenueResponse.json();
           setRevenueData(revenueData);
         } catch (error) {
           console.error('Failed to parse revenue response:', error);
           // Log the actual response text to see what we're getting
           const responseText = await revenueResponseClone.text();
           console.error('Response text:', responseText.substring(0, 200) + '...');
           setRevenueData(null);
         }
       } else {
         console.error('Revenue request failed:', revenueResponse.status, revenueResponse.statusText);
         // Log the actual response text to see what we're getting
         const responseText = await revenueResponseClone.text();
         console.error('Response text:', responseText.substring(0, 200) + '...');
         setRevenueData(null);
       }
       
       // Update last refreshed timestamp and connection status
       setLastUpdated(new Date());
       if (connectionStatus && !connectionStatus.isConnected) {
         // Re-test connection if it was previously failed
         const newConnectionTest = await testBackendConnection();
         setConnectionStatus(newConnectionTest);
       }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      if (showLoading) { // Only show error toast for manual refreshes
        toast({
          title: "Error",
          description: "Failed to load admin data. Please check your backend connection.",
          variant: "destructive",
        });
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleReview = async (data: ReviewForm) => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      const API_BASE = "https://educhain-backend-avmj.onrender.com";
      const adminEmail = localStorage.getItem('adminEmail');
      if (!adminEmail) throw new Error('Admin email missing');

      // Transform documents to URLs for backend using utility
      const transformedData = {
        ...data,
        verificationDocuments: selectedRequest.documents ? 
          transformDocumentsForBackend(selectedRequest.documents) : []
      };

      const response = await fetch(`${API_BASE}/api/admin/verification-requests/${selectedRequest.verificationRequestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin-email': adminEmail
        },
        body: JSON.stringify(transformedData)
      });

      if (!response.ok) throw new Error('Review failed');

      setReviewModal(false);
      setSelectedRequest(null);
      form.reset();
      
      // Refresh data
      const token = localStorage.getItem('adminToken');
      if (token) {
        await fetchAdminData(token);
      }
      
      toast({
        title: "Success",
        description: "Verification request reviewed successfully!",
      });
    } catch (error) {
      console.error('Review error:', error);
      toast({
        title: "Error",
        description: "Failed to review request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setReviewModal(true);
    form.reset({
      status: 'approved',
      comments: ''
    });
  };

  // Admin session check helper
  const validateAdminSession = (): boolean => {
    const email = localStorage.getItem('adminEmail');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return Boolean(email && isAdmin);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminToken'); // Remove token on logout
    setLocation('/admin/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              {lastUpdated && (
                <p className="text-sm text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔄"}
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectionTest}
                >
                  🔍 Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordModal(true)}
                >
                  🔐 Password
                </Button>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? "🟢" : "⏸️"} Auto
                </Button>
              </div>
              <Button variant="outline" onClick={handleLogout} data-testid="button-admin-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            size="sm"
            className={activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'blockchain' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('blockchain')}
            size="sm"
            className={activeTab === 'blockchain' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
          >
            Blockchain
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            size="sm"
            className={activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
          >
            User Management
          </Button>
          <Button
            variant={activeTab === 'audit' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('audit')}
            size="sm"
            className={activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
          >
            Audit Logs
          </Button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Enhanced Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${revenueData?.totalRevenue?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-gray-400">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Institutions</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{revenueData?.activeSubscriptions || 0}</div>
              <p className="text-xs text-gray-400">Verified & Active</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Reviews</CardTitle>
              <FileCheck className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{verificationRequests.filter(r => r.status === 'pending').length}</div>
              <p className="text-xs text-gray-400">Require attention</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Platform Usage</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{Math.round((verificationRequests.filter(r => r.status === 'approved').length / Math.max(verificationRequests.length, 1)) * 100)}%</div>
              <p className="text-xs text-gray-400">Approval rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Overview */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-white">Institution Status</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Verified</span>
                    <span className="text-green-400">{verificationRequests.filter(r => r.status === 'approved').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Pending</span>
                    <span className="text-yellow-400">{verificationRequests.filter(r => r.status === 'pending').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Rejected</span>
                    <span className="text-red-400">{verificationRequests.filter(r => r.status === 'rejected').length}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Revenue Breakdown</h4>
                <div className="space-y-1">
                  {revenueData?.planBreakdown && Object.entries(revenueData.planBreakdown).map(([plan, count]) => (
                    <div key={plan} className="flex justify-between text-sm">
                      <span>{plan}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">System Status</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connectionStatus?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Backend: {connectionStatus?.isConnected ? `Connected (${connectionStatus.latency}ms)` : 'Disconnected'}</span>
                  </div>
                  {connectionStatus?.error && (
                    <p className="text-xs text-red-600 ml-4">{connectionStatus.error}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                    <span>Auto-refresh: {autoRefresh ? 'On (30s)' : 'Off'}</span>
                  </div>
                  <p>API Base: https://educhain-backend-avmj.onrender.com</p>
                  <p>Last verification: {verificationRequests.length > 0 ? new Date(Math.max(...verificationRequests.map(r => new Date(r.submittedAt).getTime()))).toLocaleDateString() : 'None'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Verification Requests
              <Badge variant="secondary">{verificationRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verificationRequests.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No verification requests found. Check your backend connection or wait for institutions to submit requests.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Stats Summary */}
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm">Pending: {verificationRequests.filter(r => r.status === 'pending').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Approved: {verificationRequests.filter(r => r.status === 'approved').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Rejected: {verificationRequests.filter(r => r.status === 'rejected').length}</span>
                  </div>
                </div>

                {/* Enhanced Requests List */}
                <div className="space-y-4">
                  {/* Priority Pending Requests */}
                  {verificationRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div>
                      <h4 className="font-medium text-lg mb-4 text-orange-600">🔥 Priority Reviews ({verificationRequests.filter(r => r.status === 'pending').length})</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        {verificationRequests.filter(r => r.status === 'pending').map((request) => (
                          <Card key={request.id} className="border-l-4 border-l-orange-500 shadow-md">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">{request.institutionName}</CardTitle>
                                  <p className="text-sm text-muted-foreground">{request.institutionEmail}</p>
                                  <p className="text-xs text-orange-600 font-medium mt-1">
                                    Waiting {Math.ceil((Date.now() - new Date(request.submittedAt).getTime()) / (1000 * 60 * 60 * 24))} days
                                  </p>
                                </div>
                                {getStatusBadge(request.status)}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="text-sm">
                                <p><strong>Registration:</strong> {request.registrationNumber}</p>
                                <p><strong>Submitted:</strong> {new Date(request.submittedAt).toLocaleDateString()}</p>
                              </div>
                              
                              {request.documents && request.documents.length > 0 && (
                                <div>
                                  <p className="font-medium text-sm mb-2">Documents ({request.documents.length}):</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    {request.documents.map((doc, index) => (
                                      <div key={index} className="flex items-center gap-1 text-xs bg-gray-50 p-2 rounded">
                                        <FileCheck className="w-3 h-3 text-green-600" />
                                        <a 
                                          href={doc.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline truncate flex-1"
                                          title={doc.description || doc.originalName}
                                        >
                                          {doc.type}
                                        </a>
                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <Button 
                                onClick={() => openReviewModal(request)}
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                data-testid={`button-review-${request.id}`}
                              >
                                🚀 Review Now
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Requests */}
                  <div>
                    <h4 className="font-medium text-lg mb-4">All Verification Requests</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {verificationRequests.map((request) => (
                        <Card key={request.id} className={`border-l-4 ${
                          request.status === 'pending' ? 'border-l-yellow-500' :
                          request.status === 'approved' ? 'border-l-green-500' :
                          'border-l-red-500'
                        }`}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{request.institutionName}</CardTitle>
                                <p className="text-xs text-muted-foreground truncate">{request.institutionEmail}</p>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-xs">
                              <p><strong>Reg:</strong> {request.registrationNumber}</p>
                              <p><strong>Date:</strong> {new Date(request.submittedAt).toLocaleDateString()}</p>
                            </div>
                            
                            {request.documents && request.documents.length > 0 && (
                              <div className="text-xs">
                                <p className="font-medium mb-1">{request.documents.length} docs uploaded</p>
                                <div className="flex flex-wrap gap-1">
                                  {request.documents.slice(0, 3).map((doc, index) => (
                                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                      {doc.type.split(' ')[0]}
                                    </Badge>
                                  ))}
                                  {request.documents.length > 3 && (
                                    <Badge variant="outline" className="text-xs px-1 py-0">+{request.documents.length - 3}</Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {request.reviewedAt && (
                              <div className="text-xs bg-gray-50 p-2 rounded">
                                <p><strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleDateString()}</p>
                                {request.comments && <p className="mt-1 text-gray-600">{request.comments.substring(0, 50)}...</p>}
                              </div>
                            )}

                            {request.status === 'pending' ? (
                              <Button 
                                onClick={() => openReviewModal(request)}
                                size="sm"
                                className="w-full"
                                data-testid={`button-review-${request.id}`}
                              >
                                Review
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => openReviewModal(request)}
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                View Details
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Modal */}
        <Dialog open={reviewModal} onOpenChange={setReviewModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Review Verification Request</DialogTitle>
              <DialogDescription>
                Review the verification request for {selectedRequest?.institutionName}
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium">{selectedRequest.institutionName}</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequest.institutionEmail}</p>
                  <p className="text-sm">Registration: {selectedRequest.registrationNumber}</p>
                  <p className="text-sm">Submitted: {new Date(selectedRequest.submittedAt).toLocaleDateString()}</p>
                  {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Uploaded Documents:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedRequest.documents.map((doc, index) => (
                          <a 
                            key={index}
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-white p-2 rounded border hover:bg-blue-50 flex items-center gap-2"
                          >
                            <FileCheck className="w-3 h-3 text-green-600" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.type}</p>
                              <p className="text-gray-500 truncate">{doc.description || doc.originalName}</p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleReview)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decision</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select decision" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="approved">Approve</SelectItem>
                              <SelectItem value="rejected">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comments (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Add review comments..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setReviewModal(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="button-submit-review"
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Processing...' : 'Submit Review'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Password Change Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Admin Password</DialogTitle>
              <DialogDescription>
                Update your admin password for security
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password (min 8 chars)"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                disabled={passwordLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              >
                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </>
        )}

        {activeTab === 'blockchain' && (
          <div className="[&_*]:!bg-gray-800 [&_*]:!text-white [&_.border]:!border-gray-700">
            <BlockchainManagement />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="[&_*]:!bg-gray-800 [&_*]:!text-white [&_.border]:!border-gray-700">
            <UserManagement />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  Audit logs functionality coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}