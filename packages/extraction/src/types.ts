export type DocumentType = "invoice" | "receipt" | "statement" | "other";

export type LineItem = {
	description: string;
	quantity: number | null;
	unitPrice: number | null;
	amount: number;
};

export type FinancialDocument = {
	documentType: DocumentType;
	vendor: string | null;
	date: string | null;
	dueDate: string | null;
	referenceNumber: string | null;
	lineItems: LineItem[];
	subtotal: number | null;
	taxAmount: number | null;
	total: number | null;
	currency: string | null;
	notes: string | null;
};

export type ExtractionMethod = "regex" | "llm" | "hybrid";

export type ExtractionResult = {
	document: FinancialDocument;
	method: ExtractionMethod;
	coverage: number;
	durationMs: number;
};

export type PartialFinancialDocument = {
	[K in keyof FinancialDocument]?: FinancialDocument[K];
};
