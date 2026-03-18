import { useCallback, useEffect, useRef, useState } from "react";

import { MAX_EVENT_LOG_SIZE } from "../constants/sync";
import { UploadQueue } from "../core/upload-queue";
import type {
	UploadAdapter,
	UploadEvent,
	UploadLifecycleCallbacks,
	UploadTransport,
} from "../types";
import { useStableSyncRef } from "./use-stable-sync-ref";

interface Syncable {
	sync(): Promise<void>;
}

export function useUploadQueue(
	userId: string,
	isOnline: boolean,
	engineRef: React.RefObject<Syncable | null>,
	createUploadAdapter: () => UploadAdapter,
	createUploadTransport: () => UploadTransport,
	lifecycleCallbacks?: UploadLifecycleCallbacks,
) {
	// --- State ---
	const uploadQueueRef = useRef<UploadQueue | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadEvents, setUploadEvents] = useState<UploadEvent[]>([]);

	const syncRef = useStableSyncRef(engineRef);
	const isOnlineRef = useRef(isOnline);
	isOnlineRef.current = isOnline;

	// biome-ignore lint/correctness/useExhaustiveDependencies: syncRef is a stable ref — its .current is reassigned every render, so listing it would cause infinite re-runs
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
				...prev.slice(-(MAX_EVENT_LOG_SIZE - 1)),
				event,
			]);
			if (event.type === "upload:start") setIsUploading(true);
			if (event.type === "upload:complete" || event.type === "upload:error") {
				setIsUploading(false);
			}
			if (event.type === "upload:complete") {
				syncRef.current();
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
	}, [userId]);

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
