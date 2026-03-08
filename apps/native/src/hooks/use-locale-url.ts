import { useTranslation } from "@pengana/i18n";
import { localizeUrl } from "@pengana/i18n/urls";
import { usePathname } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

export function useLocaleUrl() {
	const pathname = usePathname();
	const { i18n } = useTranslation();

	useEffect(() => {
		if (Platform.OS !== "web") return;
		const localized = localizeUrl(pathname, i18n.language);
		if (localized !== window.location.pathname) {
			window.history.replaceState(
				null,
				"",
				localized + window.location.search + window.location.hash,
			);
		}
	}, [pathname, i18n.language]);
}
