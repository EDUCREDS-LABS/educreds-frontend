import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, QrCode, Share2 } from 'lucide-react';

interface CertificateShareProps {
  certificateId: string;
}

export function CertificateShare({ certificateId }: CertificateShareProps) {
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadShareData();
  }, [certificateId]);

  const loadShareData = async () => {
    try {
      const methods = await api.getShareMethods(certificateId);
      setShareData(methods);
    } catch (error) {
      console.error('Failed to load share data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    const value = String(text ?? '').trim();
    if (!value) return;

    const fallbackCopy = (content: string) => {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const success = fallbackCopy(value);
        if (!success) throw new Error('Clipboard API unavailable');
      }
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      const success = fallbackCopy(value);
      if (success) {
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
      } else {
        console.error('Failed to copy text to clipboard:', error);
      }
    }
  };

  const downloadW3CCredential = async () => {
    try {
      const sharePackage = await api.getSharePackage(certificateId);
      const blob = new Blob([JSON.stringify(sharePackage.w3cCredential, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credential-${certificateId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download credential:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading sharing options...</div>;
  }

  if (!shareData) {
    return <div className="p-4">Failed to load sharing options</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Share Your Certificate</h2>
        <p className="text-gray-600">Choose how you want to share your credential</p>
      </div>

      {/* W3C Verifiable Credential */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            W3C Verifiable Credential
            <Badge variant="secondary">Recommended</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{shareData.w3c.instructions}</p>
          <div className="flex gap-2">
            <Button 
              onClick={downloadW3CCredential}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
            <Button 
              variant="outline"
              onClick={() => copyToClipboard(JSON.stringify(shareData.w3c.data), 'w3c')}
            >
              <Copy className="h-4 w-4" />
              {copied === 'w3c' ? 'Copied!' : 'Copy JSON'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{shareData.qr.instructions}</p>
          <div className="flex flex-col items-center gap-4">
            <img 
              src={shareData.qr.data} 
              alt="Certificate QR Code"
              className="w-48 h-48 border rounded"
            />
            <Button 
              variant="outline"
              onClick={() => copyToClipboard(shareData.url.data, 'url')}
            >
              <Copy className="h-4 w-4" />
              {copied === 'url' ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legacy Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Traditional Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{shareData.legacy.instructions}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Certificate Number</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                  {shareData.legacy.data.certificateNumber}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(shareData.legacy.data.certificateNumber, 'cert')}
                >
                  {copied === 'cert' ? '✓' : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">IPFS Hash</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate">
                  {shareData.legacy.data.ipfsHash}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(shareData.legacy.data.ipfsHash, 'ipfs')}
                >
                  {copied === 'ipfs' ? '✓' : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            {shareData.legacy.data.tokenId && (
              <div>
                <label className="text-sm font-medium">Token ID</label>
                <div className="flex items-center gap-2 mt-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    {shareData.legacy.data.tokenId}
                </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(shareData.legacy.data.tokenId.toString(), 'token')}
                  >
                    {copied === 'token' ? '✓' : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
