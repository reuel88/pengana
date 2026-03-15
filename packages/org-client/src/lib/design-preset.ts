export const ORG_STYLE_IDS = ["vega", "nova", "maia", "lyra", "mira"] as const;

export const ORG_BASE_COLOR_IDS = [
	"neutral",
	"stone",
	"zinc",
	"gray",
	"mauve",
	"olive",
	"mist",
	"taupe",
] as const;

export const ORG_ACCENT_THEME_IDS = [
	"neutral",
	"stone",
	"zinc",
	"gray",
	"amber",
	"blue",
	"cyan",
	"emerald",
	"fuchsia",
	"green",
	"indigo",
	"lime",
	"orange",
	"pink",
	"purple",
	"red",
	"rose",
	"sky",
	"teal",
	"violet",
	"yellow",
	"mauve",
	"olive",
	"mist",
	"taupe",
] as const;

export const ORG_ICON_LIBRARY_IDS = [
	"lucide",
	"hugeicons",
	"tabler",
	"phosphor",
	"remixicon",
] as const;

export const ORG_FONT_IDS = [
	"inter",
	"noto-sans",
	"nunito-sans",
	"figtree",
	"roboto",
	"raleway",
	"dm-sans",
	"public-sans",
	"outfit",
	"jetbrains-mono",
	"geist",
	"geist-mono",
	"lora",
	"merriweather",
	"playfair-display",
	"noto-serif",
	"roboto-slab",
] as const;

export const ORG_RADIUS_IDS = [
	"default",
	"none",
	"small",
	"medium",
	"large",
] as const;

export const ORG_MENU_IDS = [
	"default",
	"inverted",
	"default-translucent",
	"inverted-translucent",
] as const;

export const ORG_MENU_ACCENT_IDS = ["subtle", "bold"] as const;

export type OrgStyleId = (typeof ORG_STYLE_IDS)[number];
export type OrgBaseColorId = (typeof ORG_BASE_COLOR_IDS)[number];
export type OrgAccentThemeId = (typeof ORG_ACCENT_THEME_IDS)[number];
export type OrgIconLibraryId = (typeof ORG_ICON_LIBRARY_IDS)[number];
export type OrgFontId = (typeof ORG_FONT_IDS)[number];
export type OrgRadiusId = (typeof ORG_RADIUS_IDS)[number];
export type OrgMenuId = (typeof ORG_MENU_IDS)[number];
export type OrgMenuAccentId = (typeof ORG_MENU_ACCENT_IDS)[number];

export interface OrgDesignPreset {
	style: OrgStyleId;
	baseColor: OrgBaseColorId;
	accentTheme: OrgAccentThemeId;
	iconLibrary: OrgIconLibraryId;
	font: OrgFontId;
	radius: OrgRadiusId;
	menu: OrgMenuId;
	menuAccent: OrgMenuAccentId;
}

export const DEFAULT_ORG_DESIGN_PRESET: OrgDesignPreset = {
	style: "vega",
	baseColor: "neutral",
	accentTheme: "blue",
	iconLibrary: "lucide",
	font: "inter",
	radius: "default",
	menu: "default",
	menuAccent: "subtle",
};

type RegistryItem<T extends string> = {
	id: T;
	label: string;
	description: string;
};

const STYLE_DETAILS: Record<
	OrgStyleId,
	Omit<RegistryItem<OrgStyleId>, "id">
> = {
	vega: {
		label: "Vega",
		description: "Lucide with Inter-style product defaults.",
	},
	nova: {
		label: "Nova",
		description: "Sharper modern layout with Geist-like tone.",
	},
	maia: {
		label: "Maia",
		description: "Card-forward styling with stronger framing.",
	},
	lyra: {
		label: "Lyra",
		description: "Softer mono-leaning visual language.",
	},
	mira: {
		label: "Mira",
		description: "Rounded modern styling with lighter chrome.",
	},
};

const BASE_COLOR_DETAILS: Record<
	OrgBaseColorId,
	Omit<RegistryItem<OrgBaseColorId>, "id">
> = {
	neutral: { label: "Neutral", description: "Balanced grayscale surfaces." },
	stone: { label: "Stone", description: "Warm mineral neutrals." },
	zinc: { label: "Zinc", description: "Cool steel-leaning neutrals." },
	gray: { label: "Gray", description: "Classic cool gray surfaces." },
	mauve: { label: "Mauve", description: "Muted mauve-tinted neutrals." },
	olive: { label: "Olive", description: "Earthy olive-gray surfaces." },
	mist: { label: "Mist", description: "Soft blue-gray atmospheric neutrals." },
	taupe: { label: "Taupe", description: "Warm taupe-neutral surfaces." },
};

const ACCENT_THEME_DETAILS: Record<
	OrgAccentThemeId,
	Omit<RegistryItem<OrgAccentThemeId>, "id">
> = {
	neutral: { label: "Neutral", description: "Minimal neutral emphasis." },
	stone: { label: "Stone", description: "Warm stone accent color." },
	zinc: { label: "Zinc", description: "Cool zinc accent color." },
	gray: { label: "Gray", description: "Classic gray accent color." },
	amber: { label: "Amber", description: "Warm amber accents." },
	blue: { label: "Blue", description: "Cool blue accents." },
	cyan: { label: "Cyan", description: "Bright cyan highlights." },
	emerald: { label: "Emerald", description: "Fresh emerald accents." },
	fuchsia: { label: "Fuchsia", description: "Vivid fuchsia accents." },
	green: { label: "Green", description: "Balanced green accents." },
	indigo: { label: "Indigo", description: "Deep indigo accents." },
	lime: { label: "Lime", description: "Electric lime accents." },
	orange: { label: "Orange", description: "Energetic orange accents." },
	pink: { label: "Pink", description: "Bright pink accents." },
	purple: { label: "Purple", description: "Classic purple accents." },
	red: { label: "Red", description: "Strong red accents." },
	rose: { label: "Rose", description: "Rose-toned accents." },
	sky: { label: "Sky", description: "Open sky-blue accents." },
	teal: { label: "Teal", description: "Teal-green accents." },
	violet: { label: "Violet", description: "Violet accents." },
	yellow: { label: "Yellow", description: "Luminous yellow accents." },
	mauve: { label: "Mauve", description: "Muted mauve accents." },
	olive: { label: "Olive", description: "Olive-toned accents." },
	mist: { label: "Mist", description: "Mist-blue accents." },
	taupe: { label: "Taupe", description: "Warm taupe accents." },
};

const ICON_LIBRARY_DETAILS: Record<
	OrgIconLibraryId,
	Omit<RegistryItem<OrgIconLibraryId>, "id">
> = {
	lucide: { label: "Lucide", description: "Clean stroke-based icons." },
	hugeicons: { label: "HugeIcons", description: "Rounded icon styling." },
	tabler: { label: "Tabler", description: "Technical, precise icon styling." },
	phosphor: { label: "Phosphor", description: "Soft, rounded icon styling." },
	remixicon: { label: "Remix Icon", description: "Compact icon styling." },
};

const FONT_DETAILS: Record<OrgFontId, Omit<RegistryItem<OrgFontId>, "id">> = {
	inter: { label: "Inter", description: "Neutral UI sans serif." },
	"noto-sans": { label: "Noto Sans", description: "Wide-coverage sans serif." },
	"nunito-sans": {
		label: "Nunito Sans",
		description: "Friendly rounded sans serif.",
	},
	figtree: { label: "Figtree", description: "Sharp geometric sans serif." },
	roboto: { label: "Roboto", description: "Familiar modern sans serif." },
	raleway: { label: "Raleway", description: "Elegant display-leaning sans." },
	"dm-sans": { label: "DM Sans", description: "Compact contemporary sans." },
	"public-sans": {
		label: "Public Sans",
		description: "Government-grade neutral sans.",
	},
	outfit: { label: "Outfit", description: "Rounded geometric sans serif." },
	"jetbrains-mono": {
		label: "JetBrains Mono",
		description: "Developer-friendly monospace.",
	},
	geist: { label: "Geist", description: "Tighter modern sans serif." },
	"geist-mono": {
		label: "Geist Mono",
		description: "Monospaced UI voice.",
	},
	lora: { label: "Lora", description: "Readable editorial serif." },
	merriweather: {
		label: "Merriweather",
		description: "Structured text serif.",
	},
	"playfair-display": {
		label: "Playfair Display",
		description: "High-contrast display serif.",
	},
	"noto-serif": {
		label: "Noto Serif",
		description: "Wide-coverage serif family.",
	},
	"roboto-slab": {
		label: "Roboto Slab",
		description: "Square slab-serif voice.",
	},
};

const RADIUS_DETAILS: Record<
	OrgRadiusId,
	Omit<RegistryItem<OrgRadiusId>, "id">
> = {
	default: { label: "Default", description: "Standard app radius." },
	none: { label: "None", description: "Square corners throughout." },
	small: { label: "Small", description: "Tighter corners." },
	medium: { label: "Medium", description: "Softer corners." },
	large: { label: "Large", description: "Rounder corners throughout." },
};

const MENU_DETAILS: Record<OrgMenuId, Omit<RegistryItem<OrgMenuId>, "id">> = {
	default: { label: "Default", description: "Standard app chrome." },
	inverted: {
		label: "Inverted",
		description: "Higher contrast menu surface.",
	},
	"default-translucent": {
		label: "Default / Translucent",
		description: "Default chrome with glass treatment.",
	},
	"inverted-translucent": {
		label: "Inverted / Translucent",
		description: "High-contrast chrome with glass treatment.",
	},
};

const MENU_ACCENT_DETAILS: Record<
	OrgMenuAccentId,
	Omit<RegistryItem<OrgMenuAccentId>, "id">
> = {
	subtle: { label: "Subtle", description: "Muted active-state styling." },
	bold: { label: "Bold", description: "Stronger active-state emphasis." },
};

export const ORG_STYLE_OPTIONS: RegistryItem<OrgStyleId>[] = ORG_STYLE_IDS.map(
	(id) => ({ id, ...STYLE_DETAILS[id] }),
);

export const ORG_BASE_COLOR_OPTIONS: RegistryItem<OrgBaseColorId>[] =
	ORG_BASE_COLOR_IDS.map((id) => ({ id, ...BASE_COLOR_DETAILS[id] }));

export const ORG_ACCENT_THEME_OPTIONS: RegistryItem<OrgAccentThemeId>[] =
	ORG_ACCENT_THEME_IDS.map((id) => ({ id, ...ACCENT_THEME_DETAILS[id] }));

export const ORG_ICON_LIBRARY_OPTIONS: RegistryItem<OrgIconLibraryId>[] =
	ORG_ICON_LIBRARY_IDS.map((id) => ({ id, ...ICON_LIBRARY_DETAILS[id] }));

export const ORG_FONT_OPTIONS: RegistryItem<OrgFontId>[] = ORG_FONT_IDS.map(
	(id) => ({ id, ...FONT_DETAILS[id] }),
);

export const ORG_RADIUS_OPTIONS: RegistryItem<OrgRadiusId>[] =
	ORG_RADIUS_IDS.map((id) => ({ id, ...RADIUS_DETAILS[id] }));

export const ORG_MENU_OPTIONS: RegistryItem<OrgMenuId>[] = ORG_MENU_IDS.map(
	(id) => ({ id, ...MENU_DETAILS[id] }),
);

export const ORG_MENU_ACCENT_OPTIONS: RegistryItem<OrgMenuAccentId>[] =
	ORG_MENU_ACCENT_IDS.map((id) => ({ id, ...MENU_ACCENT_DETAILS[id] }));

function includes<T extends string>(
	values: readonly T[],
	value: unknown,
): value is T {
	return typeof value === "string" && values.includes(value as T);
}

function normalizeStyle(value: unknown): OrgStyleId {
	if (value === "default") return "vega";
	return includes(ORG_STYLE_IDS, value)
		? value
		: DEFAULT_ORG_DESIGN_PRESET.style;
}

function normalizeBaseColor(value: unknown): OrgBaseColorId {
	return includes(ORG_BASE_COLOR_IDS, value)
		? value
		: DEFAULT_ORG_DESIGN_PRESET.baseColor;
}

function normalizeAccentTheme(value: unknown): OrgAccentThemeId {
	return includes(ORG_ACCENT_THEME_IDS, value)
		? value
		: DEFAULT_ORG_DESIGN_PRESET.accentTheme;
}

function normalizeIconLibrary(value: unknown): OrgIconLibraryId {
	return includes(ORG_ICON_LIBRARY_IDS, value)
		? value
		: DEFAULT_ORG_DESIGN_PRESET.iconLibrary;
}

function normalizeFont(value: unknown): OrgFontId {
	if (value === "geistMono") return "geist-mono";
	return includes(ORG_FONT_IDS, value) ? value : DEFAULT_ORG_DESIGN_PRESET.font;
}

function normalizeRadius(value: unknown): OrgRadiusId {
	return includes(ORG_RADIUS_IDS, value)
		? value
		: DEFAULT_ORG_DESIGN_PRESET.radius;
}

function normalizeMenu(value: unknown): OrgMenuId {
	if (value === "translucent") return "default-translucent";
	return includes(ORG_MENU_IDS, value) ? value : DEFAULT_ORG_DESIGN_PRESET.menu;
}

function normalizeMenuAccent(value: unknown): OrgMenuAccentId {
	if (value === "contrast") return "bold";
	return includes(ORG_MENU_ACCENT_IDS, value)
		? value
		: DEFAULT_ORG_DESIGN_PRESET.menuAccent;
}

export function normalizeOrgDesignPreset(value: unknown): OrgDesignPreset {
	if (!value || typeof value !== "object") return DEFAULT_ORG_DESIGN_PRESET;

	const preset = value as Partial<Record<keyof OrgDesignPreset, unknown>>;

	return {
		style: normalizeStyle(preset.style),
		baseColor: normalizeBaseColor(preset.baseColor),
		accentTheme: normalizeAccentTheme(preset.accentTheme),
		iconLibrary: normalizeIconLibrary(preset.iconLibrary),
		font: normalizeFont(preset.font),
		radius: normalizeRadius(preset.radius),
		menu: normalizeMenu(preset.menu),
		menuAccent: normalizeMenuAccent(preset.menuAccent),
	};
}

export function isOrgDesignPresetEqual(
	left: OrgDesignPreset,
	right: OrgDesignPreset,
) {
	return (
		left.style === right.style &&
		left.baseColor === right.baseColor &&
		left.accentTheme === right.accentTheme &&
		left.iconLibrary === right.iconLibrary &&
		left.font === right.font &&
		left.radius === right.radius &&
		left.menu === right.menu &&
		left.menuAccent === right.menuAccent
	);
}
