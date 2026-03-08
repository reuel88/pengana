import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface TodoInputProps {
	onSubmit: (title: string) => Promise<void>;
	onError?: (error: unknown) => void;
}

export function TodoInput({ onSubmit, onError }: TodoInputProps) {
	const [title, setTitle] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const { t } = useTranslation("todos");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed || submitting) return;

		setSubmitting(true);
		try {
			await onSubmit(trimmed);
			setTitle("");
		} catch (error) {
			onError?.(error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<Input
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder={t("addPlaceholder")}
				className="flex-1"
			/>
			<Button type="submit" disabled={!title.trim() || submitting}>
				{t("addButton")}
			</Button>
		</form>
	);
}
