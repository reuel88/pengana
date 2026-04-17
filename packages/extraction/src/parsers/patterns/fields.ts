import { extractDates } from "./dates";

type FieldResult = {
	referenceNumber: string | null;
	date: string | null;
	dueDate: string | null;
	vendor: string | null;
	subtotal: number | null;
	taxAmount: number | null;
	total: number | null;
};

function matchLabelValue(text: string, pattern: RegExp): string | null {
	const m = text.match(pattern);
	return m?.[1]?.trim() ?? null;
}

function parseNumber(s: string | null): number | null {
	if (!s) return null;
	const cleaned = s.replace(/[,\s$€£¥]/g, "");
	const num = Number.parseFloat(cleaned);
	return Number.isNaN(num) ? null : num;
}

export function extractFields(text: string): FieldResult {
	// Reference number — broadened for subscriptions, accounts, confirmations
	const referenceNumber =
		matchLabelValue(
			text,
			/(?:invoice|inv|receipt|ref|reference|order|subscription|account|customer|confirmation|transaction)\s*(?:#|id|no\.?|number|num)?\s*[:.]?\s*([A-Za-z0-9\-_/]+)/i,
		) ?? matchLabelValue(text, /(?:#|no\.?)\s*[:.]?\s*([A-Za-z0-9\-_/]+)/i);

	// Amounts — broadened for subscriptions and renewals
	const subtotal = parseNumber(
		matchLabelValue(
			text,
			/(?:sub\s*total|subtotal)\s*[:.]?\s*[$€£¥]?\s*([\d,.]+)/i,
		),
	);
	const taxAmount = parseNumber(
		matchLabelValue(
			text,
			/(?:tax|gst|vat|hst)\s*(?:\(\d+%?\))?\s*[:.]?\s*[$€£¥]?\s*([\d,.]+)/i,
		),
	);
	const total = parseNumber(
		matchLabelValue(
			text,
			/(?:total\s*(?:amount|due)?|amount\s*(?:due|charged)|balance\s*due|grand\s*total|renewal\s*amount|billing\s*amount|charge(?:d)?|price|payment\s*amount)\s*[:.]?\s*[$€£¥]?\s*([\d,.]+)/i,
		),
	);

	// Dates — broadened for subscription/renewal/billing contexts
	const dateLabelMatch = text.match(
		/(?:invoice\s*date|date\s*of\s*issue|bill(?:ing)?\s*date|reactivation\s*date|renewal\s*date|effective\s*date|transaction\s*date|payment\s*date|date)\s*[:.]?\s*(.{6,30})/i,
	);
	let date: string | null = null;
	if (dateLabelMatch?.[1]) {
		const dates = extractDates(dateLabelMatch[1]);
		date = dates[0]?.date ?? null;
	}
	if (!date) {
		const allDates = extractDates(text);
		date = allDates[0]?.date ?? null;
	}

	const dueDateMatch = text.match(
		/(?:due\s*date|payment\s*due|pay\s*by|next\s*billing(?:\s*date)?|renew(?:s|al)?\s*(?:on|date)?)\s*[:.]?\s*(.{6,30})/i,
	);
	let dueDate: string | null = null;
	if (dueDateMatch?.[1]) {
		const dates = extractDates(dueDateMatch[1]);
		dueDate = dates[0]?.date ?? null;
	}

	// Vendor — broadened to check for email-style "from" and service provider patterns
	let vendor = matchLabelValue(
		text,
		/(?:from|bill\s*from|sold\s*by|vendor|supplier|merchant|company|provider|service)\s*[:.]?\s*(.+)/i,
	);

	if (!vendor) {
		// First meaningful line (skip short lines, numbers-only lines, common headers)
		const lines = text
			.split("\n")
			.map((l) => l.trim())
			.filter(Boolean);
		for (const line of lines) {
			if (line.length < 3) continue;
			if (/^\d+$/.test(line)) continue;
			if (
				/^(invoice|receipt|statement|tax|date|page|your\s|hi\s|hello|dear)/i.test(
					line,
				)
			)
				continue;
			vendor = line;
			break;
		}
	}

	return { referenceNumber, date, dueDate, vendor, subtotal, taxAmount, total };
}
