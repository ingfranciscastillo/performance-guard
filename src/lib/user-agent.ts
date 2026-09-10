/**
 * Deliberately not a dependency (ua-parser-js etc.) — a session list only
 * needs a rough "Chrome on macOS" label, not device-detection-grade
 * accuracy, so a few regexes cover the browsers/OSes real users show up
 * with.
 */
export function parseUserAgent(userAgent: string | null | undefined): string {
	if (!userAgent) return "Unknown device";

	let os = "Unknown OS";
	if (/windows/i.test(userAgent)) os = "Windows";
	else if (/iphone|ipad/i.test(userAgent)) os = "iOS";
	else if (/mac os x/i.test(userAgent)) os = "macOS";
	else if (/android/i.test(userAgent)) os = "Android";
	else if (/linux/i.test(userAgent)) os = "Linux";

	let browser = "Unknown browser";
	if (/edg\//i.test(userAgent)) browser = "Edge";
	else if (/opr\/|opera/i.test(userAgent)) browser = "Opera";
	else if (/chrome\//i.test(userAgent)) browser = "Chrome";
	else if (/crios\//i.test(userAgent)) browser = "Chrome";
	else if (/firefox\//i.test(userAgent)) browser = "Firefox";
	else if (/safari\//i.test(userAgent)) browser = "Safari";

	return `${browser} on ${os}`;
}
