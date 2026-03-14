import { useTranslation } from "@pengana/i18n";
import { useCallback } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/lib/theme";
import { mutedText } from "@/shared/styles/shared";

import type { TodoItemRow } from "./components/todo-item";
import { TodoItem } from "./components/todo-item";

export type { TodoItemRow };

export type TodoListActions = {
	toggleTodo: (id: string) => Promise<void>;
	deleteTodo: (id: string) => Promise<void>;
	resolveConflict: (
		id: string,
		resolution: "local" | "server",
	) => Promise<void>;
};

export function TodoListBase({
	todos,
	triggerSync,
	showPickerForTodo,
	actions,
}: {
	todos: TodoItemRow[];
	triggerSync: () => void;
	showPickerForTodo: (todoId: string) => void;
	actions: TodoListActions;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	const handleToggle = useCallback(
		async (id: string) => {
			try {
				await actions.toggleTodo(id);
				triggerSync();
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToToggleTodo"));
			}
		},
		[triggerSync, actions, t],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await actions.deleteTodo(id);
				triggerSync();
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToDeleteTodo"));
			}
		},
		[triggerSync, actions, t],
	);

	const handleResolve = useCallback(
		async (id: string, resolution: "local" | "server") => {
			try {
				await actions.resolveConflict(id, resolution);
				triggerSync();
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToResolveConflict"));
			}
		},
		[triggerSync, actions, t],
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
