import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// Users Table (per better-auth requirements + Phase 1 needs)
export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	email: varchar("email", { length: 255 }).notNull().unique(),
	emailVerified: boolean("email_verified").default(false),
	name: varchar("name", { length: 255 }),
	image: text("image"),
	password: text("password"), // For password auth; NULL if OIDC only
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

// Sessions Table (per D-08: 30-day sessions, D-09: multiple per user)
export const sessions = pgTable("sessions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }), // Optional: audit trail
	userAgent: varchar("user_agent", { length: 500 }), // Device tracking
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

// API Keys Table (per D-18 to D-30)
export const apiKeys = pgTable("api_keys", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(), // D-28: User-defined label
	secretHash: text("secret_hash").notNull(), // D-22: Never store plaintext
	permission: varchar("permission", { length: 20 }).notNull(), // 'read' | 'read_write' (D-19)
	expiresAt: timestamp("expires_at", { withTimezone: true }), // D-20: NULL = never expires
	lastUsedAt: timestamp("last_used_at", { withTimezone: true }), // D-29: Track usage
	revokedAt: timestamp("revoked_at", { withTimezone: true }), // NULL = active, timestamp = revoked
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

// API Key Scopes Table (per D-18: scoped by monitor group/tag)
export const apiKeyScopes = pgTable(
	"api_key_scopes",
	{
		apiKeyId: text("api_key_id")
			.notNull()
			.references(() => apiKeys.id, { onDelete: "cascade" }),
		scope: varchar("scope", { length: 255 }).notNull(), // Tag/group name
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.apiKeyId, table.scope] })],
);

// Accounts Table (for OIDC providers, deferred but scaffolded per D-02/D-03)
export const accounts = pgTable(
	"accounts",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		provider: varchar("provider", { length: 50 }).notNull(),
		providerAccountId: varchar("provider_account_id", {
			length: 255,
		}).notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		expiresAt: timestamp("expires_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.provider],
		}),
	],
);

// Relations for type safety
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	apiKeys: many(apiKeys),
	accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id],
	}),
	scopes: many(apiKeyScopes),
}));

export const apiKeyScopesRelations = relations(apiKeyScopes, ({ one }) => ({
	apiKey: one(apiKeys, {
		fields: [apiKeyScopes.apiKeyId],
		references: [apiKeys.id],
	}),
}));
