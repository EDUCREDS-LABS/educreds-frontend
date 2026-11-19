import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Copy, RefreshCw, ServerCog, ShieldCheck, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  ConnectorAdapterKind,
  ConnectorAdvancedProfile,
  ConnectorConfig,
  ConnectorSqlMapping,
  buildConnectorConfigYaml,
  defaultSqlMapping,
  getConnectorAdvancedProfile,
  saveConnectorAdvancedProfile,
  updateConnectorConfig,
} from '@/services/connector';
import { getInstitutionHealthStatus } from '@/services/health-status';

type ConnectorFormState = ConnectorConfig &
  ConnectorAdvancedProfile & { sqlMapping: ConnectorSqlMapping; signingPublicKey?: string };

const DEFAULT_ADVANCED: ConnectorAdvancedProfile = {
  databaseAdapter: 'postgres',
  databaseHost: '',
  databasePort: '',
  databaseName: '',
  databaseUser: '',
  mTlsCertPem: '',
  mTlsClientKeyPem: '',
  mTlsCaBundlePem: '',
  vpnTunnelEnabled: false,
  vpnTunnelHost: '',
  soapWsdlEndpoint: '',
  erpPreset: 'generic',
  syncIntervalMinutes: '15',
  connectorAgentVersion: 'v1.0.0',
  autoUpdateAgent: true,
};

const SQL_FIELDS: { key: keyof ConnectorSqlMapping; label: string; optional?: boolean }[] = [
  { key: 'studentById', label: 'Student by ID' },
  { key: 'studentByEmail', label: 'Student by Email' },
  { key: 'studentByNumber', label: 'Student by Number' },
  { key: 'graduationById', label: 'Graduation by ID' },
  { key: 'programmeById', label: 'Programme by ID' },
  { key: 'transcriptByStudent', label: 'Transcript by Student' },
  { key: 'institution', label: 'Institution' },
  { key: 'updateStatus', label: 'Update Status (write-back, optional)', optional: true },
  { key: 'createCredential', label: 'Create Credential (write-back, optional)', optional: true },
];

export const ConnectorForm: React.FC<{
  initialData: ConnectorConfig;
  institutionId: string;
  /** When true, hide tier/endpoint routing and Docker commands — the wizard owns those. */
  hideCoreRouting?: boolean;
}> = ({ initialData, institutionId, hideCoreRouting = false }) => {
  const { toast } = useToast();
  const localAdvanced = useMemo(() => getConnectorAdvancedProfile(institutionId), [institutionId]);
  const adapter = (localAdvanced.databaseAdapter || 'postgres') as ConnectorAdapterKind;

  const [formData, setFormData] = useState<ConnectorFormState>({
    ...initialData,
    ...DEFAULT_ADVANCED,
    ...localAdvanced,
    sqlMapping: defaultSqlMapping(adapter),
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastDiagnostics, setLastDiagnostics] = useState<{ status: string; message: string } | null>(null);

  const setField = <K extends keyof ConnectorFormState>(key: K, value: ConnectorFormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const setSql = (key: keyof ConnectorSqlMapping, value: string) => {
    setFormData((prev) => ({ ...prev, sqlMapping: { ...prev.sqlMapping, [key]: value } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Authoritative to the backend: tier routing + endpoint topology only.
      await updateConnectorConfig(institutionId, {
        deploymentTier: formData.deploymentTier,
        connectorEndpoint: formData.connectorEndpoint || null,
        connectorApiUrl: formData.connectorApiUrl || null,
        webhookUrl: formData.webhookUrl || null,
      });

      // Draft-only: the real config is the downloaded connector-config.yaml
      // dropped on the agent host. Persisted locally so the form survives reloads.
      saveConnectorAdvancedProfile(institutionId, {
        databaseAdapter: formData.databaseAdapter,
        databaseHost: formData.databaseHost,
        databasePort: formData.databasePort,
        databaseName: formData.databaseName,
        databaseUser: formData.databaseUser,
        mTlsCertPem: formData.mTlsCertPem,
        mTlsClientKeyPem: formData.mTlsClientKeyPem,
        mTlsCaBundlePem: formData.mTlsCaBundlePem,
        vpnTunnelEnabled: formData.vpnTunnelEnabled,
        vpnTunnelHost: formData.vpnTunnelHost,
        soapWsdlEndpoint: formData.soapWsdlEndpoint,
        erpPreset: formData.erpPreset,
        syncIntervalMinutes: formData.syncIntervalMinutes,
        connectorAgentVersion: formData.connectorAgentVersion,
        autoUpdateAgent: formData.autoUpdateAgent,
      });

      toast({
        title: 'Connector core saved',
        description:
          'Tier + endpoint registered with the platform. Download the generated connector-config.yaml and drop it on the agent host.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Connector configuration could not be saved.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      const health = await getInstitutionHealthStatus(institutionId);
      const connector = health.institutionSpecific.connector;
      setLastDiagnostics({
        status: connector.status,
        message:
          connector.status === 'n/a'
            ? connector.message
            : `${connector.message} • latency ${connector.latencyMs ?? 'n/a'}ms`,
      });
      toast({ title: 'Diagnostics completed', description: `Connector status: ${connector.status}` });
    } catch (error) {
      setLastDiagnostics({
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Diagnostics failed',
      });
      toast({
        title: 'Diagnostics failed',
        description: error instanceof Error ? error.message : 'Unable to run diagnostics',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const isEnterprise = formData.deploymentTier === 'enterprise-connector';
  const isCloud = formData.deploymentTier === 'cloud-connector';

  // The artifact the on-prem agent actually consumes.
  const generatedYaml = useMemo(
    () =>
      buildConnectorConfigYaml({
        institutionId,
        deploymentTier: isEnterprise
          ? 'enterprise-connector'
          : isCloud
            ? 'cloud-connector'
            : 'enterprise-connector',
        connectorEndpoint: formData.connectorEndpoint || undefined,
        connectorApiUrl: formData.connectorApiUrl || undefined,
        adapterKind: (formData.databaseAdapter || 'postgres') as ConnectorAdapterKind,
        databaseHost: formData.databaseHost || undefined,
        databasePort: formData.databasePort || undefined,
        databaseName: formData.databaseName || undefined,
        databaseUser: formData.databaseUser || undefined,
        signingPublicKey: formData.signingPublicKey || undefined,
        sql: formData.sqlMapping,
        mtls: isEnterprise,
      }),
    [institutionId, isEnterprise, isCloud, formData],
  );

  const downloadYaml = () => {
    const blob = new Blob([generatedYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connector-config.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyYaml = () => {
    navigator.clipboard?.writeText(generatedYaml);
    toast({ title: 'Copied', description: 'connector-config.yaml copied to clipboard.' });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {!hideCoreRouting && (
      <Card className="rounded-3xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerCog className="size-5" /> Connector Core
          </CardTitle>
          <CardDescription>Configure tier routing, endpoint topology, and secure callback URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deployment Tier</Label>
              <Select
                value={formData.deploymentTier}
                onValueChange={(value) => {
                  setField('deploymentTier', value as ConnectorConfig['deploymentTier']);
                  // Offer the guided tour when an institution picks / changes its tier
                  window.dispatchEvent(new CustomEvent('startOnboarding', { detail: { tier: value } }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace">Tier 1 · Essentials (hosted)</SelectItem>
                  <SelectItem value="cloud-connector">Tier 2 · Connected (cloud API)</SelectItem>
                  <SelectItem value="enterprise-connector">Tier 3 · Enterprise (on-premise agent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={formData.webhookUrl || ''}
                onChange={(e) => setField('webhookUrl', e.target.value)}
                placeholder="https://events.institution.edu/webhook"
              />
            </div>
          </div>

          {isCloud && (
            <div className="space-y-2">
              <Label>Cloud SIS API URL</Label>
              <Input
                value={formData.connectorApiUrl || ''}
                onChange={(e) => setField('connectorApiUrl', e.target.value)}
                placeholder="https://api.cloud-sis.com"
              />
            </div>
          )}

          {isEnterprise && (
            <div className="space-y-2">
              <Label>Enterprise Connector Endpoint (mTLS)</Label>
              <Input
                value={formData.connectorEndpoint || ''}
                onChange={(e) => setField('connectorEndpoint', e.target.value)}
                placeholder="https://mtls.institution.edu"
              />
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {(isEnterprise || isCloud) && (
        <>
          <Card className="rounded-3xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" /> Data Source Adapter
              </CardTitle>
              <CardDescription>
                Select the SIS/ERP database the on-prem agent connects to. This sets the agent YAML
                <code>adapter.kind</code> (postgres, mysql, mssql, oracle, sqlite).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Database Adapter</Label>
                  <Select
                    value={formData.databaseAdapter || 'postgres'}
                    onValueChange={(value) => {
                      const next = value as ConnectorAdapterKind;
                      setField('databaseAdapter', next);
                      // Reset the SQL mapping to the chosen dialect's placeholder style.
                      setFormData((prev) => ({ ...prev, sqlMapping: defaultSqlMapping(next) }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL / MariaDB</SelectItem>
                      <SelectItem value="mssql">SQL Server / Azure SQL</SelectItem>
                      <SelectItem value="oracle">Oracle</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ERP Preset</Label>
                  <Select
                    value={formData.erpPreset || 'generic'}
                    onValueChange={(value) => setField('erpPreset', value as ConnectorAdvancedProfile['erpPreset'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">Generic</SelectItem>
                      <SelectItem value="banner">Ellucian Banner</SelectItem>
                      <SelectItem value="peoplesoft">Oracle PeopleSoft</SelectItem>
                      <SelectItem value="sap">SAP</SelectItem>
                      <SelectItem value="workday">Workday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sync Interval (minutes)</Label>
                  <Input
                    value={formData.syncIntervalMinutes || '15'}
                    onChange={(e) => setField('syncIntervalMinutes', e.target.value)}
                    placeholder="15"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input
                    value={formData.databaseHost || ''}
                    onChange={(e) => setField('databaseHost', e.target.value)}
                    placeholder="db.institution.local"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    value={formData.databasePort || ''}
                    onChange={(e) => setField('databasePort', e.target.value)}
                    placeholder="5432"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Database</Label>
                  <Input
                    value={formData.databaseName || ''}
                    onChange={(e) => setField('databaseName', e.target.value)}
                    placeholder="sis_prod"
                  />
                </div>
                <div className="space-y-2">
                  <Label>User</Label>
                  <Input
                    value={formData.databaseUser || ''}
                    onChange={(e) => setField('databaseUser', e.target.value)}
                    placeholder="connector_reader"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>SOAP/WSDL Endpoint (optional)</Label>
                <Input
                  value={formData.soapWsdlEndpoint || ''}
                  onChange={(e) => setField('soapWsdlEndpoint', e.target.value)}
                  placeholder="https://erp.institution.edu/service?wsdl"
                />
              </div>
              <div className="flex items-center justify-between border rounded-xl p-4">
                <div>
                  <p className="font-semibold">VPN Tunnel Enabled</p>
                  <p className="text-sm text-muted-foreground">Route SIS/ERP traffic through private network transport.</p>
                </div>
                <Switch
                  checked={Boolean(formData.vpnTunnelEnabled)}
                  onCheckedChange={(checked) => setField('vpnTunnelEnabled', checked)}
                />
              </div>
              {formData.vpnTunnelEnabled && (
                <div className="space-y-2">
                  <Label>VPN Tunnel Host</Label>
                  <Input
                    value={formData.vpnTunnelHost || ''}
                    onChange={(e) => setField('vpnTunnelHost', e.target.value)}
                    placeholder="vpn.institution.edu:443"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Connector SQL Data Mapping</CardTitle>
              <CardDescription>
                This is the agent&apos;s real &quot;data mapping&quot; — the institution-authored SQL it runs against your SIS
                (the <code>sql:</code> block in connector-config.yaml). Column aliases drive the canonical schema.
                Dialect placeholders: PostgreSQL <code>$1</code>, others <code>?</code> (mssql <code>TOP 1</code>, oracle <code>ROWNUM &lt;= 1</code>).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {SQL_FIELDS.map((f) => (
                <div className="space-y-2" key={f.key}>
                  <Label>
                    {f.label}
                    {f.optional && <span className="text-muted-foreground"> — optional (read-only if empty)</span>}
                  </Label>
                  <Textarea
                    value={formData.sqlMapping[f.key] || ''}
                    onChange={(e) => setSql(f.key, e.target.value)}
                    rows={f.key === 'transcriptByStudent' || f.key === 'createCredential' || f.key === 'updateStatus' ? 5 : 2}
                    placeholder={`SELECT ... FROM sis.${f.key.startsWith('student') ? 'students' : f.key.startsWith('graduation') ? 'graduations' : f.key.startsWith('programme') ? 'programmes' : f.key.startsWith('transcript') ? 'enrolments' : 'institution'}`}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Signing Public Key (optional)</Label>
                <Input
                  value={formData.signingPublicKey || ''}
                  onChange={(e) => setField('signingPublicKey', e.target.value)}
                  placeholder="-----BEGIN PUBLIC KEY-----"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" /> Security + Transport (mTLS)
              </CardTitle>
              <CardDescription>
                mTLS materials are stored on the <strong>agent host</strong> at
                <code>/etc/educreds/certs/</code> — never sent to the EduCreds cloud. Paste them here only to
                preview the generated config; the downloaded YAML references the cert <em>paths</em>, not the contents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertTitle>Host-side secrets</AlertTitle>
                <AlertDescription>
                  Keep private key material on the agent host. The cloud only stores the connector endpoint + tier.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>mTLS Certificate (PEM) — host-only</Label>
                  <Textarea
                    value={formData.mTlsCertPem || ''}
                    onChange={(e) => setField('mTlsCertPem', e.target.value)}
                    rows={5}
                    placeholder="-----BEGIN CERTIFICATE-----"
                  />
                </div>
                <div className="space-y-2">
                  <Label>mTLS CA Bundle (PEM) — host-only</Label>
                  <Textarea
                    value={formData.mTlsCaBundlePem || ''}
                    onChange={(e) => setField('mTlsCaBundlePem', e.target.value)}
                    rows={5}
                    placeholder="-----BEGIN CERTIFICATE-----"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>mTLS Client Key (PEM) — host-only</Label>
                <Textarea
                  value={formData.mTlsClientKeyPem || ''}
                  onChange={(e) => setField('mTlsClientKeyPem', e.target.value)}
                  rows={4}
                  placeholder="-----BEGIN PRIVATE KEY-----"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Agent Config — connector-config.yaml</CardTitle>
              <CardDescription>
                Generated from the settings above. Download it, place mTLS certs in
                <code>/etc/educreds/certs/</code> on the agent host, then start the agent. This is the only
                artifact the on-prem agent reads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={downloadYaml} className="gap-2">
                  <Download className="size-4" /> Download connector-config.yaml
                </Button>
                <Button type="button" variant="outline" onClick={copyYaml} className="gap-2">
                  <Copy className="size-4" /> Copy
                </Button>
              </div>
              <pre className="rounded-xl border bg-muted/40 p-4 text-xs overflow-auto max-h-96">
                {generatedYaml}
              </pre>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Agent Lifecycle & Diagnostics</CardTitle>
              <CardDescription>Keep your connection healthy and validate reachability to your systems.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Connector Agent Version</Label>
                  <Input
                    value={formData.connectorAgentVersion || ''}
                    onChange={(e) => setField('connectorAgentVersion', e.target.value)}
                    placeholder="v1.5.2"
                  />
                </div>
                <div className="flex items-center justify-between border rounded-xl p-4">
                  <div>
                    <p className="font-semibold">Auto-update Agent</p>
                    <p className="text-sm text-muted-foreground">Allow policy-managed patch updates.</p>
                  </div>
                  <Switch
                    checked={Boolean(formData.autoUpdateAgent)}
                    onCheckedChange={(checked) => setField('autoUpdateAgent', checked)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={runDiagnostics} disabled={testing} className="gap-2">
                  {testing ? <RefreshCw className="size-4 animate-spin" /> : <TestTube2 className="size-4" />}
                  Run Diagnostics
                </Button>
                {lastDiagnostics && (
                  <Badge variant="secondary" className="capitalize">
                    {lastDiagnostics.status}
                  </Badge>
                )}
              </div>

              {lastDiagnostics && (
                <Alert>
                  {lastDiagnostics.status === 'healthy' ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                  <AlertTitle className="capitalize">{lastDiagnostics.status}</AlertTitle>
                  <AlertDescription>{lastDiagnostics.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {!hideCoreRouting && (
          <Card className="rounded-3xl border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Technical Setup (IT only)</CardTitle>
              <CardDescription>These commands are for your IT team to provision a self-hosted connection. Most institutions connect without this step.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">1) Pull connector image</p>
                <code className="text-xs break-all">
                  docker pull ghcr.io/educreds-labs/connector-agent:{formData.connectorAgentVersion || 'latest'}
                </code>
              </div>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">2) Start with secure endpoint wiring</p>
                <code className="text-xs break-all">
                  docker run -d --name educreds-connector -e EDUCREDS_ENDPOINT=
                  {formData.connectorEndpoint || 'https://mtls.institution.edu'} -e EDUCREDS_WEBHOOK=
                  {formData.webhookUrl || 'https://events.institution.edu/webhook'} ghcr.io/educreds-labs/connector-agent:
                  {formData.connectorAgentVersion || 'latest'}
                </code>
              </div>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">3) Validate registration + health</p>
                <code className="text-xs break-all">
                  curl -fsSL {formData.connectorEndpoint || 'https://mtls.institution.edu'}/healthz
                </code>
              </div>
            </CardContent>
          </Card>
          )}
        </>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <RefreshCw className="size-4 animate-spin" /> : null}
          Save Connector Profile
        </Button>
        <Button type="button" variant="outline" onClick={runDiagnostics} disabled={testing}>
          Validate Connectivity
        </Button>
      </div>
    </form>
  );
};
