import { Request, Response } from 'express';
import crypto from 'crypto';

// Security audit logging
interface SecurityEvent {
  timestamp: Date;
  type: 'login_attempt' | 'failed_auth' | 'suspicious_activity' | 'rate_limit_hit' | 'invalid_input';
  ip: string;
  userAgent?: string;
  userId?: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityAuditLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 10000; // Keep last 10k events in memory

  log(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log critical events immediately
    if (event.severity === 'critical') {
      console.error('CRITICAL SECURITY EVENT:', securityEvent);
      // In production, send to monitoring service (Sentry, DataDog, etc.)
    }
  }

  getEvents(filters?: {
    type?: string;
    severity?: string;
    since?: Date;
    limit?: number;
  }): SecurityEvent[] {
    let filtered = this.events;

    if (filters?.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters?.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters?.since) {
      filtered = filtered.filter(e => e.timestamp >= filters.since!);
    }

    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getSecuritySummary() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp >= last24h);

    return {
      totalEvents: this.events.length,
      last24Hours: recentEvents.length,
      criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
      highSeverityEvents: recentEvents.filter(e => e.severity === 'high').length,
      topIPs: this.getTopIPs(recentEvents),
      eventTypes: this.getEventTypeCounts(recentEvents)
    };
  }

  private getTopIPs(events: SecurityEvent[]) {
    const ipCounts: { [ip: string]: number } = {};
    events.forEach(e => {
      ipCounts[e.ip] = (ipCounts[e.ip] || 0) + 1;
    });

    return Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }

  private getEventTypeCounts(events: SecurityEvent[]) {
    const typeCounts: { [type: string]: number } = {};
    events.forEach(e => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });

    return typeCounts;
  }
}

export const securityAudit = new SecurityAuditLogger();

// Middleware to log security events
export const logSecurityEvent = (
  type: SecurityEvent['type'],
  severity: SecurityEvent['severity'] = 'low'
) => {
  return (req: Request, res: Response, next: any) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    securityAudit.log({
      type,
      severity,
      ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: type === 'login_attempt' ? { email: req.body?.email } : undefined
      }
    });

    next();
  };
};

// Security headers validation
export const validateSecurityHeaders = (req: Request, res: Response, next: any) => {
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-cluster-client-ip'
  ];

  let suspicious = false;
  suspiciousHeaders.forEach(header => {
    const value = req.get(header);
    if (value && value.includes('127.0.0.1') && req.ip !== '127.0.0.1') {
      suspicious = true;
    }
  });

  if (suspicious) {
    securityAudit.log({
      type: 'suspicious_activity',
      severity: 'high',
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      details: {
        suspiciousHeaders: suspiciousHeaders.reduce((acc, header) => {
          const value = req.get(header);
          if (value) acc[header] = value;
          return acc;
        }, {} as any)
      }
    });
  }

  next();
};

// Generate security report
export const generateSecurityReport = () => {
  const summary = securityAudit.getSecuritySummary();
  const recentCritical = securityAudit.getEvents({
    severity: 'critical',
    limit: 50
  });

  return {
    generatedAt: new Date().toISOString(),
    summary,
    recentCriticalEvents: recentCritical,
    recommendations: generateSecurityRecommendations(summary)
  };
};

// Generate security recommendations based on events
const generateSecurityRecommendations = (summary: any) => {
  const recommendations: string[] = [];

  if (summary.criticalEvents > 0) {
    recommendations.push('Investigate critical security events immediately');
  }

  if (summary.highSeverityEvents > 10) {
    recommendations.push('Consider implementing additional rate limiting');
  }

  if (summary.topIPs.some((ip: any) => ip.count > 100)) {
    recommendations.push('Review high-activity IP addresses for potential abuse');
  }

  if (summary.eventTypes.failed_auth > 50) {
    recommendations.push('Consider implementing CAPTCHA for login attempts');
  }

  return recommendations;
};

// Content Security Policy violation handler
export const handleCSPViolation = (req: Request, res: Response) => {
  const violation = req.body;
  
  securityAudit.log({
    type: 'suspicious_activity',
    severity: 'medium',
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent'),
    details: {
      cspViolation: violation,
      blockedUri: violation['blocked-uri'],
      violatedDirective: violation['violated-directive']
    }
  });

  res.status(204).end();
};

// Generate nonce for inline scripts (CSP)
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};