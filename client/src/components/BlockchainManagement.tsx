import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Network, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  RefreshCw,
  Users,
  Shield,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface BlockchainSummary {
  totalInstitutions: number;
  verifiedInstitutions: number;
  blockchainRegistered: number;
  blockchainAuthorized: number;
  pendingBlockchainRegistration: number;
  pendingBlockchainAuthorization: number;
}

interface InstitutionBlockchainStatus {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  backendVerified: boolean;
  blockchainRegistered: boolean;
  blockchainAuthorized: boolean;
  blockchainStats: any;
  blockchainError: string | null;
  blockchainTxHash?: string;
  blockchainAuthTxHash?: string;
  blockchainRegistrationDate?: string;
  blockchainAuthorizationDate?: string;
}

export default function BlockchainManagement() {
  const [summary, setSummary] = useState<BlockchainSummary | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionBlockchainStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionBlockchainStatus | null>(null);
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState<'register' | 'authorize'>('register');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      const [summaryData, institutionsData] = await Promise.all([
        api.getBlockchainSummary(),
        api.getBlockchainStatusAll()
      ]);
      
      setSummary(summaryData.summary);
      setInstitutions(institutionsData.statusReport || []);
    } catch (error: any) {
      console.error('Failed to fetch blockchain data:', error);
      toast({
        title: "Error",
        description: "Failed to load blockchain data. Please check your backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRegistration = async () => {
    try {
      setBulkLoading(true);
      const result = await api.bulkRegisterInstitutionsOnBlockchain();
      
      if (result.summary.errors > 0) {
        toast({
          title: "Bulk registration completed with errors",
          description: `Successfully processed ${result.summary.successful} institutions. ${result.summary.errors} errors occurred. Check the list below for details.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bulk registration completed successfully",
          description: `All ${result.summary.successful} institutions have been registered on blockchain.`,
        });
      }
      
      fetchBlockchainData();
    } catch (error: any) {
      toast({
        title: "Bulk registration failed",
        description: error.message || "An error occurred during bulk registration",
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleInstitutionAction = async () => {
    if (!selectedInstitution) return;

    try {
      setActionLoading(true);
      
      if (actionType === 'register') {
        await api.registerInstitutionOnBlockchain(selectedInstitution.id);
        toast({
          title: "Registration successful",
          description: `${selectedInstitution.name} has been registered on blockchain`,
        });
      } else {
        await api.authorizeInstitutionOnBlockchain(selectedInstitution.id);
        toast({
          title: "Authorization successful",
          description: `${selectedInstitution.name} has been authorized on blockchain`,
        });
      }
      
      setActionModal(false);
      fetchBlockchainData();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (institution: InstitutionBlockchainStatus) => {
    if (institution.blockchainError) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (institution.blockchainAuthorized) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Authorized</Badge>;
    }
    if (institution.blockchainRegistered) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Registered</Badge>;
    }
    if (institution.backendVerified) {
      return <Badge variant="outline">Pending Registration</Badge>;
    }
    return <Badge variant="outline" className="text-gray-500">Not Verified</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalInstitutions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.verifiedInstitutions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Registered</CardTitle>
            <Network className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.blockchainRegistered || 0}</div>
            {(summary?.pendingBlockchainRegistration || 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                {summary?.pendingBlockchainRegistration || 0} pending
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Authorized</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.blockchainAuthorized || 0}</div>
            {(summary?.pendingBlockchainAuthorization || 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                {summary?.pendingBlockchainAuthorization || 0} pending
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Blockchain Management
            <Badge variant="outline" className="ml-2">
              Sepolia Testnet
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleBulkRegistration}
              disabled={bulkLoading || (summary?.pendingBlockchainRegistration || 0) === 0}
              variant="outline"
            >
              {bulkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bulk Register ({summary?.pendingBlockchainRegistration || 0})
            </Button>
            
            <Button
              onClick={fetchBlockchainData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {(summary?.pendingBlockchainRegistration || 0) > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {summary?.pendingBlockchainRegistration || 0} verified institutions are not yet registered on blockchain.
                Use bulk registration to process them all at once.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Institutions List */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Blockchain Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {institutions.map((institution) => (
              <div
                key={institution.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{institution.name}</h4>
                    {getStatusBadge(institution)}
                  </div>
                  <p className="text-sm text-muted-foreground">{institution.email}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {institution.walletAddress}
                  </p>
                  {institution.blockchainError && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {institution.blockchainError}
                    </p>
                  )}
                  {institution.blockchainTxHash && (
                    <p className="text-xs text-green-600 mt-1">
                      Registration TX: {institution.blockchainTxHash.slice(0, 10)}...{institution.blockchainTxHash.slice(-8)}
                    </p>
                  )}
                  {institution.blockchainAuthTxHash && (
                    <p className="text-xs text-blue-600 mt-1">
                      Authorization TX: {institution.blockchainAuthTxHash.slice(0, 10)}...{institution.blockchainAuthTxHash.slice(-8)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {institution.backendVerified && !institution.blockchainRegistered && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInstitution(institution);
                        setActionType('register');
                        setActionModal(true);
                      }}
                    >
                      Register
                    </Button>
                  )}
                  
                  {institution.blockchainRegistered && !institution.blockchainAuthorized && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInstitution(institution);
                        setActionType('authorize');
                        setActionModal(true);
                      }}
                    >
                      Authorize
                    </Button>
                  )}
                  
                  {institution.blockchainTxHash && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`https://sepolia.etherscan.io/tx/${institution.blockchainTxHash}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {institutions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No institutions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={actionModal} onOpenChange={setActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'register' ? 'Register on Blockchain' : 'Authorize on Blockchain'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'register' 
                ? `Register ${selectedInstitution?.name} on the blockchain? This will create a transaction on the blockchain.`
                : `Authorize ${selectedInstitution?.name} on the blockchain? This will grant them permission to issue certificates.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInstitutionAction}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'register' ? 'Register' : 'Authorize'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
