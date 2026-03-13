import type { RefObject } from "react";
import { useCallback, useRef } from "react";

interface Syncable {
	sync(): Promise<void>;
}

export function useStableSyncRef(engineRef: RefObject<Syncable | null>) {
	const syncRef = useRef<() => void>(() => {});
	syncRef.current = useCallback(() => {
		engineRef.current?.sync();
	}, [engineRef]);
	return syncRef;
}
