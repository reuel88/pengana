import { useTranslation } from "@pengana/i18n";
import type { Todo } from "@pengana/sync-engine";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/shared/lib/theme";
import { destructiveText, themedText } from "@/shared/styles/shared";

import { AttachButton, RemoveButton, RetryButton } from "./attachment-actions";
import { ConflictActions } from "./conflict-actions";
import { SyncDot } from "./sync-dot";

const MAX_ATTACHMENTS = 10;

export interface AttachmentRow {
	id: string;
	url: string | null;
	localUri: string | null;
	status: "queued" | "uploading" | "uploaded" | "failed" | null;
	mimeType: string;
}

export interface TodoItemRow extends Todo {
	attachments: AttachmentRow[];
}

export interface TodoItemHandlers {
	onToggle: (id: string) => void;
	onDelete: (id: string) => void;
	onResolve: (id: string, resolution: "local" | "server") => void;
	onAttach: (id: string) => void;
	onRemoveAttachment?: (attachmentId: string) => void;
	onRetryAttachment?: (attachmentId: string) => void;
}

function mimeLabel(mimeType: string): string {
	if (mimeType.startsWith("image/")) return "IMG";
	if (mimeType === "application/pdf") return "PDF";
	return "FILE";
}

export function TodoItem({
	todo,
	onToggle,
	onDelete,
	onResolve,
	onAttach,
	onRemoveAttachment,
	onRetryAttachment,
}: { todo: TodoItemRow } & TodoItemHandlers) {
	const { theme } = useTheme();
	const { t } = useTranslation();

	const canAttach = todo.attachments.length < MAX_ATTACHMENTS;

	return (
		<View
			testID="todo-row"
			style={[styles.todoItem, { borderBottomColor: theme.border }]}
		>
			<View style={styles.mainRow}>
				<SyncDot status={todo.syncStatus} />
				<Switch
					testID="todo-toggle"
					value={todo.completed}
					onValueChange={() => onToggle(todo.id)}
					accessibilityLabel={todo.title}
					accessibilityRole="switch"
					accessibilityState={{ checked: todo.completed }}
				/>
				<Text
					style={[
						styles.todoTitle,
						themedText(theme),
						todo.completed && styles.todoCompleted,
					]}
					numberOfLines={1}
				>
					{todo.title}
				</Text>
				{todo.syncStatus === "conflict" && (
					<ConflictActions onResolve={(r) => onResolve(todo.id, r)} />
				)}
				{canAttach && <AttachButton onPress={() => onAttach(todo.id)} />}
				<TouchableOpacity
					testID="todo-delete"
					onPress={() => onDelete(todo.id)}
					style={styles.deleteButton}
					accessibilityRole="button"
					accessibilityLabel={`${t("todos:actions.delete")}: ${todo.title}`}
				>
					<Text style={[styles.deleteText, destructiveText(theme)]}>
						{t("todos:actions.delete")}
					</Text>
				</TouchableOpacity>
			</View>
			{todo.attachments.length > 0 && (
				<View style={styles.attachmentRow}>
					{todo.attachments.map((a) => (
						<View
							key={a.id}
							style={[
								styles.attachmentChip,
								{
									backgroundColor: theme.background,
									borderColor: theme.border,
									borderRadius: Math.max(theme.radius - 4, 4),
								},
							]}
						>
							<Text
								style={[
									styles.attachmentLabel,
									{ color: theme.text, fontFamily: theme.fontFamily },
								]}
							>
								{mimeLabel(a.mimeType)}
							</Text>
							{a.status === "queued" || a.status === "uploading" ? (
								<Text
									style={[
										styles.uploadingText,
										{ color: theme.text, fontFamily: theme.fontFamily },
									]}
								>
									{t("todos:attachment.uploading")}
								</Text>
							) : a.status === "failed" ? (
								<>
									<Text
										style={[
											styles.failedText,
											{ fontFamily: theme.fontFamily },
										]}
									>
										{t("todos:attachment.failed")}
									</Text>
									{onRetryAttachment && (
										<RetryButton onPress={() => onRetryAttachment(a.id)} />
									)}
								</>
							) : a.url ? (
								<Text
									style={[
										styles.uploadedText,
										{ fontFamily: theme.fontFamily },
									]}
								>
									{t("todos:attachment.attached")}
								</Text>
							) : null}
							{onRemoveAttachment && (
								<RemoveButton onPress={() => onRemoveAttachment(a.id)} />
							)}
						</View>
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	todoItem: {
		flexDirection: "column",
		borderBottomWidth: 1,
	},
	mainRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
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
	},
	attachmentRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		paddingHorizontal: 12,
		paddingBottom: 8,
	},
	attachmentChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		borderWidth: 1,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	attachmentLabel: {
		fontSize: 10,
		fontWeight: "600",
	},
	uploadingText: {
		fontSize: 10,
		opacity: 0.6,
	},
	failedText: {
		fontSize: 10,
	},
	uploadedText: {
		fontSize: 10,
	},
});
