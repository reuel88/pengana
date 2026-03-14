import { describe, expect, it } from "vitest";

import { parseWsMessage } from "./ws-types";

describe("parseWsMessage", () => {
	it("parses a string payload", () => {
		expect(parseWsMessage('{"type":"connected"}')).toEqual({
			type: "connected",
		});
	});

	it("parses a Buffer payload", () => {
		expect(parseWsMessage(Buffer.from('{"type":"keepalive"}', "utf8"))).toEqual(
			{
				type: "keepalive",
			},
		);
	});

	it("parses a Uint8Array payload", () => {
		expect(
			parseWsMessage(new TextEncoder().encode('{"type":"sync-notify"}')),
		).toEqual({
			type: "sync-notify",
		});
	});

	it("parses an ArrayBuffer payload", () => {
		const bytes = new TextEncoder().encode('{"type":"connected"}');
		const payload = bytes.buffer.slice(
			bytes.byteOffset,
			bytes.byteOffset + bytes.byteLength,
		);

		expect(parseWsMessage(payload)).toEqual({
			type: "connected",
		});
	});

	it("returns null for Blob payloads", () => {
		expect(
			parseWsMessage(
				new Blob(['{"type":"connected"}'], { type: "application/json" }),
			),
		).toBeNull();
	});

	it("returns null for malformed binary JSON", () => {
		expect(parseWsMessage(Buffer.from("{invalid", "utf8"))).toBeNull();
	});

	it("returns null for unsupported message types", () => {
		expect(parseWsMessage('{"type":"other"}')).toBeNull();
	});

	it("returns null for unrelated input", () => {
		expect(parseWsMessage({ type: "connected" })).toBeNull();
	});
});
