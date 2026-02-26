import { createWeb3Modal, defaultConfig } from '@web3modal/ethers';
import { EventEmitter } from 'events';
import { ethers, BrowserProvider, Signer, Eip1193Provider } from 'ethers';

// 1. Get project ID from .env file
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Falling back to injected wallets only.');
}

// 2. Set up chains
const mainnet = {
  chainId: 8453,
  name: 'Base',
  currency: 'ETH',
  explorerUrl: 'https://basescan.org',
  rpcUrl: 'https://mainnet.base.org'
};

const testnet = {
  chainId: 84532,
  name: 'Base Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.basescan.org',
  rpcUrl: 'https://sepolia.base.org'
};

// 3. Create modal
const metadata = {
  name: 'EduCreds',
  description: 'Decentralized Certificate Issuance and Verification',
  url: 'https://educreds.xyz', // Your website URL
  icons: ['https://avatars.githubusercontent.com/u/37784886'] // Your icon URL
};

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
});

class WalletService extends EventEmitter {
  private modal: ReturnType<typeof createWeb3Modal> | null = null;
  private provider: BrowserProvider | null = null;
  private rawProvider: Eip1193Provider | null = null;
  private signer: Signer | null = null;
  private address: string | null = null;
  private chainId: string | null = null;
  private isConnectedState: boolean = false;

  constructor() {
    super();
  }

  private ensureModal() {
    if (this.modal || !projectId) return;
    this.modal = createWeb3Modal({
      ethersConfig,
      chains: [mainnet, testnet],
      projectId,
      enableAnalytics: true,
    });
    this.modal.subscribeProvider(this.onProviderChange);
  }

  private async hydrateFromProvider(provider: Eip1193Provider) {
    const browserProvider = new ethers.BrowserProvider(provider);
    const signer = await browserProvider.getSigner();
    const address = await signer.getAddress();
    const network = await browserProvider.getNetwork();
    const chainId = `0x${Number(network.chainId).toString(16)}`;
    const wasConnected = this.isConnectedState;

    this.provider = browserProvider;
    this.rawProvider = provider;
    this.signer = signer;
    this.address = address;
    this.chainId = chainId;
    this.isConnectedState = true;

    if (wasConnected) {
      this.emit('change', { address: this.address, chainId: this.chainId });
    } else {
      this.emit('connect', { address: this.address, chainId: this.chainId });
    }
  }

  private onProviderChange = async ({ provider, address, chainId, isConnected }: { provider?: Eip1193Provider, address?: string, chainId?: number, isConnected: boolean }) => {
    const wasConnected = this.isConnectedState;

    if (isConnected && provider && address && chainId) {
      const newProvider = new ethers.BrowserProvider(provider);
      const newSigner = await newProvider.getSigner();
      const hexChainId = `0x${chainId.toString(16)}`;

      this.provider = newProvider;
      this.rawProvider = provider;
      this.signer = newSigner;
      this.address = address;
      this.chainId = hexChainId;
      this.isConnectedState = true;

      if (wasConnected) {
        this.emit('change', { address: this.address, chainId: this.chainId });
      } else {
        this.emit('connect', { address: this.address, chainId: this.chainId });
      }
    } else if (!isConnected && wasConnected) {
      this.handleDisconnectCleanup();
    }
  };

  private handleDisconnectCleanup = () => {
    this.provider = null;
    this.rawProvider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnectedState = false;
    this.emit('disconnect');
  };

  public async connect() {
    // Prefer direct injected provider (MetaMask/Coinbase extension) to avoid
    // modal conflicts and keep issuance flow responsive.
    const injected = (globalThis as any)?.window?.ethereum as Eip1193Provider | undefined;
    if (injected?.request) {
      await injected.request({ method: 'eth_requestAccounts' });
      await this.hydrateFromProvider(injected);
      return;
    }

    // Fallback to WalletConnect modal when no injected provider exists.
    this.ensureModal();
    if (!this.modal) {
      throw new Error('No injected wallet found and WalletConnect projectId is not configured.');
    }
    return this.modal.open();
  }

  public async disconnect() {
    if (this.modal) {
      try {
        await this.modal.disconnect();
      } catch {
        // Ignore modal disconnect errors and force local cleanup below.
      }
    }
    this.handleDisconnectCleanup();
  }

  public isConnected(): boolean {
    return this.isConnectedState;
  }

  public getProvider(): BrowserProvider | null {
    return this.provider;
  }

  public getRawProvider(): Eip1193Provider | null {
    return this.rawProvider;
  }

  public getSigner(): Signer | null {
    return this.signer;
  }

  public getAddress(): string | null {
    return this.address;
  }

  public getChainId(): string | null {
    return this.chainId;
  }

  public async getNetwork() {
    if (!this.provider) return null;
    return this.provider.getNetwork();
  }

  public async getWalletState() {
    return {
      address: this.address,
      chainId: this.chainId,
      isConnected: this.isConnectedState,
    };
  }
}

export const walletService = new WalletService();
