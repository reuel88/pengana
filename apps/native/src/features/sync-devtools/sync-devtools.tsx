import { useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { db, todos } from "@/entities/todo";
import { useSync } from "@/features/sync/sync-context";
import { STATUS_COLORS } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";
import { client } from "@/utils/orpc";

export function SyncDevtools() {
	const {
		isOnline,
		isSyncing,
		events,
		triggerSync,
		simulateOffline,
		setSimulateOffline,
	} = useSync();
	const [isOpen, setIsOpen] = useState(false);
	const [forceConflictId, setForceConflictId] = useState("");
	const { theme, colorScheme } = useTheme();

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
					Sync Devtools
				</Text>
				<Text style={[styles.headerText, { color: theme.text }]}>
					{isOpen ? "\u25B2" : "\u25BC"}
				</Text>
			</TouchableOpacity>

			{isOpen && (
				<View style={styles.content}>
					<Text style={[styles.statusText, { color: theme.text }]}>
						Status: {isOnline ? "Online" : "Offline"}{" "}
						{isSyncing ? "(syncing)" : ""}
					</Text>

					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[styles.devButton, { borderColor: theme.border }]}
							onPress={() => setSimulateOffline(!simulateOffline)}
						>
							<Text style={[styles.devButtonText, { color: theme.text }]}>
								{simulateOffline ? "Go Online" : "Simulate Offline"}
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
								Manual Sync
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
								Force Conflict
							</Text>
						</TouchableOpacity>
					</View>

					<View>
						<Text style={[styles.label, { color: theme.text }]}>
							Force conflict on specific todo ID:
						</Text>
						<TextInput
							value={forceConflictId}
							onChangeText={setForceConflictId}
							placeholder="Leave empty for first todo"
							placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
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
							Sync Log ({events.length} events)
						</Text>
						<ScrollView
							style={[styles.logContainer, { borderColor: theme.border }]}
						>
							{events.length === 0 && (
								<Text
									style={[styles.logText, { opacity: 0.5, color: theme.text }]}
								>
									No sync events yet
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
											{
												color:
													event.type === "sync:error"
														? STATUS_COLORS.error
														: event.type === "sync:conflict"
															? STATUS_COLORS.warning
															: theme.text,
												opacity:
													event.type === "sync:error" ||
													event.type === "sync:conflict"
														? 1
														: 0.5,
											},
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
