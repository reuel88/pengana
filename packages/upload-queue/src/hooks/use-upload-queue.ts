import { useCallback, useEffect, useRef, useState } from "react";

import { UploadQueue } from "../core/upload-queue";
import type {
	UploadAdapter,
	UploadEvent,
	UploadLifecycleCallbacks,
	UploadTransport,
} from "../types";

/** Max number of upload events kept in devtools log */
const MAX_UPLOAD_EVENT_LOG_SIZE = 99;

export interface EnqueueUploadParams {
	fileUri: string;
	mimeType: string;
	mediaId: string;
	entityType?: string;
	entityId?: string;
	scopeType?: "personal" | "org";
}

export interface UseUploadQueueOptions {
	/** Factory that creates the storage adapter for persisting queued upload entries. */
	createUploadAdapter: () => UploadAdapter;
	/** Factory that creates the transport used to send files to the server. */
	createUploadTransport: () => UploadTransport;
	/** Optional callbacks invoked at each stage of an upload's lifecycle (e.g. progress, retry). */
	lifecycleCallbacks?: UploadLifecycleCallbacks;
	/** Called after each upload settles (success or lifecycle callbacks complete). Useful for triggering app-level side effects like syncing. */
	onSettled?: () => void;
}

/**
 * Manages a file upload queue with online/offline awareness.
 *
 * Creates an {@link UploadQueue} scoped to `scopeId` and automatically pauses
 * or resumes processing when connectivity changes. Queued files are uploaded
 * via the transport provided in `options` and persisted through the adapter.
 *
 * @param scopeId - Unique identifier that scopes the queue (e.g. org or user ID).
 *   Changing this value tears down the current queue and creates a new one.
 * @param isOnline - Whether the client currently has network connectivity.
 *   The queue is paused while offline and resumed when back online.
 * @param options - Factories and callbacks for configuring the queue.
 * @returns `isUploading` — true while a file is actively uploading;
 *   `uploadEvents` — rolling log of upload lifecycle events (capped at 99);
 *   `enqueueUpload` — stable callback to add a file to the queue.
 */
export function useUploadQueue(
	scopeId: string,
	isOnline: boolean,
	options: UseUploadQueueOptions,
) {
	const {
		createUploadAdapter,
		createUploadTransport,
		lifecycleCallbacks,
		onSettled,
	} = options;

	// --- State ---
	const uploadQueueRef = useRef<UploadQueue | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadEvents, setUploadEvents] = useState<UploadEvent[]>([]);

	const isOnlineRef = useRef(isOnline);
	isOnlineRef.current = isOnline;
	const onSettledRef = useRef(onSettled);
	onSettledRef.current = onSettled;

	// biome-ignore lint/correctness/useExhaustiveDependencies: onSettledRef is a stable ref
	useEffect(() => {
		setIsUploading(false);
		setUploadEvents([]);

		const uploadAdapter = createUploadAdapter();
		const uploadTransport = createUploadTransport();
		const queue = new UploadQueue(uploadAdapter, uploadTransport, {
			lifecycleCallbacks,
		});
		uploadQueueRef.current = queue;

		const unsubscribe = queue.onEvent((event) => {
			setUploadEvents((prev) => [
				...prev.slice(-(MAX_UPLOAD_EVENT_LOG_SIZE - 1)),
				event,
			]);
			if (event.type === "upload:start") setIsUploading(true);
			if (event.type === "upload:complete" || event.type === "upload:error") {
				setIsUploading(false);
			}
			if (event.type === "upload:complete") {
				onSettledRef.current?.();
			}
		});

		if (isOnlineRef.current) {
			queue.resume();
		}

		return () => {
			unsubscribe();
			uploadQueueRef.current = null;
			setIsUploading(false);
			setUploadEvents([]);
		};
	}, [scopeId]);

	useEffect(() => {
		if (isOnline) {
			uploadQueueRef.current?.resume();
		} else {
			uploadQueueRef.current?.pause();
		}
	}, [isOnline]);

	/**
	 * Add a file to the upload queue.
	 */
	const enqueueUpload = useCallback((params: EnqueueUploadParams) => {
		uploadQueueRef.current?.enqueue({
			id: params.mediaId,
			fileUri: params.fileUri,
			mimeType: params.mimeType,
			entityType: params.entityType,
			entityId: params.entityId,
			scopeType: params.scopeType,
		});
	}, []);

	return {
		isUploading,
		uploadEvents,
		enqueueUpload,
	};
}
