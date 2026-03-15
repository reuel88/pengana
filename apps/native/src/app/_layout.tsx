import { useTranslation } from "@pengana/i18n";
import type { SupportedLocale } from "@pengana/i18n/config";
import { initNativeI18n } from "@pengana/i18n/native";
import { LOCALE_STORAGE_KEY_NATIVE } from "@pengana/i18n/persistence";
import { isRtlLocale } from "@pengana/i18n/rtl";
import { AuthClientProvider } from "@pengana/org-client";
import { ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { getLocales } from "expo-localization";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
	I18nManager,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/shared/api/orpc";
import { useLifecycleCheck } from "@/shared/hooks/use-lifecycle-check";
import { useActiveOrg } from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";
import { LifecycleContext } from "@/shared/lib/lifecycle-context";
import {
	OrgDesignPresetPreviewProvider,
	useOrgDesignPresetPreview,
} from "@/shared/lib/org-design-preset-preview";
import { buildNavigationTheme, createThemeColors } from "@/shared/lib/theme";
import { useColorScheme } from "@/shared/lib/use-color-scheme";

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
	},
	retryText: {
		fontWeight: "600",
	},
});

function RootLayoutInner() {
	const { colorScheme, isDarkColorScheme } = useColorScheme();
	const { t } = useTranslation("common");
	const { data: session, isPending } = authClient.useSession();
	const { data: activeOrg } = useActiveOrg({
		enabled: Boolean(session?.session?.activeOrganizationId),
	});
	const { previewDesignPreset } = useOrgDesignPresetPreview();
	const segments = useSegments();
	const router = useRouter();
	const {
		lifecycleChecked,
		needsOnboarding,
		lifecycleData,
		orgError,
		retryLifecycleCheck,
		completeOnboarding,
	} = useLifecycleCheck({ isPending, session });
	const retryTheme = createThemeColors(
		colorScheme,
		previewDesignPreset ?? activeOrg?.designPreset,
	);

	const lifecycleContextValue = useMemo(
		() => ({ lifecycleData, completeOnboarding }),
		[lifecycleData, completeOnboarding],
	);

	useEffect(() => {
		if (isPending || orgError) return;

		const target = resolveRoute(
			session,
			lifecycleChecked,
			needsOnboarding,
			segments,
		);
		if (target) {
			router.replace(target);
		}
	}, [
		session,
		isPending,
		segments,
		router,
		lifecycleChecked,
		needsOnboarding,
		orgError,
	]);

	if (isPending || (!lifecycleChecked && session && !orgError)) return null;

	if (orgError) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>{t("error.generic")}</Text>
				<Pressable
					style={[styles.retryButton, { backgroundColor: retryTheme.primary }]}
					onPress={retryLifecycleCheck}
				>
					<Text
						style={[
							styles.retryText,
							{
								color: retryTheme.primaryForeground,
								fontFamily: retryTheme.fontFamily,
							},
						]}
					>
						{t("error.retry")}
					</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<ThemeProvider
			value={buildNavigationTheme(
				colorScheme,
				previewDesignPreset ?? activeOrg?.designPreset,
			)}
		>
			<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
			<LifecycleContext.Provider value={lifecycleContextValue}>
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
			</LifecycleContext.Provider>
		</ThemeProvider>
	);
}

export default function RootLayout() {
	const [i18nReady, setI18nReady] = useState(false);

	useEffect(() => {
		const init = async () => {
			const savedLocale =
				Platform.OS === "web"
					? localStorage.getItem(LOCALE_STORAGE_KEY_NATIVE)
					: await SecureStore.getItemAsync(LOCALE_STORAGE_KEY_NATIVE);
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

	return (
		<QueryClientProvider client={queryClient}>
			<AuthClientProvider client={authClient}>
				<OrgDesignPresetPreviewProvider>
					{i18nReady ? <RootLayoutInner /> : null}
				</OrgDesignPresetPreviewProvider>
			</AuthClientProvider>
		</QueryClientProvider>
	);
}
