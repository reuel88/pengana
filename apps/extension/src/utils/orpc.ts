import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@pengana/api/routers/index";
import { env } from "@pengana/env/web";
import i18next from "i18next";

export const link = new RPCLink({
	url: `${env.VITE_SERVER_URL}/rpc`,
	headers: () => ({ "Accept-Language": i18next.language }),
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

export const client: AppRouterClient = createORPCClient(link);
