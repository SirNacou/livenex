import { z } from "zod";

/**
 * Zod validation schemas for API requests and responses
 */

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
});

// Monitor schemas (placeholder for Phase 1)
export const createMonitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  method: z.enum(["GET", "POST", "HEAD"]).default("GET"),
  interval: z.number().min(30).default(60),
  timeout: z.number().min(1000).default(10000),
  tags: z.array(z.string()).default([]),
});

// Channel schemas (placeholder for Phase 1)
export const createChannelSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["email", "webhook", "slack", "discord"]),
  config: z.record(z.string(), z.unknown()),
});

// API Key schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()).default(["read"]),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
export type CreateMonitorRequest = z.infer<typeof createMonitorSchema>;
export type CreateChannelRequest = z.infer<typeof createChannelSchema>;
export type CreateApiKeyRequest = z.infer<typeof createApiKeySchema>;
