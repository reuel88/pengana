import type { FinancialDocument, PartialFinancialDocument } from "../types";
import { detectCurrency } from "./patterns/currency";
import { detectDocumentType } from "./patterns/document-type";
import { extractFields } from "./patterns/fields";
import { extractLineItems } from "./patterns/line-items";

const FIELD_KEYS: (keyof FinancialDocument)[] = [
	"documentType",
	"vendor",
	"date",
	"dueDate",
	"referenceNumber",
	"lineItems",
	"subtotal",
	"taxAmount",
	"total",
	"currency",
];

function isPopulated(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === "string") return value.length > 0;
	return true;
}

export function calculateCoverage(doc: PartialFinancialDocument): number {
	let populated = 0;
	for (const key of FIELD_KEYS) {
		if (isPopulated(doc[key])) populated++;
	}
	return populated / FIELD_KEYS.length;
}

export function regexParse(fullText: string): {
	document: PartialFinancialDocument;
	coverage: number;
} {
	const documentType = detectDocumentType(fullText);
	const fields = extractFields(fullText);
	const lineItems = extractLineItems(fullText);
	const currency = detectCurrency(fullText);

	const document: PartialFinancialDocument = {
		documentType,
		vendor: fields.vendor,
		date: fields.date,
		dueDate: fields.dueDate,
		referenceNumber: fields.referenceNumber,
		lineItems,
		subtotal: fields.subtotal,
		taxAmount: fields.taxAmount,
		total: fields.total,
		currency,
		notes: null,
	};

	return { document, coverage: calculateCoverage(document) };
}
