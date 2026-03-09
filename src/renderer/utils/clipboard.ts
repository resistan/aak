export const copyToClipboard = async (
	text: string,
	onSuccess?: () => void
): Promise<boolean> => {
	try {
		await navigator.clipboard.writeText(text);
		onSuccess?.();
		return true;
	} catch {
		return false;
	}
};