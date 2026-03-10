import { resolve } from "node:path";
import { config } from "dotenv";
import { Pool } from "pg";

// Load DATABASE_URL from the server app's .env (cwd is apps/e2e when run via pnpm)
config({ path: resolve(process.cwd(), "../server/.env") });

const TEST_EMAIL_PATTERN = "%@e2e.test";

export default async function globalTeardown() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL is not set. Aborting teardown to prevent connecting to an unintended database.",
		);
	}
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });

	try {
		const { rows: testUsers } = await pool.query<{ id: string }>(
			`SELECT id FROM "user" WHERE email LIKE $1`,
			[TEST_EMAIL_PATTERN],
		);

		if (testUsers.length === 0) return;

		const testUserIds = testUsers.map((u) => u.id);
		const idPlaceholders = testUserIds.map((_, i) => `$${i + 1}`).join(", ");

		// Find orgs where at least one member is a test user
		const { rows: memberships } = await pool.query<{ organizationId: string }>(
			`SELECT "organization_id" AS "organizationId" FROM member WHERE user_id IN (${idPlaceholders})`,
			testUserIds,
		);

		const testOrgIds = [...new Set(memberships.map((m) => m.organizationId))];

		// Delete orgs (cascades: member, teamMember, team, invitation)
		if (testOrgIds.length > 0) {
			const orgPlaceholders = testOrgIds.map((_, i) => `$${i + 1}`).join(", ");
			await pool.query(
				`DELETE FROM organization WHERE id IN (${orgPlaceholders})`,
				testOrgIds,
			);
		}

		// Delete test users (cascades: session, account, notification, todo)
		await pool.query(
			`DELETE FROM "user" WHERE id IN (${idPlaceholders})`,
			testUserIds,
		);
	} finally {
		await pool.end();
	}
}
