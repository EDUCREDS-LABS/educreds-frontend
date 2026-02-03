import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

// PayPal client ID from environment
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

interface PayPalPaymentProps {
  planId: string;
  planName: string;
  amount: number;
  currency?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

const PayPalButtonWrapper: React.FC<PayPalPaymentProps> = ({
  planId,
  planName,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
}) => {
  const { toast } = useToast();
  const [{ isPending }] = usePayPalScriptReducer();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');

  const createOrder = async () => {
    try {
      const response = await api.createPayPalOrder({
        planId,
        amount,
        currency,
      });
      return response.orderId;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create PayPal order');
    }
  };

  const onApprove = async (data: any) => {
    setPaymentStatus('processing');
    
    try {
      const captureResponse = await api.capturePayPalOrder({
        orderId: data.orderID,
        planId,
      });

      setPaymentStatus('succeeded');

      toast({
        title: 'Payment Successful',
        description: `Your ${planName} subscription has been activated via PayPal.`,
      });

      onSuccess?.(captureResponse);
    } catch (err: any) {
      setPaymentStatus('failed');
      const error = new Error(err.message || 'PayPal payment capture failed');
      onError?.(error);
    }
  };

  if (paymentStatus === 'succeeded') {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Payment Successful!
          </h3>
          <p className="text-green-700">
            Your {planName} subscription is now active.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          PayPal Checkout
        </CardTitle>
        <CardDescription>
          You will be redirected to PayPal to complete your payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="text-sm text-gray-500 mt-1">
            {planName} Plan - Monthly Subscription
          </div>
        </div>

        {isPending && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading PayPal...</p>
          </div>
        )}

        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay',
            height: 45,
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => {
            const error = new Error('PayPal payment failed');
            onError?.(error);
          }}
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
};

export function PayPalPayment({
  planId,
  planName,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
}: PayPalPaymentProps) {
  if (!PAYPAL_CLIENT_ID) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          PayPal is not configured. Please add VITE_PAYPAL_CLIENT_ID to your environment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: currency,
        intent: 'capture',
      }}
    >
      <PayPalButtonWrapper
        planId={planId}
        planName={planName}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </PayPalScriptProvider>
  );
}

export default PayPalPayment;