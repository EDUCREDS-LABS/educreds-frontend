import { API_CONFIG } from '@/config/api';
import { getAnyAuthToken } from '@/lib/authStorage';

const getAuthToken = () =>
  getAnyAuthToken() || '';

export interface ConnectorConfig {
  deploymentTier: 'workspace' | 'cloud-connector' | 'enterprise-connector';
  connectorEndpoint?: string | null;
  connectorApiUrl?: string | null;
  webhookUrl?: string | null;
}

/** Adapter kinds MUST match the on-prem agent's `adapter.kind` exactly. */
export type ConnectorAdapterKind = 'postgres' | 'mysql' | 'mssql' | 'oracle' | 'sqlite';

export interface ConnectorAdvancedProfile {
  databaseAdapter?: ConnectorAdapterKind;
  databaseHost?: string;
  databasePort?: string;
  databaseName?: string;
  databaseUser?: string;
  mTlsCertPem?: string;
  mTlsClientKeyPem?: string;
  mTlsCaBundlePem?: string;
  vpnTunnelEnabled?: boolean;
  vpnTunnelHost?: string;
  soapWsdlEndpoint?: string;
  erpPreset?: 'generic' | 'banner' | 'peoplesoft' | 'sap' | 'workday';
  syncIntervalMinutes?: string;
  connectorAgentVersion?: string;
  autoUpdateAgent?: boolean;
}

/** The connector agent's real "data mapping" — the institution-authored SQL
 *  block in `connector-config.yaml`. These are the exact keys the
 *  agent's `sql:` section expects. */
export interface ConnectorSqlMapping {
  studentById: string;
  studentByEmail: string;
  studentByNumber: string;
  graduationById: string;
  programmeById: string;
  transcriptByStudent: string;
  institution: string;
  updateStatus?: string;
  createCredential?: string;
}

export interface ConnectorConfigBuildInput {
  institutionId: string;
  deploymentTier: 'cloud-connector' | 'enterprise-connector';
  connectorEndpoint?: string;
  connectorApiUrl?: string;
  adapterKind: ConnectorAdapterKind;
  databaseHost?: string;
  databasePort?: string;
  databaseName?: string;
  databaseUser?: string;
  signingPublicKey?: string;
  sql: ConnectorSqlMapping;
  mtls?: boolean;
  certDir?: string;
}

const ADAPTER_DEFAULT_PORT: Record<ConnectorAdapterKind, string> = {
  postgres: '5432',
  mysql: '3306',
  mssql: '1433',
  oracle: '1521',
  sqlite: '',
};

/** Sensible default SQL mapping per adapter. Placeholder style:
 *  postgres → $1 ; everything else → ? (mssql TOP 1, oracle ROWNUM<=1). */
export const defaultSqlMapping = (adapter: ConnectorAdapterKind): ConnectorSqlMapping => {
  const P = adapter === 'postgres' ? '$1' : '?';
  const phList = (n: number): string =>
    Array.from({ length: n }, (_, k) => (P === '$1' ? `$${k + 1}` : '?')).join(', ');
  const limit1 = (where: string, from: string): string => {
    if (adapter === 'mssql') return `SELECT TOP 1 * FROM ${from} WHERE ${where}`;
    if (adapter === 'oracle') return `SELECT * FROM ${from} WHERE ${where} AND ROWNUM <= 1`;
    return `SELECT * FROM ${from} WHERE ${where} LIMIT 1`;
  };
  const studentCols =
    'id AS student_id, student_number, email, first_name, last_name, NULL AS wallet_address';

  return {
    studentById: limit1(`id = ${P}`, 'sis.students').replace('*', studentCols),
    studentByEmail: limit1(`lower(email) = ${P}`, 'sis.students').replace('*', studentCols),
    studentByNumber: limit1(`student_number = ${P}`, 'sis.students').replace('*', studentCols),
    graduationById: limit1(
      `id = ${P}`,
      'sis.graduations',
    ).replace(
      '*',
      'id AS graduation_id, student_id, programme_id, graduation_date, status, grade, updated_at',
    ),
    programmeById: limit1(`id = ${P}`, 'sis.programmes').replace(
      '*',
      'id AS programme_id, name, level, metadata',
    ),
    transcriptByStudent: [
      'SELECT c.id AS course_id, c.name AS course_name, e.grade, e.credits,',
      '       e.completed_at',
      '  FROM sis.enrolments e',
      '  JOIN sis.courses c ON c.id = e.course_id',
      ` WHERE e.student_id = ${P}`,
      '   AND e.completed_at IS NOT NULL',
      ' ORDER BY e.completed_at DESC',
    ].join('\n'),
    institution: limit1(`id = ${P}`, 'sis.institution').replace('*', 'id AS institution_id, name, domain'),
    updateStatus: [
      'INSERT INTO sis.educreds_status_updates',
      '      (status, reason, entity_id, entity_type, updated_at)',
      `VALUES (${phList(4)}, now())`,
    ].join('\n'),
    createCredential: [
      'INSERT INTO sis.educreds_credentials',
      '      (credential_id, student_id, graduation_id, programme_id,',
      '       metadata_hash, encrypted_metadata_uri, issued_at)',
      `VALUES (${phList(7)})`,
    ].join('\n'),
  };
};

const connectionBlock = (i: ConnectorConfigBuildInput): string => {
  switch (i.adapterKind) {
    case 'postgres':
      return [
        '    connection:',
        '      host: ${SIS_DB_HOST}',
        '      port: ${SIS_DB_PORT}',
        '      database: ${SIS_DB_NAME}',
        '      user: ${SIS_DB_USER}',
        '      password: ${SIS_DB_PASSWORD}',
        '      ssl:',
        '        rejectUnauthorized: true',
      ].join('\n');
    case 'mysql':
      return [
        '    connection:',
        '      host: ${SIS_DB_HOST}',
        '      port: ${SIS_DB_PORT}',
        '      user: ${SIS_DB_USER}',
        '      password: ${SIS_DB_PASSWORD}',
        '      database: ${SIS_DB_NAME}',
      ].join('\n');
    case 'mssql':
      return [
        '    connection:',
        '      server: ${SIS_DB_HOST}',
        '      port: ${SIS_DB_PORT}',
        '      user: ${SIS_DB_USER}',
        '      password: ${SIS_DB_PASSWORD}',
        '      database: ${SIS_DB_NAME}',
        '      options:',
        '        encrypt: true',
        '        trustServerCertificate: false',
      ].join('\n');
    case 'oracle':
      return [
        '    connection:',
        '      user: ${SIS_DB_USER}',
        '      password: ${SIS_DB_PASSWORD}',
        '      connectString: ${SIS_DB_HOST}:1521/${SIS_DB_NAME}',
      ].join('\n');
    case 'sqlite':
      return [
        '    connection:',
        '      # Path to the .db file on the agent host (override via SIS_DB_FILE).',
        '      filename: ${SIS_DB_FILE}',
        '      options:',
        '        readonly: false',
        '        fileMustExist: false',
      ].join('\n');
  }
};

/** Build the on-prem agent's `connector-config.yaml` from UI inputs.
 *  Mirrors the CLI `buildConfig` so what the UI emits is exactly what
 *  `dist/cli.js init` would write. Secrets stay as ${ENV} refs. */
export const buildConnectorConfigYaml = (i: ConnectorConfigBuildInput): string => {
  const certDir = i.certDir || '/etc/educreds/certs';
  const mtls = i.mtls
    ? [
        '  mtls:',
        `    cert: ${certDir}/institution.crt`,
        `    key: ${certDir}/institution.key`,
        `    ca: ${certDir}/educreds-ca.crt`,
        '    requestCert: true',
        '    rejectUnauthorized: true',
      ].join('\n')
    : '# mtls: disabled — enable for production (see docs/PUBLISHING.md §9.2)';

  const signing = i.signingPublicKey
    ? `      signingPublicKey: "${i.signingPublicKey}"`
    : '      # signingPublicKey: "-----BEGIN PUBLIC KEY-----..."';

  const sqlLines = Object.entries(i.sql).map(([k, v]) => {
    if (v === undefined || v === '') return null;
    const indented = String(v)
      .split('\n')
      .map((line, idx) => (idx === 0 ? `        ${line}` : `           ${line}`))
      .join('\n');
    return `      ${k}: |\n${indented}`;
  }).filter(Boolean).join('\n');

  return [
    '# EduCreds Connector Agent — generated by the institution portal',
    '# Drop this on the agent host at /etc/educreds/connector-config.yaml,',
    '# place mTLS certs in /etc/educreds/certs/, then start the agent.',
    `institutionId: \${EDUCREDS_INSTITUTION_ID}`,
    'http:',
    '  host: 0.0.0.0',
    '  port: 8443',
    mtls,
    'security:',
    '  sharedSecret: ${EDUCREDS_CONNECTOR_SHARED_SECRET}',
    '  rateLimit: 300',
    'audit:',
    '  dir: /var/log/educreds/audit',
    'cloud:',
    '  callbackBaseUrl: https://api.educreds.xyz',
    'adapter:',
    `  kind: ${i.adapterKind}`,
    '  config:',
    '    institution:',
    `      institutionId: \${EDUCREDS_INSTITUTION_ID}`,
    '      name: "Institution"',
    '      domain: example.edu',
    signing,
    connectionBlock(i),
    '    sql:',
    sqlLines,
  ].join('\n');
};

const advancedProfileStorageKey = (institutionId: string) => `connector_advanced_profile:${institutionId}`;

export const getConnectorAdvancedProfile = (institutionId: string): ConnectorAdvancedProfile => {
  try {
    const raw = localStorage.getItem(advancedProfileStorageKey(institutionId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

/** Draft store only — the authoritative config is the downloaded YAML on the
 *  agent host. This persists form drafts across reloads. */
export const saveConnectorAdvancedProfile = (institutionId: string, profile: ConnectorAdvancedProfile) => {
  localStorage.setItem(advancedProfileStorageKey(institutionId), JSON.stringify(profile));
};

export const getConnectorConfig = async (_institutionId: string): Promise<ConnectorConfig> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch connector config');
  return response.json();
};

export const getConnectorStatus = async (): Promise<{
  institutionId: string;
  deploymentTier: string;
  connectorEndpoint: string | null;
  connectorApiUrl: string | null;
  webhookUrl: string | null;
  rotationStatus: any;
}> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/status`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch connector status');
  return response.json();
};

export const rotateConnectorSecret = async (): Promise<any> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/rotate-secret`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Failed to rotate connector secret');
  return response.json();
};

export const testWebhook = async (): Promise<{ success: boolean; statusCode?: number; error?: string; attempts: number }> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/webhook/test`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  if (!response.ok) throw new Error('Failed to test webhook');
  return response.json();
};

export const updateConnectorConfig = async (
  _institutionId: string,
  config: Partial<ConnectorConfig>
): Promise<any> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to update connector config');
  return response.json();
};

// ── P2-1: Test Connector Tunnel ───────────────────────────────────────────────
export const testConnectorTunnel = async (): Promise<{ reachable: boolean; latencyMs: number; error?: string }> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/test`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Failed to test connector');
  return response.json();
};

/** Live health from GET /api/institutions/connector/health.
 *  Falls back to POST /connector/test only when the health route is missing (404). */
export const getConnectorHealth = async (): Promise<{
  reachable: boolean;
  latencyMs: number;
  authValid?: boolean;
  error?: string;
}> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/health`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (response.status === 404) {
    return testConnectorTunnel();
  }
  if (!response.ok) {
    throw new Error(`Connector health failed (${response.status})`);
  }
  const data: unknown = await response.json();
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const status = typeof record.status === 'string' ? record.status : '';
  const reachable =
    record.reachable === true ||
    record.ok === true ||
    status === 'healthy' ||
    status === 'ok';
  return {
    reachable,
    latencyMs: typeof record.latencyMs === 'number' ? record.latencyMs : 0,
    authValid: typeof record.authValid === 'boolean' ? record.authValid : reachable,
    error: typeof record.error === 'string' ? record.error : undefined,
  };
};

// ── P2-2: Sync History ────────────────────────────────────────────────────────
export interface SyncHistoryItem {
  id: string;
  syncedAt: string;
  recordsPulled: number;
  credentialsIssued: number;
  status: 'completed' | 'partial' | 'failed';
  errorMessage: string | null;
}

export const getConnectorSyncHistory = async (): Promise<SyncHistoryItem[]> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/sync-history`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch sync history');
  return response.json();
};

// ── P2-3: Sync Schedule ───────────────────────────────────────────────────────
export const updateConnectorSchedule = async (
  syncInterval: 'hourly' | 'daily' | 'weekly' | 'manual',
  syncTime?: string,
): Promise<{ success: boolean }> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/schedule`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ syncInterval, syncTime }),
  });
  if (!response.ok) throw new Error('Failed to update sync schedule');
  return response.json();
};

// ── P2-4: Test Cloud Connection ───────────────────────────────────────────────
export const testCloudConnection = async (
  endpoint?: string,
  apiKey?: string,
): Promise<{ reachable: boolean; latencyMs: number; authValid: boolean; error?: string }> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/test-cloud`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, apiKey }),
  });
  if (!response.ok) throw new Error('Failed to test cloud connection');
  return response.json();
};

/**
 * Test the URL the admin typed, before it is saved on Activate.
 * POST /connector/test only hits the stored endpoint, so on-prem uses
 * /connector/test-cloud which accepts `endpoint` in the body.
 */
export const testProvidedConnectorUrl = async (
  endpoint: string,
): Promise<{ reachable: boolean; latencyMs: number; authValid?: boolean; error?: string }> => {
  const trimmed = endpoint.trim().replace(/\/$/, '');
  if (!trimmed) {
    return { reachable: false, latencyMs: 0, authValid: false, error: 'Enter the Connector URL first.' };
  }
  const looksLikeHealth = /\/healthz?$/i.test(trimmed);
  const probeUrl = looksLikeHealth ? trimmed : `${trimmed}/health`;
  return testCloudConnection(probeUrl);
};

// ── Phase 2: Shared Cloud Connector Provisioning ──────────────────────────

export interface CloudProvisionRequest {
  sisVendor: string;
  sisBaseUrl: string;
  authType: string;
  credentials: Record<string, string>;
  authConfig?: Record<string, any>;
  pollingIntervalMinutes?: number;
  mappings?: ConnectorFieldMapping[];
}

export interface CloudProvisionResponse {
  message: string;
  institutionId: string;
  cloudConnectorConfigId: string;
  deploymentTier: 'cloud-connector';
  useSharedCloudConnector: true;
}

export interface CloudConnectorStatus {
  provisioned: boolean;
  cloudConnectorConfigId?: string;
  connected?: boolean;
  latencyMs?: number;
  error?: string;
  message?: string;
}

/**
 * Provision the institution for shared cloud connector (Phase 2).
 * Creates connector config + stores creds + links institution + enables routing.
 */
export const provisionCloudConnector = async (
  request: CloudProvisionRequest,
): Promise<CloudProvisionResponse> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/provision-cloud`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Provisioning failed: ${errText}`);
  }
  return response.json();
};

/**
 * Get shared cloud connector status for the institution.
 */
export const getCloudConnectorStatus = async (): Promise<CloudConnectorStatus> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/cloud-status`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch cloud connector status');
  return response.json();
};

// ── Vendor Auth Types ─────────────────────────────────────────────────────

export const SIS_AUTH_TYPES = [
  { id: 'api_key', label: 'API Key', fields: ['api_key'] },
  { id: 'bearer_token', label: 'Bearer Token', fields: ['bearer_token'] },
  { id: 'basic_auth', label: 'Basic Auth (Username/Password)', fields: ['username', 'password'] },
  {
    id: 'oauth2_client_credentials',
    label: 'OAuth2 Client Credentials',
    fields: ['client_id', 'client_secret', 'token_url'],
  },
  { id: 'custom_header', label: 'Custom Header', fields: ['header_name', 'header_value'] },
] as const;

export type AuthTypeId = typeof SIS_AUTH_TYPES[number]['id'];

// ── Extended SIS Vendor List (Phase 2) ────────────────────────────────────

export const SIS_VENDORS = [
  { id: 'generic-rest', label: 'Generic REST API', hint: '' },
  { id: 'moodle', label: 'Moodle', hint: 'https://your-moodle.edu/webservice/rest' },
  { id: 'odoo', label: 'Odoo Education', hint: 'https://your-odoo.edu/api' },
  { id: 'opensis', label: 'OpenSIS', hint: 'https://your-opensis.edu/api' },
  { id: 'powerschool', label: 'PowerSchool', hint: 'https://your-powerschool.edu/api' },
  { id: 'banner', label: 'Ellucian Banner', hint: 'https://your-banner.edu/api' },
  { id: 'workday', label: 'Workday', hint: 'https://your-tenant.workday.com' },
  { id: 'sap', label: 'SAP SuccessFactors', hint: 'https://api.successfactors.com' },
  { id: 'oracle', label: 'Oracle Cloud HCM', hint: 'https://your-tenant.fa.oraclecloud.com' },
  { id: 'custom-webhook', label: 'Custom Webhook', hint: '' },
] as const;

export const DEFAULT_SIS_FIELDS = [
  'student_id',
  'email',
  'first_name',
  'last_name',
  'grad_date',
  'programme_name',
] as const;

export interface SisSchemaResponse {
  fields: string[];
}

const FIELD_OBJECT_KEYS = ['name', 'field', 'id', 'key', 'column', 'sisField'] as const;

export const normalizeSisFields = (raw: unknown): string[] => {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { fields?: unknown }).fields)
      ? (raw as { fields: unknown[] }).fields
      : [];
  const names = list
    .map((entry) => {
      if (typeof entry === 'string' && entry.trim()) return entry.trim();
      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        for (const key of FIELD_OBJECT_KEYS) {
          const value = record[key];
          if (typeof value === 'string' && value.trim()) return value.trim();
        }
      }
      return null;
    })
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)];
};

export const getSisSchema = async (): Promise<SisSchemaResponse> => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/sis-schema`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (response.status === 404) {
    return { fields: [...DEFAULT_SIS_FIELDS] };
  }
  if (!response.ok) {
    throw new Error(`SIS schema failed (${response.status})`);
  }
  const data: unknown = await response.json();
  const fields = normalizeSisFields(data);
  if (fields.length === 0) {
    return { fields: [...DEFAULT_SIS_FIELDS] };
  }
  return { fields };
};

const fieldMappingStorageKey = (institutionId: string) => `connector_field_mappings:${institutionId}`;

export interface ConnectorFieldMapping {
  educredsField: string;
  sisField: string;
}

const normalizeFieldMappings = (value: unknown): ConnectorFieldMapping[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (row): row is ConnectorFieldMapping =>
      Boolean(row) &&
      typeof row === 'object' &&
      typeof (row as ConnectorFieldMapping).educredsField === 'string' &&
      typeof (row as ConnectorFieldMapping).sisField === 'string',
  );
};

export const getSavedFieldMappings = (institutionId: string): ConnectorFieldMapping[] => {
  try {
    const raw = localStorage.getItem(fieldMappingStorageKey(institutionId));
    if (!raw) return [];
    return normalizeFieldMappings(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
};

/** Prefer server mappings; fall back to the local cache when the API is unavailable. */
export const loadFieldMappings = async (institutionId: string): Promise<ConnectorFieldMapping[]> => {
  const authToken = getAuthToken();
  try {
    const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/field-mappings`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.ok) {
      const data: unknown = await response.json();
      const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      const mappings = normalizeFieldMappings(record.mappings ?? data);
      if (mappings.length > 0) {
        saveFieldMappings(institutionId, mappings);
        return mappings;
      }
    }
  } catch {
    // Use local cache below.
  }
  return getSavedFieldMappings(institutionId);
};

export const saveFieldMappings = (institutionId: string, mappings: ConnectorFieldMapping[]): void => {
  localStorage.setItem(fieldMappingStorageKey(institutionId), JSON.stringify(mappings));
};

export const persistFieldMappings = async (
  institutionId: string,
  mappings: ConnectorFieldMapping[],
): Promise<void> => {
  saveFieldMappings(institutionId, mappings);
  const authToken = getAuthToken();
  const response = await fetch(`${API_CONFIG.INSTITUTIONS.BASE}/connector/field-mappings`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mappings }),
  });
  if (!response.ok) {
    throw new Error(`Could not save field mappings (${response.status})`);
  }
};
