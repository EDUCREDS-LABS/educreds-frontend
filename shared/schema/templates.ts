import { randomUUID } from 'crypto';
import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { CertificateData, TemplateField, TemplateVariant as TemplateVariantType } from '../types/template';

export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  fields: jsonb('fields').$type<TemplateField[]>().notNull(),
  design: text('design').notNull(),
  previewImage: text('preview_image').notNull(),
  price: integer('price').notNull(),
  currency: text('currency').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const templateVariants = pgTable('template_variants', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  templateId: text('template_id').notNull(),
  institutionId: text('institution_id').notNull(),
  name: text('name').notNull(),
  customizations: jsonb('customizations').$type<TemplateVariantType['customizations']>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const issuedCertificates = pgTable('issued_certificates', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  templateId: text('template_id').notNull(),
  variantId: text('variant_id'),
  institutionId: text('institution_id').notNull(),
  data: jsonb('data').$type<CertificateData>().notNull(),
  certificateHash: text('certificate_hash').notNull(),
  blockchainTxHash: text('blockchain_tx_hash'),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  status: text('status').notNull().default('issued'),
});
