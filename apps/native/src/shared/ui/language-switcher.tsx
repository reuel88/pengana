import { Ionicons } from "@expo/vector-icons";
import {
	LOCALE_OPTIONS,
	type SupportedLocale,
	useTranslation,
} from "@pengana/i18n";
import { useState } from "react";
import {
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useTheme } from "@/shared/lib/theme";

interface LanguageSwitcherProps {
	currentLocale: SupportedLocale;
	onLocaleChange: (locale: SupportedLocale) => void;
}

export function LanguageSwitcher({
	currentLocale,
	onLocaleChange,
}: LanguageSwitcherProps) {
	const { theme } = useTheme();
	const { t } = useTranslation();

	const [isOpen, setIsOpen] = useState(false);

	const handleOpen = () => {
		setIsOpen(true);
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	const handleLocaleChange = (locale: SupportedLocale) => {
		handleClose();
		onLocaleChange(locale);
	};

	return (
		<>
			<View style={styles.triggerContainer}>
				<Pressable
					onPress={handleOpen}
					style={styles.trigger}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					accessibilityRole="button"
					accessibilityLabel={t("common:language.changeLabel")}
					accessibilityHint={t("common:language.changeHint")}
					accessibilityState={{ expanded: isOpen }}
				>
					<Ionicons name="globe-outline" size={24} color={theme.text} />
				</Pressable>
			</View>
			<Modal
				visible={isOpen}
				transparent
				animationType="fade"
				onRequestClose={handleClose}
				accessibilityViewIsModal
			>
				<Pressable style={styles.overlay} onPress={handleClose}>
					<View
						style={[styles.modal, { backgroundColor: theme.background }]}
						onStartShouldSetResponder={() => true}
						accessibilityRole="menu"
					>
						<FlatList
							data={LOCALE_OPTIONS}
							keyExtractor={(item) => item.value}
							renderItem={({ item }) => (
								<Pressable
									onPress={() => handleLocaleChange(item.value)}
									style={[styles.item, { borderBottomColor: theme.border }]}
									accessibilityRole="menuitem"
									accessibilityLabel={item.label}
									accessibilityState={{
										selected: item.value === currentLocale,
									}}
								>
									<Text style={[styles.label, { color: theme.text }]}>
										{item.label}
									</Text>
									{item.value === currentLocale ? (
										<Ionicons
											name="checkmark"
											size={20}
											color={theme.primary}
										/>
									) : null}
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
	triggerContainer: {
		paddingHorizontal: 12,
	},
	trigger: {
		minWidth: 44,
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
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
