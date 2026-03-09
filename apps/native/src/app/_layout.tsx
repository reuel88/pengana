import { useTranslation } from "@pengana/i18n";
import type { SupportedLocale } from "@pengana/i18n/config";
import { initNativeI18n } from "@pengana/i18n/native";
import { isRtlLocale } from "@pengana/i18n/rtl";
import { AuthClientProvider } from "@pengana/org-client";
import { fetchUserLifecycleData } from "@pengana/org-client/lib/user-lifecycle";

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
import { useCallback, useEffect, useState } from "react";
import {
	I18nManager,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient } from "@/utils/orpc";

type RouteTarget = "/(auth)/login" | "/onboarding" | "/(drawer)" | null;

function resolveRoute(
	session: unknown,
	lifecycleChecked: boolean,
	needsOnboarding: boolean,
	segments: string[],
): RouteTarget {
	const inAuthGroup = segments[0] === "(auth)";
	const inInvitation = segments[0] === "invitation";
	const inOnboarding = segments[0] === "onboarding";

	if (!session && !inAuthGroup && !inInvitation) {
		return "/(auth)/login";
	}

	if (!session || !lifecycleChecked) return null;

	if (inAuthGroup) {
		return needsOnboarding ? "/onboarding" : "/(drawer)";
	}
	if (!inOnboarding && !inInvitation && needsOnboarding) {
		return "/onboarding";
	}
	if (inOnboarding && !needsOnboarding) {
		return "/(drawer)";
	}

	return null;
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
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 12,
	},
	errorText: {
		fontSize: 14,
		opacity: 0.7,
	},
	retryButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 6,
		backgroundColor: "#007AFF",
	},
	retryText: {
		color: "#fff",
		fontWeight: "600",
	},
});

function RootLayoutInner() {
	const { isDarkColorScheme } = useColorScheme();
	const { t } = useTranslation("common");
	const { data: session, isPending } = authClient.useSession();
	const segments = useSegments();
	const router = useRouter();
	const [lifecycleChecked, setLifecycleChecked] = useState(false);
	const [needsOnboarding, setNeedsOnboarding] = useState(false);
	const [orgError, setOrgError] = useState(false);

	useEffect(() => {
		if (isPending || !session || orgError) {
			if (isPending || !session) {
				setLifecycleChecked(false);
				setNeedsOnboarding(false);
				setOrgError(false);
			}
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const data = await fetchUserLifecycleData(authClient);
				if (cancelled) return;
				setNeedsOnboarding(!data.hasOrganization);
				setLifecycleChecked(true);
			} catch (err) {
				if (!cancelled) {
					console.error("Failed to check org lifecycle:", err);
					setOrgError(true);
					setLifecycleChecked(true);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isPending, session, orgError]);

	useEffect(() => {
		if (isPending) return;

		const target = resolveRoute(
			session,
			lifecycleChecked,
			needsOnboarding,
			segments,
		);
		if (target) {
			router.replace(target);
		}
	}, [session, isPending, segments, router, lifecycleChecked, needsOnboarding]);

	const retryLifecycleCheck = useCallback(() => {
		setOrgError(false);
		setLifecycleChecked(false);
	}, []);

	if (isPending || (!lifecycleChecked && session && !orgError)) return null;

	if (orgError) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>{t("error.generic")}</Text>
				<Pressable style={styles.retryButton} onPress={retryLifecycleCheck}>
					<Text style={styles.retryText}>{t("error.retry")}</Text>
				</Pressable>
			</View>
		);
	}

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
			<AuthClientProvider client={authClient}>
				<RootLayoutInner />
			</AuthClientProvider>
		</QueryClientProvider>
	);
}
