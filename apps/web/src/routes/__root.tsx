import { useTranslation } from "@pengana/i18n";
import type { SupportedLocale } from "@pengana/i18n/config";
import { getDirection } from "@pengana/i18n/rtl";
import { Toaster } from "@pengana/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import type { orpc } from "@/utils/orpc";

import "@pengana/ui/globals.css";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "pengana",
			},
			{
				name: "description",
				content: "pengana is a web application",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	const { i18n } = useTranslation();

	useEffect(() => {
		const locale = i18n.language as SupportedLocale;
		document.documentElement.lang = locale;
		document.documentElement.dir = getDirection(locale);

		const handleLanguageChanged = (lng: string) => {
			document.documentElement.lang = lng;
			document.documentElement.dir = getDirection(lng as SupportedLocale);
		};

		i18n.on("languageChanged", handleLanguageChanged);
		return () => {
			i18n.off("languageChanged", handleLanguageChanged);
		};
	}, [i18n]);

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<div className="grid h-svh grid-rows-[auto_1fr]">
					<Header />
					<Outlet />
				</div>
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}
