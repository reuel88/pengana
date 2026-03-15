import { useTranslation } from "@pengana/i18n";
import {
	ORG_ACCENT_THEME_OPTIONS,
	ORG_BASE_COLOR_OPTIONS,
	ORG_FONT_OPTIONS,
	ORG_ICON_LIBRARY_OPTIONS,
	ORG_MENU_ACCENT_OPTIONS,
	ORG_MENU_OPTIONS,
	ORG_RADIUS_OPTIONS,
	ORG_STYLE_OPTIONS,
	type OrgDesignPreset,
} from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { useMemo } from "react";

export function OrgAppearanceForm({
	designPreset,
	onDesignPresetChange,
	canEdit,
	hasChanges,
	loading,
	onSave,
}: {
	designPreset: OrgDesignPreset;
	onDesignPresetChange: (
		updater: (current: OrgDesignPreset) => OrgDesignPreset,
	) => void;
	canEdit: boolean;
	hasChanges: boolean;
	loading: boolean;
	onSave: () => void;
}) {
	const { t } = useTranslation("organization");

	const sections = useMemo(
		() =>
			[
				{
					key: "style",
					label: t("settings.appearance.style"),
					options: ORG_STYLE_OPTIONS,
				},
				{
					key: "baseColor",
					label: t("settings.appearance.baseColor"),
					options: ORG_BASE_COLOR_OPTIONS,
				},
				{
					key: "accentTheme",
					label: t("settings.appearance.accentTheme"),
					options: ORG_ACCENT_THEME_OPTIONS,
				},
				{
					key: "iconLibrary",
					label: t("settings.appearance.iconLibrary"),
					options: ORG_ICON_LIBRARY_OPTIONS,
				},
				{
					key: "font",
					label: t("settings.appearance.font"),
					options: ORG_FONT_OPTIONS,
				},
				{
					key: "radius",
					label: t("settings.appearance.radius"),
					options: ORG_RADIUS_OPTIONS,
				},
				{
					key: "menu",
					label: t("settings.appearance.menu"),
					options: ORG_MENU_OPTIONS,
				},
				{
					key: "menuAccent",
					label: t("settings.appearance.menuAccent"),
					options: ORG_MENU_ACCENT_OPTIONS,
				},
			] as const,
		[t],
	);

	return (
		<section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
			<div className="space-y-1">
				<h2 className="font-medium text-sm">
					{t("settings.appearance.title")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t("settings.appearance.description")}
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				{sections.map((section) => (
					<div key={section.key} className="space-y-2">
						<div className="font-medium text-sm">{section.label}</div>
						<div className="grid gap-2">
							{section.options.map((option) => {
								const selected = designPreset[section.key] === option.id;
								return (
									<button
										key={option.id}
										type="button"
										className={`rounded-xl border px-4 py-3 text-left transition ${
											selected
												? "border-primary bg-primary/10"
												: "border-border bg-background"
										} ${!canEdit ? "cursor-default opacity-80" : ""}`}
										onClick={() => {
											if (!canEdit) return;
											onDesignPresetChange((current) => ({
												...current,
												[section.key]: option.id,
											}));
										}}
										disabled={!canEdit}
									>
										<div className="font-medium text-sm">{option.label}</div>
										<div className="text-muted-foreground text-xs">
											{option.description}
										</div>
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>
			{canEdit && (
				<div className="flex justify-end">
					<Button
						type="button"
						disabled={loading || !hasChanges}
						onClick={onSave}
					>
						{loading ? t("common:submitting") : t("settings.appearance.save")}
					</Button>
				</div>
			)}
		</section>
	);
}
