import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, Bitcoin, Landmark, Check, Shield, Lock, ChevronDown, ChevronUp } from 'lucide-react';

export type PaymentMethodType = 'stripe' | 'paypal' | 'crypto' | 'bank_transfer';

export interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  processingTime: string;
  fees: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelect: (method: PaymentMethodType) => void;
  disabled?: boolean;
  showFees?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'stripe',
    name: 'Credit/Debit Card',
    description: 'Pay securely with Visa, Mastercard, American Express, or Discover',
    icon: <CreditCard className="w-6 h-6" />,
    available: true,
    processingTime: 'Instant',
    fees: 'Standard card processing fees apply',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Fast and secure checkout with your PayPal account',
    icon: <Wallet className="w-6 h-6" />,
    available: true,
    processingTime: 'Instant',
    fees: 'No additional fees',
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Pay with USDC, USDT, ETH, or BTC',
    icon: <Bitcoin className="w-6 h-6" />,
    available: true,
    processingTime: 'Network confirmation required',
    fees: 'Blockchain gas fees apply',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer or wire (Enterprise only)',
    icon: <Landmark className="w-6 h-6" />,
    available: false,
    processingTime: '1-3 business days',
    fees: 'Contact sales',
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  disabled = false,
  showFees = true,
}: PaymentMethodSelectorProps) {
  const availableMethods = paymentMethods.filter((m) => m.available);

  return (
    <div className="space-y-6">
      {/* Payment Method Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => {
              if (method.available && !disabled) {
                onSelect(method.id);
              }
            }}
            disabled={!method.available || disabled}
            className={cn(
              "flex flex-col items-start gap-4 p-6 rounded-[24px] border-2 transition-all duration-300 w-full text-left",
              selectedMethod === method.id
                ? "bg-white border-primary shadow-2xl shadow-primary/10 ring-1 ring-primary/20"
                : "bg-neutral-50 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100",
              !method.available && "opacity-50 cursor-not-allowed grayscale"
            )}
          >
            <div className={cn(
              "size-12 rounded-2xl flex items-center justify-center transition-colors",
              selectedMethod === method.id ? "bg-primary text-white" : "bg-white text-neutral-500 shadow-sm"
            )}>
              {method.icon}
            </div>
            <div className="space-y-1">
              <h3 className={cn("font-black text-sm uppercase tracking-widest", selectedMethod === method.id ? "text-primary" : "text-neutral-900")}>
                {method.name}
              </h3>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
                {method.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PaymentMethodSelector;