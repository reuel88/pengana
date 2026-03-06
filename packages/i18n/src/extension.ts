import i18next from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

import {
	DEFAULT_LOCALE,
	isSupportedLocale,
	NAMESPACES,
	SUPPORTED_LOCALES,
} from "./config";

interface ExtensionI18nOptions {
	getStoredLocale?: () => Promise<string | undefined>;
}

export async function initExtensionI18n(options?: ExtensionI18nOptions) {
	let storedLocale: string | undefined;
	if (options?.getStoredLocale) {
		try {
			storedLocale = await options.getStoredLocale();
		} catch {
			// ignore storage errors
		}
	}

	const browserLocale = navigator.language;
	const detectedLocale = [storedLocale, browserLocale].find(
		(l): l is string => !!l && isSupportedLocale(l),
	);

	await i18next
		.use(initReactI18next)
		.use(
			resourcesToBackend(
				(language: string, namespace: string) =>
					import(`./locales/${language}/${namespace}.json`),
			),
		)
		.init({
			lng: detectedLocale ?? DEFAULT_LOCALE,
			fallbackLng: {
				"en-AU": ["en-US"],
				default: [DEFAULT_LOCALE],
			},
			supportedLngs: SUPPORTED_LOCALES as unknown as string[],
			ns: NAMESPACES as unknown as string[],
			defaultNS: "common",
			interpolation: {
				escapeValue: false,
			},
		});

	return i18next;
}
