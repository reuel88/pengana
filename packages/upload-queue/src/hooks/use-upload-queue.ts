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

export interface UseUploadQueueOptions {
	createUploadAdapter: () => UploadAdapter;
	createUploadTransport: () => UploadTransport;
	lifecycleCallbacks?: UploadLifecycleCallbacks;
	onUploadComplete?: () => void;
}

export function useUploadQueue(
	scopeId: string,
	isOnline: boolean,
	options: UseUploadQueueOptions,
) {
	const {
		createUploadAdapter,
		createUploadTransport,
		lifecycleCallbacks,
		onUploadComplete,
	} = options;

	// --- State ---
	const uploadQueueRef = useRef<UploadQueue | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadEvents, setUploadEvents] = useState<UploadEvent[]>([]);

	const isOnlineRef = useRef(isOnline);
	isOnlineRef.current = isOnline;
	const onUploadCompleteRef = useRef(onUploadComplete);
	onUploadCompleteRef.current = onUploadComplete;

	// biome-ignore lint/correctness/useExhaustiveDependencies: onUploadCompleteRef is a stable ref
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
				onUploadCompleteRef.current?.();
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

	const enqueueUpload = useCallback(
		(
			fileUri: string,
			mimeType: string,
			mediaId: string,
			entityType?: string,
			entityId?: string,
			scopeType?: "personal" | "org",
		) => {
			uploadQueueRef.current?.enqueue({
				id: mediaId,
				fileUri,
				mimeType,
				entityType,
				entityId,
				scopeType,
			});
		},
		[],
	);

	return {
		isUploading,
		uploadEvents,
		enqueueUpload,
	};
}
