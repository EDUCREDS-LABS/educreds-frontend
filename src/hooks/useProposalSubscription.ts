import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface ProposalUpdate {
  id: string;
  state: string;
  legitimacyScore: number;
  timestamp: Date;
}

export interface VoteUpdate {
  id: string;
  proposalId: string;
  voterAddress: string;
  vote: boolean;
  timestamp: Date;
}

export interface PoICScoreUpdate {
  institutionId: string;
  score: number;
  timestamp: Date;
}

interface UseProposalSubscriptionOptions {
  onProposalUpdate?: (update: ProposalUpdate) => void;
  onVoteUpdate?: (update: VoteUpdate) => void;
  onPoICUpdate?: (update: PoICScoreUpdate) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useProposalSubscription(options: UseProposalSubscriptionOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);

    try {
      socketRef.current = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
      });

      socketRef.current.on('connect', () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;

        // Subscribe to governance channels
        socketRef.current?.emit('subscribe', {
          channels: ['proposals', 'votes', 'poic-scores'],
        });

        options.onConnect?.();
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
        setIsConnected(false);
        options.onDisconnect?.();
      });

      // Proposal update events
      socketRef.current.on('proposal:updated', (data: ProposalUpdate) => {
        console.log('[WebSocket] Proposal updated:', data);
        options.onProposalUpdate?.(data);
      });

      socketRef.current.on('proposal:created', (data: ProposalUpdate) => {
        console.log('[WebSocket] Proposal created:', data);
        options.onProposalUpdate?.(data);
      });

      socketRef.current.on('proposal:state-changed', (data: ProposalUpdate) => {
        console.log('[WebSocket] Proposal state changed:', data);
        options.onProposalUpdate?.(data);
      });

      // Vote update events
      socketRef.current.on('vote:cast', (data: VoteUpdate) => {
        console.log('[WebSocket] Vote cast:', data);
        options.onVoteUpdate?.(data);
      });

      socketRef.current.on('votes:updated', (data: VoteUpdate) => {
        console.log('[WebSocket] Votes updated:', data);
        options.onVoteUpdate?.(data);
      });

      // PoIC score update events
      socketRef.current.on('poic-score:updated', (data: PoICScoreUpdate) => {
        console.log('[WebSocket] PoIC score updated:', data);
        options.onPoICUpdate?.(data);
      });

      socketRef.current.on('poic-scores:bulk-updated', (data: PoICScoreUpdate[]) => {
        console.log('[WebSocket] PoIC scores bulk updated:', data);
        data.forEach((update) => options.onPoICUpdate?.(update));
      });

      // Error handling
      socketRef.current.on('error', (error: any) => {
        console.error('[WebSocket] Error:', error);
        options.onError?.(error);
      });

      socketRef.current.on('connect_error', (error: any) => {
        console.error('[WebSocket] Connection error:', error);
        reconnectAttemptsRef.current += 1;

        if (reconnectAttemptsRef.current > maxReconnectAttempts) {
          setIsConnecting(false);
          options.onError?.(new Error('Failed to connect after multiple attempts'));
        }
      });
    } catch (error) {
      console.error('[WebSocket] Failed to create socket:', error);
      setIsConnecting(false);
      options.onError?.(error as Error);
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    reconnect: connect,
    disconnect,
  };
}

export function useProposalUpdates(onUpdate?: (update: ProposalUpdate) => void) {
  const [updates, setUpdates] = useState<ProposalUpdate[]>([]);
  const [isLive, setIsLive] = useState(false);

  useProposalSubscription({
    onProposalUpdate: (update) => {
      setUpdates((prev) => [update, ...prev].slice(0, 10)); // Keep last 10 updates
      setIsLive(true);
      onUpdate?.(update);

      // Auto-expire "live" indicator after 3 seconds
      setTimeout(() => setIsLive(false), 3000);
    },
  });

  return { updates, isLive };
}

export function useVoteUpdates(onUpdate?: (update: VoteUpdate) => void) {
  const [updates, setUpdates] = useState<VoteUpdate[]>([]);
  const [isLive, setIsLive] = useState(false);

  useProposalSubscription({
    onVoteUpdate: (update) => {
      setUpdates((prev) => [update, ...prev].slice(0, 10)); // Keep last 10 updates
      setIsLive(true);
      onUpdate?.(update);

      // Auto-expire "live" indicator after 3 seconds
      setTimeout(() => setIsLive(false), 3000);
    },
  });

  return { updates, isLive };
}

export function usePoICUpdates(onUpdate?: (update: PoICScoreUpdate) => void) {
  const [updates, setUpdates] = useState<PoICScoreUpdate[]>([]);
  const [isLive, setIsLive] = useState(false);

  useProposalSubscription({
    onPoICUpdate: (update) => {
      setUpdates((prev) => [update, ...prev].slice(0, 10)); // Keep last 10 updates
      setIsLive(true);
      onUpdate?.(update);

      // Auto-expire "live" indicator after 3 seconds
      setTimeout(() => setIsLive(false), 3000);
    },
  });

  return { updates, isLive };
}
