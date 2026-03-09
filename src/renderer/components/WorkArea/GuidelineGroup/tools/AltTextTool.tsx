import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';

export interface AltTextToolProps {
	isActive: boolean;
	onToggle: () => void;
}

export const AltTextTool: React.FC<AltTextToolProps> = ({
	isActive,
	onToggle
}) => {
	return (
		<div className={styles.manualEntrySection}>
			<div className={styles.focusTrackerControls}>
				<button
					className={`${styles.focusToggleBtn} ${isActive ? styles.active : ''}`}
					onClick={onToggle}
					title="이미지 대체 텍스트 오버레이 표시"
				>
					<ImageIcon size={14} />
					{isActive ? "이미지 보기" : "대체텍스트 보기"}
				</button>
			</div>
		</div>
	);
};