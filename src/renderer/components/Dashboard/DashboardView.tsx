import React from 'react';
import { Scan, AlertCircle, Trash2 } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';
import { SessionHistoryList } from './SessionHistoryList';

interface Session {
	scanId: number;
	timestamp: string;
	pageTitle: string;
}

interface TabInfo {
	title: string;
	url: string;
}

interface DashboardViewProps {
	currentTabInfo: TabInfo | null;
	isAuditing: boolean;
	sessions: Session[];
	onStartAudit: () => void;
	onSelectSession: (scanId: number) => void;
	onDeleteSession: (e: React.MouseEvent | React.KeyboardEvent, scanId: number) => void;
	onClearAll: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
	currentTabInfo,
	isAuditing,
	sessions,
	onStartAudit,
	onSelectSession,
	onDeleteSession,
	onClearAll
}) => {
	return (
		<div className={styles.dashboard}>
			<div className={styles.hero}>
				<div className={styles.heroIcon}>
					<Scan size={48} />
				</div>
				<h2>Ready to Audit</h2>
				<p>현재 페이지의 접근성을 진단합니다.</p>

				{currentTabInfo && (
					<div className={styles.pagePreview}>
						<span className={styles.pageTitle}>{currentTabInfo.title}</span>
						<span className={styles.pageUrl}>{currentTabInfo.url}</span>
					</div>
				)}

				<div className={styles.refreshNotice}>
					<AlertCircle size={14} />
					<span>정확한 진단을 위해 페이지를 <strong>새로고침</strong>한 후 시작해 주세요.</span>
				</div>

				<button
					className={styles.startBtn}
					onClick={onStartAudit}
					disabled={isAuditing}
					aria-label="진단 시작"
				>
					{isAuditing ? '진단 중...' : '진단 시작 (Start Audit)'}
				</button>

				{sessions.length > 0 && (
					<div className={styles.historyOption}>
						<div className={styles.historyHeader}>
							<p>과거 진단 기록 ({sessions.length}건)</p>
							<button
								onClick={onClearAll}
								title="전체 삭제"
								aria-label="모든 진단 기록 삭제"
								className={styles.deleteAllBtn}
							>
								<Trash2 size={14} />
								전체 삭제
							</button>
						</div>
						<SessionHistoryList
							sessions={sessions}
							onSelectSession={onSelectSession}
							onDeleteSession={onDeleteSession}
						/>
					</div>
				)}
			</div>
		</div>
	);
};