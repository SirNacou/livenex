import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

// --- Enums ---

export const monitorType = pgEnum("monitor_type", ["http", "ping"]);
export const checkStatus = pgEnum("check_status", ["up", "down", "pending"]);

// --- monitors ---

export const monitorsTable = pgTable("monitors", {
	id: uuid().primaryKey().$defaultFn(uuidv7),
	name: text().notNull(),
	type: monitorType().notNull(),
	url: text(),
	host: text(),
	interval: integer().notNull().default(60),
	enabled: boolean().notNull().default(true),
	showOnStatusPage: boolean("show_on_status_page").notNull().default(true),
	currentStatus: checkStatus("current_status").notNull().default("pending"),
	consecutiveFailures: integer("consecutive_failures").notNull().default(0),
	lastAlertedAt: timestamp("last_alerted_at"),
	confirmationThreshold: integer("confirmation_threshold").notNull().default(2),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- check_results ---

// Composite index on (monitor_id, checked_at DESC) — required for performance at scale.
// DESC intent is documented here; enforce via raw SQL migration if needed.
export const checkResultsMonitorCheckedAtIdx = index(
	"check_results_monitor_id_checked_at_idx",
);

export const checkResultsTable = pgTable(
	"check_results",
	{
		id: uuid().primaryKey().$defaultFn(uuidv7),
		monitorId: uuid("monitor_id")
			.notNull()
			.references(() => monitorsTable.id, { onDelete: "cascade" }),
		status: checkStatus().notNull(),
		responseTimeMs: integer("response_time_ms"),
		// Possible values: connection_refused, dns_error, timeout, wrong_status, icmp_failed
		errorType: text("error_type"),
		httpStatusCode: integer("http_status_code"),
		checkedAt: timestamp("checked_at").notNull().defaultNow(),
	},
	(table) => [
		index("check_results_monitor_id_checked_at_idx").on(
			table.monitorId,
			table.checkedAt,
		),
	],
);

// --- incidents ---

export const incidentsTable = pgTable("incidents", {
	id: uuid().primaryKey().$defaultFn(uuidv7),
	monitorId: uuid("monitor_id")
		.notNull()
		.references(() => monitorsTable.id, { onDelete: "cascade" }),
	startedAt: timestamp("started_at").notNull().defaultNow(),
	resolvedAt: timestamp("resolved_at"),
	durationSeconds: integer("duration_seconds"),
});

// --- notification_channels ---

export const notificationChannelsTable = pgTable("notification_channels", {
	id: uuid().primaryKey().$defaultFn(uuidv7),
	name: text().notNull(),
	// Possible values: 'discord', 'slack'
	type: text().notNull(),
	webhookUrl: text("webhook_url").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- monitor_notification_channels (join table) ---

export const monitorNotificationChannelsTable = pgTable(
	"monitor_notification_channels",
	{
		monitorId: uuid("monitor_id")
			.notNull()
			.references(() => monitorsTable.id, { onDelete: "cascade" }),
		notificationChannelId: uuid("notification_channel_id")
			.notNull()
			.references(() => notificationChannelsTable.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({
			columns: [table.monitorId, table.notificationChannelId],
		}),
	],
);
