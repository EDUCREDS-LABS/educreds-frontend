import { z } from "zod";

// User schemas
export const institutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  walletAddress: z.string(),
  registrationNumber: z.string(),
  isVerified: z.boolean(),
  verificationStatus: z.enum(['pending', 'approved', 'rejected', 'not_submitted']),
  contactInfo: z.object({
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  verificationDocuments: z.array(z.object({
    type: z.string(),
    description: z.string(),
    url: z.string(),
    originalName: z.string(),
  })).optional(),
  createdAt: z.date(),
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

export const subscriptionSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  planId: z.string(),
  status: z.enum(['active', 'cancelled', 'expired']),
  currentPeriodEnd: z.string(),
  createdAt: z.date(),
});

// Insert schemas
export const insertInstitutionSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  plan: z.string(),
  contactInfo: z.object({
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertCertificateSchema = z.object({
  studentAddress: z.string().min(1, "Student wallet address is required"),
  studentName: z.string().min(1, "Student name is required"),
  courseName: z.string().min(1, "Course name is required"),
  grade: z.string().optional(),
  completionDate: z.string().optional(),
  certificateType: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

// Generic User schema for authentication
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  createdAt: z.date(),
});

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Types
export type Institution = z.infer<typeof institutionSchema>;
export type Student = z.infer<typeof studentSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type User = z.infer<typeof userSchema>;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
