import { useTranslation } from "@pengana/i18n";
import { useCallback } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useOrgSync } from "@/features/sync/org-sync-context";
import { useTheme } from "@/shared/lib/theme";
import { mutedText } from "@/shared/styles/shared";

import type { TodoItemRow } from "./components/todo-item";
import { TodoItem } from "./components/todo-item";
import { useOrgFilePicker } from "./hooks/use-org-file-picker";
import {
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
} from "./org-todo-actions";

export function OrgTodoList({ todos }: { todos: TodoItemRow[] }) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");
	const { triggerSync } = useOrgSync();
	const { showPickerForTodo } = useOrgFilePicker();

	const handleToggle = useCallback(
		async (id: string) => {
			try {
				await toggleOrgTodo(id);
				triggerSync();
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToToggleTodo"));
			}
		},
		[triggerSync, t],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await deleteOrgTodo(id);
				triggerSync();
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToDeleteTodo"));
			}
		},
		[triggerSync, t],
	);

	const handleResolve = useCallback(
		async (id: string, resolution: "local" | "server") => {
			try {
				await resolveOrgConflict(id, resolution);
				triggerSync();
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToResolveConflict"));
			}
		},
		[triggerSync, t],
	);

	if (todos.length === 0) {
		return (
			<Text style={[styles.emptyText, mutedText(theme)]}>{t("empty")}</Text>
		);
	}

	return (
		<View
			style={[styles.list, { borderColor: theme.border }]}
			testID="todo-list"
		>
			{todos.map((todo) => (
				<TodoItem
					key={todo.id}
					todo={todo}
					onToggle={handleToggle}
					onDelete={handleDelete}
					onResolve={handleResolve}
					onAttach={showPickerForTodo}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	list: {
		borderWidth: 1,
		borderRadius: 0,
	},
	emptyText: {
		textAlign: "center",
		paddingVertical: 16,
		fontSize: 14,
	},
});
