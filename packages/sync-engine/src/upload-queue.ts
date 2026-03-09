import { createEventEmitter } from "./event-emitter";
import type {
	UploadAdapter,
	UploadEvent,
	UploadItem,
	UploadTransport,
} from "./types";

export interface UploadQueueConfig {
	maxRetries?: number;
	baseBackoffMs?: number;
}

export class UploadQueue {
	private adapter: UploadAdapter;
	private transport: UploadTransport;
	private events = createEventEmitter<UploadEvent>();
	private processing = false;
	private paused = false;
	private maxRetries: number;
	private baseBackoffMs: number;

	onEvent = this.events.onEvent;

	constructor(
		adapter: UploadAdapter,
		transport: UploadTransport,
		config: UploadQueueConfig = {},
	) {
		this.adapter = adapter;
		this.transport = transport;
		this.maxRetries = config.maxRetries ?? 3;
		this.baseBackoffMs = config.baseBackoffMs ?? 1000;
	}

	get isProcessing() {
		return this.processing;
	}

	pause() {
		this.paused = true;
	}

	resume() {
		this.paused = false;
		this.processQueue();
	}

	async enqueue(item: {
		id: string;
		todoId: string;
		fileUri: string;
		mimeType: string;
	}): Promise<void> {
		await this.adapter.addToQueue({
			...item,
			status: "queued",
			retryCount: 0,
			createdAt: new Date().toISOString(),
		});
		this.processQueue();
	}

	async retry(itemId: string): Promise<void> {
		await this.adapter.updateStatus(itemId, "queued");
		await this.adapter.updateRetry(itemId, 0);
		this.processQueue();
	}

	private async processItem(item: UploadItem): Promise<void> {
		await this.adapter.updateStatus(item.id, "uploading");

		this.events.emit({
			type: "upload:start",
			timestamp: new Date().toISOString(),
			detail: `Uploading file for todo ${item.todoId}`,
			itemId: item.id,
			todoId: item.todoId,
		});

		try {
			const result = await this.transport.upload({
				todoId: item.todoId,
				fileUri: item.fileUri,
				mimeType: item.mimeType,
				idempotencyKey: item.id,
			});

			await this.adapter.markCompleted(item.id, result.attachmentUrl);

			this.events.emit({
				type: "upload:complete",
				timestamp: new Date().toISOString(),
				detail: `Upload complete: ${result.attachmentUrl}`,
				itemId: item.id,
				todoId: item.todoId,
			});
		} catch (error) {
			await this.handleUploadError(item, error);
		}
	}

	private async handleUploadError(
		item: UploadItem,
		error: unknown,
	): Promise<void> {
		const newRetryCount = item.retryCount + 1;

		if (newRetryCount >= this.maxRetries) {
			await this.adapter.updateRetry(item.id, newRetryCount);
			await this.adapter.markFailed(item.id);
			await this.transport.onFailed?.(item.todoId, item.fileUri);

			this.events.emit({
				type: "upload:error",
				timestamp: new Date().toISOString(),
				detail: `Upload failed after ${this.maxRetries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
				itemId: item.id,
				todoId: item.todoId,
			});
		} else {
			await this.adapter.updateStatus(item.id, "queued");
			await this.adapter.updateRetry(item.id, newRetryCount);

			const backoff = this.baseBackoffMs * 2 ** (newRetryCount - 1);
			await new Promise((resolve) => setTimeout(resolve, backoff));

			this.events.emit({
				type: "upload:error",
				timestamp: new Date().toISOString(),
				detail: `Upload attempt ${newRetryCount} failed, retrying in ${backoff}ms`,
				itemId: item.id,
				todoId: item.todoId,
			});
		}
	}

	async processQueue(): Promise<void> {
		if (this.processing || this.paused) return;
		this.processing = true;

		try {
			let item = await this.adapter.getNextQueued();

			while (item && !this.paused) {
				await this.processItem(item);
				item = await this.adapter.getNextQueued();
			}
		} finally {
			this.processing = false;
		}
	}
}
