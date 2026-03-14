import type {
	UploadAdapter,
	UploadEvent,
	UploadItem,
	UploadLifecycleCallbacks,
	UploadTransport,
} from "../types";
import { createEventEmitter } from "./event-emitter";

export interface UploadQueueConfig {
	maxRetries?: number;
	baseBackoffMs?: number;
	lifecycleCallbacks?: UploadLifecycleCallbacks;
}

export class UploadQueue {
	private adapter: UploadAdapter;
	private transport: UploadTransport;
	private events = createEventEmitter<UploadEvent>();
	private processing = false;
	private paused = false;
	private maxRetries: number;
	private baseBackoffMs: number;
	private lifecycleCallbacks?: UploadLifecycleCallbacks;

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
		this.lifecycleCallbacks = config.lifecycleCallbacks;
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
		entityType: string;
		entityId: string;
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
			detail: `Uploading file for ${item.entityType} ${item.entityId}`,
			itemId: item.id,
			entityType: item.entityType,
			entityId: item.entityId,
		});

		try {
			const result = await this.transport.upload({
				entityType: item.entityType,
				entityId: item.entityId,
				fileUri: item.fileUri,
				mimeType: item.mimeType,
				idempotencyKey: item.id,
			});

			await this.adapter.markCompleted(item.id, result.attachmentUrl);
			await this.lifecycleCallbacks?.onCompleted(
				item.entityType,
				item.entityId,
				result.attachmentUrl,
			);

			this.events.emit({
				type: "upload:complete",
				timestamp: new Date().toISOString(),
				detail: `Upload complete: ${result.attachmentUrl}`,
				itemId: item.id,
				entityType: item.entityType,
				entityId: item.entityId,
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
			try {
				await this.transport.onFailed?.(
					item.entityType,
					item.entityId,
					item.fileUri,
				);
			} catch (onFailedError) {
				console.error("transport.onFailed threw:", onFailedError);
			}
			try {
				await this.lifecycleCallbacks?.onFailed(item.entityType, item.entityId);
			} catch (lcError) {
				console.error("lifecycleCallbacks.onFailed threw:", lcError);
			}

			this.events.emit({
				type: "upload:error",
				timestamp: new Date().toISOString(),
				detail: `Upload failed after ${this.maxRetries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
				itemId: item.id,
				entityType: item.entityType,
				entityId: item.entityId,
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
				entityType: item.entityType,
				entityId: item.entityId,
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
