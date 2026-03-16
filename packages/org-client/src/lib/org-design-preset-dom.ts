import {
	DEFAULT_ORG_DESIGN_PRESET,
	normalizeOrgDesignPreset,
	type OrgDesignPreset,
} from "./design-preset";
import {
	type OrgDesignPresetMode,
	type ResolvedAppThemeTokens,
	resolveOrgDesignTokens,
} from "./design-theme";

const fontStacks = {
	inter: '"Inter Variable", "Inter", sans-serif',
	"noto-sans": '"Noto Sans", "Inter Variable", sans-serif',
	"nunito-sans": '"Nunito Sans", "Inter Variable", sans-serif',
	figtree: '"Figtree", "Inter Variable", sans-serif',
	roboto: '"Roboto", "Inter Variable", sans-serif',
	raleway: '"Raleway", "Inter Variable", sans-serif',
	"dm-sans": '"DM Sans", "Inter Variable", sans-serif',
	"public-sans": '"Public Sans", "Inter Variable", sans-serif',
	outfit: '"Outfit", "Inter Variable", sans-serif',
	"jetbrains-mono": '"JetBrains Mono", "Geist Mono", ui-monospace, monospace',
	geist: '"Geist", "Inter Variable", sans-serif',
	"geist-mono": '"Geist Mono", "SFMono-Regular", ui-monospace, monospace',
	lora: '"Lora", Georgia, serif',
	merriweather: '"Merriweather", Georgia, serif',
	"playfair-display": '"Playfair Display", Georgia, serif',
	"noto-serif": '"Noto Serif", Georgia, serif',
	"roboto-slab": '"Roboto Slab", Georgia, serif',
} as const;

const radiusValues = {
	default: "0.625rem",
	none: "0rem",
	small: "0.375rem",
	medium: "0.875rem",
	large: "1.125rem",
} as const;

type CssVariableMapping = [
	cssVar: string,
	tokenKey: keyof ResolvedAppThemeTokens,
];

const TOKEN_TO_CSS_VARS: CssVariableMapping[] = [
	["--background", "background"],
	["--foreground", "text"],
	["--card", "card"],
	["--card-foreground", "cardForeground"],
	["--popover", "popover"],
	["--popover-foreground", "popoverForeground"],
	["--secondary", "secondary"],
	["--secondary-foreground", "secondaryForeground"],
	["--muted", "muted"],
	["--muted-foreground", "mutedText"],
	["--accent", "secondary"],
	["--accent-foreground", "secondaryForeground"],
	["--border", "border"],
	["--input", "input"],
	["--primary", "primary"],
	["--primary-foreground", "primaryForeground"],
	["--ring", "ring"],
	["--destructive", "danger"],
	["--sidebar", "menuBackground"],
	["--sidebar-foreground", "menuForeground"],
	["--sidebar-border", "menuBorder"],
	["--sidebar-ring", "ring"],
	["--sidebar-primary", "primary"],
	["--sidebar-primary-foreground", "primaryForeground"],
	["--sidebar-accent", "menuAccentBackground"],
	["--sidebar-accent-foreground", "menuAccentForeground"],
	["--menu-bg", "menuBackground"],
	["--menu-foreground", "menuForeground"],
	["--menu-border", "menuBorder"],
	["--menu-accent", "menuAccentBackground"],
	["--menu-accent-foreground", "menuAccentForeground"],
	["--menu-backdrop-blur", "menuBackdropBlur"],
];

export function applyOrgDesignPresetToDocument(
	presetInput: OrgDesignPreset | Record<string, unknown> | null | undefined,
	mode: OrgDesignPresetMode,
	doc: Document = document,
) {
	const preset = normalizeOrgDesignPreset(
		presetInput ?? DEFAULT_ORG_DESIGN_PRESET,
	);
	const tokens = resolveOrgDesignTokens(preset, mode);

	doc.documentElement.dataset.orgStyle = preset.style;
	doc.documentElement.dataset.orgIconLibrary = preset.iconLibrary;
	doc.documentElement.dataset.orgMenu = preset.menu;
	doc.documentElement.dataset.orgMenuAccent = preset.menuAccent;

	const style = doc.documentElement.style;
	for (const [cssVar, tokenKey] of TOKEN_TO_CSS_VARS) {
		style.setProperty(cssVar, tokens[tokenKey]);
	}
	style.setProperty("--radius", radiusValues[preset.radius]);
	style.setProperty("--font-sans", fontStacks[preset.font]);
}
