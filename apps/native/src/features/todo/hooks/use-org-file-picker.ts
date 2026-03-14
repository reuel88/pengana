import { useTranslation } from "@pengana/i18n";
import { isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@pengana/sync-engine";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { ActionSheetIOS, Alert, Platform } from "react-native";

import { useOrgSync } from "@/features/sync/org-sync-context";

import { attachOrgFile } from "../org-todo-actions";

type PickerResult = {
	canceled: boolean;
	assets:
		| {
				uri: string;
				mimeType?: string | null;
				fileSize?: number | null;
				size?: number | null;
		  }[]
		| null;
};

async function pickAsset(
	picker: () => Promise<PickerResult>,
	defaultMimeType: string,
	invalidTitle: string,
	invalidMessage: string,
	fileTooLargeMessage: string,
): Promise<{ uri: string; mimeType: string } | null> {
	const result = await picker();
	if (result.canceled || !result.assets || result.assets.length === 0)
		return null;
	const asset = result.assets[0];
	const mimeType = asset.mimeType ?? defaultMimeType;
	if (!isAllowedMimeType(mimeType)) {
		Alert.alert(invalidTitle, invalidMessage);
		return null;
	}
	let fileSize = asset.fileSize ?? asset.size;
	if (fileSize == null) {
		const info = await FileSystem.getInfoAsync(asset.uri);
		if (info.exists && "size" in info) {
			fileSize = info.size;
		}
	}
	if (fileSize != null && fileSize > MAX_FILE_SIZE_BYTES) {
		Alert.alert(invalidTitle, fileTooLargeMessage);
		return null;
	}
	return { uri: asset.uri, mimeType };
}

export function useOrgFilePicker() {
	const { enqueueUpload } = useOrgSync();
	const { t } = useTranslation();

	const attachAsset = async (todoId: string, uri: string, mimeType: string) => {
		await attachOrgFile(todoId, uri);
		enqueueUpload("orgTodo", todoId, uri, mimeType);
	};

	const invalidFileTitle = t("todos:attachment.invalidFile");
	const invalidFileMessage = t("errors:invalidFileType");
	const fileTooLargeMessage = t("errors:fileTooLarge");

	const pick = (picker: () => Promise<PickerResult>, defaultMimeType: string) =>
		pickAsset(
			picker,
			defaultMimeType,
			invalidFileTitle,
			invalidFileMessage,
			fileTooLargeMessage,
		);

	const pickFromCamera = async (todoId: string) => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) return;
		try {
			const asset = await pick(
				() =>
					ImagePicker.launchCameraAsync({
						mediaTypes: ["images"],
						quality: 0.8,
					}),
				"image/jpeg",
			);
			if (asset) await attachAsset(todoId, asset.uri, asset.mimeType);
		} catch {
			Alert.alert(
				t("todos:attachment.cameraUnavailable"),
				t("todos:attachment.cameraNotAvailable"),
			);
		}
	};

	const pickFromLibrary = async (todoId: string) => {
		const asset = await pick(
			() =>
				ImagePicker.launchImageLibraryAsync({
					mediaTypes: ["images"],
					quality: 0.8,
				}),
			"image/jpeg",
		);
		if (asset) await attachAsset(todoId, asset.uri, asset.mimeType);
	};

	const pickPdf = async (todoId: string) => {
		const asset = await pick(
			() =>
				DocumentPicker.getDocumentAsync({
					type: ["application/pdf"],
					copyToCacheDirectory: true,
				}),
			"application/pdf",
		);
		if (asset) await attachAsset(todoId, asset.uri, asset.mimeType);
	};

	const showPickerForTodo = (todoId: string) => {
		const options = [
			t("todos:actions.takePhoto"),
			t("todos:actions.chooseFromLibrary"),
			t("todos:actions.choosePdf"),
			t("todos:actions.cancel"),
		];
		const cancelButtonIndex = 3;

		if (Platform.OS === "ios") {
			ActionSheetIOS.showActionSheetWithOptions(
				{ options, cancelButtonIndex },
				(buttonIndex) => {
					if (buttonIndex === 0) pickFromCamera(todoId);
					else if (buttonIndex === 1) pickFromLibrary(todoId);
					else if (buttonIndex === 2) pickPdf(todoId);
				},
			);
		} else {
			Alert.alert(t("todos:actions.attach"), t("todos:actions.chooseOption"), [
				{
					text: t("todos:actions.takePhoto"),
					onPress: () => pickFromCamera(todoId),
				},
				{
					text: t("todos:actions.chooseFromLibrary"),
					onPress: () => pickFromLibrary(todoId),
				},
				{ text: t("todos:actions.choosePdf"), onPress: () => pickPdf(todoId) },
				{ text: t("todos:actions.cancel"), style: "cancel" },
			]);
		}
	};

	return { showPickerForTodo };
}
