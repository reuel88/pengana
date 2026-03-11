import { useTranslation } from "@pengana/i18n";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { OrgForm } from "@/features/org/org-form";
import { useCreateOrg } from "@/shared/hooks/use-create-org";
import { useTheme } from "@/shared/lib/theme";

import { onboardingStyles as styles } from "./onboarding-styles";

export function OnboardingCreateOrg({
	onCreated,
	onBackToInvitations,
}: {
	onCreated: () => void;
	onBackToInvitations?: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { t: tOrg } = useTranslation("organization");
	const { theme } = useTheme();

	const { createOrg, loading } = useCreateOrg({
		onSuccess: () => onCreated(),
		onError: (message) => Alert.alert("", message || t("create.error")),
	});

	return (
		<View
			testID="onboarding-create-org"
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.title, { color: theme.text }]}>
				{t("create.title")}
			</Text>
			<Text style={[styles.description, { color: theme.text, opacity: 0.6 }]}>
				{t("create.description")}
			</Text>

			<OrgForm
				onSubmit={createOrg}
				loading={loading}
				submitLabel={tOrg("create.submit")}
				inputStyle={{ backgroundColor: theme.background }}
				testIDs={{
					name: "org-name-input",
					slug: "org-slug-input",
					logo: "org-logo-input",
					submit: "org-submit",
				}}
			>
				{onBackToInvitations && (
					<TouchableOpacity
						style={styles.ghostButton}
						onPress={onBackToInvitations}
					>
						<Text style={[styles.ghostButtonText, { color: theme.primary }]}>
							{t("create.backToInvitations")}
						</Text>
					</TouchableOpacity>
				)}
			</OrgForm>
		</View>
	);
}
