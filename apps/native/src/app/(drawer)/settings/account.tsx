import { useTranslation } from "@pengana/i18n";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { queryClient } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";
import { TEXT_ON_PRIMARY } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { Container } from "@/shared/ui/container";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

export default function AccountSettingsScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const { data: session } = authClient.useSession();
	const [name, setName] = useState(session?.user.name ?? "");
	const [email, setEmail] = useState(session?.user.email ?? "");
	const hasEditedName = useRef(false);
	const hasEditedEmail = useRef(false);

	useEffect(() => {
		if (session?.user.name && !name && !hasEditedName.current) {
			setName(session.user.name);
		}
	}, [session?.user.name, name]);

	useEffect(() => {
		if (session?.user.email && !email && !hasEditedEmail.current) {
			setEmail(session.user.email);
		}
	}, [session?.user.email, email]);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");

	return (
		<Container>
			<ScrollView contentContainerStyle={styles.container}>
				<View
					style={[
						styles.card,
						{ backgroundColor: theme.card, borderColor: theme.border },
					]}
				>
					<Text style={[styles.title, { color: theme.text }]}>
						{t("auth:settings.account.changeName")}
					</Text>
					<ThemedTextInput
						label={t("auth:fields.name")}
						value={name}
						onChangeText={(value) => {
							hasEditedName.current = true;
							setName(value);
						}}
					/>
					<TouchableOpacity
						style={[styles.button, { backgroundColor: theme.primary }]}
						onPress={async () => {
							const result = await authClient.updateUser({ name: name.trim() });
							if (result.error) {
								Alert.alert(
									t("error:title"),
									result.error.message || t("error:generic"),
								);
								return;
							}
							await queryClient.invalidateQueries();
							Alert.alert("", t("auth:settings.account.updateSuccess"));
						}}
					>
						<Text style={styles.buttonText}>
							{t("auth:settings.account.changeName")}
						</Text>
					</TouchableOpacity>
				</View>

				<View
					style={[
						styles.card,
						{ backgroundColor: theme.card, borderColor: theme.border },
					]}
				>
					<Text style={[styles.title, { color: theme.text }]}>
						{t("auth:settings.account.changeEmail")}
					</Text>
					<ThemedTextInput
						label={t("auth:fields.email")}
						value={email}
						onChangeText={(value) => {
							hasEditedEmail.current = true;
							setEmail(value);
						}}
						autoCapitalize="none"
						keyboardType="email-address"
						hint={t("auth:settings.account.changeEmailNote")}
					/>
					<TouchableOpacity
						style={[styles.button, { backgroundColor: theme.primary }]}
						onPress={async () => {
							const result = await authClient.changeEmail({
								newEmail: email.trim(),
							});
							if (result.error) {
								Alert.alert(
									t("error:title"),
									result.error.message || t("error:generic"),
								);
								return;
							}
							Alert.alert("", t("auth:settings.account.updateSuccess"));
						}}
					>
						<Text style={styles.buttonText}>
							{t("auth:settings.account.changeEmail")}
						</Text>
					</TouchableOpacity>
				</View>

				<View
					style={[
						styles.card,
						{ backgroundColor: theme.card, borderColor: theme.border },
					]}
				>
					<Text style={[styles.title, { color: theme.text }]}>
						{t("auth:settings.account.changePassword")}
					</Text>
					<ThemedTextInput
						label={t("auth:settings.account.currentPassword")}
						value={currentPassword}
						onChangeText={setCurrentPassword}
						secureTextEntry
					/>
					<ThemedTextInput
						label={t("auth:settings.account.newPassword")}
						value={newPassword}
						onChangeText={setNewPassword}
						secureTextEntry
					/>
					<TouchableOpacity
						style={[styles.button, { backgroundColor: theme.primary }]}
						onPress={async () => {
							await authClient.changePassword(
								{
									currentPassword,
									newPassword,
								},
								{
									onSuccess: () => {
										setCurrentPassword("");
										setNewPassword("");
										Alert.alert("", t("auth:settings.account.passwordChanged"));
									},
									onError: (err) => {
										Alert.alert(
											t("error:title"),
											err.error.message || t("error:generic"),
										);
									},
								},
							);
						}}
					>
						<Text style={styles.buttonText}>
							{t("auth:settings.account.changePassword")}
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 16,
	},
	card: {
		padding: 16,
		borderWidth: 1,
		gap: 12,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
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
