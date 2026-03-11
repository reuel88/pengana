export class StorageFullError extends Error {
	constructor(message = "Storage quota exceeded") {
		super(message);
		this.name = "StorageFullError";
	}
}

/** Detects quota-exceeded errors across platforms (IndexedDB, SQLite, StorageFullError). */
export function isQuotaError(error: unknown): boolean {
	if (error instanceof StorageFullError) return true;

	if (error instanceof DOMException) {
		// QuotaExceededError: name-based (modern browsers) or code 22 (legacy)
		return error.name === "QuotaExceededError" || error.code === 22;
	}

	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		return msg.includes("quotaexceedederror") || msg.includes("sqlite_full");
	}

	return false;
}
