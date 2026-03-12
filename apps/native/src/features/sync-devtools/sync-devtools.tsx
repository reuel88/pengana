import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSync, useSyncDevtools } from "@/features/sync/sync-context";
import { db, todos } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { PLACEHOLDER_COLORS, STATUS_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";

function getLogEntryStyle(
	eventType: string,
	textColor: string,
): { color: string; opacity: number } {
	if (eventType === "sync:error") {
		return { color: STATUS_COLORS.error, opacity: 1 };
	}
	if (eventType === "sync:conflict") {
		return { color: STATUS_COLORS.warning, opacity: 1 };
	}
	return { color: textColor, opacity: 0.5 };
}

function SyncDevtoolsContent() {
	const { isOnline, isSyncing, triggerSync } = useSync();
	const { events, simulateOffline, setSimulateOffline } = useSyncDevtools();
	const [isOpen, setIsOpen] = useState(false);
	const [forceConflictId, setForceConflictId] = useState("");
	const { theme, colorScheme } = useTheme();
	const { t } = useTranslation("sync");

	const handleForceConflict = async () => {
		const trimmed = forceConflictId.trim();
		if (!trimmed) {
			const [firstTodo] = await db.select().from(todos);
			if (!firstTodo) return;
			await client.todo.forceConflict({ todoId: firstTodo.id });
		} else {
			await client.todo.forceConflict({ todoId: trimmed });
		}
		triggerSync();
	};

	return (
		<View style={[styles.container, { borderColor: theme.border }]}>
			<TouchableOpacity
				onPress={() => setIsOpen(!isOpen)}
				style={[styles.header, { backgroundColor: theme.card }]}
			>
				<Text style={[styles.headerText, { color: theme.text }]}>
					{t("devtools.title")}
				</Text>
				<Text style={[styles.headerText, { color: theme.text }]}>
					{isOpen ? "\u25B2" : "\u25BC"}
				</Text>
			</TouchableOpacity>

			{isOpen && (
				<View style={styles.content}>
					<Text style={[styles.statusText, { color: theme.text }]}>
						{t("devtools.status")}{" "}
						{isOnline
							? t("devtools.statusOnline")
							: t("devtools.statusOffline")}{" "}
						{isSyncing ? t("devtools.syncing") : ""}
					</Text>

					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[styles.devButton, { borderColor: theme.border }]}
							onPress={() => setSimulateOffline(!simulateOffline)}
						>
							<Text style={[styles.devButtonText, { color: theme.text }]}>
								{simulateOffline
									? t("devtools.goOnline")
									: t("devtools.simulateOffline")}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.devButton,
								{ borderColor: theme.border },
								!isOnline && styles.disabledButton,
							]}
							onPress={triggerSync}
							disabled={!isOnline}
						>
							<Text style={[styles.devButtonText, { color: theme.text }]}>
								{t("devtools.manualSync")}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.devButton,
								{ borderColor: theme.border },
								!isOnline && styles.disabledButton,
							]}
							onPress={handleForceConflict}
							disabled={!isOnline}
						>
							<Text style={[styles.devButtonText, { color: theme.text }]}>
								{t("devtools.forceConflict")}
							</Text>
						</TouchableOpacity>
					</View>

					<View>
						<Text style={[styles.label, { color: theme.text }]}>
							{t("devtools.forceConflictLabel")}
						</Text>
						<TextInput
							value={forceConflictId}
							onChangeText={setForceConflictId}
							placeholder={t("devtools.forceConflictPlaceholder")}
							placeholderTextColor={
								colorScheme === "dark"
									? PLACEHOLDER_COLORS.dark
									: PLACEHOLDER_COLORS.light
							}
							style={[
								styles.textInput,
								{
									color: theme.text,
									borderColor: theme.border,
								},
							]}
						/>
					</View>

					<View>
						<Text style={[styles.label, { color: theme.text }]}>
							{t("devtools.syncLog")} ({events.length} {t("devtools.events")})
						</Text>
						<ScrollView
							style={[styles.logContainer, { borderColor: theme.border }]}
						>
							{events.length === 0 && (
								<Text
									style={[styles.logText, { opacity: 0.5, color: theme.text }]}
								>
									{t("devtools.noEvents")}
								</Text>
							)}
							{[...events].reverse().map((event) => (
								<View
									key={`${event.timestamp}-${event.type}-${event.detail}`}
									style={[styles.logEntry, { borderBottomColor: theme.border }]}
								>
									<Text
										style={[
											styles.logText,
											getLogEntryStyle(event.type, theme.text),
										]}
									>
										{new Date(event.timestamp).toLocaleTimeString()} [
										{event.type}] {event.detail}
									</Text>
								</View>
							))}
						</ScrollView>
					</View>
				</View>
			)}
		</View>
	);
}

export function SyncDevtools() {
	if (!__DEV__) return null;
	return <SyncDevtoolsContent />;
}

const styles = StyleSheet.create({
	container: {
		marginTop: 16,
		borderWidth: 1,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerText: {
		fontSize: 12,
		fontWeight: "500",
	},
	content: {
		padding: 12,
		gap: 12,
	},
	statusText: {
		fontSize: 12,
	},
	buttonRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	devButton: {
		borderWidth: 1,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 4,
	},
	devButtonText: {
		fontSize: 12,
	},
	disabledButton: {
		opacity: 0.4,
	},
	label: {
		fontSize: 12,
		fontWeight: "500",
		marginBottom: 4,
	},
	textInput: {
		borderWidth: 1,
		paddingHorizontal: 8,
		paddingVertical: 4,
		fontSize: 12,
	},
	logContainer: {
		maxHeight: 192,
		borderWidth: 1,
	},
	logEntry: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderBottomWidth: 1,
	},
	logText: {
		fontSize: 11,
		fontFamily: "monospace",
	},
});
