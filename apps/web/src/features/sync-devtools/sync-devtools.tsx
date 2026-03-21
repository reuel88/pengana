import type { SyncDescriptor } from "@pengana/sync-runtime";
import { lazy, Suspense } from "react";

const SyncDevtoolsImpl = lazy(() =>
	import("./sync-devtools-impl").then((m) => ({ default: m.SyncDevtoolsImpl })),
);

export function SyncDevtools({ descriptor }: { descriptor: SyncDescriptor }) {
	if (!import.meta.env.DEV) return null;

	return (
		<Suspense>
			<SyncDevtoolsImpl descriptor={descriptor} />
		</Suspense>
	);
}
