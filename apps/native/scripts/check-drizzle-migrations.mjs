import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
	buildManifestSource,
	getDrizzlePaths,
	readJournal,
} from "./drizzle-manifest-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const { drizzleDir, journalPath, outputPath } = getDrizzlePaths(appRoot);
const journal = readJournal(journalPath);

function fail(message) {
	console.error(`Native Drizzle validation failed: ${message}`);
	process.exit(1);
}

function readJson(filePath) {
	return JSON.parse(readFileSync(filePath, "utf8"));
}

function splitMigrationStatements(sql) {
	return sql
		.split(/-->\s*statement-breakpoint/g)
		.map((statement) => statement.trim())
		.filter(Boolean);
}

function executeMigration(db, sql, filePath) {
	for (const statement of splitMigrationStatements(sql)) {
		try {
			db.exec(statement);
		} catch (error) {
			fail(
				`${path.basename(filePath)} contains invalid SQL.\nStatement: ${statement}\nError: ${error.message}`,
			);
		}
	}
}

function validateFilesAndSnapshots() {
	const manifestSource = readFileSync(outputPath, "utf8");
	const expectedManifestSource = buildManifestSource(journal);

	if (manifestSource !== expectedManifestSource) {
		fail(
			"drizzle/migrations.ts is out of date. Run `pnpm --filter native db:generate:manifest`.",
		);
	}

	let previousSnapshotId = "00000000-0000-0000-0000-000000000000";

	for (const entry of journal.entries) {
		const sqlPath = path.join(drizzleDir, `${entry.tag}.sql`);
		const snapshotPath = path.join(
			drizzleDir,
			"meta",
			`${entry.tag.split("_")[0]}_snapshot.json`,
		);

		if (!existsSync(sqlPath)) {
			fail(`Missing SQL file for journal entry ${entry.tag}.`);
		}

		if (!existsSync(snapshotPath)) {
			fail(`Missing snapshot file for journal entry ${entry.tag}.`);
		}

		const snapshot = readJson(snapshotPath);

		if (snapshot.prevId !== previousSnapshotId) {
			fail(
				`Snapshot chain is broken at ${path.basename(snapshotPath)}. Expected prevId ${previousSnapshotId}, received ${snapshot.prevId}.`,
			);
		}

		previousSnapshotId = snapshot.id;
	}
}

function replayAllMigrations() {
	const db = new DatabaseSync(":memory:");

	for (const entry of journal.entries) {
		const sqlPath = path.join(drizzleDir, `${entry.tag}.sql`);
		const sql = readFileSync(sqlPath, "utf8");
		executeMigration(db, sql, sqlPath);
	}

	db.close();
}

function verifyUploadQueueUpgrade() {
	if (journal.entries.length < 2) {
		return;
	}

	const db = new DatabaseSync(":memory:");
	const priorEntries = journal.entries.slice(0, -1);
	const latestEntry = journal.entries.at(-1);

	for (const entry of priorEntries) {
		const sqlPath = path.join(drizzleDir, `${entry.tag}.sql`);
		const sql = readFileSync(sqlPath, "utf8");
		executeMigration(db, sql, sqlPath);
	}

	const tableInfo = db
		.prepare("PRAGMA table_info('upload_queue')")
		.all()
		.map((column) => column.name);

	const latestSql = readFileSync(
		path.join(drizzleDir, `${latestEntry.tag}.sql`),
		"utf8",
	);

	const rewritesUploadQueue =
		tableInfo.includes("todo_id") &&
		latestSql.includes("entity_id") &&
		latestSql.includes("upload_queue_old");

	if (!rewritesUploadQueue) {
		db.close();
		return;
	}

	db.exec(`
		INSERT INTO upload_queue (
			id,
			todo_id,
			file_uri,
			mime_type,
			status,
			retry_count,
			created_at
		) VALUES (
			'u1',
			't1',
			'file:///tmp/demo.png',
			'image/png',
			'queued',
			0,
			'2026-03-14T00:00:00.000Z'
		)
	`);

	executeMigration(
		db,
		latestSql,
		path.join(drizzleDir, `${latestEntry.tag}.sql`),
	);

	const migrated = db
		.prepare(
			"SELECT id, entity_type, entity_id, file_uri, mime_type, status, retry_count, created_at FROM upload_queue WHERE id = 'u1'",
		)
		.get();

	if (!migrated) {
		fail(
			`Latest migration ${latestEntry.tag} dropped upload_queue rows during rewrite.`,
		);
	}

	if (migrated.entity_type !== "todo" || migrated.entity_id !== "t1") {
		fail(
			`Latest migration ${latestEntry.tag} did not preserve upload_queue identifiers during rewrite.`,
		);
	}

	db.close();
}

validateFilesAndSnapshots();
replayAllMigrations();
verifyUploadQueueUpgrade();
