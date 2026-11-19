import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, base, polygon, baseSepolia } from '@reown/appkit/networks'
import type { Chain } from 'viem'

const INVALID_PROJECT_IDS = new Set([
  '',
  'YOUR_PROJECT_ID',
  'your_reown_project_id',
  'your_project_id',
  'undefined',
  'null',
]);

const pickProjectId = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    const normalized = String(value ?? '').trim();
    if (!INVALID_PROJECT_IDS.has(normalized)) {
      return normalized;
    }
  }
  return 'YOUR_PROJECT_ID';
};

// Read Project ID from environment variables (prefer Vite runtime env for this client app)
export const projectId = pickProjectId(
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  import.meta.env.NEXT_PUBLIC_PROJECT_ID,
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  import.meta.env.NEXT_PUBLIC_PROJECT_ID,
);

// Define supported networks, explicitly typed as a non-empty array of Chains
export const networks: [Chain, ...Chain[]] = [baseSepolia, base, mainnet, polygon]

const configuredChainId = Number(
  import.meta.env.VITE_CHAIN_ID ??
  import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID ??
  84532
);

export const defaultNetwork = (
  networks.find((network) => Number((network as any).id) === configuredChainId) ||
  baseSepolia
) as Chain;

// Lazy initialization: WagmiAdapter is only created when actually needed
// This prevents WalletConnect 403 errors from blocking non-wallet features
let _wagmiAdapter: WagmiAdapter | null = null;
let _config: any = null;

function createWagmiAdapter() {
  if (!projectId || projectId === 'YOUR_PROJECT_ID') {
    console.warn('WalletConnect Project ID is not defined. Set VITE_WALLETCONNECT_PROJECT_ID in frontend .env');
    return null;
  }
  
  try {
    const adapter = new WagmiAdapter({
      storage: createStorage({ storage: cookieStorage }),
      ssr: true,
      projectId,
      networks,
    });
    return adapter;
  } catch (error) {
    console.warn('Failed to initialize WagmiAdapter:', error);
    return null;
  }
}

// Lazy getter for wagmiAdapter - creates on first access
export function getWagmiAdapter(): WagmiAdapter | null {
  if (!_wagmiAdapter) {
    _wagmiAdapter = createWagmiAdapter();
  }
  return _wagmiAdapter;
}

// Lazy getter for config - creates on first access
export function getWagmiConfig(): any {
  if (!_config) {
    const adapter = getWagmiAdapter();
    _config = adapter?.wagmiConfig ?? null;
  }
  return _config;
}

// Backwards compatibility: export the getters as the original names
// Components importing { wagmiAdapter } will get the lazy getter result
export const wagmiAdapter = getWagmiAdapter();
export const config = getWagmiConfig();
