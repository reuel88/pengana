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
import { useInvalidateOrg } from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";
import { useTheme } from "@/shared/lib/theme";
import { primaryButtonText, themedSurface } from "@/shared/styles/shared";
import { Container } from "@/shared/ui/container";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

function ChangeNameCard() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const { data: session } = authClient.useSession();
	const { invalidateActiveOrg } = useInvalidateOrg();
	const [name, setName] = useState(session?.user.name ?? "");
	const hasEdited = useRef(false);

	useEffect(() => {
		if (session?.user.name && !name && !hasEdited.current) {
			setName(session.user.name);
		}
	}, [session?.user.name, name]);

	return (
		<View style={[styles.card, themedSurface(theme)]}>
			<Text style={[styles.title, { color: theme.text }]}>
				{t("auth:settings.account.changeName")}
			</Text>
			<ThemedTextInput
				label={t("auth:fields.name")}
				value={name}
				onChangeText={(value) => {
					hasEdited.current = true;
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
					await invalidateActiveOrg();
					Alert.alert("", t("auth:settings.account.updateSuccess"));
				}}
			>
				<Text style={[styles.buttonText, primaryButtonText(theme)]}>
					{t("auth:settings.account.changeName")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

function ChangeEmailCard() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const { data: session } = authClient.useSession();
	const [email, setEmail] = useState(session?.user.email ?? "");
	const hasEdited = useRef(false);

	useEffect(() => {
		if (session?.user.email && !email && !hasEdited.current) {
			setEmail(session.user.email);
		}
	}, [session?.user.email, email]);

	return (
		<View style={[styles.card, themedSurface(theme)]}>
			<Text style={[styles.title, { color: theme.text }]}>
				{t("auth:settings.account.changeEmail")}
			</Text>
			<ThemedTextInput
				label={t("auth:fields.email")}
				value={email}
				onChangeText={(value) => {
					hasEdited.current = true;
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
				<Text style={[styles.buttonText, primaryButtonText(theme)]}>
					{t("auth:settings.account.changeEmail")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

function ChangePasswordCard() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");

	return (
		<View style={[styles.card, themedSurface(theme)]}>
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
				<Text style={[styles.buttonText, primaryButtonText(theme)]}>
					{t("auth:settings.account.changePassword")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

export default function AccountSettingsScreen() {
	return (
		<Container>
			<ScrollView contentContainerStyle={styles.container}>
				<ChangeNameCard />
				<ChangeEmailCard />
				<ChangePasswordCard />
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
		fontWeight: "600",
	},
});
