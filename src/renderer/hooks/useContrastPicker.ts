import { useState } from 'react';
import { getContrastRatio } from '../utils/color';

interface Session {
	scanId: number;
	pageTitle: string;
	url: string;
	timestamp: string;
}

export function useContrastPicker(
	selectedSessionId: number | null,
	sessions: Session[],
	addReport: (report: any) => void
) {
	// State
	const [isContrastOpen, setIsContrastOpen] = useState(false);
	const [fgColor, setFgColor] = useState("#ffffff");
	const [bgColor, setBgColor] = useState("#000000");
	const [manualContrastName, setManualContrastName] = useState("");

	// 색상 선택 (App.tsx 라인 90-103)
	const pickColor = async (type: 'fg' | 'bg') => {
		if (!window.EyeDropper) {
			alert("현재 브라우저에서 EyeDropper API를 지원하지 않습니다.");
			return;
		}
		try {
			const dropper = new window.EyeDropper();
			const result = await dropper.open();
			if (type === 'fg') setFgColor(result.sRGBHex);
			else setBgColor(result.sRGBHex);
		} catch (e) {
			console.log("EyeDropper canceled or failed");
		}
	};

	// 수동 명도 대비 항목 추가 (App.tsx 라인 104-128)
	const handleAddManualContrast = () => {
		if (!selectedSessionId) return;
		const session = sessions.find(s => s.scanId === selectedSessionId);
		if (!session) return;

		const ratio = getContrastRatio(fgColor, bgColor);
		const status = ratio >= 4.5 ? "적절" : "수정 권고";
		const message = `[수동 추가] '${manualContrastName || '명도 대비 케이스'}'의 대비는 ${ratio}:1 입니다.`;

		const manualReport = {
			guideline_id: "1.4.3",
			elementInfo: { tagName: "MANUAL", selector: "manual-contrast" },
			context: {
				smartContext: manualContrastName || "수동 측정 항목",
				color: fgColor,
				backgroundColor: bgColor
			},
			result: { status, message, rules: ["Manual Contrast Check"] },
			pageInfo: { ...session }
		};

		addReport(manualReport);
		setManualContrastName("");
		setIsContrastOpen(false);
	};

	// 폼 초기화
	const resetForm = () => {
		setFgColor("#ffffff");
		setBgColor("#000000");
		setManualContrastName("");
		setIsContrastOpen(false);
	};

	return {
		// State
		isContrastOpen,
		setIsContrastOpen,
		fgColor,
		bgColor,
		manualContrastName,
		setManualContrastName,

		// Actions
		pickColor,
		handleAddManualContrast,
		resetForm
	};
}