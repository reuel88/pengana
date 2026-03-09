import { useTranslation } from "@pengana/i18n";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";

interface OrgFieldProps {
	value: string;
	onChange: (value: string) => void;
	id?: string;
	required?: boolean;
}

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
	field,
	value,
	onChange,
	id,
	required,
}: OrgFieldProps & { field: keyof typeof fieldConfig }) {
	const { t } = useTranslation("organization");
	const config = fieldConfig[field];
	const fieldId = id ?? config.defaultId;

	return (
		<div className="flex flex-col gap-1">
			<Label htmlFor={fieldId}>{t(config.labelKey)}</Label>
			<Input
				id={fieldId}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={t(config.placeholderKey)}
				required={required}
			/>
		</div>
	);
}

export function OrgNameField(props: OrgFieldProps) {
	return <OrgFormField field="name" {...props} />;
}

export function OrgSlugField(props: OrgFieldProps & { required?: boolean }) {
	return <OrgFormField field="slug" {...props} />;
}

export function OrgLogoField(props: OrgFieldProps) {
	return <OrgFormField field="logo" {...props} />;
}
