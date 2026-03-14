import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	buildManifestSource,
	getDrizzlePaths,
	readJournal,
} from "./drizzle-manifest-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const { journalPath, outputPath } = getDrizzlePaths(appRoot);
const journal = readJournal(journalPath);

writeFileSync(outputPath, buildManifestSource(journal), "utf8");
