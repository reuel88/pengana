import { lazy, Suspense } from "react";

const SyncDevtoolsImpl = lazy(() =>
	import("./sync-devtools-impl").then((m) => ({ default: m.SyncDevtoolsImpl })),
);

export function SyncDevtools() {
	if (!import.meta.env.DEV) return null;

	return (
		<Suspense>
			<SyncDevtoolsImpl />
		</Suspense>
	);
}
