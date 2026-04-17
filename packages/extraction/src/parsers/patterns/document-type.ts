import type { DocumentType } from "../../types";

const INVOICE_KEYWORDS = [
	"invoice",
	"bill to",
	"payment terms",
	"due date",
	"invoice number",
	"inv no",
	"purchase order",
];

const RECEIPT_KEYWORDS = [
	"receipt",
	"transaction",
	"change due",
	"payment received",
	"paid",
	"eftpos",
	"card ending",
	"subscription",
	"renewal",
	"reactivat",
	"billing cycle",
	"recurring",
	"plan",
	"tier",
	"charged",
	"payment confirmation",
];

const STATEMENT_KEYWORDS = [
	"statement",
	"account summary",
	"opening balance",
	"closing balance",
	"account number",
	"period ending",
];

function countKeywords(text: string, keywords: string[]): number {
	const lower = text.toLowerCase();
	return keywords.filter((kw) => lower.includes(kw)).length;
}

export function detectDocumentType(text: string): DocumentType {
	const invoiceScore = countKeywords(text, INVOICE_KEYWORDS);
	const receiptScore = countKeywords(text, RECEIPT_KEYWORDS);
	const statementScore = countKeywords(text, STATEMENT_KEYWORDS);

	const max = Math.max(invoiceScore, receiptScore, statementScore);
	if (max === 0) return "other";

	if (invoiceScore === max) return "invoice";
	if (receiptScore === max) return "receipt";
	return "statement";
}
