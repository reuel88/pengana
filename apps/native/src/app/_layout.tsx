import type { SupportedLocale } from "@pengana/i18n/config";
import { initNativeI18n } from "@pengana/i18n/native";
import { isRtlLocale } from "@pengana/i18n/rtl";
import {
	DarkTheme,
	DefaultTheme,
	type Theme,
	ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { getLocales } from "expo-localization";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { I18nManager, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient } from "@/utils/orpc";

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

export default function RootLayout() {
	const { isDarkColorScheme } = useColorScheme();
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
			<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
				<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
				<GestureHandlerRootView style={styles.container}>
					<Stack>
						<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
						<Stack.Screen
							name="modal"
							options={{ title: "Modal", presentation: "modal" }}
						/>
					</Stack>
				</GestureHandlerRootView>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
