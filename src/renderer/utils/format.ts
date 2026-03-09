export const formatRelativeTime = (timestamp: string): string => {
	const date = new Date(timestamp);
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInMins = Math.floor(diffInMs / (1000 * 60));

	if (diffInMins < 1) return '방금 전';
	if (diffInMins < 60) return `${diffInMins}분 전`;

	const isToday = date.toDateString() === now.toDateString();
	const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

	if (isToday) return `오늘 ${timeStr}`;

	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	if (date.toDateString() === yesterday.toDateString()) return `어제 ${timeStr}`;

	return date.toLocaleDateString() + ' ' + timeStr;
};
export const normalizeUrl = (url: string): string => url.replace(/\/$/, "").split('?')[0].split('#')[0];