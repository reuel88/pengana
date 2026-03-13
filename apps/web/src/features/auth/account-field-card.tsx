import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

export function AccountFieldCard({
	title,
	label,
	type = "text",
	note,
	value: initialValue,
	onSubmit,
}: {
	title: string;
	label: string;
	type?: string;
	note?: string;
	value: string;
	onSubmit: (value: string) => Promise<unknown>;
}) {
	const { t } = useTranslation();
	const inputId = useId();
	const [value, setValue] = useState(initialValue);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			await onSubmit(value);
			toast.success(t("auth:settings.account.updateSuccess"));
		} catch {
			toast.error(t("error.generic"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={inputId}>{label}</Label>
						<Input
							id={inputId}
							type={type}
							value={value}
							onChange={(e) => setValue(e.target.value)}
						/>
					</div>
					{note && <p className="text-muted-foreground text-xs">{note}</p>}
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? t("submitting") : title}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
