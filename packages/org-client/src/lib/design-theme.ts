import {
	DEFAULT_ORG_DESIGN_PRESET,
	normalizeOrgDesignPreset,
	type OrgDesignPreset,
} from "./design-preset";

export type OrgDesignPresetMode = "light" | "dark";

export type ResolvedAppThemeTokens = {
	style: OrgDesignPreset["style"];
	iconLibrary: OrgDesignPreset["iconLibrary"];
	font: OrgDesignPreset["font"];
	radiusKey: OrgDesignPreset["radius"];
	menu: OrgDesignPreset["menu"];
	menuAccent: OrgDesignPreset["menuAccent"];
	background: string;
	text: string;
	card: string;
	cardForeground: string;
	popover: string;
	popoverForeground: string;
	secondary: string;
	secondaryForeground: string;
	muted: string;
	mutedText: string;
	secondaryText: string;
	border: string;
	input: string;
	primary: string;
	primaryForeground: string;
	ring: string;
	success: string;
	successSurface: string;
	warning: string;
	warningSurface: string;
	danger: string;
	dangerSurface: string;
	placeholder: string;
	overlay: string;
	menuBackground: string;
	menuForeground: string;
	menuBorder: string;
	menuAccentBackground: string;
	menuAccentForeground: string;
	menuBackdropBlur: string;
};

const baseColorDescriptors = {
	neutral: { hue: 240, saturation: 3 },
	stone: { hue: 30, saturation: 7 },
	zinc: { hue: 240, saturation: 5 },
	gray: { hue: 220, saturation: 8 },
	mauve: { hue: 320, saturation: 16 },
	olive: { hue: 110, saturation: 12 },
	mist: { hue: 205, saturation: 16 },
	taupe: { hue: 24, saturation: 12 },
} as const;

const accentThemeDescriptors = {
	neutral: { hue: 240, saturation: 4 },
	stone: { hue: 30, saturation: 10 },
	zinc: { hue: 240, saturation: 7 },
	gray: { hue: 220, saturation: 12 },
	amber: { hue: 38, saturation: 92 },
	blue: { hue: 221, saturation: 83 },
	cyan: { hue: 191, saturation: 88 },
	emerald: { hue: 160, saturation: 84 },
	fuchsia: { hue: 292, saturation: 84 },
	green: { hue: 142, saturation: 72 },
	indigo: { hue: 239, saturation: 74 },
	lime: { hue: 84, saturation: 81 },
	orange: { hue: 24, saturation: 95 },
	pink: { hue: 335, saturation: 86 },
	purple: { hue: 272, saturation: 71 },
	red: { hue: 0, saturation: 84 },
	rose: { hue: 346, saturation: 78 },
	sky: { hue: 199, saturation: 89 },
	teal: { hue: 173, saturation: 80 },
	violet: { hue: 262, saturation: 83 },
	yellow: { hue: 48, saturation: 96 },
	mauve: { hue: 320, saturation: 26 },
	olive: { hue: 105, saturation: 22 },
	mist: { hue: 205, saturation: 28 },
	taupe: { hue: 24, saturation: 20 },
} as const;

function hsl(
	hue: number,
	saturation: number,
	lightness: number,
	alpha?: number,
) {
	if (alpha === undefined) {
		return `hsl(${hue} ${saturation}% ${lightness}%)`;
	}

	return `hsl(${hue} ${saturation}% ${lightness}% / ${alpha})`;
}

function createSurfaceTokens(
	mode: OrgDesignPresetMode,
	hue: number,
	saturation: number,
) {
	if (mode === "light") {
		return {
			background: hsl(hue, Math.max(1, saturation * 0.35), 98),
			text: hsl(hue, Math.max(4, saturation * 0.7), 12),
			card: hsl(hue, Math.max(1, saturation * 0.25), 99),
			cardForeground: hsl(hue, Math.max(4, saturation * 0.7), 12),
			popover: hsl(hue, Math.max(1, saturation * 0.25), 99),
			popoverForeground: hsl(hue, Math.max(4, saturation * 0.7), 12),
			secondary: hsl(hue, Math.max(2, saturation * 0.5), 95),
			secondaryForeground: hsl(hue, Math.max(4, saturation * 0.75), 22),
			muted: hsl(hue, Math.max(2, saturation * 0.45), 95),
			mutedText: hsl(hue, Math.max(5, saturation * 0.65), 42),
			secondaryText: hsl(hue, Math.max(4, saturation * 0.7), 28),
			border: hsl(hue, Math.max(3, saturation * 0.45), 88),
			input: hsl(hue, Math.max(3, saturation * 0.45), 88),
			placeholder: hsl(hue, Math.max(4, saturation * 0.5), 58),
			overlay: hsl(240, 12, 10, 0.42),
		};
	}

	return {
		background: hsl(hue, Math.max(4, saturation * 0.45), 12),
		text: hsl(hue, Math.max(4, saturation * 0.4), 96),
		card: hsl(hue, Math.max(5, saturation * 0.5), 16),
		cardForeground: hsl(hue, Math.max(4, saturation * 0.4), 96),
		popover: hsl(hue, Math.max(5, saturation * 0.5), 16),
		popoverForeground: hsl(hue, Math.max(4, saturation * 0.4), 96),
		secondary: hsl(hue, Math.max(5, saturation * 0.55), 22),
		secondaryForeground: hsl(hue, Math.max(4, saturation * 0.4), 96),
		muted: hsl(hue, Math.max(5, saturation * 0.55), 22),
		mutedText: hsl(hue, Math.max(4, saturation * 0.45), 70),
		secondaryText: hsl(hue, Math.max(4, saturation * 0.4), 82),
		border: hsl(hue, Math.max(4, saturation * 0.45), 28, 0.55),
		input: hsl(hue, Math.max(4, saturation * 0.45), 30, 0.65),
		placeholder: hsl(hue, Math.max(4, saturation * 0.45), 54),
		overlay: hsl(240, 12, 4, 0.58),
	};
}

function createAccentTokens(
	mode: OrgDesignPresetMode,
	hue: number,
	saturation: number,
) {
	if (mode === "light") {
		return {
			primary: hsl(hue, saturation, hue === 48 ? 42 : 52),
			primaryForeground:
				hue >= 45 && hue <= 90 ? hsl(hue, 18, 12) : hsl(0, 0, 98),
			ring: hsl(hue, Math.max(18, saturation - 18), 64),
		};
	}

	return {
		primary: hsl(hue, Math.max(10, saturation - 10), hue === 48 ? 64 : 62),
		primaryForeground:
			hue >= 45 && hue <= 120 ? hsl(hue, 18, 14) : hsl(hue, 24, 96),
		ring: hsl(hue, Math.max(12, saturation - 22), 58),
	};
}

function createStatusTokens(mode: OrgDesignPresetMode) {
	if (mode === "light") {
		return {
			success: hsl(142, 72, 40),
			successSurface: hsl(142, 72, 40, 0.12),
			warning: hsl(38, 92, 42),
			warningSurface: hsl(38, 92, 42, 0.16),
			danger: hsl(0, 82, 58),
			dangerSurface: hsl(0, 82, 58, 0.12),
		};
	}

	return {
		success: hsl(142, 70, 62),
		successSurface: hsl(142, 70, 62, 0.18),
		warning: hsl(42, 92, 62),
		warningSurface: hsl(42, 92, 62, 0.22),
		danger: hsl(0, 72, 54),
		dangerSurface: hsl(0, 72, 54, 0.18),
	};
}

function createMenuTokens(
	mode: OrgDesignPresetMode,
	menu: OrgDesignPreset["menu"],
	surface: ReturnType<typeof createSurfaceTokens>,
) {
	const inverted = menu.startsWith("inverted");
	const translucent = menu.endsWith("translucent");

	if (!inverted) {
		return {
			menuBackground: translucent
				? mode === "light"
					? "color-mix(in oklab, white 78%, transparent)"
					: "color-mix(in oklab, black 48%, transparent)"
				: surface.card,
			menuForeground: surface.text,
			menuBorder: translucent
				? mode === "light"
					? "color-mix(in oklab, black 12%, transparent)"
					: "color-mix(in oklab, white 14%, transparent)"
				: surface.border,
			menuBackdropBlur: translucent ? "blur(18px)" : "none",
		};
	}

	return {
		menuBackground: translucent
			? mode === "light"
				? "color-mix(in oklab, black 58%, transparent)"
				: "color-mix(in oklab, white 76%, transparent)"
			: mode === "light"
				? hsl(240, 8, 16)
				: hsl(0, 0, 92),
		menuForeground: mode === "light" ? hsl(0, 0, 98) : hsl(240, 10, 12),
		menuBorder: translucent
			? mode === "light"
				? "color-mix(in oklab, white 14%, transparent)"
				: "color-mix(in oklab, black 16%, transparent)"
			: mode === "light"
				? hsl(240, 6, 24)
				: hsl(0, 0, 82),
		menuBackdropBlur: translucent ? "blur(18px)" : "none",
	};
}

function createMenuAccentTokens(
	menuAccent: OrgDesignPreset["menuAccent"],
	surface: ReturnType<typeof createSurfaceTokens>,
	accent: ReturnType<typeof createAccentTokens>,
) {
	if (menuAccent === "bold") {
		return {
			menuAccentBackground: accent.primary,
			menuAccentForeground: accent.primaryForeground,
		};
	}

	return {
		menuAccentBackground: surface.secondary,
		menuAccentForeground: surface.secondaryForeground,
	};
}

export function resolveOrgDesignTokens(
	presetInput: OrgDesignPreset | Record<string, unknown> | null | undefined,
	mode: OrgDesignPresetMode,
): ResolvedAppThemeTokens {
	const preset = normalizeOrgDesignPreset(
		presetInput ?? DEFAULT_ORG_DESIGN_PRESET,
	);
	const baseDescriptor = baseColorDescriptors[preset.baseColor];
	const accentDescriptor = accentThemeDescriptors[preset.accentTheme];
	const surface = createSurfaceTokens(
		mode,
		baseDescriptor.hue,
		baseDescriptor.saturation,
	);
	const accent = createAccentTokens(
		mode,
		accentDescriptor.hue,
		accentDescriptor.saturation,
	);
	const status = createStatusTokens(mode);
	const menu = createMenuTokens(mode, preset.menu, surface);
	const menuAccent = createMenuAccentTokens(preset.menuAccent, surface, accent);

	return {
		style: preset.style,
		iconLibrary: preset.iconLibrary,
		font: preset.font,
		radiusKey: preset.radius,
		menu: preset.menu,
		menuAccent: preset.menuAccent,
		background: surface.background,
		text: surface.text,
		card: surface.card,
		cardForeground: surface.cardForeground,
		popover: surface.popover,
		popoverForeground: surface.popoverForeground,
		secondary: surface.secondary,
		secondaryForeground: surface.secondaryForeground,
		muted: surface.muted,
		mutedText: surface.mutedText,
		secondaryText: surface.secondaryText,
		border: surface.border,
		input: surface.input,
		primary: accent.primary,
		primaryForeground: accent.primaryForeground,
		ring: accent.ring,
		success: status.success,
		successSurface: status.successSurface,
		warning: status.warning,
		warningSurface: status.warningSurface,
		danger: status.danger,
		dangerSurface: status.dangerSurface,
		placeholder: surface.placeholder,
		overlay: surface.overlay,
		menuBackground: menu.menuBackground,
		menuForeground: menu.menuForeground,
		menuBorder: menu.menuBorder,
		menuAccentBackground: menuAccent.menuAccentBackground,
		menuAccentForeground: menuAccent.menuAccentForeground,
		menuBackdropBlur: menu.menuBackdropBlur,
	};
}
