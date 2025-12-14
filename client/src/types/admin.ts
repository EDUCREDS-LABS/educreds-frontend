export type AdminRole = 'super_admin' | 'reviewer' | 'auditor' | 'blockchain_registrar';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  createdBy: string;
}

export type AdminPermission = 
  | 'view_dashboard'
  | 'review_institutions'
  | 'approve_institutions'
  | 'reject_institutions'
  | 'view_revenue'
  | 'export_revenue'
  | 'manage_blockchain'
  | 'register_blockchain'
  | 'authorize_blockchain'
  | 'manage_users'
  | 'create_users'
  | 'delete_users'
  | 'view_audit_logs'
  | 'system_settings';

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'view_dashboard',
    'review_institutions',
    'approve_institutions',
    'reject_institutions',
    'view_revenue',
    'export_revenue',
    'manage_blockchain',
    'register_blockchain',
    'authorize_blockchain',
    'manage_users',
    'create_users',
    'delete_users',
    'view_audit_logs',
    'system_settings'
  ],
  reviewer: [
    'view_dashboard',
    'review_institutions',
    'approve_institutions',
    'reject_institutions',
    'view_audit_logs'
  ],
  auditor: [
    'view_dashboard',
    'view_revenue',
    'export_revenue',
    'view_audit_logs'
  ],
  blockchain_registrar: [
    'view_dashboard',
    'manage_blockchain',
    'register_blockchain',
    'authorize_blockchain',
    'view_audit_logs'
  ]
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Administrator',
  reviewer: 'Institution Reviewer',
  auditor: 'Financial Auditor',
  blockchain_registrar: 'Blockchain Registrar'
};