/**
 * Backend connection testing utilities
 */

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:5000";

export interface ConnectionStatus {
  isConnected: boolean;
  latency: number;
  error?: string;
  timestamp: Date;
}

/**
 * Test backend connection and measure latency
 */
export async function testBackendConnection(): Promise<ConnectionStatus> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return {
        isConnected: true,
        latency,
        timestamp: new Date()
      };
    } else {
      return {
        isConnected: false,
        latency,
        error: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date()
      };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      isConnected: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

/**
 * Test admin endpoints specifically
 */
export async function testAdminConnection(adminEmail: string): Promise<ConnectionStatus> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/test`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'admin-email': adminEmail
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return {
        isConnected: true,
        latency,
        timestamp: new Date()
      };
    } else {
      return {
        isConnected: false,
        latency,
        error: `Admin endpoint error: ${response.status}`,
        timestamp: new Date()
      };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      isConnected: false,
      latency,
      error: error instanceof Error ? error.message : 'Admin connection failed',
      timestamp: new Date()
    };
  }
}