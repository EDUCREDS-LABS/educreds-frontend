import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Key, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Zap,
  Shield,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/hooks/useAuth";

interface BatchSigningStatus {
  enabled: boolean;
  message: string;
}

export default function BatchSigningSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<BatchSigningStatus | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Institution ID is stored in 'id' field for institution users
  const institutionId = user?.id;

  useEffect(() => {
    fetchStatus();
  }, [institutionId]);

  const fetchStatus = async () => {
    if (!institutionId) return;

    try {
      const token = localStorage.getItem('institution_token') || localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.CERT}/api/institutions/${institutionId}/batch-signing/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch batch signing status:", error);
    }
  };

  const handleStoreKey = async () => {
    if (!privateKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your private key",
        variant: "destructive",
      });
      return;
    }

    if (!privateKey.startsWith("0x")) {
      toast({
        title: "Invalid Format",
        description: "Private key must start with 0x",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('institution_token') || localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.CERT}/api/institutions/${institutionId}/batch-signing/store-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ privateKey }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setPrivateKey("");
        setShowKey(false);
        fetchStatus();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to store private key",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to store private key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!confirm("Are you sure you want to remove your stored private key? This will disable automatic batch signing.")) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('institution_token') || localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.CERT}/api/institutions/${institutionId}/batch-signing/remove-key`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchStatus();
        setTestResult(null);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to remove private key",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove private key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const token = localStorage.getItem('institution_token') || localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.CERT}/api/institutions/${institutionId}/batch-signing/test-key`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast({
          title: "Test Successful",
          description: "Your stored private key is valid and ready to use",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.message || "Private key test failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to test private key",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <CardTitle>Batch Signing (Automatic)</CardTitle>
          </div>
          {status?.enabled ? (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Disabled
            </Badge>
          )}
        </div>
        <CardDescription>
          Store your private key securely to enable automatic batch signing for bulk certificate issuance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>What is Batch Signing?</strong>
            <p className="mt-1 text-sm">
              When enabled, bulk certificate issuance (100+ certificates) will be signed automatically using your stored private key. 
              This eliminates the need for manual signatures and reduces processing time from 15-20 minutes to 2-3 minutes.
            </p>
          </AlertDescription>
        </Alert>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
              <Zap className="w-4 h-4" />
              6-8x Faster
            </div>
            <p className="text-sm text-blue-600">
              Process 100 certificates in 2-3 minutes instead of 15-20 minutes
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
              <CheckCircle className="w-4 h-4" />
              Zero Manual Signatures
            </div>
            <p className="text-sm text-green-600">
              No need to sign each transaction manually - fully automated
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
              <Shield className="w-4 h-4" />
              Secure Encryption
            </div>
            <p className="text-sm text-purple-600">
              Your key is encrypted with AES-256-GCM military-grade encryption
            </p>
          </div>
        </div>

        {!status?.enabled ? (
          <>
            {/* Store Private Key */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="privateKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Institution Private Key
                </Label>
                <div className="relative">
                  <Input
                    id="privateKey"
                    type={showKey ? "text" : "password"}
                    placeholder="0x..."
                    value={privateKey}
                    onChange={(e) => {
                      let value = e.target.value.trim();
                      // Remove 0x if present, then add it back to normalize
                      if (value.startsWith('0x') || value.startsWith('0X')) {
                        value = value.slice(2);
                      }
                      // Only add 0x if there's actual content
                      setPrivateKey(value ? `0x${value}` : '');
                    }}
                    className="font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showKey ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-600">
                  Export your private key from MetaMask: Account Details → Show Private Key
                </p>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Warning:</strong> Your private key will be encrypted and stored securely. 
                  Never share your private key with anyone. You can remove it anytime.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleStoreKey} 
                disabled={loading || !privateKey.trim()}
                className="w-full"
              >
                {loading ? "Storing..." : "Enable Batch Signing"}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Key Stored - Show Status */}
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {status.message}
                </AlertDescription>
              </Alert>

              {/* Test Result */}
              {testResult && (
                <Alert className={testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    <strong>{testResult.success ? "Test Passed" : "Test Failed"}</strong>
                    <p className="mt-1">{testResult.message}</p>
                    {testResult.walletAddress && (
                      <p className="mt-1 font-mono text-xs">{testResult.walletAddress}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestKey} 
                  disabled={testing}
                  variant="outline"
                  className="flex-1"
                >
                  {testing ? "Testing..." : "Test Key"}
                </Button>
                <Button 
                  onClick={handleRemoveKey} 
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading ? "Removing..." : "Remove Key"}
                </Button>
              </div>

              {/* Usage Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>How to use:</strong> When you perform bulk certificate issuance, 
                  the system will automatically use your stored key to sign all transactions. 
                  No manual intervention required!
                </p>
              </div>
            </div>
          </>
        )}

        {/* Security Info */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Features
          </h4>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li>• AES-256-GCM encryption (military-grade)</li>
            <li>• Unique encryption key per institution</li>
            <li>• Keys only decrypted in memory during signing</li>
            <li>• Can be removed anytime</li>
            <li>• Audit trail of all key operations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
