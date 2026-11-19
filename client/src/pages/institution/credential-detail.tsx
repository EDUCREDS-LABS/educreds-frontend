import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Clock3, Loader2, XCircle, Copy, ExternalLink } from 'lucide-react';
import { CredentialActions } from '@/components/institution/CredentialActions';
import { credentialState } from '@/components/institution/CredentialStatusBadge';

type Step = { step: string; status: string; ipfsCid?: string | null; lastError?: string | null; attempts?: number; completedAt?: string | null };
type Pipeline = { certificateId: string; overallStatus: string; steps: Step[]; certificate: { isMinted: boolean; tokenId?: string | number | null; blockchainTxHash?: string | null; badgeIpfsCid?: string | null } };
const labels: Record<string, string> = { ipfs_did: 'DID upload', ipfs_metadata: 'Metadata upload', ipfs_credential: 'W3C credential upload', blockchain_mint: 'Blockchain mint' };
const badgeUrl = (cid?: string | null) => cid && /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]+)$/.test(cid) ? `https://gateway.pinata.cloud/ipfs/${cid}` : null;
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString() : 'Not available';

export default function InstitutionCredentialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const client = useQueryClient();
  const pipeline = useQuery<Pipeline>({ queryKey: ['credential-pipeline', id], queryFn: () => api.getCredentialPipeline(id!), enabled: !!id, refetchInterval: query => query.state.data?.steps.some(s => s.status === 'pending' || s.status === 'processing') ? 5000 : false });
  const certificates = useQuery({ queryKey: ['institution-credential-detail-list'], queryFn: () => api.getCertificates({ limit: 500 }), enabled: !!id });
  const credential = certificates.data?.certificates?.find((c: any) => String(c.id) === id) as Record<string, any> | undefined;
  const retry = useMutation({ mutationFn: (step: string) => api.retryAnchorJob(id!, step), onSuccess: () => { client.invalidateQueries({ queryKey: ['credential-pipeline', id] }); toast({ title: 'Retry queued' }); }, onError: (error: Error) => toast({ title: 'Could not retry', description: error.message, variant: 'destructive' }) });
  const pdf = useMutation({ mutationFn: () => api.downloadCredentialPDF(id!), onError: (error: Error) => toast({ title: 'Download failed', description: error.message, variant: 'destructive' }) });
  if (!id) return <p className="p-6">Credential ID is missing.</p>;
  if (pipeline.isLoading) return <div className="space-y-4 p-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (pipeline.isError) return <div role="alert" className="p-6">Unable to load pipeline. <Button onClick={() => pipeline.refetch()}>Try again</Button></div>;
  const data = pipeline.data!;
  const image = badgeUrl(data.certificate.badgeIpfsCid);
  const tx = data.certificate.blockchainTxHash;
  const chainUrl = tx && /^0x[a-fA-F0-9]{64}$/.test(tx) ? `${import.meta.env.VITE_NETWORK === 'mainnet' ? 'https://basescan.org' : 'https://sepolia.basescan.org'}/tx/${tx}` : null;
  const statusClass = data.overallStatus === 'active' ? 'text-green-700 dark:text-green-300' : data.overallStatus === 'failed' ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300';
  return <div className="mx-auto max-w-5xl space-y-6" data-testid="credential-detail">
    <Link className="text-sm underline" to="/institution/certificates">← Back to credentials</Link>
    <header><h1 className="text-2xl font-semibold">{credential?.courseName || credential?.credentialType || 'Credential detail'}</h1><p>{credential?.studentName || 'Student name not available'} · <span className={statusClass}>{data.overallStatus}</span></p></header>
    <div className="grid gap-6 md:grid-cols-[240px_1fr]"><Card><CardContent className="flex min-h-60 items-center justify-center p-6">{image ? <img src={image} alt={`${credential?.credentialType || 'Credential'} badge`} className="h-48 w-48 object-contain" /> : <span className="text-center text-muted-foreground">Badge image not available</span>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Credential information</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{[['Student', credential?.studentName], ['Course', credential?.courseName], ['Type', credential?.credentialType || credential?.certificateType], ['Grade', credential?.grade], ['Issued', date(credential?.issuedAt)], ['Completion date', date(credential?.completionDate)]].map(([label, value]) => <div key={label}><div className="text-sm text-muted-foreground">{label}</div><div className="break-words">{value || 'Not available'}</div></div>)}</CardContent></Card></div>
    {credential && <CredentialActions id={id} state={credentialState(credential)} />}
    {certificates.isError && <p role="alert">Credential information could not be loaded. <Button variant="outline" onClick={() => certificates.refetch()}>Retry</Button></p>}
    <Card><CardHeader><CardTitle>Issuance pipeline</CardTitle></CardHeader><CardContent><ol className="space-y-0">{data.steps.map((s, index) => { const failed = ['failed', 'dead_letter'].includes(s.status); const Icon = s.status === 'completed' ? CheckCircle2 : failed ? XCircle : s.status === 'processing' ? Loader2 : Clock3; return <li key={s.step} className={`relative flex gap-4 pb-7 ${index < data.steps.length - 1 ? 'border-l-2 border-border ml-3 pl-6' : 'ml-3 pl-6'}`}><Icon aria-hidden="true" className={`absolute -left-3 top-0 h-6 w-6 bg-background ${s.status === 'completed' ? 'text-green-600' : failed ? 'text-red-600' : 'text-blue-600'} ${s.status === 'processing' ? 'animate-spin' : ''}`} /><div className="min-w-0 flex-1"><div className="font-medium">{labels[s.step] || s.step} <span className="text-sm font-normal text-muted-foreground">({s.status.replace('_', ' ')})</span></div>{s.completedAt && <p className="text-xs text-muted-foreground">{date(s.completedAt)}</p>}{s.ipfsCid && <p className="mt-1 break-all text-sm">CID: {s.ipfsCid.slice(0, 14)}… <Button aria-label={`Copy ${labels[s.step] || s.step} CID`} size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(s.ipfsCid!).then(() => toast({ title: 'CID copied' })).catch(() => toast({ title: 'Could not copy CID', variant: 'destructive' }))}><Copy className="h-4 w-4" /></Button></p>}{s.step === 'blockchain_mint' && s.status === 'completed' && <p className="break-all text-sm">Token: {data.certificate.tokenId ?? 'Not available'} · Transaction: {chainUrl ? <a className="underline" href={chainUrl} target="_blank" rel="noopener noreferrer">{tx?.slice(0, 16)}… <ExternalLink className="inline h-3 w-3" /></a> : 'Not available'}</p>}{failed && <div className="mt-2"><p role="alert" className="break-words text-sm text-red-700 dark:text-red-300">{s.lastError || 'This step failed.'}</p><Button className="mt-2" size="sm" disabled={retry.isPending} onClick={() => retry.mutate(s.step)}>Retry {labels[s.step] || s.step}</Button></div>}</div></li>; })}</ol></CardContent></Card>
    <div className="flex flex-wrap gap-3"><Button disabled={pdf.isPending || data.overallStatus !== 'active'} onClick={() => pdf.mutate()}>{pdf.isPending ? 'Downloading…' : 'Download PDF'}</Button>{chainUrl && <Button asChild variant="outline"><a href={chainUrl} target="_blank" rel="noopener noreferrer">View on chain <ExternalLink className="ml-2 h-4 w-4" /></a></Button>}</div>
  </div>;
}
