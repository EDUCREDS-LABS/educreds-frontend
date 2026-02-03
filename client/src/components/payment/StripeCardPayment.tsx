import React, { useState, useEffect } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Lock, Shield, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

// Stripe public key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

export function getStripe(): Promise<any> | null {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stripe = getStripe();
  
  if (!stripe) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your environment.
        </AlertDescription>
      </Alert>
    );
  }

  const options: StripeElementsOptions = {
    mode: 'subscription',
    currency: 'usd',
    amount: 0,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0f172a',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
    },
  };

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  );
};

interface StripeCardPaymentProps {
  planId: string;
  planName: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      '::placeholder': {
        color: '#94a3b8',
      },
      padding: '12px',
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

export const StripeCardPaymentForm: React.FC<StripeCardPaymentProps> = ({
  planId,
  planName,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');

  // Create payment intent on mount
  useEffect(() => {
    const createPaymentIntent = async (): Promise<void> => {
      try {
        const response = await api.createStripePaymentIntent({
          planId,
          amount,
          currency: currency.toLowerCase(),
        });
        setClientSecret(response.clientSecret);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [planId, amount, currency]);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: cardholderName,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('succeeded');
        
        await api.confirmSubscriptionPayment({
          planId,
          paymentIntentId: paymentIntent.id,
          paymentMethod: 'stripe',
        });

        toast({
          title: 'Payment Successful',
          description: `Your ${planName} subscription has been activated.`,
        });

        onSuccess?.(paymentIntent);
      } else {
        throw new Error('Payment status is not successful');
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setError(err.message || 'An unexpected error occurred');
      onError?.(err);
      
      toast({
        title: 'Payment Failed',
        description: err.message || 'Please try again or use a different payment method.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardChange = (event: any): void => {
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Card Payment Details
          </CardTitle>
          <CardDescription>
            Secure payment processed by Stripe
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

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">
              Cardholder Name
            </Label>
            <Input
              id="cardholderName"
              placeholder="John Doe"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Card Element */}
          <div className="space-y-2">
            <Label htmlFor="card-element">
              Card Details
            </Label>
            <div className="p-3 border rounded-md bg-white">
              <CardElement
                id="card-element"
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardChange}
              />
            </div>
            <p className="text-xs text-gray-500">
              We accept Visa, Mastercard, American Express, and Discover
            </p>
          </div>

          {/* Security Indicators */}
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700">PCI Compliant</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!stripe || !elements || !clientSecret || isLoading || !cardholderName}
            >
              {isLoading ? (
                <>
                  <Skeleton className="w-4 h-4 mr-2 rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                }).format(amount)}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default StripeCardPaymentForm;