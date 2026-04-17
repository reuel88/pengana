import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { FinancialDocument, PartialFinancialDocument } from "../types";

const financialDocumentSchema = z.object({
	documentType: z.enum(["invoice", "receipt", "statement", "other"]),
	vendor: z.string().nullable(),
	date: z.string().nullable(),
	dueDate: z.string().nullable(),
	referenceNumber: z.string().nullable(),
	lineItems: z.array(
		z.object({
			description: z.string(),
			quantity: z.number().nullable(),
			unitPrice: z.number().nullable(),
			amount: z.number(),
		}),
	),
	subtotal: z.number().nullable(),
	taxAmount: z.number().nullable(),
	total: z.number().nullable(),
	currency: z.string().nullable(),
	notes: z.string().nullable(),
});

const SYSTEM_PROMPT = `You are a financial document parser. Extract structured data from OCR text.

Return a JSON object with these fields:
- documentType: "invoice" | "receipt" | "statement" | "other"
- vendor: company/merchant name or null
- date: document date in ISO format (YYYY-MM-DD) or null
- dueDate: payment due date in ISO format or null
- referenceNumber: invoice/receipt/reference number or null
- lineItems: array of { description, quantity (number or null), unitPrice (number or null), amount (number) }
- subtotal: number or null
- taxAmount: tax/GST/VAT amount or null
- total: total amount or null
- currency: ISO 4217 code (e.g., "AUD", "USD") or null
- notes: any other relevant financial info or null

Return ONLY valid JSON, no markdown fences or explanation.`;

export async function llmParse(
	fullText: string,
	partialDoc: PartialFinancialDocument | null,
	apiKey: string,
): Promise<FinancialDocument | null> {
	const client = new Anthropic({ apiKey });

	let userMessage = `Extract structured financial data from this OCR text:\n\n${fullText}`;

	if (partialDoc) {
		const populated = Object.entries(partialDoc)
			.filter(
				([, v]) =>
					v !== null &&
					v !== undefined &&
					!(Array.isArray(v) && v.length === 0),
			)
			.map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
			.join("\n");

		if (populated) {
			userMessage += `\n\nA regex parser already extracted these fields (validate and supplement):\n${populated}`;
		}
	}

	try {
		const response = await client.messages.create({
			model: "claude-sonnet-4-20250514",
			max_tokens: 2048,
			system: SYSTEM_PROMPT,
			messages: [{ role: "user", content: userMessage }],
		});

		const textBlock = response.content.find((b) => b.type === "text");
		if (!textBlock || textBlock.type !== "text") return null;

		const parsed = JSON.parse(textBlock.text);
		const result = financialDocumentSchema.safeParse(parsed);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}
