import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getKey(): Buffer {
	const raw = process.env.INTEGRATION_ENCRYPTION_KEY;
	if (!raw) {
		throw new Error(
			"INTEGRATION_ENCRYPTION_KEY is not set. Generate one with " +
				"`node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"` " +
				"and add it to .env.local and Vercel's project env vars.",
		);
	}
	const key = Buffer.from(raw, "base64");
	if (key.length !== 32) {
		throw new Error(
			"INTEGRATION_ENCRYPTION_KEY must decode to exactly 32 bytes — it should be crypto.randomBytes(32).toString('base64'), not hand-typed.",
		);
	}
	return key;
}

/** AES-256-GCM. Encoded as "iv.authTag.ciphertext", each part base64. */
export function encryptSecret(plaintext: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();
	return [iv, authTag, ciphertext].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(encoded: string): string {
	const [ivB64, authTagB64, ciphertextB64] = encoded.split(".");
	if (!ivB64 || !authTagB64 || !ciphertextB64) {
		throw new Error("Malformed encrypted value");
	}
	const decipher = createDecipheriv(
		"aes-256-gcm",
		getKey(),
		Buffer.from(ivB64, "base64"),
	);
	decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
	return Buffer.concat([
		decipher.update(Buffer.from(ciphertextB64, "base64")),
		decipher.final(),
	]).toString("utf8");
}
