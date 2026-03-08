export const SUPPORTED_LOCALES = [
	"en-US",
	"en-AU",
	"es",
	"zh",
	"tl",
	"vi",
	"ar",
	"fr",
	"ko",
	"ru",
	"pt-BR",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en-US";

export const RTL_LOCALES: ReadonlySet<SupportedLocale> = new Set(["ar"]);

export const NAMESPACES = [
	"common",
	"auth",
	"todos",
	"sync",
	"dashboard",
	"errors",
	"organization",
	"onboarding",
	"notifications",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}
