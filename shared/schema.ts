import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin schema
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  username: true,
  password: true,
});

// Referral token schema
export const referralTokens = pgTable("referral_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralTokenSchema = createInsertSchema(referralTokens).pick({
  token: true,
});

// Reseller schema
export const resellers = pgTable("resellers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(0),
  keysGenerated: integer("keys_generated").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResellerSchema = createInsertSchema(resellers).pick({
  username: true,
  email: true,
  password: true,
});

// Key schema
export const keys = pgTable("keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  game: text("game").notNull(),
  deviceLimit: integer("device_limit").notNull(),
  devicesUsed: integer("devices_used").notNull().default(0),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status").notNull().default("active"),
  resellerId: integer("reseller_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertKeySchema = createInsertSchema(keys).pick({
  key: true,
  game: true,
  deviceLimit: true,
  expiryDate: true,
  resellerId: true,
});

// Device schema
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  keyId: integer("key_id").notNull(),
  hwid: text("hwid").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  keyId: true,
  hwid: true,
});

// Types
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export type InsertReferralToken = z.infer<typeof insertReferralTokenSchema>;
export type ReferralToken = typeof referralTokens.$inferSelect;

export type InsertReseller = z.infer<typeof insertResellerSchema>;
export type Reseller = typeof resellers.$inferSelect & {
  apiUsage?: {
    totalRequests: number;
    lastRequest: Date;
    usageByDate: Record<string, number>;
    usageByKey: Record<string, number>;
  };
};

export type InsertKey = z.infer<typeof insertKeySchema>;
export type Key = typeof keys.$inferSelect;

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

// Validation schemas
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const resellerLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const resellerRegistrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralToken: z.string().min(1, "Referral token is required"),
});

export const addCreditsSchema = z.object({
  resellerId: z.number(),
  amount: z.number().positive("Amount must be positive")
});

export const generateKeySchema = z.object({
  game: z.string().min(1, "Game is required"),
  deviceLimit: z.coerce.number().int().positive(),
  customKey: z.string().optional(),
  expiryDate: z.string().min(1, "Expiry date is required")
});

export const verifyKeySchema = z.object({
  key: z.string().min(1, "Key is required"),
  hwid: z.string().min(1, "Hardware ID is required")
});
