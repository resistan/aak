import { useState, useMemo, useEffect, useRef } from 'react';
import { ABTItem, kwcagHierarchy } from '../store/useStore';
import { normalizeUrl } from '../utils/format';

export function useSessionManager(items: ABTItem[]) {
	// State
	const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
	const [activeTab, setActiveTab] = useState("ALL");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
	const [manualEntryGid, setManualEntryGid] = useState<string | null>(null);

	// Ref
	const collapsedByUser = useRef<Set<string>>(new Set());

	// 세션 목록 계산 (App.tsx 라인 154-170)
	const sessions = useMemo(() => {
		const map = new Map<number, any>();

		items.forEach(item => {
			const pInfo = item.pageInfo;
			if(!pInfo || !pInfo.scanId) return;

			if(!map.has(pInfo.scanId)) {
				map.set(pInfo.scanId, {
					...pInfo,
					pageTitle: pInfo.pageTitle || "제목없는 페이지"
				})
			}
		});

		return Array.from(map.values()).sort((a,b) => b.scanId - a.scanId);
	}, [items]);

	// 세션/가이드라인 필터 (App.tsx 라인 293-300)
	const baseFilteredItems = useMemo(() => {
		return items.filter(item => {
			if(selectedSessionId && item.pageInfo?.scanId !== selectedSessionId) return false;
			if(activeTab !== "ALL" && item.guideline_id !== activeTab) return false;
			return true;
		})
	}, [items, selectedSessionId, activeTab]);

	// 상태 필터 (App.tsx 라인 302-306)
	const filteredItems = useMemo(() => {
		if (statusFilter === "ALL") return baseFilteredItems;
		return baseFilteredItems.filter(item => item.currentStatus === statusFilter);
	}, [baseFilteredItems, statusFilter]);

	// 통계 계산 (App.tsx 라인 308-329)
	const itemStats = useMemo(() => {
		const stats = {
			total: baseFilteredItems.length,
			error: 0,
			review: 0,
			pass: 0,
			inappropriate: 0,
			recommendation: 0
		}

		baseFilteredItems.forEach(item => {
			const status = item.currentStatus;
			if(status === '오류') stats.error++;
			else if(status === '검토 필요') stats.review++;
			else if(status === '적절') stats.pass++;
			else if(status === '부적절') stats.inappropriate++;
			else if(status === '수정 권고') stats.recommendation++;
		});

		return stats;
	}, [baseFilteredItems]);

	// 그룹핑 (App.tsx 라인 331-359)
	const allGroupedItems = useMemo(() => {
		const itemMap: Record<string, ABTItem[]> = {};
		filteredItems.forEach(item => {
			if (!itemMap[item.guideline_id]) itemMap[item.guideline_id] = [];
			itemMap[item.guideline_id].push(item);
		});

		const result: {gid: string, label: string, items: ABTItem[]}[] = [];
		kwcagHierarchy.forEach(principle => {
			principle.items.forEach(item => {
				const itemsInGroup = itemMap[item.id] || [];

				// [정렬 로직] MANUAL 항목 우선 배치 + 최신순 정렬
				const sortedItems = [...itemsInGroup].sort((a, b) => {
					const aManual = a.elementInfo?.tagName === 'MANUAL';
					const bManual = b.elementInfo?.tagName === 'MANUAL';
					if (aManual && !bManual) return -1;
					if (!aManual && bManual) return 1;
					const aTime = new Date(a.pageInfo?.timestamp || 0).getTime();
					const bTime = new Date(b.pageInfo?.timestamp || 0).getTime();
					return bTime - aTime;
				});

				result.push({ gid: item.id, label: item.label, items: sortedItems });
			});
		});
		return result;
	}, [filteredItems]);

	// 그룹 토글 함수 (App.tsx 라인 242-252)
	const toggleGroup = (gid: string) => {
		setExpandedGroups(prev => {
			if (prev.includes(gid)) {
				collapsedByUser.current.add(gid);
				return prev.filter(id => id !== gid);
			} else {
				collapsedByUser.current.delete(gid);
				return [...prev, gid];
			}
		});
	};

	// 모든 그룹은 기본 접힘 상태로 시작 (자동 펼치기 없음)

	// 세션 정리 (App.tsx 라인 232-240)
	useEffect(() => {
		if (items.length === 0) {
			setSelectedSessionId(null);
		} else if (selectedSessionId && !items.some(i => i.pageInfo?.scanId === selectedSessionId)) {
			setSelectedSessionId(null);
		}
	}, [items, selectedSessionId]);

	// 세션 선택: 해당 URL 탭이 이미 열려있으면 활성화, 없으면 새 탭으로 열기
	const handleSelectSession = async (scanId: number) => {
		const session = sessions.find(s => s.scanId === scanId);

		if (session?.url && typeof chrome !== 'undefined' && chrome.tabs) {
			try {
				const allTabs = await chrome.tabs.query({});
				const matchingTab = allTabs.find(
					tab => tab.url && normalizeUrl(tab.url) === normalizeUrl(session.url)
				);

				if (matchingTab?.id) {
					// 기존 탭 활성화
					await chrome.tabs.update(matchingTab.id, { active: true });
					if (matchingTab.windowId) {
						await chrome.windows.update(matchingTab.windowId, { focused: true });
					}
				} else {
					// 새 탭으로 열기
					await chrome.tabs.create({ url: session.url });
				}
			} catch {
				// 탭 접근 불가 시 무시
			}
		}

		setSelectedSessionId(scanId);
	};

	return {
		// State
		selectedSessionId,
		setSelectedSessionId,
		activeTab,
		setActiveTab,
		statusFilter,
		setStatusFilter,
		expandedGroups,
		setExpandedGroups,
		manualEntryGid,
		setManualEntryGid,

		// Computed
		sessions,
		baseFilteredItems,
		filteredItems,
		itemStats,
		allGroupedItems,

		// Functions
		handleSelectSession,
		toggleGroup,

		// Ref
		collapsedByUser
	};
}