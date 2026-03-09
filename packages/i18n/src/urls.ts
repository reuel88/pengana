import {
	DEFAULT_LOCALE,
	isSupportedLocale,
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
