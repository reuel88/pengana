import type { MutableRefObject } from "react";
import { useCallback, useRef } from "react";

import type { SyncEngine } from "../core/engine";

export function useStableSyncRef(
	engineRef: MutableRefObject<SyncEngine | null>,
) {
	const syncRef = useRef<() => void>(() => {});
	syncRef.current = useCallback(() => {
		engineRef.current?.sync();
	}, [engineRef]);
	return syncRef;
}
