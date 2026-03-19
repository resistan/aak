import React from 'react';
import styles from '@/renderer/styles/App.module.scss';
import { handleKeyDown } from '@/renderer/utils/keyhelper';
import { ABTItem } from '@/renderer/store/useStore';

interface ScoreBadgeProps {
	gid: string;
	items: ABTItem[];
	selectedSessionId: number | null;
	setGuidelineScore: (scanId: number, gid: string, score: number) => void;
}

// 전수 조사형 지침 목록
const EXHAUSTIVE_GIDS = ['1.1.1', '1.3.1', '1.4.3', '2.1.1', '2.1.2', '2.4.1', '2.4.2', '2.4.3', '2.5.3', '3.1.1', '3.3.2'];
// 수동 검사 배지 스킵 지침
const SKIP_MANUAL_BADGE_GIDS = ['1.1.1', '3.1.1'];

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
	gid,
	items,
	selectedSessionId,
	setGuidelineScore
}) => {
	const total = items.length;
	const manualScore = total > 0 ? items[0].manualScore : undefined;

	const handleScoreEdit = (e: React.MouseEvent | React.KeyboardEvent, currentScore?: number) => {
		e.stopPropagation();
		const promptMsg = currentScore !== undefined
			? `점수 입력 (0-100):`
			: "수동 검사 점수 입력 (0-100):";
		const defaultVal = currentScore?.toString() || "";
		const val = prompt(promptMsg, defaultVal);
		if (val !== null && selectedSessionId) {
			setGuidelineScore(selectedSessionId, gid, parseInt(val));
		}
	};

	// 수동 점수가 있는 경우
	if (manualScore !== undefined) {
		return (
			<span
				className={`${styles.scoreBadge} ${manualScore < 60 ? styles.bad : manualScore < 90 ? styles.warning : styles.good}`}
				onClick={(e) => handleScoreEdit(e, manualScore)}
				onKeyDown={(e) => {
					e.stopPropagation();
					handleKeyDown(e, () => handleScoreEdit(e, manualScore));
				}}
				tabIndex={0}
				role="button"
				title="클릭하여 점수를 수정할 수 있습니다."
				aria-label={`수동 점수 ${manualScore}점, 수정하려면 클릭`}
			>
				{manualScore}점 (수동)
			</span>
		);
	}

	// 검출 항목 없음
	if (total === 0) {
		return (
			<span
				className={styles.naBadge}
				onClick={(e) => {
					e.stopPropagation();
					alert("N/A 항목은 검출된 요소가 없어 점수를 저장할 수 없습니다.");
				}}
				tabIndex={0}
				role="button"
				aria-label="N/A 항목"
			>
				N/A
			</span>
		);
	}

	// 점수 계산
	let pass = 0, fail = 0, review = 0, calcTotal = 0;
	items.forEach(i => {
		if (i.currentStatus === '참고자료') return;
		const weight = (i as any).isSummary && (i as any).passCount ? (i as any).passCount : 1;
		calcTotal += weight;
		if (i.currentStatus === '적절') pass += weight;
		else if (['오류', '부적절'].includes(i.currentStatus)) fail += weight;
		else if (['검토 필요', '수정 권고'].includes(i.currentStatus)) review += weight;
	});

	// 수동 검사 필요 표시
	if (fail === 0 && review > 0 && items.some(i => i.currentStatus === '검토 필요') && !SKIP_MANUAL_BADGE_GIDS.includes(gid)) {
		return (
			<span
				className={`${styles.scoreBadge} ${styles.manual}`}
				onClick={(e) => handleScoreEdit(e)}
				onKeyDown={(e) => {
					e.stopPropagation();
					handleKeyDown(e, () => handleScoreEdit(e));
				}}
				tabIndex={0}
				role="button"
				title="자동 진단이 어려운 항목입니다. 클릭하여 직접 점수를 입력하세요."
				aria-label="수동 검사 필요, 점수를 입력하려면 클릭"
			>
				수동 검사 필요
			</span>
		);
	}

	// 점수 계산
	let score = 100;
	if (EXHAUSTIVE_GIDS.includes(gid)) {
		score = Math.round(((pass * 100 + review * 50) / (calcTotal * 100)) * 100);
	} else {
		const rawScore = 100 * Math.pow(0.8, fail) * Math.pow(0.95, review);
		score = Math.round(rawScore);
		if (calcTotal > 0 && pass === calcTotal) score = 100;
	}

	return (
		<span
			className={`${styles.scoreBadge} ${score < 60 ? styles.bad : score < 90 ? styles.warning : styles.good}`}
			onClick={(e) => handleScoreEdit(e, score)}
			onKeyDown={(e) => {
				e.stopPropagation();
				handleKeyDown(e, () => handleScoreEdit(e, score));
			}}
			tabIndex={0}
			role="button"
			title="클릭하여 점수를 직접 수정할 수 있습니다."
			aria-label={`진단 점수 ${score}점, 수정하려면 클릭`}
		>
			{score}점
		</span>
	);
};