import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  CheckCircle2,
  Copy,
  Check,
  LogOut,
  Shield,
  Zap,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';

// ─── Network name + badge colour mapping ───────────────────────────────────
const NETWORK_MAP: Record<string, { name: string; className: string }> = {
  '0x2105':  { name: 'Base',          className: 'bg-blue-100 text-blue-700 border-blue-200' },
  '0x14a34': { name: 'Base Sepolia',  className: 'bg-amber-100 text-amber-700 border-amber-200' },
  '0x1':     { name: 'Ethereum',      className: 'bg-purple-100 text-purple-700 border-purple-200' },
  '0x89':    { name: 'Polygon',       className: 'bg-violet-100 text-violet-700 border-violet-200' },
  '0x14':    { name: 'Base Testnet',  className: 'bg-orange-100 text-orange-700 border-orange-200' },
};

const SUPPORTED_WALLETS = ['MetaMask', 'WalletConnect', 'Coinbase Wallet', '+ More'];

const TRUST_BADGES = [
  { icon: Shield, label: 'Non-custodial' },
  { icon: Zap,    label: 'Instant sign-in' },
  { icon: Link2,  label: 'Base Network' },
];

// ─── Component ──────────────────────────────────────────────────────────────
export function WalletConnectPanel() {
  const {
    isConnected,
    walletAddress,
    networkId,
    connect,
    disconnect,
    isLoading,
    error,
  } = useWallet();

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be restricted in some environments
    }
  }, [walletAddress]);

  const networkInfo =
    NETWORK_MAP[networkId?.toLowerCase()] ??
    { name: networkId ? 'Unknown Network' : 'Base', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' };

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <AnimatePresence mode="wait">
      {isConnected ? (
        /* ── Connected state: compact strip ─────────────────────────── */
        <motion.div
          key="connected"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex flex-wrap items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-200"
        >
          {/* Pulsing live dot */}
          <span className="relative flex-shrink-0">
            <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
          </span>

          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />

          <span className="text-sm font-semibold text-emerald-900 mr-1">
            Issuer Wallet Connected
          </span>

          {/* Address chip with copy */}
          <div className="flex items-center gap-1">
            <code className="text-xs font-mono text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {shortAddress}
            </code>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors text-emerald-600"
              title={copied ? 'Copied!' : 'Copy address'}
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Network badge */}
          <Badge className={cn('text-xs font-bold px-2.5 py-0.5 border', networkInfo.className)}>
            {networkInfo.name}
          </Badge>

          <div className="flex-1" />

          {/* Disconnect */}
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            className="h-8 px-3 gap-1.5 text-xs font-semibold text-emerald-700 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </Button>
        </motion.div>
      ) : (
        /* ── Disconnected state: full hero panel ─────────────────────── */
        <motion.div
          key="disconnected"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Card className="border-0 overflow-hidden shadow-xl">
            {/* Gradient hero */}
            <div
              className="relative px-8 py-10 text-white text-center overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, #1560BD 0%, #00416A 58%, #15BCA9 100%)',
              }}
            >
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-white/3 -translate-y-1/2" />

              {/* Icon */}
              <div className="relative z-10 flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                  <Wallet className="w-9 h-9 text-white" />
                </div>
              </div>

              {/* Heading + description */}
              <div className="relative z-10 space-y-3 mb-7">
                <h3 className="text-2xl font-extrabold tracking-tight leading-tight">
                  Connect Your Issuer Wallet
                </h3>
                <p className="text-white/65 text-sm leading-relaxed max-w-sm mx-auto">
                  Your institution's blockchain wallet is required to
                  cryptographically sign and issue verifiable credentials
                  on the Base network.
                </p>
              </div>

              {/* CTA button */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <Button
                  onClick={() => connect()}
                  disabled={isLoading}
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 active:bg-white/80 font-bold px-10 h-12 rounded-xl shadow-2xl text-sm gap-2 min-w-[180px]"
                >
                  <Wallet className="w-4 h-4" />
                  {isLoading ? 'Opening Wallet…' : 'Connect Wallet'}
                </Button>

                {/* Error message */}
                {error && !error.includes('substring') && (
                  <div className="flex items-center gap-1.5 text-red-200 text-xs bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Trust badges */}
                <div className="flex items-center gap-4">
                  {TRUST_BADGES.map(({ icon: Icon, label }, i) => (
                    <span key={label} className="flex items-center gap-4">
                      {i > 0 && (
                        <span className="w-px h-3 bg-white/20" />
                      )}
                      <span className="flex items-center gap-1.5 text-white/50 text-xs">
                        <Icon className="w-3 h-3" />
                        {label}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Supported wallets footer */}
              <div className="relative z-10 mt-7 pt-5 border-t border-white/10">
                <p className="text-white/35 text-[10px] uppercase tracking-widest font-bold mb-2.5">
                  Supported Wallets
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                  {SUPPORTED_WALLETS.map((name, i) => (
                    <span key={name} className="flex items-center gap-3">
                      {i > 0 && (
                        <span className="w-px h-3 bg-white/20" />
                      )}
                      <span className="text-white/55 text-xs font-medium">{name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
