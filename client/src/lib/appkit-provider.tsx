'use client'

import React, { ReactNode, Component, ErrorInfo } from 'react'
import { WagmiProvider } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { config, networks, projectId, wagmiAdapter, defaultNetwork } from './wagmi-config'

const INVALID_PROJECT_IDS = new Set(['', 'YOUR_PROJECT_ID', 'your_reown_project_id', 'undefined', 'null']);
const isValidProjectId = projectId && !INVALID_PROJECT_IDS.has(projectId);

const metadata = {
  name: 'EduCreds',
  description: 'Blockchain-powered educational credential management platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://educreds.xyz',
  icons: ['https://educreds.xyz/favicon.ico'],
}

// Initialize AppKit only when a valid project ID exists
if (typeof window !== 'undefined' && isValidProjectId) {
  try {
    createAppKit({
      adapters: [wagmiAdapter],
      projectId: projectId,
      networks: networks,
      defaultNetwork,
      metadata,
      features: {
        analytics: true,
        email: false,
      },
    })
  } catch (error) {
    console.warn('AppKit already initialized or initialization error:', error)
  }
}

// Error boundary: prevents WagmiProvider crash from blanking the entire app
class Web3ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[EduCreds] Web3/WagmiProvider failed to initialise:', error.message, info);
  }

  render() {
    if (this.state.hasError) {
      // Wallet/Web3 features unavailable but the rest of the app renders fine
      return <>{this.props.children}</>;
    }
    return this.props.children;
  }
}

export function AppKitProvider({ children }: { children: ReactNode }) {
  // If no valid WalletConnect project ID, skip WagmiProvider entirely
  if (!isValidProjectId) {
    console.warn('[EduCreds] WalletConnect project ID not configured. Blockchain wallet features disabled. Set VITE_WALLETCONNECT_PROJECT_ID to enable.');
    return <>{children}</>;
  }

  return (
    <Web3ErrorBoundary>
      <WagmiProvider config={config}>
        {children}
      </WagmiProvider>
    </Web3ErrorBoundary>
  )
}
