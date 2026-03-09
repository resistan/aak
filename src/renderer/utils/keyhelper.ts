export const handleKeyDown = (
	e: React.KeyboardEvent,
	callback: () => void
): void => {
	if (e.key === 'Enter' || e.key === ' ') {
		e.preventDefault();
		callback();
	}
};