/// <reference lib="dom" />

export interface NetworkStatusMonitor {
	readonly isOnline: boolean;
	subscribe(listener: (isOnline: boolean) => void): () => void;
	destroy(): void;
}

export function createNetworkStatusMonitor(): NetworkStatusMonitor {
	let online = navigator.onLine;
	const listeners = new Set<(isOnline: boolean) => void>();

	function handleOnline() {
		online = true;
		for (const listener of listeners) listener(true);
	}

	function handleOffline() {
		online = false;
		for (const listener of listeners) listener(false);
	}

	window.addEventListener("online", handleOnline);
	window.addEventListener("offline", handleOffline);

	return {
		get isOnline() {
			return online;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		destroy() {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
			listeners.clear();
		},
	};
}
