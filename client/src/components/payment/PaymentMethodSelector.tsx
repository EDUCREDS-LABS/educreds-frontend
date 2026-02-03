import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, Bitcoin, Landmark, Check, Shield, Lock } from 'lucide-react';

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
  const [hoveredMethod, setHoveredMethod] = useState<PaymentMethodType | null>(null);

  const selectedPaymentMethod = paymentMethods.find((m) => m.id === selectedMethod);

  return (
    <div className="space-y-4">
      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <Shield className="w-5 h-5 text-green-600" />
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800 font-medium">
            Secure Payment Processing
          </span>
        </div>
        <span className="text-xs text-green-600">256-bit SSL Encryption</span>
      </div>

      {/* Payment Method Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`relative cursor-pointer transition-all duration-200 ${
              selectedMethod === method.id
                ? 'border-2 border-primary ring-2 ring-primary/20'
                : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
            } ${!method.available ? 'opacity-60 cursor-not-allowed' : ''} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => {
              if (method.available && !disabled) {
                onSelect(method.id);
              }
            }}
            onMouseEnter={() => setHoveredMethod(method.id)}
            onMouseLeave={() => setHoveredMethod(null)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedMethod === method.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {method.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm text-gray-900">
                      {method.name}
                    </h3>
                    {selectedMethod === method.id && (
                      <Badge variant="default" className="bg-primary">
                        <Check className="w-3 h-3" />
                      </Badge>
                    )}
                    {!method.available && (
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {method.description}
                  </p>
                  
                  {showFees && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {method.processingTime}
                      </Badge>
                      {method.id !== 'bank_transfer' && (
                        <Badge variant="outline" className="text-xs">
                          {method.fees}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Method Details */}
      {selectedPaymentMethod && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-primary">{selectedPaymentMethod.icon}</div>
              <div>
                <p className="font-medium text-sm">
                  Selected: {selectedPaymentMethod.name}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedPaymentMethod.processingTime} · {selectedPaymentMethod.fees}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PaymentMethodSelector;