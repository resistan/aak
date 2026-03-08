import { useState } from 'react';

export function useToolsState(isPopup: boolean, sourceWindowId: number | null) {
	const [isLinearView, setIsLinearView] = useState(false);
	const [isImageAltView, setIsImageAltView] = useState(false);
	const [isFocusTracking, setIsFocusTracking] = useState(false);

	const toggleCSS = () => {
		const nextState = !isLinearView;
		setIsLinearView(nextState);
		if (typeof chrome !== 'undefined' && chrome.runtime) {
			chrome.runtime.sendMessage({
				type: 'TOGGLE_CSS',
				enable: nextState,
				windowId: isPopup ? sourceWindowId : null
			});
		}
	};

	const toggleImageAlt = () => {
		const nextState = !isImageAltView;
		setIsImageAltView(nextState);
		if (typeof chrome !== 'undefined' && chrome.runtime) {
			chrome.runtime.sendMessage({
				type: 'TOGGLE_IMAGE_ALT',
				enable: nextState,
				windowId: isPopup ? sourceWindowId : null
			});
		}
	};

	const toggleFocusTracking = () => {
		const nextState = !isFocusTracking;
		if (typeof chrome !== 'undefined' && chrome.runtime) {
			chrome.runtime.sendMessage({
				type: 'TOGGLE_FOCUS_TRACKING',
				enable: nextState,
				windowId: isPopup ? sourceWindowId : null
			}, (res) => {
				if (res?.status === 'success') setIsFocusTracking(nextState);
			});
		}
	};

	const resetFocusPath = () => {
		if (typeof chrome !== 'undefined' && chrome.runtime) {
			chrome.runtime.sendMessage({
				type: 'RESET_FOCUS_TRACKING',
				windowId: isPopup ? sourceWindowId : null
			});
		}
	};

	return {
		isLinearView,
		isImageAltView,
		isFocusTracking,
		toggleCSS,
		toggleImageAlt,
		toggleFocusTracking,
		resetFocusPath
	};
}