import { Button } from "@pengana/ui/components/button";
import { useState } from "react";
import { todoDb } from "@/entities/todo";
import { useSync } from "@/features/sync/sync-context";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

export function SyncDevtoolsImpl() {
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

	const handleForceConflict = async () => {
		try {
			const trimmed = forceConflictId.trim();
			if (!trimmed) {
				const firstTodo = await todoDb.todos.toCollection().first();
				if (!firstTodo) return;
				await client.todo.forceConflict({ todoId: firstTodo.id });
			} else {
				await client.todo.forceConflict({ todoId: trimmed });
			}
			triggerSync();
		} catch (err) {
			console.error("Failed to force conflict", err);
		}
	};

	return (
		<div className="mt-4 border border-border">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between bg-muted/50 px-3 py-2 text-left font-medium text-xs hover:bg-muted"
			>
				<span>Sync Devtools</span>
				<span>{isOpen ? "▲" : "▼"}</span>
			</button>

			{isOpen && (
				<div className="space-y-3 p-3">
					<div className="flex items-center gap-3">
						<span className="text-xs">
							Status: {isOnline ? "Online" : "Offline"}{" "}
							{isSyncing ? "(syncing)" : ""}
						</span>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							size="xs"
							variant="outline"
							onClick={() => setSimulateOffline(!simulateOffline)}
						>
							{simulateOffline ? "Go Online" : "Simulate Offline"}
						</Button>

						<Button
							size="xs"
							variant="outline"
							onClick={triggerSync}
							disabled={!isOnline}
						>
							Manual Sync
						</Button>

						<Button
							size="xs"
							variant="outline"
							onClick={handleForceConflict}
							disabled={!isOnline}
						>
							Force Conflict
						</Button>
					</div>

					<div>
						<p className="mb-1 font-medium text-xs">
							Force conflict on specific todo ID:
						</p>
						<input
							type="text"
							value={forceConflictId}
							onChange={(e) => setForceConflictId(e.target.value)}
							placeholder="Leave empty for first todo"
							className="w-full border border-border bg-transparent px-2 py-1 text-xs"
						/>
					</div>

					<div>
						<p className="mb-1 font-medium text-xs">
							Sync Log ({events.length} events)
						</p>
						<div className="max-h-48 overflow-y-auto border border-border font-mono text-xs">
							{events.length === 0 && (
								<p className="p-2 text-muted-foreground">No sync events yet</p>
							)}
							{[...events].reverse().map((event, i) => (
								<div
									key={`${event.timestamp ?? i}-${event.type}`}
									className={cn(
										"border-border border-b px-2 py-1 last:border-b-0",
										event.type === "sync:error"
											? "text-red-500"
											: event.type === "sync:conflict"
												? "text-yellow-500"
												: "text-muted-foreground",
									)}
								>
									<span className="opacity-60">
										{new Date(event.timestamp).toLocaleTimeString()}
									</span>{" "}
									[{event.type}] {event.detail}
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
