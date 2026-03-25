import { useTranslation } from "@pengana/i18n";
import { type FormEvent, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface TodoInputProps {
	onSubmit: (title: string) => Promise<void>;
	onError?: (error: unknown) => void;
}

export function TodoInput({ onSubmit, onError }: TodoInputProps) {
	const { t } = useTranslation("todos");

	const [title, setTitle] = useState("");

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) return;

		try {
			await onSubmit(trimmed);
			setTitle("");
		} catch (error) {
			onError?.(error);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex gap-2"
			data-testid="todo-form"
		>
			<Input
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder={t("addPlaceholder")}
				className="flex-1"
				data-testid="todo-input"
			/>
			<Button type="submit" disabled={!title.trim()} data-testid="todo-submit">
				{t("addButton")}
			</Button>
		</form>
	);
}
