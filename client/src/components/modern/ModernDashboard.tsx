import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  Users, 
  Zap, 
  TrendingUp,
  Plus,
  Eye,
  BarChart3,
  CheckCircle,
  UserPlus,
  Activity,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles,
  Target,
  Globe
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import CreateCertificateModal from "@/components/CreateCertificateModal";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function ModernDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: api.getStats,
    enabled: !!user,
    refetchOnMount: true,
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription/current"],
    queryFn: api.getCurrentSubscription,
    enabled: !!user,
    refetchOnMount: true,
  });

  const { data: certificatesData } = useQuery({
    queryKey: ["/api/certificates/institution"],
    queryFn: api.getCertificates,
    enabled: !!user,
    refetchOnMount: true,
  });

  const certificates = certificatesData?.certificates || [];
  const recentCertificates = certificates.slice(0, 5);

  const quickActions = [
    {
      title: "Issue Certificate",
      description: "Create a new certificate",
      icon: Plus,
      color: "text-white",
      bg: "bg-gradient-to-r from-primary to-purple-600",
      action: () => setIsCertificateModalOpen(true),
      primary: true
    },
    {
      title: "View All Certificates",
      description: "Manage issued certificates",
      icon: Award,
      color: "text-primary",
      bg: "bg-primary/10",
      action: () => setLocation("/certificates"),
    },
    {
      title: "Browse Templates",
      description: "Find certificate designs",
      icon: Sparkles,
      color: "text-purple-600",
      bg: "bg-purple-100",
      action: () => setLocation("/marketplace"),
    },
    {
      title: "Analytics",
      description: "View detailed insights",
      icon: BarChart3,
      color: "text-green-600",
      bg: "bg-green-100",
      action: () => setLocation("/subscription"),
    }
  ];

  const getUsagePercentage = () => {
    const usage = (subscription as any)?.usage?.certificatesThisMonth || 0;
    const limit = (subscription as any)?.subscription?.planId === 'enterprise' ? 1000 : 500;
    return Math.min((usage / limit) * 100, 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-neutral-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            {user?.isVerified ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Clock className="w-3 h-3 mr-1" />
                Verification Pending
              </Badge>
            )}
          </div>
          <p className="text-neutral-600">
            {format(new Date(), "EEEE, MMMM do, yyyy")}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsCertificateModalOpen(true)}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Issue Certificate
          </Button>
          <Button variant="outline" onClick={() => setLocation("/certificates")}>
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12%
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 mb-1">
                    {(stats as any)?.totalCertificates || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Total Certificates</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-100">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Active
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 mb-1">
                    {(stats as any)?.activeCertificates || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Active Certificates</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    <Globe className="w-3 h-3 mr-1" />
                    Blockchain
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 mb-1">
                    {(stats as any)?.activeCertificates || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Verified On-Chain</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-neutral-600">
                    This Month
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 mb-1">
                    {(subscription as any)?.usage?.certificatesThisMonth || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Monthly Usage</p>
                  <Progress value={getUsagePercentage()} className="h-1 mt-2" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant={action.primary ? "default" : "outline"}
                onClick={action.action}
                className={`h-auto p-6 flex-col items-start space-y-3 ${
                  action.primary 
                    ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white border-0" 
                    : "hover:bg-neutral-50"
                }`}
              >
                <div className={`p-3 rounded-xl ${action.primary ? "bg-white/20" : action.bg} w-fit`}>
                  <action.icon className={`w-6 h-6 ${action.primary ? "text-white" : action.color}`} />
                </div>
                <div className="text-left space-y-1">
                  <div className={`font-semibold ${action.primary ? "text-white" : "text-neutral-900"}`}>
                    {action.title}
                  </div>
                  <div className={`text-sm ${action.primary ? "text-white/80" : "text-neutral-500"}`}>
                    {action.description}
                  </div>
                </div>
                {!action.primary && (
                  <ArrowUpRight className="w-4 h-4 text-neutral-400 self-end" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Certificates */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Recent Certificates
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/certificates")}>
            View All
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentCertificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No certificates yet</h3>
              <p className="text-neutral-600 mb-4">Start by issuing your first certificate</p>
              <Button onClick={() => setIsCertificateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Issue Certificate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCertificates.map((cert: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{cert.studentName}</p>
                      <p className="text-sm text-neutral-600">{cert.courseName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={cert.isMinted ? "default" : "secondary"}>
                        {cert.isMinted ? "On Blockchain" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {format(new Date(cert.issuedAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Certificate Modal */}
      <CreateCertificateModal
        open={isCertificateModalOpen}
        onOpenChange={setIsCertificateModalOpen}
      />
    </div>
  );
}