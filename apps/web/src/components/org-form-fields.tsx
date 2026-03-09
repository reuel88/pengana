import { useTranslation } from "@pengana/i18n";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";

interface OrgFieldProps {
	value: string;
	onChange: (value: string) => void;
	id?: string;
}

export function OrgNameField({
	value,
	onChange,
	id = "org-name",
}: OrgFieldProps) {
	const { t } = useTranslation("organization");
	return (
		<div className="flex flex-col gap-1">
			<Label htmlFor={id}>{t("create.name")}</Label>
			<Input
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={t("create.namePlaceholder")}
				required
			/>
		</div>
	);
}

export function OrgSlugField({
	value,
	onChange,
	id = "org-slug",
	required,
}: OrgFieldProps & { required?: boolean }) {
	const { t } = useTranslation("organization");
	return (
		<div className="flex flex-col gap-1">
			<Label htmlFor={id}>{t("create.slug")}</Label>
			<Input
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={t("create.slugPlaceholder")}
				required={required}
			/>
		</div>
	);
}

export function OrgLogoField({
	value,
	onChange,
	id = "org-logo",
}: OrgFieldProps) {
	const { t } = useTranslation("organization");
	return (
		<div className="flex flex-col gap-1">
			<Label htmlFor={id}>{t("create.logo")}</Label>
			<Input
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={t("create.logoPlaceholder")}
			/>
		</div>
	);
}
