import { useTranslation } from "@pengana/i18n";
import {
	isAllowedMimeType,
	MAX_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync-engine";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
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

type PickerMessages = {
	invalidTitle: string;
	invalidMessage: string;
	fileTooLargeMessage: string;
};

async function pickAssets(
	picker: () => Promise<PickerResult>,
	defaultMimeType: string,
	messages: PickerMessages,
): Promise<AssetResult[]> {
	const result = await picker();
	if (result.canceled || !result.assets || result.assets.length === 0)
		return [];

	const valid: AssetResult[] = [];
	for (const asset of result.assets) {
		const mimeType = asset.mimeType ?? defaultMimeType;
		if (!isAllowedMimeType(mimeType)) {
			Alert.alert(messages.invalidTitle, messages.invalidMessage);
			continue;
		}
		let fileSize = asset.fileSize ?? asset.size;
		if (fileSize == null) {
			try {
				const info = new File(asset.uri).info();
				if (info.exists && info.size != null) {
					fileSize = info.size;
				}
			} catch {
				// fileSize stays null → handled by the guard below
			}
		}
		if (fileSize == null || fileSize > MAX_FILE_SIZE_BYTES) {
			Alert.alert(messages.invalidTitle, messages.fileTooLargeMessage);
			continue;
		}
		valid.push({ uri: asset.uri, mimeType });
	}
	return valid;
}

export function useFilePickerBase(deps: {
	addMedia: (options: {
		userId: string;
		localUri: string;
		mimeType: string;
		scopeType: "personal" | "org";
		scopeId: string;
		organizationId: string;
		createdBy: string;
	}) => Promise<string>;
	attachMedia: (
		mediaId: string,
		entityType: string,
		entityId: string,
	) => Promise<string>;
	updateMediaLocalUri?: (mediaId: string, localUri: string) => Promise<void>;
	enqueueUpload: (
		uri: string,
		mimeType: string,
		mediaId: string,
		entityType?: string,
		entityId?: string,
		scopeType?: "personal" | "org",
	) => void;
	getMediaCount: (entityId: string) => Promise<number>;
	entityType: string;
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	createdBy: string;
}) {
	const { t } = useTranslation();

	const attachAssets = async (todoId: string, assets: AssetResult[]) => {
		const currentCount = await deps.getMediaCount(todoId);
		const available = Math.max(0, MAX_ATTACHMENTS - currentCount);
		const toProcess = assets.slice(0, available);

		for (const asset of toProcess) {
			try {
				const mediaId = await deps.addMedia({
					userId: deps.userId,
					localUri: asset.uri,
					mimeType: asset.mimeType,
					scopeType: deps.scopeType,
					scopeId: deps.scopeId,
					organizationId: deps.organizationId,
					createdBy: deps.createdBy,
				});
				await deps.attachMedia(mediaId, deps.entityType, todoId);
				deps.enqueueUpload(
					asset.uri,
					asset.mimeType,
					mediaId,
					deps.entityType,
					todoId,
				);
			} catch {
				Alert.alert(t("errors:failedToAttachFile"));
			}
		}
	};

	const messages: PickerMessages = {
		invalidTitle: t("todos:attachment.invalidFile"),
		invalidMessage: t("errors:invalidFileType"),
		fileTooLargeMessage: t("errors:fileTooLarge"),
	};

	const pick = (picker: () => Promise<PickerResult>, defaultMimeType: string) =>
		pickAssets(picker, defaultMimeType, messages);

	const pickFromCamera = async (todoId: string) => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) return;

		try {
			while (true) {
				const currentCount = await deps.getMediaCount(todoId);
				if (currentCount >= MAX_ATTACHMENTS) break;

				const assets = await pick(
					() =>
						ImagePicker.launchCameraAsync({
							mediaTypes: ["images"],
							quality: 0.8,
						}),
					"image/jpeg",
				);
				if (assets.length === 0) break;

				await attachAssets(todoId, assets);
			}
		} catch {
			Alert.alert(
				t("todos:attachment.cameraUnavailable"),
				t("todos:attachment.cameraNotAvailable"),
			);
		}
	};

	const pickFromLibrary = async (todoId: string) => {
		try {
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
		} catch {
			Alert.alert(
				t("todos:attachment.error"),
				t("todos:attachment.libraryError"),
			);
		}
	};

	const pickPdf = async (todoId: string) => {
		try {
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
		} catch {
			Alert.alert(t("todos:attachment.error"), t("todos:attachment.pdfError"));
		}
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
