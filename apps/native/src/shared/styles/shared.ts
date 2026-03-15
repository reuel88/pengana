import { StyleSheet } from "react-native";
import type { NativeAppTheme } from "@/shared/lib/theme";

/** Static styles shared across org/form screens */
export const sharedStyles = StyleSheet.create({
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	button: { padding: 12, alignItems: "center" },
	listContainer: { padding: 16, gap: 8 },
});

/** Theme-dependent style factories */
export function mutedText(
	theme: Pick<NativeAppTheme, "mutedText" | "fontFamily">,
) {
	return { color: theme.mutedText, fontFamily: theme.fontFamily } as const;
}

export function bodyText(theme: Pick<NativeAppTheme, "text" | "fontFamily">) {
	return { color: theme.text, fontFamily: theme.fontFamily } as const;
}

export function secondaryText(
	theme: Pick<NativeAppTheme, "secondaryText" | "fontFamily">,
) {
	return {
		color: theme.secondaryText,
		fontFamily: theme.fontFamily,
		fontSize: 12,
	} as const;
}

export function destructiveText(
	theme: Pick<NativeAppTheme, "danger" | "fontFamily">,
) {
	return { color: theme.danger, fontFamily: theme.fontFamily } as const;
}

export function successText(
	theme: Pick<NativeAppTheme, "success" | "fontFamily">,
) {
	return { color: theme.success, fontFamily: theme.fontFamily } as const;
}

export function warningText(
	theme: Pick<NativeAppTheme, "warning" | "fontFamily">,
) {
	return { color: theme.warning, fontFamily: theme.fontFamily } as const;
}

export function placeholderColor(theme: Pick<NativeAppTheme, "placeholder">) {
	return theme.placeholder;
}

export function inputThemed(
	theme: Pick<
		NativeAppTheme,
		"text" | "border" | "background" | "radius" | "fontFamily"
	>,
	options?: { isError?: boolean; danger?: string },
) {
	return {
		color: theme.text,
		borderColor: options?.isError
			? (options.danger ?? theme.border)
			: theme.border,
		backgroundColor: theme.background,
		borderRadius: Math.max(theme.radius, 0),
		fontFamily: theme.fontFamily,
	} as const;
}

type ThemeChrome = Pick<
	NativeAppTheme,
	"text" | "border" | "card" | "background" | "radius" | "fontFamily" | "style"
>;

export function themedSurface(theme: ThemeChrome) {
	const radius = Math.max(theme.radius, 0);
	const base = {
		backgroundColor: theme.card,
		borderColor: theme.border,
		borderRadius: radius,
		borderWidth: 1,
	} as const;

	switch (theme.style) {
		case "lyra":
			return {
				...base,
				shadowColor: theme.text,
				shadowOpacity: 0.12,
				shadowRadius: 16,
				shadowOffset: { width: 0, height: 8 },
				elevation: 4,
			} as const;
		case "mira":
			return {
				...base,
				shadowColor: theme.text,
				shadowOpacity: 0.08,
				shadowRadius: 22,
				shadowOffset: { width: 0, height: 10 },
				elevation: 3,
			} as const;
		default:
			return base;
	}
}

export function themedControl(
	theme: Pick<ThemeChrome, "radius" | "fontFamily">,
) {
	return {
		borderRadius: Math.max(theme.radius, 0),
		fontFamily: theme.fontFamily,
	} as const;
}

export function themedText(theme: Pick<ThemeChrome, "text" | "fontFamily">) {
	return {
		color: theme.text,
		fontFamily: theme.fontFamily,
	} as const;
}

export function primaryButton(
	theme: Pick<NativeAppTheme, "primary" | "radius">,
	options?: { disabled?: boolean },
) {
	return {
		backgroundColor: theme.primary,
		borderRadius: Math.max(theme.radius, 0),
		opacity: options?.disabled ? 0.5 : 1,
	} as const;
}

export function primaryButtonText(
	theme: Pick<NativeAppTheme, "primaryForeground" | "fontFamily">,
) {
	return {
		color: theme.primaryForeground,
		fontFamily: theme.fontFamily,
		fontWeight: "600",
	} as const;
}

export function smallPrimaryButtonText(
	theme: Pick<NativeAppTheme, "primaryForeground" | "fontFamily">,
) {
	return {
		color: theme.primaryForeground,
		fontFamily: theme.fontFamily,
		fontSize: 12,
		fontWeight: "600",
	} as const;
}

export function outlineButton(
	theme: Pick<NativeAppTheme, "border" | "radius">,
	options?: { disabled?: boolean },
) {
	return {
		borderColor: theme.border,
		borderWidth: 1,
		borderRadius: Math.max(theme.radius, 0),
		opacity: options?.disabled ? 0.5 : 1,
	} as const;
}

export function bannerSurface(
	theme: Pick<NativeAppTheme, "successSurface" | "dangerSurface" | "border">,
	tone: "success" | "danger",
) {
	return {
		backgroundColor:
			tone === "success" ? theme.successSurface : theme.dangerSurface,
		borderColor: tone === "success" ? "transparent" : theme.border,
	} as const;
}

export function modalOverlay(theme: Pick<NativeAppTheme, "overlay">) {
	return { backgroundColor: theme.overlay } as const;
}
