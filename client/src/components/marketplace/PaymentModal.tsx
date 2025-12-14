import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentModalProps {
  templateName: string;
  price: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentModal({ templateName, price, currency, onSuccess, onCancel }: PaymentModalProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, we'll always succeed
    // In a real implementation, you'd integrate with Stripe, PayPal, etc.
    
    toast({
      title: 'Payment Successful!',
      description: `Successfully purchased "${templateName}" for $${price} ${currency}`,
    });
    
    setProcessing(false);
    onSuccess();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Purchase
          </CardTitle>
          <CardDescription>
            Purchase "{templateName}" for ${price} {currency}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                  maxLength={19}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="card-name">Cardholder Name</Label>
                <Input
                  id="card-name"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                />
              </div>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="text-center py-8">
              <div className="text-blue-600 text-lg font-semibold mb-2">PayPal</div>
              <p className="text-gray-600">You will be redirected to PayPal to complete your payment.</p>
            </div>
          )}

          {paymentMethod === 'crypto' && (
            <div className="text-center py-8">
              <div className="text-orange-600 text-lg font-semibold mb-2">Cryptocurrency</div>
              <p className="text-gray-600">Scan the QR code to pay with your wallet.</p>
              <div className="flex justify-center my-4">
                <QRCodeSVG value={`ethereum:0x1234567890123456789012345678901234567890?value=${price}`} />
              </div>
              <p className="text-sm text-gray-500">
                Send {price} {currency} to the address above.
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Pay ${price} {currency}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
