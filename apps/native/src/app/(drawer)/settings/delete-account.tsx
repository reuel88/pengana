import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { queryClient } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";
import { TEXT_ON_PRIMARY } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { Container } from "@/shared/ui/container";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

export default function DeleteAccountScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const router = useRouter();
	const [confirmation, setConfirmation] = useState("");
	const confirmKeyword = t("auth:settings.deleteAccount.confirmKeyword");

	return (
		<Container>
			<View style={styles.container}>
				<Text style={{ color: theme.notification }}>
					{t("auth:settings.deleteAccount.warning")}
				</Text>
				<ThemedTextInput
					label={t("auth:settings.deleteAccount.confirm", {
						keyword: confirmKeyword,
					})}
					value={confirmation}
					onChangeText={setConfirmation}
				/>
				<TouchableOpacity
					style={[
						styles.button,
						{
							backgroundColor: theme.notification,
							opacity: confirmation === confirmKeyword ? 1 : 0.5,
						},
					]}
					disabled={confirmation !== confirmKeyword}
					onPress={async () => {
						await authClient.deleteUser(undefined, {
							onSuccess: () => {
								queryClient.clear();
								router.replace("/(auth)/login");
							},
							onError: (err) => {
								Alert.alert(
									t("error:title"),
									err.error.message || t("error:generic"),
								);
							},
						});
					}}
				>
					<Text style={styles.buttonText}>
						{t("auth:settings.deleteAccount.submit")}
					</Text>
				</TouchableOpacity>
			</View>
		</Container>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 16,
	},
	button: {
		padding: 12,
		alignItems: "center",
	},
	buttonText: {
		color: TEXT_ON_PRIMARY,
		fontWeight: "600",
	},
});
