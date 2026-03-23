import { describe, expect, it } from "vitest";
import {
	compare,
	compareStr,
	deserialize,
	HLC,
	mergeFieldClocks,
	serialize,
} from "./hlc";

describe("HLC", () => {
	describe("serialize / deserialize", () => {
		it("round-trips correctly", () => {
			const ts = { wallMs: 1700000000000, counter: 42, node: "device-a" };
			const s = serialize(ts);
			const back = deserialize(s);
			expect(back).toEqual(ts);
		});

		it("produces lexicographically comparable strings", () => {
			const a = serialize({ wallMs: 1000, counter: 0, node: "a" });
			const b = serialize({ wallMs: 1001, counter: 0, node: "a" });
			expect(a < b).toBe(true);
		});

		it("counter breaks wall-clock ties lexicographically", () => {
			const a = serialize({ wallMs: 1000, counter: 1, node: "a" });
			const b = serialize({ wallMs: 1000, counter: 2, node: "a" });
			expect(a < b).toBe(true);
		});

		it("handles node IDs with colons", () => {
			const ts = { wallMs: 1000, counter: 0, node: "node:with:colons" };
			const s = serialize(ts);
			const back = deserialize(s);
			expect(back.node).toBe("node:with:colons");
		});
	});

	describe("compare", () => {
		it("orders by wallMs first", () => {
			const a = { wallMs: 100, counter: 5, node: "z" };
			const b = { wallMs: 200, counter: 0, node: "a" };
			expect(compare(a, b)).toBeLessThan(0);
		});

		it("orders by counter when wallMs ties", () => {
			const a = { wallMs: 100, counter: 1, node: "a" };
			const b = { wallMs: 100, counter: 2, node: "a" };
			expect(compare(a, b)).toBeLessThan(0);
		});

		it("orders by node when both tie", () => {
			const a = { wallMs: 100, counter: 1, node: "a" };
			const b = { wallMs: 100, counter: 1, node: "b" };
			expect(compare(a, b)).toBeLessThan(0);
		});

		it("returns 0 for equal timestamps", () => {
			const a = { wallMs: 100, counter: 1, node: "a" };
			expect(compare(a, { ...a })).toBe(0);
		});
	});

	describe("compareStr", () => {
		it("compares serialized strings correctly", () => {
			const a = serialize({ wallMs: 100, counter: 0, node: "a" });
			const b = serialize({ wallMs: 200, counter: 0, node: "a" });
			expect(compareStr(a, b)).toBeLessThan(0);
			expect(compareStr(b, a)).toBeGreaterThan(0);
			expect(compareStr(a, a)).toBe(0);
		});
	});

	describe("HLC class", () => {
		it("generates increasing timestamps", () => {
			const time = 1000;
			const hlc = new HLC("node-1", () => time);

			const a = hlc.now();
			const b = hlc.now();

			// Same wall clock → counter increments
			expect(a.wallMs).toBe(1000);
			expect(b.wallMs).toBe(1000);
			expect(b.counter).toBe(a.counter + 1);
		});

		it("resets counter when wall clock advances", () => {
			let time = 1000;
			const hlc = new HLC("node-1", () => time);

			hlc.now();
			hlc.now(); // counter = 1
			time = 2000;
			const c = hlc.now();

			expect(c.wallMs).toBe(2000);
			expect(c.counter).toBe(0);
		});

		it("receive advances clock from remote", () => {
			const time = 1000;
			const hlc = new HLC("node-1", () => time);

			hlc.receive({ wallMs: 5000, counter: 10, node: "node-2" });
			const ts = hlc.now();

			expect(ts.wallMs).toBe(5000);
			expect(ts.counter).toBeGreaterThan(10);
		});

		it("receive does not go backwards", () => {
			const time = 5000;
			const hlc = new HLC("node-1", () => time);
			hlc.now(); // wallMs = 5000

			hlc.receive({ wallMs: 1000, counter: 0, node: "node-2" });
			const ts = hlc.now();

			expect(ts.wallMs).toBe(5000);
		});

		it("two nodes produce ordered timestamps despite same wall clock", () => {
			const time = 1000;
			const hlcA = new HLC("node-a", () => time);
			const hlcB = new HLC("node-b", () => time);

			const a = hlcA.now();
			const b = hlcB.now();

			// Same wallMs, same counter, different node → still deterministically ordered
			expect(compare(a, b)).not.toBe(0);
		});

		it("now() throws on counter overflow", () => {
			const hlc = new HLC("node-1", () => 1000);

			// First call sets wallMs=1000, counter=0. Next 65535 calls increment to MAX_COUNTER.
			for (let i = 0; i < 0xffff + 1; i++) {
				hlc.now();
			}

			// The 65537th call should overflow
			expect(() => hlc.now()).toThrowError(/HLC counter overflow/);
		});

		it("receive() throws on counter overflow", () => {
			const hlc = new HLC("node-1", () => 1000);
			hlc.now(); // wallMs=1000, counter=0

			// Receive with counter at MAX_COUNTER at same wallMs — max(0, 0xFFFF) + 1 overflows
			expect(() =>
				hlc.receive({ wallMs: 1000, counter: 0xffff, node: "node-2" }),
			).toThrowError(/HLC counter overflow/);
		});

		it("serializes and restores correctly", () => {
			const time = 1000;
			const hlc = new HLC("node-1", () => time);
			hlc.now();
			hlc.now();

			const serialized = hlc.serialize();
			const restored = HLC.restore(serialized, () => time);

			const original = hlc.now();
			const fromRestored = restored.now();

			// Both should produce timestamps at the same wallMs
			expect(fromRestored.wallMs).toBe(original.wallMs);
		});
	});

	describe("mergeFieldClocks", () => {
		it("picks the field with the higher HLC", () => {
			const a = { title: "A title", completed: false };
			const aClock = {
				title: serialize({ wallMs: 2000, counter: 0, node: "a" }),
				completed: serialize({ wallMs: 1000, counter: 0, node: "a" }),
			};

			const b = { title: "B title", completed: true };
			const bClock = {
				title: serialize({ wallMs: 1000, counter: 0, node: "b" }),
				completed: serialize({ wallMs: 3000, counter: 0, node: "b" }),
			};

			const result = mergeFieldClocks(a, aClock, b, bClock, [
				"title",
				"completed",
			]);

			expect(result.merged.title).toBe("A title"); // a wins (wallMs 2000 > 1000)
			expect(result.merged.completed).toBe(true); // b wins (wallMs 3000 > 1000)
			expect(result.changed).toBe(true); // completed was overwritten
		});

		it("returns changed=false when a wins all fields", () => {
			const a = { title: "A", completed: false };
			const aClock = {
				title: serialize({ wallMs: 2000, counter: 0, node: "a" }),
				completed: serialize({ wallMs: 2000, counter: 0, node: "a" }),
			};

			const b = { title: "B", completed: true };
			const bClock = {
				title: serialize({ wallMs: 1000, counter: 0, node: "b" }),
				completed: serialize({ wallMs: 1000, counter: 0, node: "b" }),
			};

			const result = mergeFieldClocks(a, aClock, b, bClock, [
				"title",
				"completed",
			]);

			expect(result.changed).toBe(false);
		});

		it("handles missing field clocks gracefully", () => {
			const a = { title: "A" };
			const aClock = {
				title: serialize({ wallMs: 2000, counter: 0, node: "a" }),
			};
			const b = { title: "B" };
			const bClock = {}; // no clock for title

			const result = mergeFieldClocks(a, aClock, b, bClock, ["title"]);
			expect(result.merged.title).toBe("A"); // a wins (has clock, b has empty string)
		});
	});
});
