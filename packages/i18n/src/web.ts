import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

import {
	DEFAULT_LOCALE,
	isSupportedLocale,
	NAMESPACES,
	SUPPORTED_LOCALES,
	type SupportedLocale,
} from "./config";

export function detectLocaleFromUrl(pathname: string): SupportedLocale {
	const segments = pathname.split("/").filter(Boolean);
	const first = segments[0];
	if (first && isSupportedLocale(first)) {
		return first;
	}
	return DEFAULT_LOCALE;
}

export function deLocalizeUrl(pathname: string): string {
	const segments = pathname.split("/").filter(Boolean);
	const first = segments[0];
	if (first && isSupportedLocale(first)) {
		return `/${segments.slice(1).join("/")}` || "/";
	}
	return pathname;
}

export function localizeUrl(pathname: string, locale: SupportedLocale): string {
	const clean = deLocalizeUrl(pathname);
	if (locale === DEFAULT_LOCALE) {
		return clean;
	}
	return `/${locale}${clean === "/" ? "" : clean}`;
}

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
