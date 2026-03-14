import type { SupportedLocale } from "@pengana/i18n";
import { isRtlLocale } from "@pengana/i18n/rtl";

interface ChangeLanguageDependencies {
	currentLocale: SupportedLocale;
	nextLocale: SupportedLocale;
	i18n: {
		changeLanguage: (locale: SupportedLocale) => Promise<unknown> | unknown;
	};
	isWeb: boolean;
	storeLocale: (locale: SupportedLocale) => Promise<boolean> | boolean;
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
	storeLocale,
	reload,
	allowRTL,
	forceRTL,
	showRestartAlert,
}: ChangeLanguageDependencies) {
	if (nextLocale === currentLocale) {
		return;
	}

	let storageSucceeded = false;
	try {
		storageSucceeded = await storeLocale(nextLocale);
	} catch {
		storageSucceeded = false;
	}

	if (!storageSucceeded) {
		console.warn("[i18n] failed to persist locale preference", {
			locale: nextLocale,
		});
	}

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
