import { useTranslation } from "@pengana/i18n";
import type { Todo } from "@pengana/sync-engine";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { STATUS_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";

import { AttachButton, RetryButton } from "./attachment-actions";
import { AttachmentIndicator } from "./attachment-indicator";
import { ConflictActions } from "./conflict-actions";
import { SyncDot } from "./sync-dot";

export interface TodoItemRow extends Todo {
	attachmentLocalUri?: string | null;
	attachmentStatus?: "queued" | "uploading" | "uploaded" | "failed" | null;
}

export interface TodoItemHandlers {
	onToggle: (id: string) => void;
	onDelete: (id: string) => void;
	onResolve: (id: string, resolution: "local" | "server") => void;
	onAttach: (id: string) => void;
}

export function TodoItem({
	todo,
	onToggle,
	onDelete,
	onResolve,
	onAttach,
}: { todo: TodoItemRow } & TodoItemHandlers) {
	const { theme } = useTheme();
	const { t } = useTranslation();

	return (
		<View
			testID="todo-row"
			style={[styles.todoItem, { borderBottomColor: theme.border }]}
		>
			<SyncDot status={todo.syncStatus} />
			<Switch
				testID="todo-toggle"
				value={todo.completed}
				onValueChange={() => onToggle(todo.id)}
				accessibilityLabel={todo.title}
			/>
			<Text
				style={[
					styles.todoTitle,
					{ color: theme.text },
					todo.completed && styles.todoCompleted,
				]}
				numberOfLines={1}
			>
				{todo.title}
			</Text>
			<AttachmentIndicator
				status={todo.attachmentStatus}
				attachmentUrl={todo.attachmentUrl}
			/>
			{todo.syncStatus === "conflict" && (
				<ConflictActions onResolve={(r) => onResolve(todo.id, r)} />
			)}
			{!todo.attachmentUrl && !todo.attachmentStatus && (
				<AttachButton onPress={() => onAttach(todo.id)} />
			)}
			{todo.attachmentStatus === "failed" && (
				<RetryButton onPress={() => onAttach(todo.id)} />
			)}
			<TouchableOpacity
				testID="todo-delete"
				onPress={() => onDelete(todo.id)}
				style={styles.deleteButton}
				accessibilityRole="button"
				accessibilityLabel={t("todos:actions.delete")}
			>
				<Text style={styles.deleteText}>{t("todos:actions.delete")}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	todoItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderBottomWidth: 1,
	},
	todoTitle: {
		flex: 1,
		fontSize: 14,
	},
	todoCompleted: {
		textDecorationLine: "line-through",
		opacity: 0.5,
	},
	deleteButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	deleteText: {
		fontSize: 12,
		color: STATUS_COLORS.error,
	},
});
