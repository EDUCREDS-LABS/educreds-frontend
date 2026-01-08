import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Database, 
  Upload, 
  Search, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  Download,
  RefreshCw,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOracleSnapshots, useInstitutionSearch, useOracleUpload } from "@/hooks/useOracle";
import { oracleService } from "@/services/oracleService";

interface AccreditationSnapshot {
  id: string;
  snapshotHash: string;
  recordCount: number;
  createdAt: string;
  uploadedBy: string;
  description?: string;
  isActive: boolean;
}

interface InstitutionProfile {
  walletAddress: string;
  name: string;
  accreditationStatus: 'ACCREDITED' | 'PROVISIONAL' | 'UNVERIFIED';
  trustScore: number;
  oracleMatch: boolean;
  manualOverride?: {
    status: string;
    reason: string;
    adminId: string;
    createdAt: string;
  };
  submittedDocuments: number;
  lastUpdated: string;
}

export default function OracleManagement() {
  const { snapshots, loading, refetch } = useOracleSnapshots();
  const { profile: institutionProfile, loading: searchLoading, searchInstitution } = useInstitutionSearch();
  const { uploading, uploadFile } = useOracleUpload();
  
  const [searchAddress, setSearchAddress] = useState("");
  const [uploadModal, setUploadModal] = useState(false);
  const [overrideModal, setOverrideModal] = useState(false);
  const [uploadFileState, setUploadFileState] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [overrideData, setOverrideData] = useState({
    status: 'ACCREDITED' as const,
    reason: ''
  });
  const { toast } = useToast();

  const handleFileUpload = async () => {
    if (!uploadFileState) return;

    const success = await uploadFile(uploadFileState, uploadDescription);
    if (success) {
      setUploadModal(false);
      setUploadFileState(null);
      setUploadDescription("");
      refetch();
    }
  };

  const handleManualOverride = async () => {
    if (!institutionProfile || !overrideData.reason.trim()) return;

    try {
      await oracleService.manualOverride(
        institutionProfile.walletAddress,
        overrideData.status,
        overrideData.reason
      );
      
      toast({
        title: "Success",
        description: "Institution status overridden successfully"
      });
      
      setOverrideModal(false);
      setOverrideData({ status: 'ACCREDITED', reason: '' });
      searchInstitution(institutionProfile.walletAddress);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to override institution status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCREDITED':
        return <Badge className="bg-green-100 text-green-800">Accredited</Badge>;
      case 'PROVISIONAL':
        return <Badge className="bg-yellow-100 text-yellow-800">Provisional</Badge>;
      case 'UNVERIFIED':
        return <Badge variant="destructive">Unverified</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Oracle Management</h2>
          <p className="text-gray-400">Manage NCHE accreditation data and institution verification</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setUploadModal(true)} size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload NCHE Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Total Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{snapshots.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Active Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {snapshots.find(s => s.isActive)?.recordCount || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Last Update</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white">
              {snapshots[0] ? new Date(snapshots[0].createdAt).toLocaleDateString() : 'Never'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-white">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Institution Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Institution Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter wallet address..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && searchInstitution(searchAddress)}
            />
            <Button onClick={() => searchInstitution(searchAddress)} disabled={searchLoading}>
              {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </div>

          {institutionProfile && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-white">{institutionProfile.name}</h4>
                  <p className="text-sm text-gray-400">{institutionProfile.walletAddress}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(institutionProfile.accreditationStatus)}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setOverrideModal(true)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Override
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Trust Score:</span>
                  <div className="font-semibold text-white">{institutionProfile.trustScore}/100</div>
                </div>
                <div>
                  <span className="text-gray-400">Oracle Match:</span>
                  <div className="font-semibold text-white">
                    {institutionProfile.oracleMatch ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Documents:</span>
                  <div className="font-semibold text-white">{institutionProfile.submittedDocuments}</div>
                </div>
                <div>
                  <span className="text-gray-400">Last Updated:</span>
                  <div className="font-semibold text-white">
                    {new Date(institutionProfile.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {institutionProfile.manualOverride && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Manual Override Active:</strong> {institutionProfile.manualOverride.reason}
                    <br />
                    <small>By {institutionProfile.manualOverride.adminId} on {new Date(institutionProfile.manualOverride.createdAt).toLocaleDateString()}</small>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snapshots List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            NCHE Data Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No NCHE data snapshots found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${snapshot.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <div>
                      <div className="font-medium text-white">
                        Snapshot #{snapshot.snapshotHash.substring(0, 8)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {snapshot.recordCount} records • {new Date(snapshot.createdAt).toLocaleDateString()}
                      </div>
                      {snapshot.description && (
                        <div className="text-xs text-gray-500">{snapshot.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {snapshot.isActive && (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                    <span className="text-xs text-gray-400">by {snapshot.uploadedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={uploadModal} onOpenChange={setUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload NCHE Data</DialogTitle>
            <DialogDescription>
              Upload a CSV file containing NCHE accreditation data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFileState(e.target.files?.[0] || null)}
              />
            </div>
            
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Describe this data upload..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={!uploadFileState || uploading}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Modal */}
      <Dialog open={overrideModal} onOpenChange={setOverrideModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Status Override</DialogTitle>
            <DialogDescription>
              Manually override the accreditation status for {institutionProfile?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={overrideData.status} onValueChange={(value: any) => 
                setOverrideData(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCREDITED">Accredited</SelectItem>
                  <SelectItem value="PROVISIONAL">Provisional</SelectItem>
                  <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Reason for Override</Label>
              <Textarea
                placeholder="Explain why this override is necessary..."
                value={overrideData.reason}
                onChange={(e) => setOverrideData(prev => ({ ...prev, reason: e.target.value }))}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualOverride} 
              disabled={!overrideData.reason.trim()}
              variant="destructive"
            >
              <Shield className="w-4 h-4 mr-2" />
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}