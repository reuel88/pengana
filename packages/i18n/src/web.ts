import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE, NAMESPACES, SUPPORTED_LOCALES } from "./config";

import { detectLocaleFromUrl } from "./urls";

export { deLocalizeUrl, detectLocaleFromUrl, localizeUrl } from "./urls";

export async function initWebI18n() {
	const detectedLocale = detectLocaleFromUrl(window.location.pathname);

	await i18next
		.use(LanguageDetector)
		.use(initReactI18next)
		.use(
			resourcesToBackend(
				(language: string, namespace: string) =>
					import(`./locales/${language}/${namespace}.json`),
			),
		)
		.init({
			lng: detectedLocale,
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
			detection: {
				order: ["path", "localStorage", "navigator"],
				lookupFromPathIndex: 0,
				caches: ["localStorage"],
			},
		});

	return i18next;
}
