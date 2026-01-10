/**
 * Generates a random alphanumeric ID using crypto.getRandomValues().
 * Safe for use in Cloudflare Workers.
 */
export function generateShareId(length = 10): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
