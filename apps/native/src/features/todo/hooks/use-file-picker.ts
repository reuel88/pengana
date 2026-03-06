import { useTranslation } from "@pengana/i18n";
import { isAllowedMimeType } from "@pengana/sync-engine";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { ActionSheetIOS, Alert, Platform } from "react-native";

import { useSync } from "@/features/sync/sync-context";

import { attachFile } from "../todo-actions";

async function pickAsset(
	picker: () => Promise<{
		canceled: boolean;
		assets: { uri: string; mimeType?: string | null }[] | null;
	}>,
	defaultMimeType: string,
	invalidTitle: string,
	invalidMessage: string,
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
	return { uri: asset.uri, mimeType };
}

export function useFilePicker(todoId: string) {
	const { enqueueUpload } = useSync();
	const { t } = useTranslation();

	const attachAsset = async (uri: string, mimeType: string) => {
		await attachFile(todoId, uri);
		enqueueUpload(todoId, uri, mimeType);
	};

	const invalidFileTitle = t("todos:attachment.invalidFile");
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
				invalidFileTitle,
				invalidFileMessage,
			);
			if (asset) await attachAsset(asset.uri, asset.mimeType);
		} catch {
			Alert.alert(
				t("todos:attachment.cameraUnavailable"),
				t("todos:attachment.cameraNotAvailable"),
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
			invalidFileTitle,
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
			invalidFileTitle,
			invalidFileMessage,
		);
		if (asset) await attachAsset(asset.uri, asset.mimeType);
	};

	const showPicker = () => {
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
					if (buttonIndex === 0) pickFromCamera();
					else if (buttonIndex === 1) pickFromLibrary();
					else if (buttonIndex === 2) pickPdf();
				},
			);
		} else {
			Alert.alert(t("todos:actions.attach"), t("todos:actions.chooseOption"), [
				{ text: t("todos:actions.takePhoto"), onPress: pickFromCamera },
				{
					text: t("todos:actions.chooseFromLibrary"),
					onPress: pickFromLibrary,
				},
				{ text: t("todos:actions.choosePdf"), onPress: pickPdf },
				{ text: t("todos:actions.cancel"), style: "cancel" },
			]);
		}
	};

	return { showPicker };
}
