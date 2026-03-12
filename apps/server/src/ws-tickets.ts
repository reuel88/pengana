import { randomBytes } from "node:crypto";

const TICKET_TTL_MS = 30_000; // 30 seconds
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute

interface Ticket {
	userId: string;
	expiresAt: number;
}

const tickets = new Map<string, Ticket>();

// Periodically clean up expired tickets
setInterval(() => {
	const now = Date.now();
	for (const [token, ticket] of tickets) {
		if (ticket.expiresAt <= now) {
			tickets.delete(token);
		}
	}
}, CLEANUP_INTERVAL_MS);

/** Issue a short-lived, one-time-use ticket for WebSocket authentication. */
export function issueWsTicket(userId: string): string {
	const token = randomBytes(32).toString("hex");
	tickets.set(token, {
		userId,
		expiresAt: Date.now() + TICKET_TTL_MS,
	});
	return token;
}

/** Redeem a ticket. Returns the userId if valid, null otherwise. One-time use. */
export function redeemWsTicket(token: string): string | null {
	const ticket = tickets.get(token);
	if (!ticket) return null;

	// Always delete — one-time use
	tickets.delete(token);

	if (ticket.expiresAt <= Date.now()) return null;

	return ticket.userId;
}
