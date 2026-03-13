export type RealtimeTransportStatus =
	| "idle"
	| "connecting"
	| "open"
	| "degraded"
	| "closed";

export type RealtimeMessageKind = "notify" | "heartbeat";

export interface RealtimeTransportCallbacks {
	onNotify: () => void;
	onOpen?: () => void;
}

export type NotifyTransportCallbacks = RealtimeTransportCallbacks;

export interface RealtimeTransport {
	start(): void;
	stop(): void;
	getStatus(): RealtimeTransportStatus;
	subscribe(listener: (status: RealtimeTransportStatus) => void): () => void;
}

export type CreateNotifyTransport = (
	notifyKey: string,
	callbacks: NotifyTransportCallbacks,
) => RealtimeTransport;

export type CreateRealtimeTransport = CreateNotifyTransport;
