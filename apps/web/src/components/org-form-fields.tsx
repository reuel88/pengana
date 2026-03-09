import { useTranslation } from "@pengana/i18n";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import type { AnyFieldApi } from "@tanstack/react-form";

const fieldConfig = {
	name: {
		defaultId: "org-name",
		labelKey: "create.name",
		placeholderKey: "create.namePlaceholder",
	},
	slug: {
		defaultId: "org-slug",
		labelKey: "create.slug",
		placeholderKey: "create.slugPlaceholder",
	},
	logo: {
		defaultId: "org-logo",
		labelKey: "create.logo",
		placeholderKey: "create.logoPlaceholder",
	},
} as const;

function OrgFormField({
	fieldKey,
	field,
	id,
	required,
}: {
	fieldKey: keyof typeof fieldConfig;
	field: AnyFieldApi;
	id?: string;
	required?: boolean;
}) {
	const { t } = useTranslation("organization");
	const config = fieldConfig[fieldKey];
	const fieldId = id ?? config.defaultId;

	return (
		<div className="flex flex-col gap-1">
			<Label htmlFor={fieldId}>{t(config.labelKey)}</Label>
			<Input
				id={fieldId}
				value={field.state.value as string}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				placeholder={t(config.placeholderKey)}
				required={required}
			/>
			{field.state.meta.errors.map((error) => (
				<p key={error?.message} className="text-red-500 text-xs">
					{error?.message}
				</p>
			))}
		</div>
	);
}

export function OrgNameField({
	field,
	id,
}: {
	field: AnyFieldApi;
	id?: string;
}) {
	return <OrgFormField fieldKey="name" field={field} id={id} />;
}

export function OrgSlugField({
	field,
	id,
	required,
}: {
	field: AnyFieldApi;
	id?: string;
	required?: boolean;
}) {
	return (
		<OrgFormField fieldKey="slug" field={field} id={id} required={required} />
	);
}

export function OrgLogoField({
	field,
	id,
}: {
	field: AnyFieldApi;
	id?: string;
}) {
	return <OrgFormField fieldKey="logo" field={field} id={id} />;
}
