import type { LineItem } from "../../types";

/**
 * Attempt to extract line items from OCR text.
 * Uses heuristics: look for table-like patterns with descriptions and amounts.
 */
export function extractLineItems(text: string): LineItem[] {
	const lines = text
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);
	const items: LineItem[] = [];

	// Find a header row that suggests a table
	let tableStartIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		const lower = (lines[i] as string).toLowerCase();
		if (
			(lower.includes("description") || lower.includes("item")) &&
			(lower.includes("amount") ||
				lower.includes("total") ||
				lower.includes("price"))
		) {
			tableStartIdx = i;
			break;
		}
	}

	if (tableStartIdx >= 0) {
		// Parse lines after header until we hit a total/subtotal/blank
		for (let i = tableStartIdx + 1; i < lines.length; i++) {
			const line = lines[i] as string;

			// Stop at subtotal/total lines
			if (/^\s*(sub\s*total|total|tax|gst|vat)/i.test(line)) break;
			if (line.length < 3) break;

			const item = parseLineItemRow(line);
			if (item) items.push(item);
		}
	}

	// If no table found, try generic pattern: text followed by dollar amount at end
	if (items.length === 0) {
		for (const line of lines) {
			// Skip header-like or total lines
			if (
				/^\s*(sub\s*total|total|tax|gst|vat|date|invoice|receipt)/i.test(line)
			)
				continue;

			const item = parseLineItemRow(line);
			if (item) items.push(item);
		}
		// Only keep if we found a reasonable number (not every line)
		if (items.length > lines.length * 0.5) {
			items.length = 0; // Too many matches = false positives
		}
	}

	// Try narrative-style items: "Plan Name - $XX.XX/mo" or "Subscription ... $XX.XX"
	if (items.length === 0) {
		for (const line of lines) {
			const item = parseNarrativeItem(line);
			if (item) items.push(item);
		}
	}

	return items;
}

function parseLineItemRow(line: string): LineItem | null {
	// Pattern: description ... optional qty x price ... $amount
	// e.g., "Widget 2 x $10.00 $20.00"
	// e.g., "Consulting Services $500.00"
	// e.g., "Item A    2    $15.00    $30.00"

	// Extract all dollar amounts from the line
	const amountMatches = [...line.matchAll(/\$?\s*([\d,]+\.\d{2})\b/g)];
	if (amountMatches.length === 0) return null;

	// The last amount is the line total
	const lastAmount = amountMatches[
		amountMatches.length - 1
	] as RegExpMatchArray;
	const amount = Number.parseFloat((lastAmount[1] as string).replace(/,/g, ""));
	if (Number.isNaN(amount) || amount === 0) return null;

	// Description is everything before the first amount
	const firstAmount = amountMatches[0] as RegExpMatchArray;
	let description = line.slice(0, firstAmount.index).trim();

	// Try to extract quantity from description
	let quantity: number | null = null;
	let unitPrice: number | null = null;

	// Check for "qty x price" pattern in description
	const qtyMatch = description.match(/(\d+)\s*[x×@]\s*/i);
	if (qtyMatch) {
		quantity = Number.parseInt(qtyMatch[1] as string, 10);
		description = description.slice(0, qtyMatch.index).trim();
	}

	// If we have 3+ amounts: qty, unit price, total
	if (amountMatches.length >= 3 && !quantity) {
		quantity = Number.parseFloat(
			(amountMatches[0] as RegExpMatchArray)[1]?.replace(/,/g, "") ?? "",
		);
		unitPrice = Number.parseFloat(
			(amountMatches[1] as RegExpMatchArray)[1]?.replace(/,/g, "") ?? "",
		);
		description = line
			.slice(0, (amountMatches[0] as RegExpMatchArray).index)
			.trim();
	} else if (amountMatches.length >= 2 && quantity) {
		unitPrice = Number.parseFloat(
			(amountMatches[0] as RegExpMatchArray)[1]?.replace(/,/g, "") ?? "",
		);
	}

	// Clean up description
	description = description.replace(/[\s\-–—]+$/, "").trim();
	if (!description || description.length < 2) return null;

	return { description, quantity, unitPrice, amount };
}

/**
 * Parse narrative-style line items common in subscription/SaaS documents.
 * e.g., "Premium Plan - $29.99/mo", "Pro Tier $99.00/year"
 */
function parseNarrativeItem(line: string): LineItem | null {
	// Match lines containing subscription-like keywords followed by a price
	const subscriptionRe =
		/(.+?(?:plan|tier|subscription|membership|license|seat|renewal|service).*?)[\s\-–—]+[$€£¥]?\s*([\d,]+\.\d{2})(?:\s*\/\s*(?:mo|month|yr|year|week|day))?\s*$/i;
	const m = line.match(subscriptionRe);
	if (!m) return null;

	const description = (m[1] as string).replace(/[\s\-–—]+$/, "").trim();
	const amount = Number.parseFloat((m[2] as string).replace(/,/g, ""));

	if (
		!description ||
		description.length < 2 ||
		Number.isNaN(amount) ||
		amount === 0
	) {
		return null;
	}

	return { description, quantity: 1, unitPrice: amount, amount };
}
