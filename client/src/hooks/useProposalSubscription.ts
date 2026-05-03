import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from './use-toast';
import { API_CONFIG } from '../config/api';

interface ProposalUpdate {
  id: string;
  type: 'state-changed' | 'vote-received' | 'score-updated';
  data: any;
  timestamp: Date;
}

interface UseProposalSubscriptionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useProposalSubscription(
  onUpdate?: (update: ProposalUpdate) => void,
  options: UseProposalSubscriptionOptions = {}
) {
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [updates, setUpdates] = useState<ProposalUpdate[]>([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const {
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const apiBase = API_CONFIG.MAIN;
    const backendUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
    
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to governance gateway');
      setIsConnected(true);
      setIsLive(true);
      setConnectionAttempts(0);
      
      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        newSocket.emit('ping');
      }, 30000);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from governance gateway:', reason);
      setIsConnected(false);
      setIsLive(false);
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Auto-reconnect with exponential backoff
      if (autoReconnect && connectionAttempts < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(2, connectionAttempts);
        setConnectionAttempts(prev => prev + 1);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect... (${connectionAttempts + 1}/${maxReconnectAttempts})`);
          connect();
        }, delay);
      }
    });

    newSocket.on('pong', () => {
      setIsLive(true);
    });

    newSocket.on('proposal:state-changed', (data) => {
      const update: ProposalUpdate = {
        id: data.proposalId,
        type: 'state-changed',
        data,
        timestamp: new Date(data.timestamp),
      };
      
      setUpdates(prev => [...prev.slice(-9), update]);
      onUpdate?.(update);
    });

    newSocket.on('proposal:vote-received', (data) => {
      const update: ProposalUpdate = {
        id: data.proposalId,
        type: 'vote-received',
        data,
        timestamp: new Date(data.timestamp),
      };
      
      setUpdates(prev => [...prev.slice(-9), update]);
      onUpdate?.(update);
    });

    newSocket.on('institution:score-updated', (data) => {
      const update: ProposalUpdate = {
        id: data.institutionId,
        type: 'score-updated',
        data,
        timestamp: new Date(data.timestamp),
      };
      
      setUpdates(prev => [...prev.slice(-9), update]);
      onUpdate?.(update);
    });

    newSocket.on('governance:metrics-updated', (data) => {
      // Handle governance metrics updates
      console.log('Governance metrics updated:', data);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time updates',
        variant: 'destructive',
      });
    });

    setSocket(newSocket);
  }, [autoReconnect, maxReconnectAttempts, reconnectDelay, connectionAttempts, onUpdate, toast]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setIsLive(false);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
  }, [socket]);

  const subscribeToProposal = useCallback((proposalId: string) => {
    if (socket && isConnected) {
      socket.emit('proposal:subscribe', { proposalId });
    }
  }, [socket, isConnected]);

  const unsubscribeFromProposal = useCallback((proposalId: string) => {
    if (socket && isConnected) {
      socket.emit('proposal:unsubscribe', { proposalId });
    }
  }, [socket, isConnected]);

  const subscribeToInstitution = useCallback((institutionId: string) => {
    if (socket && isConnected) {
      socket.emit('institution:subscribe', { institutionId });
    }
  }, [socket, isConnected]);

  const unsubscribeFromInstitution = useCallback((institutionId: string) => {
    if (socket && isConnected) {
      socket.emit('institution:unsubscribe', { institutionId });
    }
  }, [socket, isConnected]);

  // Initialize connection on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    isLive,
    updates,
    connectionAttempts,
    connect,
    disconnect,
    subscribeToProposal,
    unsubscribeFromProposal,
    subscribeToInstitution,
    unsubscribeFromInstitution,
  };
}

// Simplified hook for basic proposal updates
export function useProposalUpdates(onUpdate?: (update: ProposalUpdate) => void) {
  const { isLive, updates } = useProposalSubscription(onUpdate);
  
  return {
    isLive,
    updates,
  };
}
