import {
	resolveLocale,
	type SupportedLocale,
	useTranslation,
} from "@pengana/i18n";
import { LOCALE_STORAGE_KEY_NATIVE } from "@pengana/i18n/persistence";
import * as SecureStore from "expo-secure-store";
import { Alert, I18nManager, Platform } from "react-native";

import { changeLanguage } from "@/features/i18n/change-language";
import { LanguageSwitcher as LanguageSwitcherBase } from "@/shared/ui/language-switcher";

export function LanguageSwitcher() {
	const { i18n, t } = useTranslation();

	const currentLocale = resolveLocale(i18n.language);

	const handleChange = async (locale: SupportedLocale) => {
		await changeLanguage({
			currentLocale,
			nextLocale: locale,
			i18n,
			isWeb: Platform.OS === "web",
			storeLocale: async (nextLocale) => {
				if (Platform.OS === "web") {
					try {
						localStorage.setItem(LOCALE_STORAGE_KEY_NATIVE, nextLocale);
						return true;
					} catch {
						return false;
					}
				}

				try {
					await SecureStore.setItemAsync(LOCALE_STORAGE_KEY_NATIVE, nextLocale);
					return true;
				} catch {
					return false;
				}
			},
			reload: () => window.location.reload(),
			allowRTL: (allow) => I18nManager.allowRTL(allow),
			forceRTL: (rtl) => I18nManager.forceRTL(rtl),
			showRestartAlert: () =>
				Alert.alert(
					t("common:restartRequired.title"),
					t("common:restartRequired.message"),
				),
		});
	};

	return (
		<LanguageSwitcherBase
			currentLocale={currentLocale}
			onLocaleChange={handleChange}
		/>
	);
}
