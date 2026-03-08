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
import { STATUS_COLORS } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";
import { useFilePicker } from "../hooks/use-file-picker";
import { deleteTodo, resolveConflict, toggleTodo } from "../todo-actions";

import { AttachmentIndicator } from "./attachment-indicator";
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
			Alert.alert("Error", t("errors:failedToToggleTodo"));
		}
	};

	const handleDelete = async () => {
		await deleteTodo(todo.id);
		triggerSync();
	};

	const handleResolve = async (resolution: "local" | "server") => {
		await resolveConflict(todo.id, resolution);
		triggerSync();
	};

	return (
		<View style={[styles.todoItem, { borderBottomColor: theme.border }]}>
			<SyncDot status={todo.syncStatus} />
			<Switch
				value={todo.completed}
				onValueChange={handleToggle}
				style={styles.switch}
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
				<View style={styles.conflictButtons}>
					<TouchableOpacity
						style={[styles.smallButton, { borderColor: theme.border }]}
						onPress={() => handleResolve("local")}
					>
						<Text style={[styles.smallButtonText, { color: theme.text }]}>
							{t("todos:actions.keepLocal")}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.smallButton, { borderColor: theme.border }]}
						onPress={() => handleResolve("server")}
					>
						<Text style={[styles.smallButtonText, { color: theme.text }]}>
							{t("todos:actions.useServer")}
						</Text>
					</TouchableOpacity>
				</View>
			)}
			{!todo.attachmentUrl && !todo.attachmentStatus && (
				<TouchableOpacity onPress={showPicker} style={styles.attachButton}>
					<Text style={[styles.attachText, { color: theme.primary }]}>
						{t("todos:actions.attach")}
					</Text>
				</TouchableOpacity>
			)}
			{todo.attachmentStatus === "failed" && (
				<TouchableOpacity onPress={showPicker} style={styles.attachButton}>
					<Text style={styles.retryText}>{t("todos:actions.retry")}</Text>
				</TouchableOpacity>
			)}
			<TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
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
	switch: {
		transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
	},
	todoTitle: {
		flex: 1,
		fontSize: 14,
	},
	todoCompleted: {
		textDecorationLine: "line-through",
		opacity: 0.5,
	},
	conflictButtons: {
		flexDirection: "row",
		gap: 4,
	},
	smallButton: {
		borderWidth: 1,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	smallButtonText: {
		fontSize: 11,
	},
	attachButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	attachText: {
		fontSize: 12,
	},
	retryText: {
		fontSize: 12,
		color: STATUS_COLORS.warning,
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
