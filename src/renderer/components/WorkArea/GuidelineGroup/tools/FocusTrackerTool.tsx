import React from 'react';
import { MousePointer2, RotateCcw } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';

export interface FocusTrackerToolProps {
	isActive: boolean;
	onToggle: () => void;
	onReset: () => void;
}

export const FocusTrackerTool: React.FC<FocusTrackerToolProps> = ({
	isActive,
	onToggle,
	onReset
}) => {
	return (
		<div className={styles.manualEntrySection}>
			<div className={styles.focusTrackerControls}>
				<button
					className={`${styles.focusToggleBtn} ${isActive ? styles.active : ''}`}
					onClick={onToggle}
					title="초점 이동 경로 및 순서 시각화"
				>
					<MousePointer2 size={14} />
					{isActive ? "시각화 끄기" : "초점 순서 시각화"}
				</button>
				{isActive && (
					<button
						className={styles.focusResetBtn}
						onClick={onReset}
						title="표시된 경로 초기화"
					>
						<RotateCcw size={14} />
					</button>
				)}
			</div>
		</div>
	);
};