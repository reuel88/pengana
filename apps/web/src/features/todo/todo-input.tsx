import { Button } from "@pengana/ui/components/button";
import { Input } from "@pengana/ui/components/input";
import { useState } from "react";
import { toast } from "sonner";
import { useSync } from "@/features/sync/sync-context";

import { addTodo } from "./todo-actions";

export function TodoInput({ userId }: { userId: string }) {
	const [title, setTitle] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const { triggerSync } = useSync();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed || submitting) return;

		setSubmitting(true);
		try {
			await addTodo(userId, trimmed);
			setTitle("");
			triggerSync();
		} catch {
			toast.error("Failed to add todo");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<Input
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="Add a new todo..."
				className="flex-1"
			/>
			<Button type="submit" disabled={!title.trim() || submitting}>
				Add
			</Button>
		</form>
	);
}
