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

export interface RealtimeTransport {
	start(): void;
	stop(): void;
	getStatus(): RealtimeTransportStatus;
	subscribe(listener: (status: RealtimeTransportStatus) => void): () => void;
}

export type CreateRealtimeTransport = (
	userId: string,
	callbacks: RealtimeTransportCallbacks,
) => RealtimeTransport;
