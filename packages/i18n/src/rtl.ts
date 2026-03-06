import { RTL_LOCALES, type SupportedLocale } from "./config";

export function isRtlLocale(locale: SupportedLocale): boolean {
	return RTL_LOCALES.has(locale);
}

export function getDirection(locale: SupportedLocale): "ltr" | "rtl" {
	return isRtlLocale(locale) ? "rtl" : "ltr";
}
