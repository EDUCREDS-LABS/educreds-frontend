import React, { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum } from '@reown/appkit/networks';

// Metadata for the application
const metadata = {
  name: 'EduCreds',
  description: 'Secure Credential Verification Platform',
  url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Initialize Wagmi adapter with supported networks
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, polygon, arbitrum],
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  ssr: false,
});

// Initialize AppKit
let appKitInitialized = false;

function initializeAppKit() {
  if (appKitInitialized) return;

  if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
    console.warn(
      'Missing VITE_WALLETCONNECT_PROJECT_ID environment variable. Crypto payments may not work.'
    );
    return;
  }

  try {
    createAppKit({
      adapters: [wagmiAdapter],
      networks: [mainnet, polygon, arbitrum],
      defaultNetwork: mainnet,
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      metadata,
      features: {
        analytics: true,
      },
    });
    appKitInitialized = true;
  } catch (error) {
    console.error('Failed to initialize AppKit:', error);
  }
}

interface CryptoPaymentProviderProps {
  children: ReactNode;
}

export function CryptoPaymentProvider({ children }: CryptoPaymentProviderProps) {
  // Initialize AppKit on mount
  React.useEffect(() => {
    initializeAppKit();
  }, []);

  return <>{children}</>;
}

export default CryptoPaymentProvider;
