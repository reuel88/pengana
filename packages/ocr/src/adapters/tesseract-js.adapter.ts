import { createWorker, type Worker } from "tesseract.js";
import type { OcrAdapter, OcrPageResult } from "../types";

/**
 * Server-side OCR adapter using tesseract.js (pure JavaScript, no system dependencies).
 * Lazily initializes a Tesseract worker and reuses it across calls.
 */
export class TesseractJsAdapter implements OcrAdapter {
	readonly name = "tesseract.js";
	private worker: Worker | null = null;
	private initPromise: Promise<Worker> | null = null;
	private currentLanguages: string | null = null;

	private async getWorker(languages: string[]): Promise<Worker> {
		const langStr = languages.join("+");

		// Reinitialize if languages changed
		if (this.initPromise && this.currentLanguages !== langStr) {
			await this.dispose();
		}

		if (!this.initPromise) {
			this.currentLanguages = langStr;
			this.initPromise = createWorker(langStr).then((w) => {
				this.worker = w;
				return w;
			});
		}

		return this.initPromise;
	}

	async recognizeImage(
		imageBuffer: Buffer,
		options: { languages: string[] },
	): Promise<OcrPageResult> {
		const worker = await this.getWorker(options.languages);
		const { data } = await worker.recognize(imageBuffer);

		return {
			page: 1,
			text: data.text,
			confidence: data.confidence,
		};
	}

	async dispose(): Promise<void> {
		if (this.worker) {
			await this.worker.terminate();
			this.worker = null;
		}
		this.initPromise = null;
		this.currentLanguages = null;
	}
}
