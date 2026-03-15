import {
	DEFAULT_ORG_DESIGN_PRESET,
	normalizeOrgDesignPreset,
	type OrgDesignPreset,
} from "./design-preset";
import {
	type OrgDesignPresetMode,
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

function setCssVariable(doc: Document, name: string, value: string) {
	doc.documentElement.style.setProperty(name, value);
}

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

	setCssVariable(doc, "--background", tokens.background);
	setCssVariable(doc, "--foreground", tokens.text);
	setCssVariable(doc, "--card", tokens.card);
	setCssVariable(doc, "--card-foreground", tokens.cardForeground);
	setCssVariable(doc, "--popover", tokens.popover);
	setCssVariable(doc, "--popover-foreground", tokens.popoverForeground);
	setCssVariable(doc, "--secondary", tokens.secondary);
	setCssVariable(doc, "--secondary-foreground", tokens.secondaryForeground);
	setCssVariable(doc, "--muted", tokens.muted);
	setCssVariable(doc, "--muted-foreground", tokens.mutedText);
	setCssVariable(doc, "--accent", tokens.secondary);
	setCssVariable(doc, "--accent-foreground", tokens.secondaryForeground);
	setCssVariable(doc, "--border", tokens.border);
	setCssVariable(doc, "--input", tokens.input);
	setCssVariable(doc, "--primary", tokens.primary);
	setCssVariable(doc, "--primary-foreground", tokens.primaryForeground);
	setCssVariable(doc, "--ring", tokens.ring);
	setCssVariable(doc, "--destructive", tokens.danger);
	setCssVariable(doc, "--sidebar", tokens.menuBackground);
	setCssVariable(doc, "--sidebar-foreground", tokens.menuForeground);
	setCssVariable(doc, "--sidebar-border", tokens.menuBorder);
	setCssVariable(doc, "--sidebar-ring", tokens.ring);
	setCssVariable(doc, "--sidebar-primary", tokens.primary);
	setCssVariable(doc, "--sidebar-primary-foreground", tokens.primaryForeground);
	setCssVariable(doc, "--sidebar-accent", tokens.menuAccentBackground);
	setCssVariable(
		doc,
		"--sidebar-accent-foreground",
		tokens.menuAccentForeground,
	);
	setCssVariable(doc, "--menu-bg", tokens.menuBackground);
	setCssVariable(doc, "--menu-foreground", tokens.menuForeground);
	setCssVariable(doc, "--menu-border", tokens.menuBorder);
	setCssVariable(doc, "--menu-accent", tokens.menuAccentBackground);
	setCssVariable(doc, "--menu-accent-foreground", tokens.menuAccentForeground);
	setCssVariable(doc, "--menu-backdrop-blur", tokens.menuBackdropBlur);
	setCssVariable(doc, "--radius", radiusValues[preset.radius]);
	setCssVariable(doc, "--font-sans", fontStacks[preset.font]);
}
