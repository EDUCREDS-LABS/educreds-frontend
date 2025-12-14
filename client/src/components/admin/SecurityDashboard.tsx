import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Lock, 
  Eye, 
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  Globe
} from 'lucide-react';

interface SecurityEvent {
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  details: any;
}

interface SecuritySummary {
  totalEvents: number;
  last24Hours: number;
  criticalEvents: number;
  highSeverityEvents: number;
  topIPs: Array<{ ip: string; count: number }>;
  eventTypes: Record<string, number>;
}

export default function SecurityDashboard() {
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSecurityData = async () => {
    try {
      setRefreshing(true);
      
      // In a real implementation, these would be actual API calls
      const mockSummary: SecuritySummary = {
        totalEvents: 1247,
        last24Hours: 89,
        criticalEvents: 2,
        highSeverityEvents: 12,
        topIPs: [
          { ip: '192.168.1.100', count: 45 },
          { ip: '10.0.0.15', count: 23 },
          { ip: '172.16.0.5', count: 18 }
        ],
        eventTypes: {
          'login_attempt': 34,
          'failed_auth': 28,
          'rate_limit_hit': 15,
          'suspicious_activity': 8,
          'invalid_input': 4
        }
      };

      const mockEvents: SecurityEvent[] = [
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          type: 'failed_auth',
          severity: 'medium',
          ip: '192.168.1.100',
          details: { attempts: 5, email: 'admin@test.com' }
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          type: 'suspicious_activity',
          severity: 'high',
          ip: '10.0.0.15',
          details: { reason: 'Multiple failed certificate verifications' }
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          type: 'rate_limit_hit',
          severity: 'low',
          ip: '172.16.0.5',
          details: { endpoint: '/api/certificates/verify' }
        }
      ];

      setSummary(mockSummary);
      setRecentEvents(mockEvents);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Security Dashboard
          </h2>
          <p className="text-neutral-600">Monitor security events and system health</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchSecurityData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {summary && summary.criticalEvents > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Security Events Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {summary.criticalEvents} critical security events in the last 24 hours require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.last24Hours}</div>
            <p className="text-xs text-muted-foreground">
              Recent security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.criticalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <Lock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary?.highSeverityEvents}</div>
            <p className="text-xs text-muted-foreground">
              Need attention soon
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Recent Security Events
            </CardTitle>
            <CardDescription>
              Latest security events requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.type.replace('_', ' ')}</span>
                        <Badge variant={getSeverityColor(event.severity) as any}>
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600">IP: {event.ip}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top IPs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Top Active IPs
            </CardTitle>
            <CardDescription>
              Most active IP addresses in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary?.topIPs.map((ip, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono text-sm">{ip.ip}</span>
                  <Badge variant="outline">{ip.count} events</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Event Types (Last 24 Hours)
          </CardTitle>
          <CardDescription>
            Distribution of security event types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {summary && Object.entries(summary.eventTypes).map(([type, count]) => (
              <div key={type} className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{count}</div>
                <div className="text-sm text-neutral-600 capitalize">
                  {type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}