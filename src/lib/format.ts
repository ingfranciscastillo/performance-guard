export function timeAgo(iso: string | Date | null): string {
	if (!iso) return "never";
	const ms = Date.now() - new Date(iso).getTime();
	const hours = Math.floor(ms / 3_600_000);
	if (hours < 1) return "just now";
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
