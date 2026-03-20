import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouterClient } from "@pengana/api/routers/index";
import { i18next } from "@pengana/i18n";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { Alert, Platform } from "react-native";

import { authClient } from "@/shared/lib/auth-client";
import { getServerUrl } from "@/shared/lib/server-url";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			Alert.alert("Error", error.message);
		},
	}),
});

export const link = new RPCLink({
	url: `${getServerUrl()}/rpc`,
	fetch:
		Platform.OS !== "web"
			? undefined
			: (url, options) =>
					fetch(url, {
						...options,
						credentials: "include",
					}),
	headers() {
		const clientId =
			Platform.OS === "web" ? "native-web" : `native-${Platform.OS}`;
		if (Platform.OS === "web") {
			return { "Accept-Language": i18next.language, "X-Client-Id": clientId };
		}
		const headers = new Map<string, string>();
		headers.set("Accept-Language", i18next.language);
		headers.set("X-Client-Id", clientId);
		const cookies = authClient.getCookie();
		if (cookies) {
			headers.set("Cookie", cookies);
		}
		return Object.fromEntries(headers);
	},
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
