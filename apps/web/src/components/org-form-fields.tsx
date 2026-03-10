import { useTranslation } from "@pengana/i18n";
import type { AnyFieldApi } from "@tanstack/react-form";

import { FormField } from "@/components/form-field";

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

	return (
		<FormField
			field={field}
			label={t(config.labelKey)}
			id={id ?? config.defaultId}
			placeholder={t(config.placeholderKey)}
			required={required}
		/>
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
