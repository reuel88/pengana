export interface EventEmitter<T> {
	onEvent(listener: (event: T) => void): () => void;
	emit(event: T): void;
}

export function createEventEmitter<T>(): EventEmitter<T> {
	let listeners: Array<(event: T) => void> = [];
	return {
		onEvent(listener) {
			listeners.push(listener);
			return () => {
				listeners = listeners.filter((l) => l !== listener);
			};
		},
		emit(event) {
			for (const listener of listeners) listener(event);
		},
	};
}
