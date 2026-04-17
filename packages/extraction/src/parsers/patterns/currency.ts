export type AmountMatch = {
	amount: number;
	currency: string | null;
	raw: string;
	index: number;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
	$: "AUD", // AU bias, refined by context clues
	"€": "EUR",
	"£": "GBP",
	"¥": "JPY",
};

const CURRENCY_CODES = [
	"AUD",
	"USD",
	"EUR",
	"GBP",
	"NZD",
	"CAD",
	"JPY",
	"SGD",
	"HKD",
];

function parseAmount(raw: string): number | null {
	// Remove commas, spaces, and currency symbols
	let cleaned = raw.replace(/[,\s]/g, "");
	const negative = cleaned.startsWith("(") && cleaned.endsWith(")");
	if (negative) cleaned = cleaned.slice(1, -1);
	cleaned = cleaned.replace(/^[^\d.-]+/, "").replace(/[^\d.-]+$/, "");
	const num = Number.parseFloat(cleaned);
	if (Number.isNaN(num)) return null;
	return negative ? -num : num;
}

/**
 * Extract currency amounts from text.
 */
export function extractAmounts(text: string): AmountMatch[] {
	const results: AmountMatch[] = [];

	// Detect explicit currency code in text
	let detectedCurrency: string | null = null;
	for (const code of CURRENCY_CODES) {
		if (text.includes(code)) {
			detectedCurrency = code;
			break;
		}
	}

	// $1,234.56 or ($1,234.56) for negatives
	const symbolRe = /(\(?\s*[$€£¥]\s*[\d,]+(?:\.\d{1,2})?\s*\)?)/g;
	for (const m of text.matchAll(symbolRe)) {
		const raw = m[1] as string;
		const amount = parseAmount(raw);
		if (amount === null) continue;
		const symbolMatch = raw.match(/[$€£¥]/);
		let currency = symbolMatch
			? (CURRENCY_SYMBOLS[symbolMatch[0] as string] ?? null)
			: null;
		// If we detected an explicit code, use it to override $ ambiguity
		if (currency === "AUD" && detectedCurrency && detectedCurrency !== "AUD") {
			currency = detectedCurrency;
		}
		results.push({
			amount,
			currency,
			raw: m[0] as string,
			index: m.index ?? 0,
		});
	}

	// CODE $1,234.56 or CODE 1,234.56
	const codeRe =
		/\b(AUD|USD|EUR|GBP|NZD|CAD|SGD|HKD)\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\b/gi;
	for (const m of text.matchAll(codeRe)) {
		const amount = parseAmount(m[2] as string);
		if (amount === null) continue;
		results.push({
			amount,
			currency: (m[1] as string).toUpperCase(),
			raw: m[0] as string,
			index: m.index ?? 0,
		});
	}

	return results;
}

/**
 * Detect the primary currency used in the document.
 */
export function detectCurrency(text: string): string | null {
	for (const code of CURRENCY_CODES) {
		if (text.toUpperCase().includes(code)) return code;
	}
	// Check for dollar sign — default to AUD
	if (/\$/.test(text)) return "AUD";
	if (/€/.test(text)) return "EUR";
	if (/£/.test(text)) return "GBP";
	return null;
}
