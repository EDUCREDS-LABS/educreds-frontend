/**
 * Shared type definitions for Ethereum/Web3 wallet providers
 * Used across the application for MetaMask and other injected wallets
 */

export interface EthereumRequestArgs {
  method: string;
  params?: unknown[];
}

export interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  request: (args: EthereumRequestArgs) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isConnected?: () => Promise<boolean>;
  chainId?: string;
  networkVersion?: string;
  selectedAddress?: string;
}

// Extend Window interface globally for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
