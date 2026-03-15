import { useTranslation } from "@pengana/i18n";
import type { SupportedLocale } from "@pengana/i18n/config";
import { getDirection } from "@pengana/i18n/rtl";
import { AuthClientProvider } from "@pengana/org-client";
import { Toaster } from "@pengana/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useMatches,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { OrgDesignPresetPreviewProvider } from "@/features/theme/org-design-preset-preview";
import { OrgDesignPresetSync } from "@/features/theme/org-design-preset-sync";
import { ThemeProvider } from "@/features/theme/theme-provider";
import type { orpc } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";
import { Header } from "@/widgets/header";

import "@pengana/ui/globals.css";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

function RootErrorComponent({ error }: { error: Error }) {
	return (
		<div className="flex h-svh flex-col items-center justify-center gap-4 p-8">
			<p className="font-medium text-destructive">Something went wrong</p>
			<p className="text-muted-foreground text-sm">{error.message}</p>
		</div>
	);
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	errorComponent: RootErrorComponent,
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

const HEADERLESS_PREFIXES = [
	"/login",
	"/sign-up",
	"/onboarding",
	"/verify-email",
	"/magic-link",
	"/forgot-password",
	"/reset-password",
	"/auth-error",
] as const;

function RootComponent() {
	const { i18n } = useTranslation();
	const matches = useMatches();
	const pathname = matches.at(-1)?.pathname ?? "";
	const hideHeader = HEADERLESS_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);

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
		<AuthClientProvider client={authClient}>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<OrgDesignPresetPreviewProvider>
					<OrgDesignPresetSync />
					<div className={hideHeader ? "" : "grid h-svh grid-rows-[auto_1fr]"}>
						{!hideHeader && <Header />}
						<Outlet />
					</div>
					<Toaster richColors />
				</OrgDesignPresetPreviewProvider>
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</AuthClientProvider>
	);
}
