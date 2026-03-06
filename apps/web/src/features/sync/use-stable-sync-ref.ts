import type { SyncEngine } from "@pengana/sync-engine";
import { useRef } from "react";

export function useStableSyncRef(
	engineRef: React.RefObject<SyncEngine | null>,
) {
	const syncRef = useRef<() => void>(() => {});
	syncRef.current = () => {
		engineRef.current?.sync();
	};
	return syncRef;
}
