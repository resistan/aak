import React from 'react';
import { RotateCcw } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';

interface AuditingViewProps {
	currentGuideline: string | null;
}

export const AuditingView: React.FC<AuditingViewProps> = ({
	currentGuideline
}) => {
	return (
		<div className={styles.dashboard} aria-busy="true" aria-live="polite">
			<div className={styles.hero}>
				<div className={styles.heroIcon} style={{ animationDuration: '1s' }}>
					<RotateCcw size={48} />
				</div>
				<h2>정밀 진단 중</h2>
				{currentGuideline && (
					<p style={{ color: 'var(--accent-highlight)', fontWeight: 'bold', fontSize: '1rem', margin: '0.8rem 0' }}>
						검사항목 {currentGuideline} 분석 중...
					</p>
				)}
				<p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>
					KWCAG 2.2 표준 지침에 따라<br/>페이지의 모든 요소를 정밀 진단하고 있습니다.
				</p>
				<div className={styles.loadingBar}>
					<div className={styles.progress}></div>
				</div>
			</div>
		</div>
	);
};