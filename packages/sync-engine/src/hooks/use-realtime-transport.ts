import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import { subscribeToSharedNotifyChannel } from "../realtime/shared-notify-manager";
import type { CreateNotifyTransport } from "../realtime/types";

interface Syncable {
	sync(): Promise<void>;
}

export function useRealtimeTransport(
	notifyKey: string | undefined,
	enabled: boolean,
	engineRef: RefObject<Syncable | null>,
	createNotifyTransport: CreateNotifyTransport,
	onRefreshNotify?: () => void,
) {
	const subscriptionRef = useRef<ReturnType<
		typeof subscribeToSharedNotifyChannel
	> | null>(null);
	const enabledRef = useRef(enabled);
	enabledRef.current = enabled;
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
					engineRef.current?.sync();
					return;
				}
				onRefreshNotifyRef.current?.();
			},
			onOpen: () => {
				engineRef.current?.sync();
			},
		});

		subscriptionRef.current = subscription;
		return () => {
			subscription.unsubscribe();
			if (subscriptionRef.current === subscription) {
				subscriptionRef.current = null;
			}
		};
	}, [notifyKey, createNotifyTransport, engineRef]);

	useEffect(() => {
		subscriptionRef.current?.setEnabled(enabled);
	}, [enabled]);
}
