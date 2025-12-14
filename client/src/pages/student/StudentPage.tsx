import { StudentPortalEnhanced } from "@/components/StudentPortalEnhanced";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, AlertCircle } from "lucide-react";

export default function StudentPage() {
  const { isConnected, connect, isLoading, error } = useWallet();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Student Portal</h1>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">Connect Your Wallet</h3>
          <p className="text-neutral-600 mb-6">
            Connect your blockchain wallet to access your certificates and verify your credentials.
          </p>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            size="lg"
            onClick={connect}
            disabled={isLoading}
            className="min-w-[200px]"
            data-testid="connect-wallet-btn"
          >
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </Button>
          
          <div className="mt-4 text-sm text-neutral-500">
            <p>Supported wallets: MetaMask, WalletConnect, Coinbase Wallet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-8">Student Portal</h1>
        <StudentPortalEnhanced />
      </div>
    </div>
  );
}
