import { useEffect, useRef } from "react";

import { subscribeToSharedNotifyChannel } from "../realtime/shared-notify-manager";
import type { CreateNotifyTransport } from "../realtime/types";

export interface UseRealtimeTransportOptions {
	createNotifyTransport: CreateNotifyTransport;
	onSyncNotify?: () => void;
	onOpen?: () => void;
	onRefreshNotify?: () => void;
}

export function useRealtimeTransport(
	notifyKey: string | undefined,
	enabled: boolean,
	options: UseRealtimeTransportOptions,
) {
	const { createNotifyTransport, onSyncNotify, onOpen, onRefreshNotify } =
		options;

	const subscriptionRef = useRef<ReturnType<
		typeof subscribeToSharedNotifyChannel
	> | null>(null);
	const enabledRef = useRef(enabled);
	enabledRef.current = enabled;
	const onSyncNotifyRef = useRef(onSyncNotify);
	onSyncNotifyRef.current = onSyncNotify;
	const onOpenRef = useRef(onOpen);
	onOpenRef.current = onOpen;
	const onRefreshNotifyRef = useRef(onRefreshNotify);
	onRefreshNotifyRef.current = onRefreshNotify;

	useEffect(() => {
		if (!notifyKey) {
			subscriptionRef.current?.unsubscribe();
			subscriptionRef.current = null;
			return;
		}

		const subscription = subscribeToSharedNotifyChannel({
			notifyKey,
			createNotifyTransport,
			enabled: enabledRef.current,
			onNotify: (kind) => {
				if (kind === "sync") {
					onSyncNotifyRef.current?.();
					return;
				}
				onRefreshNotifyRef.current?.();
			},
			onOpen: () => {
				onOpenRef.current?.();
			},
		});

		subscriptionRef.current = subscription;
		return () => {
			subscription.unsubscribe();
			if (subscriptionRef.current === subscription) {
				subscriptionRef.current = null;
			}
		};
	}, [notifyKey, createNotifyTransport]);

	useEffect(() => {
		subscriptionRef.current?.setEnabled(enabled);
	}, [enabled]);
}
