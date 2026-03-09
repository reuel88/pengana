import { useTranslation } from "@pengana/i18n";
import type { UserLifecycleData } from "@pengana/org-client/lib/user-lifecycle";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { OnboardingCreateOrg } from "@/features/onboarding/onboarding-create-org";
import { OnboardingInvitations } from "@/features/onboarding/onboarding-invitations";
import { OnboardingInviteMembers } from "@/features/onboarding/onboarding-invite-members";
import { useOnboarding } from "@/features/onboarding/use-onboarding";
import { authClient } from "@/lib/auth-client";
import { useLifecycleData } from "@/lib/lifecycle-context";
import { useTheme } from "@/lib/theme";

export default function OnboardingScreen() {
	const { theme } = useTheme();
	const { data: session } = authClient.useSession();
	const lifecycleData = useLifecycleData();

	if (!lifecycleData) {
		return (
			<View style={[styles.container, { backgroundColor: theme.background }]}>
				<ActivityIndicator size="large" color={theme.primary} />
			</View>
		);
	}

	return (
		<OnboardingContent
			lifecycleData={lifecycleData}
			userName={session?.user?.name ?? ""}
		/>
	);
}

function OnboardingContent({
	lifecycleData,
	userName,
}: {
	lifecycleData: UserLifecycleData;
	userName: string;
}) {
	const { t } = useTranslation("onboarding");
	const { t: tCommon } = useTranslation("common");
	const { theme } = useTheme();
	const { state, send } = useOnboarding(lifecycleData.hasPendingInvitations);

	const handleSignOut = async () => {
		await authClient.signOut();
	};

	return (
		<ScrollView
			style={[styles.scrollView, { backgroundColor: theme.background }]}
			contentContainerStyle={styles.contentContainer}
		>
			<View style={styles.header}>
				<Text style={[styles.welcomeText, { color: theme.text }]}>
					{t("title", { name: userName })}
				</Text>
				<Text
					style={[styles.descriptionText, { color: theme.text, opacity: 0.6 }]}
				>
					{t("description")}
				</Text>
				<TouchableOpacity onPress={handleSignOut}>
					<Text style={[styles.signOutText, { color: theme.primary }]}>
						{tCommon("user.signOut")}
					</Text>
				</TouchableOpacity>
			</View>

			{state.matches({ organizationStep: "viewInvitations" }) && (
				<OnboardingInvitations
					onAccepted={() => send({ type: "INVITATION_ACCEPTED" })}
					onSkipToCreate={() => send({ type: "SKIP_TO_CREATE" })}
				/>
			)}

			{state.matches({ organizationStep: "createOrganization" }) && (
				<OnboardingCreateOrg
					onCreated={() => send({ type: "ORG_CREATED" })}
					onBackToInvitations={
						lifecycleData.hasPendingInvitations
							? () => send({ type: "BACK_TO_CHOICE" })
							: undefined
					}
				/>
			)}

			{state.matches("inviteMembers") && (
				<OnboardingInviteMembers
					onInvited={() => send({ type: "MEMBERS_INVITED" })}
					onSkip={() => send({ type: "SKIP_INVITE" })}
				/>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	scrollView: {
		flex: 1,
	},
	contentContainer: {
		padding: 16,
		paddingTop: 60,
		alignItems: "center",
	},
	header: {
		alignItems: "center",
		marginBottom: 24,
		width: "100%",
	},
	welcomeText: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 8,
		textAlign: "center",
	},
	descriptionText: {
		fontSize: 14,
		textAlign: "center",
		marginBottom: 12,
	},
	signOutText: {
		fontSize: 14,
	},
});
