const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

export function getEncryptionKey(secret: string): Promise<CryptoKey> {
	const keyMaterial = new TextEncoder().encode(
		secret.padEnd(32, "x").slice(0, 32),
	);
	return crypto.subtle.importKey("raw", keyMaterial, ALGORITHM, false, [
		"encrypt",
		"decrypt",
	]);
}

export async function encrypt(
	plaintext: string,
	secret: string,
): Promise<string> {
	const key = await getEncryptionKey(secret);
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encoded = new TextEncoder().encode(plaintext);
	const encrypted = await crypto.subtle.encrypt(
		{ name: ALGORITHM, iv },
		key,
		encoded,
	);
	const combined = new Uint8Array(iv.length + encrypted.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(encrypted), iv.length);
	return btoa(String.fromCharCode(...combined));
}

export async function decrypt(
	ciphertext: string,
	secret: string,
): Promise<string> {
	const key = await getEncryptionKey(secret);
	const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
	const iv = combined.slice(0, IV_LENGTH);
	const data = combined.slice(IV_LENGTH);
	const decrypted = await crypto.subtle.decrypt(
		{ name: ALGORITHM, iv },
		key,
		data,
	);
	return new TextDecoder().decode(decrypted);
}
