/**
 * Backend connection testing utilities
 */

import { API_CONFIG, CONNECTION_CONFIG } from '@/config/api';

export interface ConnectionStatus {
  isConnected: boolean;
  latency: number;
  error?: string;
  timestamp: Date;
}

/**
 * Fetch with timeout using AbortController
 */
function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Request timeout'));
    }, timeout);

    fetch(url, { ...options, signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          reject(new Error('Request timeout'));
        } else {
          reject(error);
        }
      });
  });
}

/**
 * Test backend connection and measure latency
 */
export async function testBackendConnection(): Promise<ConnectionStatus> {
  const startTime = Date.now();
  
  try {
    const response = await fetchWithTimeout(
      API_CONFIG.HEALTH.MAIN,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      CONNECTION_CONFIG.TIMEOUT
    );
    
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
    const response = await fetchWithTimeout(
      API_CONFIG.ADMIN.TEST,
      {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'admin-email': adminEmail
        }
      },
      CONNECTION_CONFIG.TIMEOUT
    );
    
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