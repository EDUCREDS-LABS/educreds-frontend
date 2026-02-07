import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  Loader2,
  Coins,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

// Supported cryptocurrencies
export type CryptoCurrency = 'ETH' | 'USDC' | 'USDT' | 'BTC';

interface CryptoPaymentProps {
  planId: string;
  planName: string;
  amount: number;
  currency?: string;
  onSuccess?: (transaction: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

const CRYPTO_ICONS: Record<CryptoCurrency, React.ReactNode> = {
  ETH: <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Ξ</div>,
  USDC: <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">$</div>,
  USDT: <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">$</div>,
  BTC: <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">₿</div>,
};

export function CryptoPayment({
  planId,
  planName,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
}: CryptoPaymentProps) {
  const { toast } = useToast();
  
  // Safely get AppKit hooks with fallback
  let open: (() => void) | undefined;
  let isConnected = false;
  let address: string | undefined;
  
  try {
    const appKit = useAppKit();
    open = appKit.open;
  } catch (error) {
    console.warn('AppKit not initialized. Crypto payment will not be available.', error);
  }
  
  try {
    const account = useAppKitAccount();
    isConnected = account.isConnected;
    address = account.address;
  } catch (error) {
    console.warn('AppKit account hook failed', error);
  }
  
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('USDC');
  const [paymentAddress, setPaymentAddress] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'processing' | 'confirmed' | 'failed'>('idle');

  // Initialize payment
  useEffect(() => {
    const initializePayment = async () => {
      if (!isConnected || !address) return;

      try {
        setIsLoading(true);
        const response = await api.createCryptoPayment({
          planId,
          cryptoCurrency: selectedCrypto,
          walletAddress: address,
        });
        
        setPaymentAddress(response.paymentAddress);
        setPaymentAmount(response.amountInCrypto);
      } catch (err: any) {
        setPaymentStatus('failed');
        onError?.(new Error(err.message || 'Failed to initialize crypto payment'));
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [planId, selectedCrypto, address, isConnected]);

  const handleConnectWallet = async () => {
    if (!open) {
      toast({
        title: 'Wallet Not Available',
        description: 'Crypto payment provider is not initialized. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await open();
    } catch (err) {
      toast({
        title: 'Connection Error',
        description: 'Failed to open wallet connection',
        variant: 'destructive',
      });
    }
  };

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(paymentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitTransaction = async () => {
    if (!transactionHash) {
      toast({
        title: 'Transaction Required',
        description: 'Please enter your transaction hash',
        variant: 'destructive',
      });
      return;
    }

    setPaymentStatus('processing');

    try {
      const response = await api.confirmCryptoPayment({
        planId,
        transactionHash,
        cryptoCurrency: selectedCrypto,
        walletAddress: address || '',
      });

      setPaymentStatus('confirmed');

      toast({
        title: 'Payment Submitted',
        description: 'Your transaction is being confirmed. Subscription will be activated shortly.',
      });

      onSuccess?.(response);
    } catch (err: any) {
      setPaymentStatus('failed');
      onError?.(new Error(err.message || 'Failed to confirm payment'));
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your Web3 wallet to pay with cryptocurrency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount to pay:</span>
              <span className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                }).format(amount)}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {planName} Plan - Monthly Subscription
            </div>
          </div>

          <Button onClick={handleConnectWallet} className="w-full">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>

          <Button variant="outline" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'confirmed') {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Payment Submitted!
          </h3>
          <p className="text-green-700">
            Your {planName} subscription will be activated once the transaction is confirmed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Cryptocurrency Payment
        </CardTitle>
        <CardDescription>
          Send crypto to the address below to complete your subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Wallet Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-blue-900 font-medium">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Crypto Selection */}
        <div className="space-y-2">
          <Label>Select Cryptocurrency</Label>
          <div className="flex gap-2">
            {(['USDC', 'USDT', 'ETH'] as CryptoCurrency[]).map((crypto) => (
              <Button
                key={crypto}
                variant={selectedCrypto === crypto ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCrypto(crypto)}
                className="flex items-center gap-2"
              >
                {CRYPTO_ICONS[crypto]}
                {crypto}
              </Button>
            ))}
          </div>
        </div>

        {/* Amount Display */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount to pay:</span>
            <span className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
              }).format(amount)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-500">In {selectedCrypto}:</span>
            <span className="font-mono text-lg">{paymentAmount || 'Loading...'}</span>
          </div>
        </div>

        {/* Payment Address */}
        <div className="space-y-2">
          <Label>Send to this address</Label>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex gap-2">
              <Input
                value={paymentAddress}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopyAddress}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Only send {selectedCrypto} to this address. Other tokens may be lost.
          </p>
        </div>

        {/* Transaction Hash Input */}
        <div className="space-y-2">
          <Label>Transaction Hash</Label>
          <Input
            placeholder="0x..."
            value={transactionHash}
            onChange={(e) => setTransactionHash(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Paste your transaction hash after sending
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmitTransaction}
            disabled={!transactionHash || paymentStatus === 'processing'}
          >
            {paymentStatus === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>Confirm Payment</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CryptoPayment;