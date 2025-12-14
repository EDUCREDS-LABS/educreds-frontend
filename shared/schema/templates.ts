// Mock database tables for development
export const templates = {
  tableName: 'templates',
  id: { primaryKey: true, defaultRandom: () => Math.random().toString(36).substr(2, 9) },
  name: { notNull: true },
  category: { notNull: true },
  description: { notNull: true },
  fields: { notNull: true },
  design: { notNull: true },
  previewImage: { notNull: true },
  createdAt: { defaultNow: () => new Date() },
  updatedAt: { defaultNow: () => new Date() }
};

export const templateVariants = {
  tableName: 'template_variants',
  id: { primaryKey: true, defaultRandom: () => Math.random().toString(36).substr(2, 9) },
  templateId: { notNull: true },
  institutionId: { notNull: true },
  name: { notNull: true },
  customizations: { notNull: true },
  createdAt: { defaultNow: () => new Date() },
  updatedAt: { defaultNow: () => new Date() }
};

export const issuedCertificates = {
  tableName: 'issued_certificates',
  id: { primaryKey: true, defaultRandom: () => Math.random().toString(36).substr(2, 9) },
  templateId: { notNull: true },
  variantId: {},
  institutionId: { notNull: true },
  data: { notNull: true },
  certificateHash: { notNull: true },
  blockchainTxHash: {},
  issuedAt: { defaultNow: () => new Date() },
  status: { notNull: true, default: 'issued' }
};
