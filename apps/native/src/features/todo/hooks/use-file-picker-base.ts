import { useTranslation } from "@pengana/i18n";
import { isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@pengana/sync-engine";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { ActionSheetIOS, Alert, Platform } from "react-native";

type AssetResult = {
	uri: string;
	mimeType: string;
};

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

const MAX_ATTACHMENTS = 10;

async function pickAssets(
	picker: () => Promise<PickerResult>,
	defaultMimeType: string,
	invalidTitle: string,
	invalidMessage: string,
	fileTooLargeMessage: string,
): Promise<AssetResult[]> {
	const result = await picker();
	if (result.canceled || !result.assets || result.assets.length === 0)
		return [];

	const valid: AssetResult[] = [];
	for (const asset of result.assets) {
		const mimeType = asset.mimeType ?? defaultMimeType;
		if (!isAllowedMimeType(mimeType)) {
			Alert.alert(invalidTitle, invalidMessage);
			continue;
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
			continue;
		}
		valid.push({ uri: asset.uri, mimeType });
	}
	return valid;
}

export function useFilePickerBase(deps: {
	addMedia: (
		entityId: string,
		entityType: string,
		userId: string,
		uri: string,
		mimeType: string,
	) => Promise<string>;
	enqueueUpload: (
		entity: string,
		entityId: string,
		uri: string,
		mimeType: string,
		mediaId: string,
	) => void;
	getMediaCount: (entityId: string) => Promise<number>;
	entityType: string;
	userId: string;
}) {
	const { t } = useTranslation();

	const attachAssets = async (todoId: string, assets: AssetResult[]) => {
		const currentCount = await deps.getMediaCount(todoId);
		const available = MAX_ATTACHMENTS - currentCount;
		const toProcess = assets.slice(0, available);

		for (const asset of toProcess) {
			const mediaId = await deps.addMedia(
				todoId,
				deps.entityType,
				deps.userId,
				asset.uri,
				asset.mimeType,
			);
			deps.enqueueUpload(
				deps.entityType,
				todoId,
				asset.uri,
				asset.mimeType,
				mediaId,
			);
		}
	};

	const invalidFileTitle = t("todos:attachment.invalidFile");
	const invalidFileMessage = t("errors:invalidFileType");
	const fileTooLargeMessage = t("errors:fileTooLarge");

	const pick = (picker: () => Promise<PickerResult>, defaultMimeType: string) =>
		pickAssets(
			picker,
			defaultMimeType,
			invalidFileTitle,
			invalidFileMessage,
			fileTooLargeMessage,
		);

	const pickFromCamera = async (todoId: string) => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) return;

		const currentCount = await deps.getMediaCount(todoId);
		let remaining = MAX_ATTACHMENTS - currentCount;

		try {
			while (remaining > 0) {
				const assets = await pick(
					() =>
						ImagePicker.launchCameraAsync({
							mediaTypes: ["images"],
							quality: 0.8,
						}),
					"image/jpeg",
				);
				if (assets.length === 0) break;

				for (const asset of assets) {
					if (remaining <= 0) break;
					const mediaId = await deps.addMedia(
						todoId,
						deps.entityType,
						deps.userId,
						asset.uri,
						asset.mimeType,
					);
					deps.enqueueUpload(
						deps.entityType,
						todoId,
						asset.uri,
						asset.mimeType,
						mediaId,
					);
					remaining--;
				}
			}
		} catch {
			Alert.alert(
				t("todos:attachment.cameraUnavailable"),
				t("todos:attachment.cameraNotAvailable"),
			);
		}
	};

	const pickFromLibrary = async (todoId: string) => {
		const currentCount = await deps.getMediaCount(todoId);
		const selectionLimit = MAX_ATTACHMENTS - currentCount;
		if (selectionLimit <= 0) return;

		const assets = await pick(
			() =>
				ImagePicker.launchImageLibraryAsync({
					mediaTypes: ["images"],
					quality: 0.8,
					allowsMultipleSelection: true,
					selectionLimit,
				}),
			"image/jpeg",
		);
		if (assets.length > 0) await attachAssets(todoId, assets);
	};

	const pickPdf = async (todoId: string) => {
		const assets = await pick(
			() =>
				DocumentPicker.getDocumentAsync({
					type: ["application/pdf"],
					copyToCacheDirectory: true,
					multiple: true,
				}),
			"application/pdf",
		);
		if (assets.length > 0) await attachAssets(todoId, assets);
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
