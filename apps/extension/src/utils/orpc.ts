/**
 * oRPC client for the extension — no React Query integration.
 *
 * The extension follows an offline-first sync engine pattern:
 *   UI → Dexie (local) → background worker → server
 *
 * The UI reads from local Dexie state, so React Query's server-state
 * caching is unnecessary. If a future use case needs React Query,
 * evaluate whether it fits the sync engine pattern before adding it.
 */
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@pengana/api/routers/index";
import { env } from "@pengana/env/web";

export const link = new RPCLink({
	url: `${env.VITE_SERVER_URL}/rpc`,
	headers: () => ({ "Accept-Language": navigator.language }),
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

export const client: AppRouterClient = createORPCClient(link);
