import { eq } from "drizzle-orm";
import { db } from "./index.ts";
import { monitorsTable } from "./schema.ts";

async function seed() {
	const httpName = "Example HTTP Monitor";
	const pingName = "Example Ping Monitor";

	// Idempotent: skip if already seeded
	const existing = await db
		.select({ name: monitorsTable.name })
		.from(monitorsTable)
		.where(eq(monitorsTable.name, httpName));

	if (existing.length > 0) {
		console.log("Seed data already exists — skipping.");
		process.exit(0);
	}

	await db.insert(monitorsTable).values([
		{
			name: httpName,
			type: "http",
			url: "https://example.com",
			interval: 60,
			enabled: true,
			showOnStatusPage: true,
			currentStatus: "pending",
			consecutiveFailures: 0,
			confirmationThreshold: 2,
		},
		{
			name: pingName,
			type: "ping",
			host: "1.1.1.1",
			interval: 30,
			enabled: true,
			showOnStatusPage: true,
			currentStatus: "pending",
			consecutiveFailures: 0,
			confirmationThreshold: 2,
		},
	]);

	console.log("Seeded 1 HTTP monitor and 1 ping monitor.");
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
