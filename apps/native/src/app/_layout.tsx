import type { SupportedLocale } from "@pengana/i18n/config";
import { initNativeI18n } from "@pengana/i18n/native";
import { isRtlLocale } from "@pengana/i18n/rtl";
import { deLocalizeUrl, detectLocaleFromUrl } from "@pengana/i18n/urls";
import {
	DarkTheme,
	DefaultTheme,
	type Theme,
	ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { getLocales } from "expo-localization";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { I18nManager, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useLocaleUrl } from "@/hooks/use-locale-url";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient } from "@/utils/orpc";

if (Platform.OS === "web") {
	const detected = detectLocaleFromUrl(window.location.pathname);
	const stripped = deLocalizeUrl(window.location.pathname);
	if (stripped !== window.location.pathname) {
		window.history.replaceState(
			null,
			"",
			stripped + window.location.search + window.location.hash,
		);
	}
	localStorage.setItem("appLocale", detected);
}

const LIGHT_THEME: Theme = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

export const unstable_settings = {
	initialRouteName: "(drawer)",
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

function RootLayoutInner() {
	const { isDarkColorScheme } = useColorScheme();
	const { data: session, isPending } = authClient.useSession();
	const segments = useSegments();
	const router = useRouter();
	useLocaleUrl();

	const [lifecycleChecked, setLifecycleChecked] = useState(false);
	const [needsOnboarding, setNeedsOnboarding] = useState(false);

	useEffect(() => {
		if (isPending || !session) {
			setLifecycleChecked(false);
			setNeedsOnboarding(false);
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const orgs = await authClient.organization.list();
				if (cancelled) return;
				const hasOrg = (orgs.data?.length ?? 0) > 0;
				setNeedsOnboarding(!hasOrg);
				setLifecycleChecked(true);
			} catch {
				if (!cancelled) {
					setNeedsOnboarding(false);
					setLifecycleChecked(true);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isPending, session]);

	useEffect(() => {
		if (isPending) return;

		const inAuthGroup = segments[0] === "(auth)";
		const inInvitation = segments[0] === "invitation";
		const inOnboarding = segments[0] === "onboarding";

		if (!session && !inAuthGroup && !inInvitation) {
			router.replace("/(auth)/login");
			return;
		}

		if (!session || !lifecycleChecked) return;

		if (session && inAuthGroup) {
			if (needsOnboarding) {
				router.replace("/onboarding");
			} else {
				router.replace("/(drawer)");
			}
		} else if (session && !inOnboarding && !inInvitation && needsOnboarding) {
			router.replace("/onboarding");
		} else if (session && inOnboarding && !needsOnboarding) {
			router.replace("/(drawer)");
		}
	}, [session, isPending, segments, router, lifecycleChecked, needsOnboarding]);

	if (isPending) return null;

	return (
		<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
			<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
			<GestureHandlerRootView style={styles.container}>
				<Stack>
					<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
					<Stack.Screen name="(auth)" options={{ headerShown: false }} />
					<Stack.Screen name="onboarding" options={{ headerShown: false }} />
					<Stack.Screen
						name="invitation/[invitationId]"
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="modal"
						options={{ title: "Modal", presentation: "modal" }}
					/>
				</Stack>
			</GestureHandlerRootView>
		</ThemeProvider>
	);
}

export default function RootLayout() {
	const [i18nReady, setI18nReady] = useState(false);

	useEffect(() => {
		const init = async () => {
			const savedLocale =
				Platform.OS === "web"
					? localStorage.getItem("appLocale")
					: await SecureStore.getItemAsync("appLocale");
			const deviceLocale = getLocales()[0]?.languageTag;
			const i18n = await initNativeI18n(savedLocale ?? deviceLocale);
			const locale = i18n.language as SupportedLocale;
			const shouldBeRtl = isRtlLocale(locale);
			if (I18nManager.isRTL !== shouldBeRtl) {
				I18nManager.allowRTL(true);
				I18nManager.forceRTL(shouldBeRtl);
			}
			if (Platform.OS === "web") {
				document.documentElement.dir = shouldBeRtl ? "rtl" : "ltr";
			}
			setI18nReady(true);
		};
		init();
	}, []);

	if (!i18nReady) return null;

	return (
		<QueryClientProvider client={queryClient}>
			<RootLayoutInner />
		</QueryClientProvider>
	);
}
