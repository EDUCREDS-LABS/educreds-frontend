import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Institutions Table
export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  walletAddress: text("walletAddress").notNull().unique(), // CamelCase to match TypeORM
  registrationNumber: text("registrationNumber").notNull(),
  did: text("did"),
  didDocumentIPFSHash: text("didDocumentIPFSHash"),
  verificationDocumentsIPFSHash: text("verificationDocumentsIPFSHash"),
  isVerified: boolean("isVerified").default(false).notNull(),
  verificationStatus: text("verificationStatus").default('not_submitted').notNull(),
  poicScore: integer("poicScore"),
  blockchainRegistered: boolean("blockchainRegistered").default(false),
  blockchainTxHash: text("blockchainTxHash"),
  blockchainRegistrationDate: timestamp("blockchainRegistrationDate"),
  blockchainError: text("blockchainError"),
  blockchainAuthorized: boolean("blockchainAuthorized").default(false),
  blockchainAuthTxHash: text("blockchainAuthTxHash"),
  blockchainAuthorizationDate: timestamp("blockchainAuthorizationDate"),
  iinTokenId: integer("iinTokenId"),
  iinMintTxHash: text("iinMintTxHash"),
  contactInfo: jsonb("contactInfo"),
  verificationDocuments: jsonb("verificationDocuments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// API Keys Table
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institutionId").references(() => institutions.id).notNull(),
  keyHash: text("keyHash").notNull().unique(),
  prefix: text("prefix").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  lastUsedAt: timestamp("lastUsedAt"),
  isActive: boolean("isActive").default(true).notNull(),
});

// Subscriptions Table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id").references(() => institutions.id).notNull(),
  planId: text("plan_id").notNull(),
  status: text("status", { enum: ['active', 'cancelled', 'expired'] }).default('active').notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Select/Insert Schemas derived from tables
export const userSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);

export const institutionSchema = createSelectSchema(institutions);
export const insertInstitutionSchema = createInsertSchema(institutions);

export const apiKeySchema = createSelectSchema(apiKeys);
export const insertApiKeySchema = createInsertSchema(apiKeys);

export const subscriptionSchema = createSelectSchema(subscriptions);

// Additional schemas and refinements
export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const requestSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  templateId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  requestData: z.record(z.any()), // flexible JSON data for form inputs
  submissionDate: z.date(),
  reviewedAt: z.date().optional(),
  reviewedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  walletAddress: z.string(),
  createdAt: z.date(),
});

export const certificateSchema = z.object({
  id: z.string(),
  studentAddress: z.string(),
  studentName: z.string(),
  courseName: z.string(),
  grade: z.string(),
  ipfsHash: z.string(),
  completionDate: z.date(),
  certificateType: z.string(),
  issuedBy: z.string(),
  institutionName: z.string(),
  issuedAt: z.date(),
  isValid: z.boolean(),
  isMinted: z.boolean(),
  tokenId: z.number().optional(),
  mintedTo: z.string().optional(),
  mintedAt: z.date().optional(),
});

// Types
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = typeof institutions.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;

export type Student = z.infer<typeof studentSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type Request = z.infer<typeof requestSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
