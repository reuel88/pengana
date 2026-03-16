/**
 * Minimal valid JPEG (1x1 pixel, red) for use in e2e tests.
 * Avoids committing binary fixtures to the repo.
 */
const TINY_JPEG_HEX =
	"ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909" +
	"080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c" +
	"30313434341f27393d38323c2e333432ffc0000b080001000101011100ffc4001f00000105" +
	"01010101010100000000000000000102030405060708090a0bffc40000ffc4000000ffda00" +
	"08010100003f00548e01ffd9";

export const TINY_JPEG = Buffer.from(TINY_JPEG_HEX, "hex");

export const TEST_JPEG_PAYLOAD = {
	name: "test.jpg",
	mimeType: "image/jpeg",
	buffer: TINY_JPEG,
} as const;
