import { useState, useEffect } from 'react';

interface Session {
	scanId: number;
	pageTitle: string;
	url: string;
	timestamp: string;
}

const normalizeUrl = (u: string) => u.replace(/\/$/, "").split('?')[0].split('#')[0];

export function useAudit(
	addReport: (report: any) => void,
	addReportsBatch: (reports: any[]) => void,
	setSelectedSessionId: (id: number | null) => void,
	setIsManualDashboard: (value: boolean) => void,
	sessions: Session[],
	selectedSessionId: number | null,
	isManualDashboard: boolean,
	isPopup: boolean,
	sourceWindowId: number | null
) {
	// State
	const [isConnected, setIsConnected] = useState(false);
	const [currentTabInfo, setCurrentTabInfo] = useState<{url: string, title: string} | null>(null);
	const [lastTriggeredScanTime, setLastTriggeredScanTime] = useState<number>(0);
	const [isAuditing, setIsAuditing] = useState(false);
	const [currentGuideline, setCurrentGuideline] = useState<string | null>(null);
	const [isReloadRequired, setIsReloadRequired] = useState(false);

	// Track active tab (App.tsx 라인 108-140)
	useEffect(() => {
		const updateCurrentTab = () => {
			if (typeof chrome !== 'undefined' && chrome.tabs) {
				const queryOptions = (isPopup && sourceWindowId)
					? { active: true, windowId: sourceWindowId }
					: { active: true, lastFocusedWindow: true };

				chrome.tabs.query(queryOptions, (tabs) => {
					const validTab = tabs.find(t => t.url && !t.url.startsWith('chrome-extension://')) || tabs[0];
					if (validTab) {
						setCurrentTabInfo({
							url: validTab.url || "",
							title: validTab.title || ""
						});
					}
				});
			}
		};

		updateCurrentTab();
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			const tabListener = (tabId: number, changeInfo: any, tab: chrome.tabs.Tab) => {
				if (changeInfo.status === 'complete' && tab.active) updateCurrentTab();
			};
			const activeListener = () => updateCurrentTab();
			chrome.tabs.onUpdated.addListener(tabListener);
			chrome.tabs.onActivated.addListener(activeListener);
			return () => {
				chrome.tabs.onUpdated.removeListener(tabListener);
				chrome.tabs.onActivated.removeListener(activeListener);
			};
		}
	}, [isPopup, sourceWindowId]);

	// 진단 시작 (App.tsx 라인 142-167)
	const handleStartAudit = () => {
		if (typeof chrome !== 'undefined' && chrome.runtime) {
			setIsAuditing(true);
			setLastTriggeredScanTime(Date.now());

			if (chrome.tabs) {
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					if (tabs[0] && tabs[0].id) {
						chrome.tabs.sendMessage(tabs[0].id, { type: 'RUN_AUDIT' }, (response) => {
							if (chrome.runtime.lastError) {
								chrome.scripting.executeScript({
									target: { tabId: tabs[0].id },
									files: ['engine/abt-engine.js']
								}).then(() => {
									setTimeout(() => chrome.tabs.sendMessage(tabs[0].id, { type: 'RUN_AUDIT' }), 200);
								});
							}
						});
					}
				});
			} else {
				chrome.runtime.sendMessage({ type: 'RUN_AUDIT', windowId: isPopup ? sourceWindowId : null });
			}
			setTimeout(() => setIsAuditing(false), 10000);
		}
	};

	// Chrome 메시지 리스너 (App.tsx 라인 238-267)
	useEffect(() => {
		if (typeof chrome === 'undefined' || !chrome.runtime) return;
		const handleMessage = (message: any) => {
			if (message.type === 'UPDATE_ABT_LIST_BATCH' || message.type === 'UPDATE_ABT_BATCH') {
				setIsConnected(true);
				addReportsBatch(message.items || message.data);
			} else if (message.type === 'UPDATE_ABT_LIST') {
				setIsConnected(true);
				addReport(message.data);
			} else if (message.type === 'SCAN_PROGRESS') {
				setCurrentGuideline(message.guideline_id);
				setIsAuditing(true);
			} else if (message.type === 'SCAN_FINISHED') {
				setIsAuditing(false);
				setSelectedSessionId(message.scanId);
				setIsManualDashboard(false);
			} else if (message.type === 'CONTEXT_INVALIDATED') {
				setIsAuditing(false);
				setIsReloadRequired(true);
			}
		};

		const port = chrome.runtime.connect({ name: 'abt-sidepanel' });
		port.onMessage.addListener(handleMessage);
		const runtimeListener = (message: any) => handleMessage(message);
		chrome.runtime.onMessage.addListener(runtimeListener);

		return () => {
			port.onMessage.removeListener(handleMessage);
			port.disconnect();
			chrome.runtime.onMessage.removeListener(runtimeListener);
		};
	}, [addReport, addReportsBatch, setSelectedSessionId, setIsManualDashboard]);

	// 세션 자동 선택 (App.tsx 라인 214-228)
	useEffect(() => {
		if (!currentTabInfo?.url) return;
		const latestSessionForUrl = sessions.find(s => normalizeUrl(s.url) === normalizeUrl(currentTabInfo.url));
		if (latestSessionForUrl) {
			const sessionTime = new Date(latestSessionForUrl.timestamp).getTime();
			if (!selectedSessionId && !isManualDashboard && lastTriggeredScanTime === 0) {
				setSelectedSessionId(latestSessionForUrl.scanId);
			} else if (lastTriggeredScanTime > 0 && sessionTime > lastTriggeredScanTime - 1000) {
				setSelectedSessionId(latestSessionForUrl.scanId);
				setIsManualDashboard(false);
				setLastTriggeredScanTime(0);
				setIsAuditing(false);
			}
		} else { // 해당 URL에 대한 세션이 없으면 초기 페이지로
      if (selectedSessionId !== null) {
        setSelectedSessionId(null);
      }
    }
	}, [currentTabInfo?.url, sessions, selectedSessionId, isManualDashboard, lastTriggeredScanTime, setSelectedSessionId, setIsManualDashboard]);

	return {
		// State
		isConnected,
		currentTabInfo,
		lastTriggeredScanTime,
		isAuditing,
		currentGuideline,
		isReloadRequired,

		// Actions
		handleStartAudit
	};
}