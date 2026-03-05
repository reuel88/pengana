import type { AppRouterClient } from "@finance-tool-poc/api/routers/index";

import { env } from "@finance-tool-poc/env/web";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

export const link = new RPCLink({
	url: `${env.VITE_SERVER_URL}/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

export const client: AppRouterClient = createORPCClient(link);
