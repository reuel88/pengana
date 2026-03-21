export const SYNC_INTERVAL_MS = 5 * 60_000;

interface Syncable {
	sync(): Promise<void>;
}

export function createPeriodicSync(
	getEngine: () => Syncable | null,
	intervalMs = SYNC_INTERVAL_MS,
) {
	let timer: ReturnType<typeof setInterval> | null = null;

	return {
		start() {
			this.stop();
			timer = setInterval(() => {
				getEngine()?.sync();
			}, intervalMs);
		},
		stop() {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		},
	};
}
