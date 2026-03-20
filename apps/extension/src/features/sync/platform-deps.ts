import type { RealtimeTransport } from "@pengana/realtime-transport";

export function createNoopRealtimeTransport(): RealtimeTransport {
	return {
		start() {},
		stop() {},
		getStatus() {
			return "idle";
		},
		subscribe() {
			return () => {};
		},
	};
}
