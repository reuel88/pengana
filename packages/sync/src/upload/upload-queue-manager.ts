import type {
	EnqueueUploadParams,
	UploadAdapter,
	UploadEvent,
	UploadLifecycleCallbacks,
	UploadTransport,
} from "./types";
import { UploadQueue } from "./upload-queue";

/** Max number of upload events kept in the log */
const MAX_UPLOAD_EVENT_LOG_SIZE = 99;

export interface UploadQueueManagerOptions {
	createUploadAdapter: () => UploadAdapter;
	createUploadTransport: () => UploadTransport;
	lifecycleCallbacks?: UploadLifecycleCallbacks;
	onSettled?: () => void;
}

export interface UploadQueueState {
	isUploading: boolean;
	uploadEvents: UploadEvent[];
}

type Listener = (state: UploadQueueState) => void;

export class UploadQueueManager {
	private options: UploadQueueManagerOptions;
	private queue: UploadQueue | null = null;
	private unsubscribeQueue: (() => void) | null = null;
	private listeners = new Set<Listener>();

	private state: UploadQueueState = {
		isUploading: false,
		uploadEvents: [],
	};

	constructor(options: UploadQueueManagerOptions) {
		this.options = options;
	}

	init(_scopeId: string): void {
		this.teardown();

		const adapter = this.options.createUploadAdapter();
		const transport = this.options.createUploadTransport();
		const queue = new UploadQueue(adapter, transport, {
			lifecycleCallbacks: this.options.lifecycleCallbacks,
		});
		this.queue = queue;

		this.unsubscribeQueue = queue.onEvent((event) => {
			const uploadEvents = [
				...this.state.uploadEvents.slice(-(MAX_UPLOAD_EVENT_LOG_SIZE - 1)),
				event,
			];

			let isUploading = this.state.isUploading;
			if (event.type === "upload:start") isUploading = true;
			if (event.type === "upload:complete" || event.type === "upload:error") {
				isUploading = false;
			}
			if (event.type === "upload:complete") {
				this.options.onSettled?.();
			}

			this.setState({ isUploading, uploadEvents });
		});
	}

	setOnline(isOnline: boolean): void {
		if (isOnline) {
			this.queue?.resume();
		} else {
			this.queue?.pause();
		}
	}

	enqueue(params: EnqueueUploadParams): void {
		this.queue?.enqueue({
			id: params.mediaId,
			fileUri: params.fileUri,
			mimeType: params.mimeType,
			entityType: params.entityType,
			entityId: params.entityId,
			scopeType: params.scopeType,
		});
	}

	getState(): UploadQueueState {
		return this.state;
	}

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	dispose(): void {
		this.teardown();
		this.listeners.clear();
	}

	private teardown(): void {
		this.unsubscribeQueue?.();
		this.unsubscribeQueue = null;
		this.queue = null;
		this.setState({ isUploading: false, uploadEvents: [] });
	}

	private setState(next: UploadQueueState): void {
		this.state = next;
		for (const listener of this.listeners) {
			listener(this.state);
		}
	}
}
