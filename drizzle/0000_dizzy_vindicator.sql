CREATE TYPE "public"."check_status" AS ENUM('up', 'down', 'pending');--> statement-breakpoint
CREATE TYPE "public"."monitor_type" AS ENUM('http', 'ping');--> statement-breakpoint
CREATE TABLE "check_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"status" "check_status" NOT NULL,
	"response_time_ms" integer,
	"error_type" text,
	"http_status_code" integer,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"duration_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "monitor_notification_channels" (
	"monitor_id" uuid NOT NULL,
	"notification_channel_id" uuid NOT NULL,
	CONSTRAINT "monitor_notification_channels_monitor_id_notification_channel_id_pk" PRIMARY KEY("monitor_id","notification_channel_id")
);
--> statement-breakpoint
CREATE TABLE "monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "monitor_type" NOT NULL,
	"url" text,
	"host" text,
	"interval" integer DEFAULT 60 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"show_on_status_page" boolean DEFAULT true NOT NULL,
	"current_status" "check_status" DEFAULT 'pending' NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_alerted_at" timestamp,
	"confirmation_threshold" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"webhook_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_results" ADD CONSTRAINT "check_results_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor_notification_channels" ADD CONSTRAINT "monitor_notification_channels_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor_notification_channels" ADD CONSTRAINT "monitor_notification_channels_notification_channel_id_notification_channels_id_fk" FOREIGN KEY ("notification_channel_id") REFERENCES "public"."notification_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "check_results_monitor_id_checked_at_idx" ON "check_results" USING btree ("monitor_id","checked_at");