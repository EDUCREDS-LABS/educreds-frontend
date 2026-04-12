import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Shield } from "lucide-react";

interface OtpInputProps {
  email: string;
  type: 'register' | 'login';
  onVerify: (otp: string, otpToken: string) => void;
  onResend: () => Promise<{ otpToken: string }>;
  isLoading?: boolean;
  otpToken?: string;
}

export default function OtpInput({ email, type, onVerify, onResend, isLoading, otpToken: propOtpToken }: OtpInputProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState(propOtpToken || '');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update token when prop changes
  useEffect(() => {
    if (propOtpToken) {
      setOtpToken(propOtpToken);
    }
  }, [propOtpToken]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = (currentOtp?: string[]) => {
    const otpCode = (currentOtp || otp).join('');
    if (otpCode.length === 6 && otpToken) {
      onVerify(otpCode, otpToken);
    }
  };

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all digits are filled
    if (newOtp.every(digit => digit !== "") && newOtp.length === 6) {
      handleVerify(newOtp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    
    pastedData.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newOtp[index] = char;
      }
    });

    setOtp(newOtp);
    
    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();

    if (newOtp.every(digit => digit !== "") && newOtp.length === 6) {
      handleVerify(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await onResend();
      setOtpToken(result.otpToken);
      setTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Verify Your Email</h3>
        <p className="text-sm text-neutral-600">
          We've sent a 6-digit code to <strong>{email}</strong>
          {type === 'register' && <><br />Complete your registration by entering the code below.</>}
        </p>
      </div>

      <div className="flex justify-center space-x-2">
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1} of 6`}
            aria-setsize={6}
            aria-posinset={index + 1}
            className="w-12 h-12 text-center text-lg font-semibold"
            disabled={isLoading}
          />
        ))}
      </div>

      <div className="text-center space-y-3">
        <Button
          onClick={handleVerify}
          disabled={otp.join('').length !== 6 || !otpToken || isLoading}
          className="w-full h-11"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Code
        </Button>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-neutral-600">
          <Shield className="w-4 h-4" />
          <span>Code expires in {formatTime(timeLeft)}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={timeLeft > 0 || isResending}
          className="text-primary hover:text-primary/80"
        >
          {isResending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend Code'}
        </Button>
      </div>
    </div>
  );
}