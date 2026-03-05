import type { SyncEngine, UploadEvent } from "@pengana/sync-engine";
import { UploadQueue } from "@pengana/sync-engine";
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

	// stable syncRef to call latest engine.sync
	const syncRef = useRef<() => void>(() => {});
	syncRef.current = () => {
		engineRef.current?.sync();
	};

	useEffect(() => {
		if (!userId) return;

		const uploadAdapter = createWebUploadAdapter();
		const uploadTransport = createWebUploadTransport();
		const queue = new UploadQueue(uploadAdapter, uploadTransport);
		uploadQueueRef.current = queue;

		const unsubscribe = queue.onEvent((event) => {
			setUploadEvents((prev) => [...prev.slice(-99), event]);
			if (event.type === "upload:start") setIsUploading(true);
			if (event.type === "upload:complete" || event.type === "upload:error") {
				setIsUploading(false);
			}
			if (event.type === "upload:complete") {
				syncRef.current();
			}
		});

		queue.resume();

		return () => {
			unsubscribe();
			uploadQueueRef.current = null;
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
