import React from 'react';
import { LayoutList } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';

export interface LinearizeToolProps {
	isActive: boolean;
	onToggle: () => void;
}

export const LinearizeTool: React.FC<LinearizeToolProps> = ({
	isActive,
	onToggle
}) => {
	return (
		<div className={styles.manualEntrySection}>
			<div className={styles.focusTrackerControls}>
				<button
					className={`${styles.focusToggleBtn} ${isActive ? styles.active : ''}`}
					onClick={onToggle}
					title="CSS 비활성화를 통한 선형 구조 확인"
				>
					<LayoutList size={14} />
					{isActive ? "CSS 켜기" : "선형화(CSS 끄기)"}
				</button>
			</div>
		</div>
	);
};