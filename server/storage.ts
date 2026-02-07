import { users, institutions, apiKeys, subscriptions, type User, type InsertUser, type ApiKey, type InsertApiKey, type Institution, type Subscription } from "@shared/schema";
import { db } from "./lib/db";
import { eq, and } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // API Keys
  createApiKey(key: InsertApiKey & { institutionId: string, keyHash: string, prefix: string, isActive: boolean, createdAt: Date }): Promise<ApiKey>;
  getApiKeys(institutionId: string): Promise<ApiKey[]>;
  getApiKey(id: string): Promise<ApiKey | undefined>;
  revokeApiKey(id: string): Promise<void>;

  // Institutions
  getInstitution(id: string): Promise<Institution | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // API Key Implementation
  async createApiKey(keyData: InsertApiKey & { institutionId: string, keyHash: string, prefix: string, isActive: boolean, createdAt: Date }): Promise<ApiKey> {
    const [apiKey] = await db.insert(apiKeys).values({
      ...keyData,
      expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt) : null,
    }).returning();
    return apiKey;
  }

  async getApiKeys(institutionId: string): Promise<ApiKey[]> {
    return db.select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.institutionId, institutionId),
          eq(apiKeys.isActive, true)
        )
      );
  }

  async getApiKey(id: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return apiKey;
  }

  async revokeApiKey(id: string): Promise<void> {
    await db.update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id));
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution;
  }
}

export const storage = new DatabaseStorage();
