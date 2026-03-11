import { useTranslation } from "@pengana/i18n";
import type { Todo } from "@pengana/sync-engine";
import {
	Alert,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { useSync } from "@/features/sync/sync-context";
import { STATUS_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { useFilePicker } from "../hooks/use-file-picker";
import { deleteTodo, resolveConflict, toggleTodo } from "../todo-actions";

import { AttachButton, RetryButton } from "./attachment-actions";
import { AttachmentIndicator } from "./attachment-indicator";
import { ConflictActions } from "./conflict-actions";
import { SyncDot } from "./sync-dot";

export interface TodoItemRow extends Todo {
	attachmentLocalUri?: string | null;
	attachmentStatus?: "queued" | "uploading" | "uploaded" | "failed" | null;
}

export function TodoItem({ todo }: { todo: TodoItemRow }) {
	const { triggerSync } = useSync();
	const { theme } = useTheme();
	const { t } = useTranslation();
	const { showPicker } = useFilePicker(todo.id);

	const handleToggle = async () => {
		try {
			await toggleTodo(todo.id);
			triggerSync();
		} catch {
			Alert.alert(t("error.title"), t("errors:failedToToggleTodo"));
		}
	};

	const handleDelete = async () => {
		try {
			await deleteTodo(todo.id);
			triggerSync();
		} catch {
			Alert.alert(t("error.title"), t("errors:failedToDeleteTodo"));
		}
	};

	const handleResolve = async (resolution: "local" | "server") => {
		try {
			await resolveConflict(todo.id, resolution);
			triggerSync();
		} catch {
			Alert.alert(t("error.title"), t("errors:failedToResolveConflict"));
		}
	};

	return (
		<View
			testID="todo-row"
			style={[styles.todoItem, { borderBottomColor: theme.border }]}
		>
			<SyncDot status={todo.syncStatus} />
			<Switch
				testID="todo-toggle"
				value={todo.completed}
				onValueChange={handleToggle}
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
				<ConflictActions onResolve={handleResolve} />
			)}
			{!todo.attachmentUrl && !todo.attachmentStatus && (
				<AttachButton onPress={showPicker} />
			)}
			{todo.attachmentStatus === "failed" && (
				<RetryButton onPress={showPicker} />
			)}
			<TouchableOpacity
				testID="todo-delete"
				onPress={handleDelete}
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
