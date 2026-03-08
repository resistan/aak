import { useState, useEffect, useRef } from 'react';

export function useModalState(isContrastOpen: boolean, setIsContrastOpen: (value: boolean) => void) {
	// State: 선택/판정 관련
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [judgingId, setJudgingId] = useState<string | null>(null);
	const [tempComment, setTempComment] = useState("");
	const [selectedJudgeStatus, setSelectedJudgeStatus] = useState<string | null>(null);

	// State: 모달/패널
	const [isPropPanelOpen, setIsPropPanelOpen] = useState(false);
	const [selectedGuidelineInfo, setSelectedGuidelineInfo] = useState<string | null>(null);

	// Refs: 포커스 관리
	const propPanelRef = useRef<HTMLDivElement>(null);
	const guidelineInfoRef = useRef<HTMLDivElement>(null);
	const lastFocusedRef = useRef<HTMLElement | null>(null);

	// ESC 키 핸들러
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsPropPanelOpen(false);
				setSelectedGuidelineInfo(null);
				setIsContrastOpen(false);
			}
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [setIsContrastOpen]);

	// Focus Restore
	useEffect(() => {
		if (!isPropPanelOpen && !selectedGuidelineInfo && lastFocusedRef.current) {
			lastFocusedRef.current.focus();
			lastFocusedRef.current = null;
		}
	}, [isPropPanelOpen, selectedGuidelineInfo]);

	// PropPanel Focus Trap
	useEffect(() => {
		if (isPropPanelOpen && propPanelRef.current) {
			lastFocusedRef.current = document.activeElement as HTMLElement;
			const focusableElements = propPanelRef.current.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			if (focusableElements.length > 0) {
				(focusableElements[0] as HTMLElement).focus();
			}
		}
	}, [isPropPanelOpen]);

	// GuidelineInfo Focus Trap
	useEffect(() => {
		if (selectedGuidelineInfo && guidelineInfoRef.current) {
			lastFocusedRef.current = document.activeElement as HTMLElement;
			const focusableElements = guidelineInfoRef.current.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			if (focusableElements.length > 0) {
				(focusableElements[0] as HTMLElement).focus();
			}
		}
	}, [selectedGuidelineInfo]);

	return {
		// 선택/판정 상태
		selectedId,
		setSelectedId,
		judgingId,
		setJudgingId,
		tempComment,
		setTempComment,
		selectedJudgeStatus,
		setSelectedJudgeStatus,

		// 모달/패널 상태
		isPropPanelOpen,
		setIsPropPanelOpen,
		selectedGuidelineInfo,
		setSelectedGuidelineInfo,

		// Refs (포커스 관리용)
		propPanelRef,
		guidelineInfoRef
	};
}