/**
 * Hybrid Logical Clock (HLC) implementation.
 *
 * Combines wall-clock time with a logical counter to produce causally-ordered
 * timestamps even in the presence of clock skew between devices.
 *
 * Serialized format: "<wallMs-hex-13>:<counter-hex-4>:<node>"
 * This format is lexicographically sortable = causal order.
 */

export interface HLCTimestamp {
	/** Wall-clock milliseconds (capped to max of local clock and last-seen). */
	wallMs: number;
	/** Logical counter (incremented when wallMs ties). */
	counter: number;
	/** Node ID — identifies the device/session that created this timestamp. */
	node: string;
}

const WALL_HEX_LEN = 13;
const COUNTER_HEX_LEN = 4;
const MAX_COUNTER = 0xffff;

/** Serialize an HLC timestamp to a comparable string. */
export function serialize(ts: HLCTimestamp): string {
	const wall = ts.wallMs.toString(16).padStart(WALL_HEX_LEN, "0");
	const counter = ts.counter.toString(16).padStart(COUNTER_HEX_LEN, "0");
	return `${wall}:${counter}:${ts.node}`;
}

/** Deserialize an HLC string back to a timestamp. */
export function deserialize(s: string): HLCTimestamp {
	const parts = s.split(":");
	if (parts.length < 3) {
		throw new Error(`Invalid HLC timestamp: ${s}`);
	}
	return {
		wallMs: Number.parseInt(parts[0] as string, 16),
		counter: Number.parseInt(parts[1] as string, 16),
		node: parts.slice(2).join(":"),
	};
}

/** Compare two HLC timestamps. Returns negative, zero, or positive. */
export function compare(a: HLCTimestamp, b: HLCTimestamp): number {
	if (a.wallMs !== b.wallMs) return a.wallMs - b.wallMs;
	if (a.counter !== b.counter) return a.counter - b.counter;
	if (a.node < b.node) return -1;
	if (a.node > b.node) return 1;
	return 0;
}

/** Compare two serialized HLC strings. Lexicographic comparison works. */
export function compareStr(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

/**
 * Merge per-field clocks from two versions, returning the merged record
 * and merged field clocks.
 *
 * For each field, the version with the higher HLC wins.
 * Returns { merged fields, merged fieldClocks, changed: true if any field differs from `a` }.
 */
export function mergeFieldClocks<T extends Record<string, unknown>>(
	a: T,
	aClock: Record<string, string>,
	b: T,
	bClock: Record<string, string>,
	fields: (keyof T & string)[],
): {
	merged: Partial<T>;
	fieldClocks: Record<string, string>;
	changed: boolean;
} {
	const merged: Record<string, unknown> = {};
	const fieldClocks: Record<string, string> = {};
	let changed = false;

	for (const field of fields) {
		const aHlc = aClock[field] ?? "";
		const bHlc = bClock[field] ?? "";

		if (compareStr(aHlc, bHlc) >= 0) {
			merged[field] = a[field];
			fieldClocks[field] = aHlc;
		} else {
			merged[field] = b[field];
			fieldClocks[field] = bHlc;
			changed = true;
		}
	}

	return { merged: merged as Partial<T>, fieldClocks, changed };
}

export class HLC {
	private wallMs = 0;
	private counter = 0;
	private nodeId: string;
	private getNow: () => number;

	constructor(nodeId: string, getNow: () => number = Date.now) {
		this.nodeId = nodeId;
		this.getNow = getNow;
	}

	/** Generate the next HLC timestamp for a local event. */
	now(): HLCTimestamp {
		const physicalNow = this.getNow();
		if (physicalNow > this.wallMs) {
			this.wallMs = physicalNow;
			this.counter = 0;
		} else {
			this.counter = Math.min(this.counter + 1, MAX_COUNTER);
		}
		return { wallMs: this.wallMs, counter: this.counter, node: this.nodeId };
	}

	/** Update the local clock after receiving a remote timestamp. */
	receive(remote: HLCTimestamp): void {
		const physicalNow = this.getNow();
		const maxWall = Math.max(physicalNow, this.wallMs, remote.wallMs);

		if (maxWall === this.wallMs && maxWall === remote.wallMs) {
			this.counter = Math.min(
				Math.max(this.counter, remote.counter) + 1,
				MAX_COUNTER,
			);
		} else if (maxWall === this.wallMs) {
			this.counter = Math.min(this.counter + 1, MAX_COUNTER);
		} else if (maxWall === remote.wallMs) {
			this.counter = Math.min(remote.counter + 1, MAX_COUNTER);
		} else {
			// physicalNow is the max — reset counter
			this.counter = 0;
		}

		this.wallMs = maxWall;
	}

	/** Serialize the current clock state (for persistence). */
	serialize(): string {
		return serialize({
			wallMs: this.wallMs,
			counter: this.counter,
			node: this.nodeId,
		});
	}

	/** Restore clock state from a serialized string. */
	static restore(s: string, getNow?: () => number): HLC {
		const ts = deserialize(s);
		const hlc = new HLC(ts.node, getNow);
		hlc.wallMs = ts.wallMs;
		hlc.counter = ts.counter;
		return hlc;
	}

	get node(): string {
		return this.nodeId;
	}
}
