ALTER TABLE "check_results" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "incidents" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "monitors" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notification_channels" ALTER COLUMN "id" DROP DEFAULT;