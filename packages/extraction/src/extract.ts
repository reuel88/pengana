import { llmParse } from "./parsers/llm-parser";
import { calculateCoverage, regexParse } from "./parsers/regex-parser";
import type {
	ExtractionMethod,
	ExtractionResult,
	FinancialDocument,
	PartialFinancialDocument,
} from "./types";

export type ExtractOptions = {
	anthropicApiKey?: string;
	coverageThreshold?: number;
	forceLlm?: boolean;
	skipLlm?: boolean;
};

const DEFAULT_DOCUMENT: FinancialDocument = {
	documentType: "other",
	vendor: null,
	date: null,
	dueDate: null,
	referenceNumber: null,
	lineItems: [],
	subtotal: null,
	taxAmount: null,
	total: null,
	currency: null,
	notes: null,
};

function toFullDocument(partial: PartialFinancialDocument): FinancialDocument {
	return { ...DEFAULT_DOCUMENT, ...partial };
}

function mergeDocuments(
	regex: PartialFinancialDocument,
	llm: FinancialDocument,
): FinancialDocument {
	const merged: FinancialDocument = { ...DEFAULT_DOCUMENT };

	for (const key of Object.keys(
		DEFAULT_DOCUMENT,
	) as (keyof FinancialDocument)[]) {
		const regexVal = regex[key];
		const llmVal = llm[key];

		if (key === "lineItems") {
			// Prefer LLM line items if it found any, otherwise keep regex
			const llmItems = llmVal as FinancialDocument["lineItems"];
			const regexItems = regexVal as FinancialDocument["lineItems"] | undefined;
			merged.lineItems = llmItems.length > 0 ? llmItems : (regexItems ?? []);
		} else {
			// LLM value takes precedence when both exist; regex fills gaps
			(merged as Record<string, unknown>)[key] =
				llmVal ?? regexVal ?? DEFAULT_DOCUMENT[key];
		}
	}

	return merged;
}

export async function extractFinancialData(
	fullText: string,
	options?: ExtractOptions,
): Promise<ExtractionResult> {
	const start = performance.now();
	const threshold = options?.coverageThreshold ?? 0.5;

	// Step 1: Regex parse (unless force LLM)
	let regexResult: {
		document: PartialFinancialDocument;
		coverage: number;
	} | null = null;
	if (!options?.forceLlm) {
		regexResult = regexParse(fullText);
	}

	// Step 2: Check if regex is sufficient
	if (regexResult && regexResult.coverage >= threshold && !options?.forceLlm) {
		return {
			document: toFullDocument(regexResult.document),
			method: "regex",
			coverage: regexResult.coverage,
			durationMs: Math.round(performance.now() - start),
		};
	}

	// Step 3: LLM fallback
	const canUseLlm = options?.anthropicApiKey && !options.skipLlm;
	if (canUseLlm) {
		const llmResult = await llmParse(
			fullText,
			regexResult?.document ?? null,
			options.anthropicApiKey as string,
		);

		if (llmResult) {
			let method: ExtractionMethod = options?.forceLlm ? "llm" : "hybrid";
			let document: FinancialDocument;

			if (regexResult) {
				document = mergeDocuments(regexResult.document, llmResult);
			} else {
				document = llmResult;
				method = "llm";
			}

			return {
				document,
				method,
				coverage: calculateCoverage(document),
				durationMs: Math.round(performance.now() - start),
			};
		}
	}

	// Step 4: Return regex-only result
	return {
		document: toFullDocument(regexResult?.document ?? {}),
		method: "regex",
		coverage: regexResult?.coverage ?? 0,
		durationMs: Math.round(performance.now() - start),
	};
}
