import { useTranslation } from "@pengana/i18n";
import type { Todo } from "@pengana/sync-engine";
import { isAllowedMimeType } from "@pengana/sync-engine";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
	ActionSheetIOS,
	Alert,
	Platform,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { useSync } from "@/features/sync/sync-context";
import { STATUS_COLORS } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";

import {
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "../todo-actions";

import { AttachmentIndicator } from "./attachment-indicator";
import { SyncDot } from "./sync-dot";

export interface TodoItemRow extends Todo {
	attachmentLocalUri?: string | null;
	attachmentStatus?: "queued" | "uploading" | "uploaded" | "failed" | null;
}

async function pickAsset(
	picker: () => Promise<{
		canceled: boolean;
		assets: { uri: string; mimeType?: string | null }[] | null;
	}>,
	defaultMimeType: string,
	invalidMessage: string,
): Promise<{ uri: string; mimeType: string } | null> {
	const result = await picker();
	if (result.canceled || !result.assets || result.assets.length === 0)
		return null;
	const asset = result.assets[0];
	const mimeType = asset.mimeType ?? defaultMimeType;
	if (!isAllowedMimeType(mimeType)) {
		Alert.alert("Invalid file", invalidMessage);
		return null;
	}
	return { uri: asset.uri, mimeType };
}

export function TodoItem({ todo }: { todo: TodoItemRow }) {
	const { syncAfterWrite, enqueueUpload } = useSync();
	const { theme } = useTheme();
	const { t } = useTranslation();

	const handleToggle = async () => {
		try {
			await toggleTodo(todo.id);
			syncAfterWrite();
		} catch {
			Alert.alert("Error", t("errors:failedToToggleTodo"));
		}
	};

	const handleDelete = async () => {
		await deleteTodo(todo.id);
		syncAfterWrite();
	};

	const handleResolve = async (resolution: "local" | "server") => {
		await resolveConflict(todo.id, resolution);
		syncAfterWrite();
	};

	const attachAsset = async (uri: string, mimeType: string) => {
		await attachFile(todo.id, uri);
		enqueueUpload(todo.id, uri, mimeType);
	};

	const invalidFileMessage = t("errors:invalidFileType");

	const pickFromCamera = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) return;
		try {
			const asset = await pickAsset(
				() =>
					ImagePicker.launchCameraAsync({
						mediaTypes: ["images"],
						quality: 0.8,
					}),
				"image/jpeg",
				invalidFileMessage,
			);
			if (asset) await attachAsset(asset.uri, asset.mimeType);
		} catch {
			Alert.alert(
				"Camera unavailable",
				"Camera is not available on this device.",
			);
		}
	};

	const pickFromLibrary = async () => {
		const asset = await pickAsset(
			() =>
				ImagePicker.launchImageLibraryAsync({
					mediaTypes: ["images"],
					quality: 0.8,
				}),
			"image/jpeg",
			invalidFileMessage,
		);
		if (asset) await attachAsset(asset.uri, asset.mimeType);
	};

	const pickPdf = async () => {
		const asset = await pickAsset(
			() =>
				DocumentPicker.getDocumentAsync({
					type: ["application/pdf"],
					copyToCacheDirectory: true,
				}),
			"application/pdf",
			invalidFileMessage,
		);
		if (asset) await attachAsset(asset.uri, asset.mimeType);
	};

	const handleAttach = () => {
		const options = [
			"Take Photo",
			"Choose from Library",
			"Choose PDF",
			"Cancel",
		];
		const cancelButtonIndex = 3;

		if (Platform.OS === "ios") {
			ActionSheetIOS.showActionSheetWithOptions(
				{ options, cancelButtonIndex },
				(buttonIndex) => {
					if (buttonIndex === 0) pickFromCamera();
					else if (buttonIndex === 1) pickFromLibrary();
					else if (buttonIndex === 2) pickPdf();
				},
			);
		} else {
			Alert.alert(t("todos:actions.attach"), "Choose an option", [
				{ text: "Take Photo", onPress: pickFromCamera },
				{ text: "Choose from Library", onPress: pickFromLibrary },
				{ text: "Choose PDF", onPress: pickPdf },
				{ text: "Cancel", style: "cancel" },
			]);
		}
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
				<TouchableOpacity onPress={handleAttach} style={styles.attachButton}>
					<Text style={[styles.attachText, { color: theme.primary }]}>
						{t("todos:actions.attach")}
					</Text>
				</TouchableOpacity>
			)}
			{todo.attachmentStatus === "failed" && (
				<TouchableOpacity onPress={handleAttach} style={styles.attachButton}>
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
