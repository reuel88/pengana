import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import type { SyncEngine } from "../core/engine";
import type {
	CreateRealtimeTransport,
	RealtimeTransport,
} from "../realtime/types";

export function useRealtimeTransport(
	userId: string | undefined,
	enabled: boolean,
	engineRef: RefObject<SyncEngine | null>,
	createRealtimeTransport: CreateRealtimeTransport,
	onSyncNotify?: () => void,
) {
	const transportRef = useRef<RealtimeTransport | null>(null);
	const onSyncNotifyRef = useRef(onSyncNotify);
	onSyncNotifyRef.current = onSyncNotify;

	useEffect(() => {
		if (!userId) {
			transportRef.current?.stop();
			transportRef.current = null;
			return;
		}

		const transport = createRealtimeTransport(userId, {
			onNotify: () => {
				engineRef.current?.sync();
				onSyncNotifyRef.current?.();
			},
			onOpen: () => {
				engineRef.current?.sync();
			},
		});

		transportRef.current = transport;
		return () => {
			transport.stop();
			if (transportRef.current === transport) {
				transportRef.current = null;
			}
		};
	}, [userId, createRealtimeTransport, engineRef]);

	useEffect(() => {
		const transport = transportRef.current;
		if (!transport) return;
		if (enabled) {
			transport.start();
			return;
		}
		transport.stop();
	}, [enabled, userId]);
}
