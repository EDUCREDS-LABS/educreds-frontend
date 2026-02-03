'use client'

import React, { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { config, networks, projectId, wagmiAdapter } from '@/lib/wagmi-config'
import { mainnet } from '@reown/appkit/networks'

const queryClient = new QueryClient()

const metadata = {
  name: 'EduCreds',
  description: 'Blockchain-powered educational credential management platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://educreds.xyz',
  icons: ['https://educreds.xyz/favicon.ico'],
}

// Initialize AppKit
if (projectId && projectId !== 'YOUR_PROJECT_ID') {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId: projectId!,
    networks: networks,
    defaultNetwork: mainnet,
    metadata,
    features: {
      analytics: true,
      email: false,
    },
  })
}

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
