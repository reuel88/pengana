import { Ionicons } from "@expo/vector-icons";
import {
	SUPPORTED_LOCALES,
	type SupportedLocale,
	useTranslation,
} from "@pengana/i18n";
import { isRtlLocale } from "@pengana/i18n/rtl";

import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
	Alert,
	FlatList,
	I18nManager,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { useTheme } from "@/lib/theme";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
	"en-US": "English (US)",
	"en-AU": "English (AU)",
	es: "Espanol",
	zh: "\u4E2D\u6587",
	tl: "Tagalog",
	vi: "Ti\u1EBFng Vi\u1EC7t",
	ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
	fr: "Fran\u00E7ais",
	ko: "\uD55C\uAD6D\uC5B4",
	ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
	"pt-BR": "Portugu\u00EAs (BR)",
};

export function LanguageSwitcher() {
	const { i18n } = useTranslation();
	const { theme } = useTheme();
	const [visible, setVisible] = useState(false);

	const currentLocale = i18n.language as SupportedLocale;

	const handleSelect = async (locale: SupportedLocale) => {
		setVisible(false);
		if (locale === currentLocale) return;

		if (Platform.OS === "web") {
			localStorage.setItem("appLocale", locale);
			window.location.reload();
			return;
		}

		await SecureStore.setItemAsync("appLocale", locale);

		const wasRtl = isRtlLocale(currentLocale);
		const willBeRtl = isRtlLocale(locale);

		if (wasRtl !== willBeRtl) {
			I18nManager.allowRTL(true);
			I18nManager.forceRTL(willBeRtl);
			Alert.alert(
				"Restart Required",
				"The app needs to restart to apply the layout direction change. Please close and reopen the app.",
			);
		}

		await i18n.changeLanguage(locale);
	};

	return (
		<>
			<Pressable onPress={() => setVisible(true)} style={styles.trigger}>
				<Ionicons name="globe-outline" size={24} color={theme.text} />
			</Pressable>
			<Modal
				visible={visible}
				transparent
				animationType="fade"
				onRequestClose={() => setVisible(false)}
			>
				<Pressable style={styles.overlay} onPress={() => setVisible(false)}>
					<View
						style={[styles.modal, { backgroundColor: theme.background }]}
						onStartShouldSetResponder={() => true}
					>
						<FlatList
							data={SUPPORTED_LOCALES as unknown as SupportedLocale[]}
							keyExtractor={(item) => item}
							renderItem={({ item }) => (
								<Pressable
									onPress={() => handleSelect(item)}
									style={[styles.item, { borderBottomColor: theme.border }]}
								>
									<Text style={[styles.label, { color: theme.text }]}>
										{LOCALE_LABELS[item]}
									</Text>
									{item === currentLocale && (
										<Ionicons
											name="checkmark"
											size={20}
											color={theme.primary}
										/>
									)}
								</Pressable>
							)}
						/>
					</View>
				</Pressable>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	trigger: {
		marginRight: 12,
		padding: 4,
	},
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
	},
	modal: {
		width: "80%",
		maxHeight: "60%",
		borderRadius: 12,
		paddingVertical: 8,
	},
	item: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	label: {
		fontSize: 16,
	},
});
