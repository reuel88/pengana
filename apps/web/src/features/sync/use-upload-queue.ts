import type { SyncEngine, UploadEvent } from "@pengana/sync-engine";
import { UploadQueue, useStableSyncRef } from "@pengana/sync-engine";
import { useCallback, useEffect, useRef, useState } from "react";

import {
	createWebUploadAdapter,
	createWebUploadTransport,
} from "@/entities/upload-queue";

export function useUploadQueue(
	userId: string | undefined,
	isOnline: boolean,
	engineRef: React.RefObject<SyncEngine | null>,
) {
	const uploadQueueRef = useRef<UploadQueue | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadEvents, setUploadEvents] = useState<UploadEvent[]>([]);

	const MAX_UPLOAD_EVENT_HISTORY = 100;

	const syncRef = useStableSyncRef(engineRef);
	const isOnlineRef = useRef(isOnline);
	isOnlineRef.current = isOnline;

	// biome-ignore lint/correctness/useExhaustiveDependencies: syncRef is a stable ref — its .current is reassigned every render, so listing it would cause infinite re-runs
	useEffect(() => {
		if (!userId) return;

		setIsUploading(false);
		setUploadEvents([]);

		const uploadAdapter = createWebUploadAdapter();
		const uploadTransport = createWebUploadTransport();
		const queue = new UploadQueue(uploadAdapter, uploadTransport);
		uploadQueueRef.current = queue;

		const unsubscribe = queue.onEvent((event) => {
			setUploadEvents((prev) => [
				...prev.slice(-(MAX_UPLOAD_EVENT_HISTORY - 1)),
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
		(todoId: string, fileUri: string, mimeType: string) => {
			uploadQueueRef.current?.enqueue({
				id: crypto.randomUUID(),
				todoId,
				fileUri,
				mimeType,
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
