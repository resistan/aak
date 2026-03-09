import React from 'react';
import { ActivitySquare, Home, PanelRightClose, ExternalLink, FileText } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';

interface HeaderProps {
	isPopup: boolean;
	sourceWindowId: number | null;
	isAuditing: boolean;
	selectedSessionId: number | null;
	filteredItemsCount: number;
	copyStatus: boolean;
	onGoHome: () => void;
	onGenerateReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
	isPopup,
	sourceWindowId,
	isAuditing,
	selectedSessionId,
	filteredItemsCount,
	copyStatus,
	onGoHome,
	onGenerateReport
}) => {
	const handleReturnToSidePanel = () => {
		if (typeof chrome !== 'undefined' && chrome.sidePanel) {
			const targetWinId = sourceWindowId || chrome.windows.WINDOW_ID_CURRENT;
			(chrome as any).sidePanel.open({ windowId: targetWinId }, () => {
				window.close();
			});
		}
	};

	const handlePopOut = () => {
		if (typeof chrome !== 'undefined' && chrome.windows) {
			chrome.windows.getCurrent((currentWin) => {
				const winId = currentWin.id;
				chrome.windows.create({
					url: chrome.runtime.getURL(`sidepanel.html?mode=popup&windowId=${winId}`),
					type: 'popup',
					width: 750,
					height: 900
				});
				if (winId) chrome.runtime.sendMessage({ type: 'POP_OUT', windowId: winId });
			});
		}
	};

	return (
		<header className={styles.extHeader}>
			<div className={styles.brand}>
				<ActivitySquare size={18} className={styles.logo} />
				<div className={styles.titleInfo}>
					<h1>A11Y Assistant</h1>
					<span>{isPopup ? 'Window' : 'Extension'}</span>
				</div>
			</div>
			<div className={styles.headerActions}>
				{!isAuditing && (
					<>
						{selectedSessionId !== null && (
							<button
								onClick={onGoHome}
								title="홈으로 이동"
								aria-label="초기 화면으로 이동"
								className={styles.iconBtn}
							>
								<Home size={16} />
							</button>
						)}

						{filteredItemsCount > 0 && (isPopup ? (
							<button
								onClick={handleReturnToSidePanel}
								title="사이드 패널로 돌리기"
								aria-label="사이드 패널로 돌리기"
								className={styles.iconBtn}
							>
								<PanelRightClose size={16} />
							</button>
						) : (
							<button
								onClick={handlePopOut}
								title="창 분리하기"
								aria-label="창 분리하기"
								className={styles.iconBtn}
							>
								<ExternalLink size={16} />
							</button>
						))}

						{selectedSessionId !== null && (
							<button
								onClick={onGenerateReport}
								title="리포트 추출"
								aria-label="마크다운 리포트 추출"
								className={`${styles.iconBtn} ${copyStatus ? styles.success : ''}`}
							>
								<FileText size={16} />
							</button>
						)}
					</>
				)}
			</div>
		</header>
	);
};