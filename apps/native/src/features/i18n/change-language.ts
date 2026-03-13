import type { SupportedLocale } from "@pengana/i18n";
import { isRtlLocale } from "@pengana/i18n/rtl";

interface ChangeLanguageDependencies {
	currentLocale: SupportedLocale;
	nextLocale: SupportedLocale;
	i18n: {
		changeLanguage: (locale: SupportedLocale) => Promise<unknown> | unknown;
	};
	isWeb: boolean;
	persistLocale: (locale: SupportedLocale) => Promise<void> | void;
	reload: () => void;
	allowRTL: (allow: boolean) => void;
	forceRTL: (rtl: boolean) => void;
	showRestartAlert: () => void;
}

export async function changeLanguage({
	currentLocale,
	nextLocale,
	i18n,
	isWeb,
	persistLocale,
	reload,
	allowRTL,
	forceRTL,
	showRestartAlert,
}: ChangeLanguageDependencies) {
	if (nextLocale === currentLocale) {
		return;
	}

	await persistLocale(nextLocale);

	if (isWeb) {
		reload();
		return;
	}

	const wasRtl = isRtlLocale(currentLocale);
	const willBeRtl = isRtlLocale(nextLocale);

	if (wasRtl !== willBeRtl) {
		allowRTL(true);
		forceRTL(willBeRtl);
		showRestartAlert();
	}

	await i18n.changeLanguage(nextLocale);
}
