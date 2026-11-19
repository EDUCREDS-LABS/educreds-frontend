import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { DeploymentTier } from '@/lib/deploymentTier';
import {
  ConnectorAdapterKind,
  ConnectorConfig,
  ConnectorFieldMapping,
  buildConnectorConfigYaml,
  defaultSqlMapping,
  getConnectorAdvancedProfile,
  getConnectorConfig,
  getConnectorStatus,
  getConnectorSyncHistory,
  loadFieldMappings,
  getSisSchema,
  persistFieldMappings,
  normalizeSisFields,
  testCloudConnection,
  testProvidedConnectorUrl,
  updateConnectorConfig,
  provisionCloudConnector,
  SIS_AUTH_TYPES,
  SIS_VENDORS,
  type AuthTypeId,
} from '@/services/connector';
import { ConnectorForm } from './ConnectorForm';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle,
  ChevronDown,
  Cloud,
  Download,
  ExternalLink,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react';

type WizardStep = 1 | 2 | 3 | 4;

interface ConnectionOption {
  id: DeploymentTier;
  label: string;
  title: string;
  description: string;
  bestFor: string;
  icon: React.ReactNode;
}

const CONNECTION_OPTIONS: ConnectionOption[] = [
  {
    id: 'enterprise-connector',
    label: 'On-Premise Connector',
    title: 'Your student data stays entirely within your own infrastructure.',
    description: 'Install a connector on your campus servers. EduCreds never stores your student information system database.',
    bestFor: 'Large universities with strict data residency requirements.',
    icon: <Server className="size-5" />,
  },
  {
    id: 'cloud-connector',
    label: 'Cloud SIS Integration',
    title: 'Connect EduCreds directly to your existing cloud-based student system.',
    description: 'Use your current cloud student information system as the source of truth.',
    bestFor: 'Universities already using a cloud student system such as Banner Cloud or Workday.',
    icon: <Cloud className="size-5" />,
  },
  {
    id: 'workspace',
    label: 'EduCreds Workspace',
    title: 'Use EduCreds as your complete credential management system.',
    description: 'Issue and manage credentials in EduCreds without connecting an external student system.',
    bestFor: 'Institutions without an existing digital student information system.',
    icon: <Building2 className="size-5" />,
  },
];

const EDUCREDS_FIELDS: { key: string; label: string; defaultSis: string; required: boolean; group: string }[] = [
  // Student fields
  { key: 'studentId', label: 'Student ID', defaultSis: 'student_id', required: true, group: 'Student' },
  { key: 'email', label: 'Email', defaultSis: 'email', required: true, group: 'Student' },
  { key: 'firstName', label: 'First Name', defaultSis: 'first_name', required: true, group: 'Student' },
  { key: 'lastName', label: 'Last Name', defaultSis: 'last_name', required: true, group: 'Student' },
  { key: 'studentNumber', label: 'Student Number', defaultSis: 'student_number', required: false, group: 'Student' },
  // Graduation fields
  { key: 'graduationId', label: 'Graduation ID', defaultSis: 'graduation_id', required: true, group: 'Graduation' },
  { key: 'graduationDate', label: 'Graduation Date', defaultSis: 'grad_date', required: true, group: 'Graduation' },
  { key: 'graduationStatus', label: 'Graduation Status', defaultSis: 'graduation_status', required: true, group: 'Graduation' },
  { key: 'classification', label: 'Classification / Grade', defaultSis: 'classification', required: false, group: 'Graduation' },
  // Programme fields
  { key: 'programmeId', label: 'Programme ID', defaultSis: 'programme_id', required: true, group: 'Programme' },
  { key: 'programme', label: 'Programme Name', defaultSis: 'programme_name', required: true, group: 'Programme' },
  { key: 'programmeLevel', label: 'Programme Level', defaultSis: 'level', required: false, group: 'Programme' },
  { key: 'faculty', label: 'Faculty / Department', defaultSis: 'faculty', required: false, group: 'Programme' },
];

const SIS_PRESETS = [
  { id: 'workday', label: 'Workday', hint: 'https://your-tenant.workday.com' },
  { id: 'banner', label: 'Ellucian Banner Cloud', hint: 'https://your-campus.banner.cloud' },
  { id: 'sap', label: 'SAP SuccessFactors', hint: 'https://api.successfactors.com' },
  { id: 'oracle', label: 'Oracle Cloud HCM', hint: 'https://your-tenant.fa.oraclecloud.com' },
  { id: 'other', label: 'Other cloud student system', hint: '' },
] as const;

interface ConnectionTestResult {
  reachable: boolean;
  latencyMs: number;
  authValid?: boolean;
  error?: string;
}

const isDeploymentTier = (value: string | undefined | null): value is DeploymentTier =>
  value === 'workspace' || value === 'cloud-connector' || value === 'enterprise-connector';

const downloadTextFile = (filename: string, contents: string) => {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const dockerComposeTemplate = `services:
  educreds-connector:
    image: educreds/connector:latest
    restart: unless-stopped
    env_file: .env
    ports:
      - "8443:8443"
    volumes:
      - ./connector-config.yaml:/etc/educreds/connector-config.yaml:ro
`;

const envTemplate = (institutionId: string) =>
  [
    `EDUCREDS_INSTITUTION_ID=${institutionId}`,
    'EDUCREDS_CONNECTOR_SHARED_SECRET=',
    'SIS_DB_HOST=',
    'SIS_DB_PORT=5432',
    'SIS_DB_NAME=',
    'SIS_DB_USER=',
    'SIS_DB_PASSWORD=',
  ].join('\n');

const defaultConnectorYaml = (institutionId: string, connectorUrl: string) => {
  const profile = getConnectorAdvancedProfile(institutionId);
  const adapter = (profile.databaseAdapter || 'postgres') as ConnectorAdapterKind;
  return buildConnectorConfigYaml({
    institutionId,
    deploymentTier: 'enterprise-connector',
    connectorEndpoint: connectorUrl || undefined,
    adapterKind: adapter,
    databaseHost: profile.databaseHost,
    databasePort: profile.databasePort,
    databaseName: profile.databaseName,
    databaseUser: profile.databaseUser,
    sql: defaultSqlMapping(adapter),
    mtls: true,
  });
};

const ConnectorWizard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const institutionId = user?.id || '';

  const [step, setStep] = useState<WizardStep>(1);
  const [selectedKind, setSelectedKind] = useState<DeploymentTier | null>(null);
  const [connectorUrl, setConnectorUrl] = useState('');
  const [sisPreset, setSisPreset] = useState<string>('generic-rest');
  const [authType, setAuthType] = useState<AuthTypeId>('api_key');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [provisioned, setProvisioned] = useState(false);
  const [mappings, setMappings] = useState<ConnectorFieldMapping[]>(
    EDUCREDS_FIELDS.map((field) => ({ educredsField: field.key, sisField: field.defaultSis })),
  );
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationChecks, setActivationChecks] = useState<{
    reachable: boolean | null;
    authValid: boolean | null;
    records: number | null;
    mapped: boolean | null;
  }>({ reachable: null, authValid: null, records: null, mapped: null });

  const { data: config, isLoading: configLoading, error: configError } = useQuery<ConnectorConfig, Error>({
    queryKey: ['connector-config', institutionId],
    queryFn: () => getConnectorConfig(institutionId),
    enabled: Boolean(institutionId),
  });

  const { data: status } = useQuery({
    queryKey: ['connector-status', institutionId],
    queryFn: getConnectorStatus,
    enabled: Boolean(institutionId),
  });

  const { data: sisSchema } = useQuery({
    queryKey: ['connector-sis-schema', institutionId],
    queryFn: getSisSchema,
    enabled: Boolean(institutionId),
  });

  const currentTier: DeploymentTier | null = useMemo(() => {
    if (isDeploymentTier(status?.deploymentTier)) return status.deploymentTier;
    if (isDeploymentTier(config?.deploymentTier)) return config.deploymentTier;
    if (isDeploymentTier(user?.deploymentTier)) return user.deploymentTier;
    return null;
  }, [status?.deploymentTier, config?.deploymentTier, user?.deploymentTier]);

  const availableOptions = useMemo(
    () => (currentTier ? CONNECTION_OPTIONS.filter((option) => option.id === currentTier) : []),
    [currentTier],
  );

  useEffect(() => {
    if (!selectedKind && availableOptions.length === 1) {
      setSelectedKind(availableOptions[0].id);
    }
  }, [availableOptions, selectedKind]);

  useEffect(() => {
    const existingUrl = status?.connectorEndpoint || status?.connectorApiUrl || config?.connectorEndpoint || config?.connectorApiUrl;
    if (existingUrl && !connectorUrl) {
      setConnectorUrl(existingUrl);
    }
  }, [status, config, connectorUrl]);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    void loadFieldMappings(institutionId).then((saved) => {
      if (cancelled || saved.length === 0) return;
      setMappings(
        EDUCREDS_FIELDS.map((field) => {
          const match = saved.find((row) => row.educredsField === field.key);
          return { educredsField: field.key, sisField: match?.sisField || field.defaultSis };
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  const sisFields = (() => {
    const fromSchema = normalizeSisFields(sisSchema?.fields);
    return fromSchema.length > 0 ? fromSchema : EDUCREDS_FIELDS.map((field) => field.defaultSis);
  })();

  const allFieldsMapped = mappings.every((row) => row.sisField.trim().length > 0);

  const canContinueFromStep2 = useMemo(() => {
    if (!selectedKind) return false;
    if (selectedKind === 'workspace') return true;
    return Boolean(testResult?.reachable);
  }, [selectedKind, testResult]);

  const runConnectionTest = useCallback(async () => {
    if (!selectedKind || selectedKind === 'workspace') return;
    if (!connectorUrl.trim()) {
      setTestResult({ reachable: false, latencyMs: 0, error: 'Enter the Connector URL first.' });
      toast({
        title: 'Cannot reach connector',
        description: 'Enter the Connector URL first.',
        variant: 'destructive',
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result =
        selectedKind === 'enterprise-connector'
          ? await testProvidedConnectorUrl(connectorUrl)
          : await testCloudConnection(connectorUrl);
      setTestResult(result);
      toast({
        title: result.reachable ? 'Connected' : 'Cannot reach connector',
        description: result.reachable
          ? 'You can continue to field mapping.'
          : (result.error ?? 'Check that the connector is running and reachable.'),
        variant: result.reachable ? 'default' : 'destructive',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection test failed';
      setTestResult({ reachable: false, latencyMs: 0, error: message });
    } finally {
      setTesting(false);
    }
  }, [selectedKind, connectorUrl, toast]);

  const goNext = () => {
    if (step === 3 && institutionId) {
      void persistFieldMappings(institutionId, mappings).catch((error) => {
        const message = error instanceof Error ? error.message : 'Could not save field mappings';
        toast({ title: 'Mappings saved locally only', description: message, variant: 'destructive' });
      });
    }
    setStep((current) => (current < 4 ? ((current + 1) as WizardStep) : current));
  };

  const goBack = () => {
    setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current));
  };

  const runActivationChecks = useCallback(async () => {
    const mapped = allFieldsMapped;
    let reachable = selectedKind === 'workspace' ? true : Boolean(testResult?.reachable);
    let authValid = selectedKind === 'workspace' ? true : testResult?.authValid !== false && reachable;
    let records: number | null = null;

    if (selectedKind !== 'workspace') {
      try {
        const history = await getConnectorSyncHistory();
        const latest = history[0];
        records = typeof latest?.recordsPulled === 'number' ? latest.recordsPulled : 0;
      } catch {
        records = 0;
      }
    }

    setActivationChecks({ reachable, authValid, records, mapped });
  }, [allFieldsMapped, selectedKind, testResult]);

  useEffect(() => {
    if (step === 4) {
      void runActivationChecks();
    }
  }, [step, runActivationChecks]);

  const handleActivate = async () => {
    if (!institutionId || !selectedKind) return;
    setActivating(true);
    try {
      await persistFieldMappings(institutionId, mappings);

      if (selectedKind === 'cloud-connector') {
        // Phase 2: Provision through shared cloud connector service
        await provisionCloudConnector({
          sisVendor: sisPreset,
          sisBaseUrl: connectorUrl,
          authType,
          credentials,
          mappings,
        });
      } else {
        await updateConnectorConfig(institutionId, {
          deploymentTier: selectedKind,
          connectorEndpoint: selectedKind === 'enterprise-connector' ? connectorUrl || null : null,
          connectorApiUrl: null,
        });
      }

      setActivated(true);
      toast({
        title: 'Integration activated',
        description: selectedKind === 'cloud-connector'
          ? 'Your cloud connector is provisioned and syncing will begin shortly.'
          : 'Your connection is registered. You can return to this page any time to test it again.',
      });
    } catch (error) {
      toast({
        title: 'Could not activate integration',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActivating(false);
    }
  };

  const progressValue = (step / 4) * 100;
  const selectedOption = CONNECTION_OPTIONS.find((option) => option.id === selectedKind);

  if (!institutionId) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Institution session required</AlertTitle>
        <AlertDescription>Sign in with an institution account to connect a student information system.</AlertDescription>
      </Alert>
    );
  }

  if (configLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!currentTier) {
    return (
      <Alert variant="destructive">
        <AlertTitle>We could not determine your connection type</AlertTitle>
        <AlertDescription>
          Your institution's deployment tier did not load, so the setup steps cannot be shown yet. Refresh the page, and
          contact EduCreds support if this keeps happening.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Connect your student system</h2>
        <p className="mt-1 text-gray-600">
          A guided setup so your IT team can connect EduCreds without editing configuration files in this portal.
        </p>
      </div>

      {configError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load the current connection</AlertTitle>
          <AlertDescription>{configError.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Step {step} of 4</span>
          <span>{selectedOption?.label ?? 'Choose a connection type'}</span>
        </div>
        <Progress value={progressValue} />
      </div>

      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-1">
          {availableOptions.map((option) => {
            const selected = selectedKind === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedKind(option.id);
                  setTestResult(null);
                  setActivated(false);
                }}
                className={`text-left ${selected ? 'ring-2 ring-blue-600' : ''}`}
              >
                <Card className={selected ? 'border-blue-600' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        {option.icon}
                        <Badge variant="secondary">{option.label}</Badge>
                      </div>
                      {selected && <CheckCircle className="size-5 text-blue-600" />}
                    </div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">Best for: {option.bestFor}</p>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {step === 2 && selectedKind === 'enterprise-connector' && (
        <Card>
          <CardHeader>
            <CardTitle>Your data stays in your infrastructure</CardTitle>
            <CardDescription>
              Complete these steps on a server your institution controls. Student records never leave your campus network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ol className="space-y-4 text-sm text-gray-800">
              <li className="space-y-2">
                <p className="font-medium">1. Install Docker on your server (about five minutes)</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://docs.docker.com/get-docker/" target="_blank" rel="noopener noreferrer">
                    View Docker install guide
                    <ExternalLink className="ml-2 size-3" />
                  </a>
                </Button>
              </li>
              <li className="space-y-2">
                <p className="font-medium">2. Download the EduCreds Connector files</p>
                <p className="text-gray-600">
                  Place all three files in the same folder on your server. The compose file mounts the config the connector reads on start.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTextFile('docker-compose.yml', dockerComposeTemplate)}
                  >
                    <Download className="mr-2 size-3" />
                    docker-compose.yml
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTextFile('.env', envTemplate(institutionId))}
                  >
                    <Download className="mr-2 size-3" />
                    Environment template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadTextFile(
                        'connector-config.yaml',
                        defaultConnectorYaml(institutionId, connectorUrl),
                      )
                    }
                  >
                    <Download className="mr-2 size-3" />
                    connector-config.yaml
                  </Button>
                </div>
              </li>
              <li className="space-y-1">
                <p className="font-medium">3. Fill in your Institution ID and database credentials</p>
                <p className="text-gray-600">
                  We pre-filled your Institution ID in the environment template:
                  <code className="ml-1 rounded bg-gray-100 px-1.5 py-0.5">{institutionId}</code>
                </p>
              </li>
              <li>
                <p className="font-medium">4. Start the connector:</p>
                <code className="mt-1 inline-block rounded bg-gray-100 px-2 py-1 font-mono text-xs">docker compose up -d</code>
              </li>
              <li className="space-y-3">
                <p className="font-medium">5. Enter your Connector URL once it is running</p>
                <div className="space-y-2">
                  <Label htmlFor="connector-url">Connector URL</Label>
                  <Input
                    id="connector-url"
                    value={connectorUrl}
                    onChange={(event) => {
                      setConnectorUrl(event.target.value);
                      setTestResult(null);
                    }}
                    placeholder="https://your-server:8443"
                  />
                  <Button onClick={() => void runConnectionTest()} disabled={testing || !connectorUrl.trim()}>
                    {testing ? <RefreshCw className="mr-2 size-4 animate-spin" /> : null}
                    {testing ? 'Testing connection…' : 'Test Connection'}
                  </Button>
                </div>
              </li>
            </ol>
            {testResult && (
              <Alert variant={testResult.reachable ? 'default' : 'destructive'}>
                {testResult.reachable ? (
                  <>
                    <CheckCircle className="size-4" />
                    <AlertTitle>Connected</AlertTitle>
                    <AlertDescription>You can continue to field mapping.</AlertDescription>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4" />
                    <AlertTitle>Cannot reach connector</AlertTitle>
                    <AlertDescription>
                      {testResult.error ?? 'The connector did not respond.'} Confirm Docker is running, port 8443 is open on the firewall, and the URL is correct.
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}

            <Collapsible className="rounded-xl border border-dashed border-gray-300 px-4 py-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-800"
                >
                  Advanced technical setup
                  <ChevronDown className="size-4 text-gray-500" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <p className="mb-4 text-sm text-gray-600">
                  Use this only if your student system is not PostgreSQL, you need custom queries, or your security team requires extra host-side settings. Most institutions can skip this and use the three files above.
                </p>
                <ConnectorForm
                  hideCoreRouting
                  institutionId={institutionId}
                  initialData={{
                    deploymentTier: 'enterprise-connector',
                    connectorEndpoint: connectorUrl || config?.connectorEndpoint || null,
                    connectorApiUrl: config?.connectorApiUrl || null,
                    webhookUrl: config?.webhookUrl || null,
                  }}
                />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedKind === 'cloud-connector' && (
        <Card>
          <CardHeader>
            <CardTitle>Connect your cloud student system</CardTitle>
            <CardDescription>
              EduCreds connects to your student system securely. Credentials are encrypted and never stored in plain text.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 1. SIS Vendor */}
            <div className="space-y-2">
              <Label>Student information system</Label>
              <Select
                value={sisPreset}
                onValueChange={(value) => {
                  setSisPreset(value);
                  const vendor = SIS_VENDORS.find((v) => v.id === value);
                  if (vendor?.hint) {
                    setConnectorUrl(vendor.hint);
                    setTestResult(null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose your student system" />
                </SelectTrigger>
                <SelectContent>
                  {SIS_VENDORS.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. SIS Base URL */}
            <div className="space-y-2">
              <Label htmlFor="cloud-url">API Base URL</Label>
              <Input
                id="cloud-url"
                value={connectorUrl}
                onChange={(event) => {
                  setConnectorUrl(event.target.value);
                  setTestResult(null);
                }}
                placeholder="https://your-campus.example.com/api"
              />
              <p className="text-xs text-gray-500">
                The base URL of your student system's REST API. EduCreds will only connect to this host.
              </p>
            </div>

            {/* 3. Auth Type */}
            <div className="space-y-2">
              <Label>Authentication method</Label>
              <Select
                value={authType}
                onValueChange={(value) => {
                  setAuthType(value as AuthTypeId);
                  setCredentials({});
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIS_AUTH_TYPES.map((at) => (
                    <SelectItem key={at.id} value={at.id}>
                      {at.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Credential Fields */}
            <div className="space-y-3">
              <Label>Credentials</Label>
              <p className="text-xs text-gray-500">
                These are encrypted before storage. EduCreds staff cannot read them.
              </p>
              {(() => {
                const authDef = SIS_AUTH_TYPES.find((at) => at.id === authType);
                return (authDef?.fields ?? ['api_key']).map((fieldName) => (
                  <div key={fieldName} className="space-y-1">
                    <Label htmlFor={`cred-${fieldName}`} className="text-sm capitalize">
                      {fieldName.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      id={`cred-${fieldName}`}
                      type={fieldName.includes('password') || fieldName.includes('secret') || fieldName.includes('key') || fieldName.includes('token') ? 'password' : 'text'}
                      value={credentials[fieldName] ?? ''}
                      onChange={(e) =>
                        setCredentials((prev) => ({ ...prev, [fieldName]: e.target.value }))
                      }
                      placeholder={fieldName.replace(/_/g, ' ')}
                    />
                  </div>
                ));
              })()}
            </div>

            {/* 5. Test Connection */}
            <Button
              onClick={() => void runConnectionTest()}
              disabled={testing || !connectorUrl.trim()}
              variant="outline"
            >
              {testing ? <RefreshCw className="mr-2 size-4 animate-spin" /> : null}
              {testing ? 'Testing…' : 'Test Connection'}
            </Button>

            {testResult && (
              <Alert variant={testResult.reachable ? 'default' : 'destructive'}>
                {testResult.reachable ? (
                  <>
                    <CheckCircle className="size-4" />
                    <AlertTitle>Connected</AlertTitle>
                    <AlertDescription>
                      {testResult.authValid === false
                        ? 'Reachable but authentication failed. Check credentials.'
                        : 'Connection verified. Continue to field mapping.'}
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4" />
                    <AlertTitle>Cannot reach student system</AlertTitle>
                    <AlertDescription>
                      {testResult.error ?? 'Confirm the URL and that EduCreds is allowed in your vendor settings.'}
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedKind === 'workspace' && (
        <Card>
          <CardHeader>
            <CardTitle>Use EduCreds as your student and credential workspace</CardTitle>
            <CardDescription>
              You will enter students, programmes, and graduation records in EduCreds. There is no external connector to install.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>This path is the right fit when your institution does not already run a digital student information system.</p>
            <p>Your Institution ID for support and onboarding is <code className="rounded bg-gray-100 px-1.5 py-0.5">{institutionId}</code>.</p>
            <p>Continue to confirm how student fields should appear on credentials, then activate the workspace.</p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Map your student fields to EduCreds fields</CardTitle>
            <CardDescription>
              {selectedKind === 'workspace'
                ? 'Confirm the names EduCreds should use when staff enter student records.'
                : 'Match each EduCreds field to the matching column from your student system.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">EduCreds Field</th>
                    <th className="py-2 font-medium">Your SIS Field</th>
                  </tr>
                </thead>
                <tbody>
                  {EDUCREDS_FIELDS.map((field) => {
                    const current = mappings.find((row) => row.educredsField === field.key)?.sisField ?? field.defaultSis;
                    return (
                      <tr key={field.key} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium text-gray-900">{field.label}</td>
                        <td className="py-3">
                          <Select
                            value={current}
                            onValueChange={(value) => {
                              setMappings((prev) =>
                                prev.map((row) =>
                                  row.educredsField === field.key ? { ...row, sisField: value } : row,
                                ),
                              );
                            }}
                          >
                            <SelectTrigger className="max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sisFields.map((sisField) => (
                                <SelectItem key={`${field.key}-${sisField}`} value={sisField}>
                                  {sisField}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{activated ? 'Integration is active' : 'Test and activate'}</CardTitle>
            <CardDescription>
              {activated
                ? 'Your institution can start using this connection.'
                : 'We confirm the connection, field mapping, and then register the endpoint with EduCreds.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                {activationChecks.reachable ? <CheckCircle className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-red-600" />}
                {selectedKind === 'workspace' ? 'Workspace ready' : activationChecks.reachable ? 'Connector reachable' : 'Connector not reachable'}
              </li>
              <li className="flex items-center gap-2">
                {activationChecks.authValid ? <CheckCircle className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-red-600" />}
                {activationChecks.authValid ? 'Authentication valid' : 'Authentication not confirmed'}
              </li>
              <li className="flex items-center gap-2">
                {activationChecks.records !== null ? (
                  <CheckCircle className="size-4 text-emerald-600" />
                ) : (
                  <span className="inline-block size-4 rounded-full border border-gray-300" />
                )}
                {selectedKind === 'workspace'
                  ? 'Student records will be entered in EduCreds'
                  : activationChecks.records === 0
                    ? '0 student records accessible (not synced yet)'
                    : activationChecks.records !== null
                      ? `${activationChecks.records.toLocaleString()} student records accessible`
                      : 'Student records not checked'}
              </li>
              <li className="flex items-center gap-2">
                {activationChecks.mapped ? <CheckCircle className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-red-600" />}
                {activationChecks.mapped ? 'Required fields mapped' : 'Complete field mapping before activating'}
              </li>
            </ul>

            <Button
              onClick={() => void handleActivate()}
              disabled={
                activating ||
                activated ||
                !activationChecks.mapped ||
                !activationChecks.reachable ||
                !activationChecks.authValid
              }
            >
              {activating ? <RefreshCw className="mr-2 size-4 animate-spin" /> : null}
              {activated ? 'Activated' : 'Activate Integration'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={step === 1}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        {step < 4 && (
          <Button
            onClick={goNext}
            disabled={
              (step === 1 && !selectedKind) ||
              (step === 2 && !canContinueFromStep2) ||
              (step === 3 && !allFieldsMapped)
            }
          >
            Continue
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const ConnectorPage: React.FC = () => <ConnectorWizard />;

export default ConnectorPage;
