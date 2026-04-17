const MONTH_NAMES: Record<string, number> = {
	jan: 1,
	january: 1,
	feb: 2,
	february: 2,
	mar: 3,
	march: 3,
	apr: 4,
	april: 4,
	may: 5,
	jun: 6,
	june: 6,
	jul: 7,
	july: 7,
	aug: 8,
	august: 8,
	sep: 9,
	september: 9,
	oct: 10,
	october: 10,
	nov: 11,
	november: 11,
	dec: 12,
	december: 12,
};

function toIsoDate(year: number, month: number, day: number): string | null {
	if (year < 1900 || year > 2100) return null;
	if (month < 1 || month > 12) return null;
	if (day < 1 || day > 31) return null;
	const y = String(year).padStart(4, "0");
	const m = String(month).padStart(2, "0");
	const d = String(day).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function expandYear(y: number): number {
	if (y >= 100) return y;
	return y >= 50 ? 1900 + y : 2000 + y;
}

type DateMatch = { date: string; index: number };

/**
 * Extract dates from text. AU locale bias: DD/MM/YYYY preferred over MM/DD/YYYY.
 */
export function extractDates(text: string): DateMatch[] {
	const results: DateMatch[] = [];
	const seen = new Set<string>();

	function add(date: string | null, index: number) {
		if (date && !seen.has(`${date}:${index}`)) {
			seen.add(`${date}:${index}`);
			results.push({ date, index });
		}
	}

	// ISO: YYYY-MM-DD
	for (const m of text.matchAll(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/g)) {
		add(toIsoDate(Number(m[1]), Number(m[2]), Number(m[3])), m.index ?? 0);
	}

	// DD/MM/YYYY or DD-MM-YYYY (AU bias: first number is day)
	for (const m of text.matchAll(
		/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/g,
	)) {
		const day = Number(m[1]);
		const month = Number(m[2]);
		const year = expandYear(Number(m[3]));
		// AU bias: DD/MM/YYYY
		add(toIsoDate(year, month, day), m.index ?? 0);
	}

	// Natural: "1 Jan 2025", "January 1, 2025", "1st January 2025"
	const monthPattern = Object.keys(MONTH_NAMES).join("|");
	const naturalRe = new RegExp(
		`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})[,.]?\\s+(\\d{2,4})\\b`,
		"gi",
	);
	for (const m of text.matchAll(naturalRe)) {
		const day = Number(m[1]);
		const month = MONTH_NAMES[(m[2] as string).toLowerCase()] as number;
		const year = expandYear(Number(m[3]));
		add(toIsoDate(year, month, day), m.index ?? 0);
	}

	// "January 1, 2025"
	const naturalRe2 = new RegExp(
		`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?[,.]?\\s+(\\d{2,4})\\b`,
		"gi",
	);
	for (const m of text.matchAll(naturalRe2)) {
		const month = MONTH_NAMES[(m[1] as string).toLowerCase()] as number;
		const day = Number(m[2]);
		const year = expandYear(Number(m[3]));
		add(toIsoDate(year, month, day), m.index ?? 0);
	}

	return results;
}
