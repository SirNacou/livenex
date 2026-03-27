import { pgTable, text, timestamp, uuid, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Base column definitions for reusability
export const baseColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

// Users table
export const users = pgTable(
  "users",
  {
    ...baseColumns,
    id: uuid("id").primaryKey().default(() => `user_${createId()}`),
    email: text("email").notNull().unique(),
    password: text("password"),
    name: text("name"),
    emailVerified: boolean("email_verified").default(false),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    deletedIdx: index("users_deleted_at_idx").on(table.deletedAt),
  })
);

// Sessions table (from better-auth)
export const sessions = pgTable(
  "sessions",
  {
    ...baseColumns,
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
    deletedIdx: index("sessions_deleted_at_idx").on(table.deletedAt),
  })
);

// API Keys table
export const apiKeys = pgTable(
  "api_keys",
  {
    ...baseColumns,
    id: uuid("id").primaryKey().default(() => `key_${createId()}`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull().unique(), // hashed API key
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true),
    permissions: text("permissions").default("read,write"), // comma-separated
  },
  (table) => ({
    userIdIdx: index("api_keys_user_id_idx").on(table.userId),
    keyIdx: index("api_keys_key_idx").on(table.key),
    isActiveIdx: index("api_keys_is_active_idx").on(table.isActive),
    deletedIdx: index("api_keys_deleted_at_idx").on(table.deletedAt),
  })
);

// Audit logs table
export const auditLogs = pgTable(
  "audit_logs",
  {
    ...baseColumns,
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // e.g., "user.created", "api_key.revoked"
    resourceType: text("resource_type"), // e.g., "user", "api_key", "monitor"
    resourceId: text("resource_id"), // ID of the affected resource
    changes: text("changes"), // JSON stringified object of what changed
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    resourceTypeIdx: index("audit_logs_resource_type_idx").on(table.resourceType),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  apiKeys: many(apiKeys),
  auditLogs: many(auditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
