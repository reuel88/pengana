import { useCallback, useState } from "react";

import { client } from "@/shared/api/orpc";
import { OCR_ACCEPTED_MIME_TYPES } from "./constants";

type ExtractionDocument = {
	documentType: "invoice" | "receipt" | "statement" | "other";
	vendor: string | null;
	date: string | null;
	dueDate: string | null;
	referenceNumber: string | null;
	lineItems: {
		description: string;
		quantity: number | null;
		unitPrice: number | null;
		amount: number;
	}[];
	subtotal: number | null;
	taxAmount: number | null;
	total: number | null;
	currency: string | null;
	notes: string | null;
};

type ExtractionResult = {
	document: ExtractionDocument;
	method: "regex" | "llm" | "hybrid";
	coverage: number;
	durationMs: number;
};

type OcrExtractResult = {
	ocr: {
		fullText: string;
		confidence: number;
		pageCount: number;
		durationMs: number;
	};
	extraction: ExtractionResult;
};

export type OcrPipelineState =
	| { status: "idle" }
	| { status: "uploading"; fileName: string }
	| { status: "processing"; fileName: string }
	| { status: "done"; fileName: string; result: OcrExtractResult }
	| { status: "error"; fileName: string; error: string };

function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result as string;
			const base64 = dataUrl.split(",")[1];
			if (!base64) {
				reject(new Error("Failed to read file"));
				return;
			}
			resolve(base64);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

export function useOcrPipeline() {
	const [state, setState] = useState<OcrPipelineState>({ status: "idle" });

	const startOcr = useCallback(async (file: File) => {
		const mimeType = file.type;
		if (!(OCR_ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
			setState({
				status: "error",
				fileName: file.name,
				error: `Unsupported file type: ${mimeType}`,
			});
			return;
		}

		try {
			setState({ status: "uploading", fileName: file.name });

			const base64 = await readFileAsBase64(file);
			const uploadResult = await client.upload.upload({
				fileName: file.name,
				mimeType: mimeType as (typeof OCR_ACCEPTED_MIME_TYPES)[number],
				data: base64,
				idempotencyKey: crypto.randomUUID(),
				attachmentId: crypto.randomUUID(),
			});

			const mediaId = uploadResult.data.mediaId;

			setState({ status: "processing", fileName: file.name });

			const extractResult = await client.ocr.extract({ mediaId });

			setState({
				status: "done",
				fileName: file.name,
				result: extractResult.data,
			});
		} catch (err) {
			setState({
				status: "error",
				fileName: file.name,
				error: err instanceof Error ? err.message : "OCR failed",
			});
		}
	}, []);

	const reset = useCallback(() => {
		setState({ status: "idle" });
	}, []);

	return { state, startOcr, reset };
}
