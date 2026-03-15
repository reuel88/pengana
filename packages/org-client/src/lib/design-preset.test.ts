import { describe, expect, it } from "vitest";
import {
	DEFAULT_ORG_DESIGN_PRESET,
	normalizeOrgDesignPreset,
	ORG_ACCENT_THEME_IDS,
	ORG_BASE_COLOR_IDS,
	ORG_FONT_IDS,
	ORG_ICON_LIBRARY_IDS,
	ORG_MENU_ACCENT_IDS,
	ORG_MENU_IDS,
	ORG_RADIUS_IDS,
	ORG_STYLE_IDS,
} from "./design-preset";
import { resolveOrgDesignTokens } from "./design-theme";

describe("normalizeOrgDesignPreset", () => {
	it("returns the default preset for missing values", () => {
		expect(normalizeOrgDesignPreset(undefined)).toEqual(
			DEFAULT_ORG_DESIGN_PRESET,
		);
	});

	it("accepts every supported official option id", () => {
		expect(
			normalizeOrgDesignPreset({
				style: ORG_STYLE_IDS.at(-1),
				baseColor: ORG_BASE_COLOR_IDS.at(-1),
				accentTheme: ORG_ACCENT_THEME_IDS.at(-1),
				iconLibrary: ORG_ICON_LIBRARY_IDS.at(-1),
				font: ORG_FONT_IDS.at(-1),
				radius: ORG_RADIUS_IDS.at(-1),
				menu: ORG_MENU_IDS.at(-1),
				menuAccent: ORG_MENU_ACCENT_IDS.at(-1),
			}),
		).toEqual({
			style: "mira",
			baseColor: "taupe",
			accentTheme: "taupe",
			iconLibrary: "remixicon",
			font: "roboto-slab",
			radius: "large",
			menu: "inverted-translucent",
			menuAccent: "bold",
		});
	});

	it("maps legacy saved values to the new shadcn-aligned ids", () => {
		expect(
			normalizeOrgDesignPreset({
				style: "default",
				baseColor: "mauve",
				accentTheme: "amber",
				iconLibrary: "phosphor",
				font: "geistMono",
				radius: "medium",
				menu: "translucent",
				menuAccent: "contrast",
			}),
		).toEqual({
			style: "vega",
			baseColor: "mauve",
			accentTheme: "amber",
			iconLibrary: "phosphor",
			font: "geist-mono",
			radius: "medium",
			menu: "default-translucent",
			menuAccent: "bold",
		});
	});

	it("falls back field-by-field for unknown values", () => {
		expect(
			normalizeOrgDesignPreset({
				style: "unknown",
				baseColor: "unknown",
				accentTheme: "unknown",
				iconLibrary: "unknown",
				font: "unknown",
				radius: "unknown",
				menu: "unknown",
				menuAccent: "unknown",
			}),
		).toEqual(DEFAULT_ORG_DESIGN_PRESET);
	});
});

describe("resolveOrgDesignTokens", () => {
	it("produces shared semantic tokens for web and native adapters", () => {
		const tokens = resolveOrgDesignTokens(
			{
				...DEFAULT_ORG_DESIGN_PRESET,
				accentTheme: "yellow",
				menu: "inverted-translucent",
				menuAccent: "bold",
			},
			"dark",
		);

		expect(tokens.primary).toContain("hsl(");
		expect(tokens.primaryForeground).toContain("hsl(");
		expect(tokens.background).toContain("hsl(");
		expect(tokens.dangerSurface).toContain("hsl(");
		expect(tokens.menuBackground).toContain("color-mix");
		expect(tokens.menuBackdropBlur).toBe("blur(18px)");
		expect(tokens.iconLibrary).toBe(DEFAULT_ORG_DESIGN_PRESET.iconLibrary);
		expect(tokens.radiusKey).toBe(DEFAULT_ORG_DESIGN_PRESET.radius);
	});
});
