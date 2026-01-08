import { useState, useEffect } from 'react';
import { oracleService, type OracleSnapshot, type InstitutionProfile } from '@/services/oracleService';
import { useToast } from '@/hooks/use-toast';

export function useOracleSnapshots() {
  const [snapshots, setSnapshots] = useState<OracleSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSnapshots = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await oracleService.getSnapshots();
      setSnapshots(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch snapshots';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  return { snapshots, loading, error, refetch: fetchSnapshots };
}

export function useInstitutionSearch() {
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchInstitution = async (walletAddress: string) => {
    if (!walletAddress.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await oracleService.getInstitutionProfile(walletAddress.trim());
      setProfile(data);
      if (!data) {
        toast({
          title: "Not Found",
          description: "Institution not found in Oracle database",
          variant: "destructive"
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, searchInstitution, clearProfile: () => setProfile(null) };
}

export function useOracleUpload() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, description?: string) => {
    setUploading(true);
    try {
      await oracleService.uploadNCHEData(file, description);
      toast({
        title: "Success",
        description: "NCHE data uploaded successfully"
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadFile };
}