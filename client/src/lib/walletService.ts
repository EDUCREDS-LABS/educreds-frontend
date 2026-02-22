import { createWeb3Modal, defaultConfig } from '@web3modal/ethers';
import { EventEmitter } from 'events';
import { ethers, BrowserProvider, Signer, Eip1193Provider } from 'ethers';

// 1. Get project ID from .env file
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set in .env');
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
  private modal: ReturnType<typeof createWeb3Modal>;
  private provider: BrowserProvider | null = null;
  private rawProvider: Eip1193Provider | null = null;
  private signer: Signer | null = null;
  private address: string | null = null;
  private chainId: string | null = null;
  private isConnectedState: boolean = false;

  constructor() {
    super();
    this.modal = createWeb3Modal({
      ethersConfig,
      chains: [mainnet, testnet],
      projectId,
      enableAnalytics: true
    });

    this.modal.subscribeProvider(this.onProviderChange);
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
    return this.modal.open();
  }

  public async disconnect() {
    await this.modal.disconnect();
    // The subscription will trigger the cleanup.
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
    const state = this.modal.getState();
    return {
      address: state.address,
      chainId: state.selectedNetworkId ? `0x${state.selectedNetworkId.toString(16)}` : null,
      isConnected: state.open,
    };
  }
}

export const walletService = new WalletService();