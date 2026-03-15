import {
	DEFAULT_ORG_DESIGN_PRESET,
	normalizeOrgDesignPreset,
	type ResolvedAppThemeTokens,
	resolveOrgDesignTokens,
} from "@pengana/org-client";
import type { Theme as NavigationTheme } from "@react-navigation/native";
import { useTheme as useNavigationTheme } from "@react-navigation/native";
import { Platform } from "react-native";
import { useActiveOrg } from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";
import { useOrgDesignPresetPreview } from "@/shared/lib/org-design-preset-preview";
import { useColorScheme } from "@/shared/lib/use-color-scheme";

type NativeThemeColors = ResolvedAppThemeTokens &
	NavigationTheme["colors"] & {
		menuBackground: string;
		menuBorder: string;
		menuForeground: string;
		fontFamily: string;
		radius: number;
	};

export type NativeAppTheme = NativeThemeColors;

const radiusValues = {
	default: 10,
	none: 0,
	small: 6,
	medium: 14,
	large: 18,
} as const;

function resolveFontFamily(font: string) {
	switch (font) {
		case "jetbrains-mono":
		case "geist-mono":
			return "SpaceMono-Regular";
		case "lora":
		case "merriweather":
		case "playfair-display":
		case "noto-serif":
		case "roboto-slab":
			return Platform.select({
				ios: "Times New Roman",
				android: "serif",
				default: "serif",
			});
		default:
			return Platform.select({
				ios: "System",
				android: "sans-serif",
				default: "System",
			});
	}
}

export function createThemeColors(
	colorScheme: "light" | "dark",
	designPreset: unknown,
): NativeThemeColors {
	const preset = normalizeOrgDesignPreset(designPreset);
	const tokens = resolveOrgDesignTokens(
		preset,
		colorScheme === "dark" ? "dark" : "light",
	);

	return {
		...tokens,
		notification: tokens.danger,
		fontFamily: resolveFontFamily(preset.font),
		radius: radiusValues[preset.radius],
	};
}

export function buildNavigationTheme(
	colorScheme: "light" | "dark",
	designPreset: unknown,
): NavigationTheme {
	const preset = normalizeOrgDesignPreset(designPreset);
	const colors = createThemeColors(colorScheme, preset);

	return {
		dark: colorScheme === "dark",
		colors: {
			primary: colors.primary,
			background: colors.background,
			card: colors.card,
			text: colors.text,
			border: colors.border,
			notification: colors.notification,
		},
		fonts: {
			regular: {
				fontFamily: colors.fontFamily,
				fontWeight: "400",
			},
			medium: {
				fontFamily: colors.fontFamily,
				fontWeight: "500",
			},
			bold: {
				fontFamily: colors.fontFamily,
				fontWeight: "700",
			},
			heavy: {
				fontFamily: colors.fontFamily,
				fontWeight: "800",
			},
		},
	};
}

export function useTheme() {
	const { colorScheme } = useColorScheme();
	const { data: session } = authClient.useSession();
	const { data: activeOrg } = useActiveOrg({
		enabled: Boolean(session?.session?.activeOrganizationId),
	});
	const { previewDesignPreset } = useOrgDesignPresetPreview();
	const theme = buildNavigationTheme(
		colorScheme,
		previewDesignPreset ?? activeOrg?.designPreset ?? DEFAULT_ORG_DESIGN_PRESET,
	);
	const colors = createThemeColors(
		colorScheme,
		previewDesignPreset ?? activeOrg?.designPreset ?? DEFAULT_ORG_DESIGN_PRESET,
	);

	return {
		theme: colors,
		colorScheme,
		navigationTheme: theme,
		designPreset: normalizeOrgDesignPreset(
			previewDesignPreset ?? activeOrg?.designPreset,
		),
	};
}

export function useNavigationColors() {
	const theme = useNavigationTheme();
	return theme.colors;
}
