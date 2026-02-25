'use client'

import React, { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { config, networks, projectId, wagmiAdapter } from './wagmi-config'
import { mainnet } from '@reown/appkit/networks'

const metadata = {
  name: 'EduCreds',
  description: 'Blockchain-powered educational credential management platform',
  url: 'https://educreds.xyz',
  icons: ['https://educreds.xyz/favicon.ico'],
}

// Initialize AppKit once at module load time
if (typeof window !== 'undefined' && projectId && projectId !== 'YOUR_PROJECT_ID') {
  try {
    createAppKit({
      adapters: [wagmiAdapter],
      projectId: projectId,
      networks: networks,
      defaultNetwork: mainnet,
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

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}
