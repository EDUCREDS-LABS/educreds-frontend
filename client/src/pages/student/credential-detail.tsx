import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { getStudentToken } from '@/lib/authStorage';
import { api } from '@/lib/api';
import ShareCredentialModal from '@/components/credentials/ShareCredentialModal';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type Credential = { id: string; courseName?: string; credentialType?: string; certificateType?: string; institutionName?: string; studentName?: string; grade?: string; issuedAt?: string; completionDate?: string; status?: string; isValid?: boolean; isFrozen?: boolean; isMinted?: boolean; anchorStatus?: string; badgeIpfsCid?: string; w3cCredentialIPFSHash?: string; tokenId?: string | number; blockchainTxHash?: string };
const badgeUrl = (cid?: string) => cid && /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]+)$/.test(cid) ? `https://gateway.pinata.cloud/ipfs/${cid}` : null;
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString() : 'Not available';

export default function StudentCredentialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const { toast } = useToast();
  // The student-owned list is the access gate: never render a certificate fetched from a public ID alone.
  const credential = useQuery<Credential | null>({ queryKey: ['student-credential-detail', id], enabled: !!id, queryFn: async () => {
    const token = getStudentToken();
    if (!token) throw new Error('Student session required');
    const response = await fetch(`${API_CONFIG.CERT}/student/credentials`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Unable to load your credentials');
    const payload = await response.json();
    const list: Credential[] = Array.isArray(payload) ? payload : payload?.certificates ?? [];
    return list.find(item => String(item.id) === id) ?? null;
  } });
  const pdf = useMutation({ mutationFn: () => api.downloadCredentialPDF(id!), onError: (error: Error) => toast({ title: 'Download failed', description: error.message, variant: 'destructive' }) });
  if (!id) return <p className="p-6">Credential ID is missing.</p>;
  if (credential.isLoading) return <div className="mx-auto max-w-4xl space-y-4 p-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (credential.isError) return <div role="alert" className="p-6">Could not load this credential. <Button onClick={() => credential.refetch()}>Try again</Button></div>;
  const c = credential.data;
  if (!c) return <div className="p-6">This credential is not in your wallet. <Link className="underline" to="/student/credentials">Back to wallet</Link></div>;
  const url = `${window.location.origin}/verify/${encodeURIComponent(id)}`;
  const image = badgeUrl(c.badgeIpfsCid);
  const revoked = c.isValid === false || c.status?.toLowerCase() === 'revoked';
  const frozen = c.isFrozen === true || c.status?.toLowerCase() === 'frozen';
  const active = !revoked && !frozen && (c.isMinted === true || c.anchorStatus === 'minted' || c.status?.toLowerCase() === 'active');
  const status = revoked ? 'Revoked' : frozen ? 'Frozen' : active ? 'Active' : 'Minting';
  const color = revoked ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200' : frozen ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200' : active ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200' : 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200';
  const txUrl = c.blockchainTxHash && /^0x[a-fA-F0-9]{64}$/.test(c.blockchainTxHash) ? `https://polygonscan.com/tx/${c.blockchainTxHash}` : null;
  return <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6"><Link className="text-sm underline" to="/student/credentials">← My credentials</Link>
    <Card><CardContent className="flex flex-col items-center gap-3 p-6 text-center">{image ? <img src={image} alt={`${c.credentialType || c.certificateType || 'Credential'} badge`} className="h-48 w-48 object-contain" /> : <div className="flex h-48 w-48 items-center justify-center rounded-full border text-muted-foreground">Badge image not available</div>}<h1 className="text-2xl font-semibold">{c.courseName || c.credentialType || 'Credential'}</h1><p className="text-muted-foreground">{c.institutionName || 'Institution not available'}</p></CardContent></Card>
    <div role="status" className={`rounded-lg border p-4 ${color}`}><strong>{status}</strong><p className="text-sm">{revoked ? 'This credential has been permanently invalidated.' : frozen ? 'This credential has been temporarily suspended by the issuing institution.' : active ? 'This credential is active and can be shared for verification.' : 'This credential is being secured on the blockchain.'}</p></div>
    <Card><CardHeader><CardTitle>Credential information</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">{[['Institution', c.institutionName], ['Course', c.courseName], ['Type', c.credentialType || c.certificateType], ['Grade', c.grade], ['Issued', date(c.issuedAt)], ['Completion date', date(c.completionDate)], ['Student', c.studentName]].map(([label, value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p>{value || 'Not available'}</p></div>)}</CardContent></Card>
    <Card><CardContent className="space-y-3 p-5"><details><summary className="cursor-pointer font-semibold">Verification proof</summary><div className="mt-4 space-y-3 text-sm"><p>Issuer signature: Not available from this response</p><p className="break-all">Document integrity (IPFS CID): {c.w3cCredentialIPFSHash || 'Not available'}</p><p>On-chain: {c.tokenId != null ? `Token #${c.tokenId}` : 'Not available'} {txUrl && <a href={txUrl} target="_blank" rel="noopener noreferrer" className="underline">View transaction ↗</a>}</p><p>Institution standing: Not available from this response</p></div></details></CardContent></Card>
    <div className="flex flex-col gap-3 sm:flex-row"><Button disabled={pdf.isPending || !active} onClick={() => pdf.mutate()}>{pdf.isPending ? 'Downloading…' : 'Download PDF'}</Button><Button variant="outline" onClick={() => setShareOpen(true)}>Share</Button><Button variant="outline" onClick={() => setQrOpen(true)}>Show QR</Button></div>
    <ShareCredentialModal open={shareOpen} onOpenChange={setShareOpen} verificationUrl={url} credentialTitle={c.courseName || c.credentialType} badgeImageUrl={image || undefined} />
    <Dialog open={qrOpen} onOpenChange={setQrOpen}><DialogContent className="flex flex-col items-center"><DialogHeader><DialogTitle>Scan to verify credential</DialogTitle></DialogHeader><div className="rounded-lg bg-white p-3"><QRCodeSVG value={url} size={240} level="M" /></div><p className="break-all text-center text-xs text-muted-foreground">{url}</p></DialogContent></Dialog>
  </main>;
}
