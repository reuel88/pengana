import { I18nextProvider } from "@pengana/i18n";
import type { SupportedLocale } from "@pengana/i18n/config";
import { DEFAULT_LOCALE } from "@pengana/i18n/config";
import { deLocalizeUrl, initWebI18n, localizeUrl } from "@pengana/i18n/web";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { Loader } from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { orpc, queryClient } from "./utils/orpc";

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}

async function main() {
	const i18n = await initWebI18n();

	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		defaultPendingComponent: () => <Loader />,
		context: { orpc, queryClient },
		rewrite: {
			input: ({ url }) => {
				const stripped = deLocalizeUrl(url.pathname);
				if (stripped !== url.pathname) {
					url.pathname = stripped;
					return url;
				}
				return undefined;
			},
			output: ({ url }) => {
				const locale = i18n.language as SupportedLocale;
				if (locale !== DEFAULT_LOCALE) {
					url.pathname = localizeUrl(url.pathname, locale);
					return url;
				}
				return undefined;
			},
		},
		Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
			return (
				<QueryClientProvider client={queryClient}>
					<I18nextProvider i18n={i18n}>{children}</I18nextProvider>
				</QueryClientProvider>
			);
		},
	});

	const rootElement = document.getElementById("app");

	if (!rootElement) {
		throw new Error("Root element not found");
	}

	if (!rootElement.innerHTML) {
		const root = ReactDOM.createRoot(rootElement);
		root.render(<RouterProvider router={router} />);
	}
}

main();
