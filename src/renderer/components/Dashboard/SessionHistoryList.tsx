import React from 'react';
import { Trash2, ChevronRight } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';
import { formatRelativeTime } from '@/renderer/utils/format';
import { handleKeyDown } from '@/renderer/utils/keyhelper';

interface Session {
	scanId: number;
	timestamp: string;
	pageTitle: string;
}

interface SessionHistoryListProps {
	sessions: Session[];
	onSelectSession: (scanId: number) => void;
	onDeleteSession: (e: React.MouseEvent | React.KeyboardEvent, scanId: number) => void;
}

export const SessionHistoryList: React.FC<SessionHistoryListProps> = ({
	sessions,
	onSelectSession,
	onDeleteSession
}) => {
	return (
		<div className={styles.historyList}>
			{sessions.map((s, idx) => (
				<div
					key={s.scanId}
					className={styles.historyItem}
					onClick={() => onSelectSession(s.scanId)}
					onKeyDown={(e) => handleKeyDown(e, () => onSelectSession(s.scanId))}
					tabIndex={0}
					role="button"
					aria-label={`${s.pageTitle}, ${formatRelativeTime(s.timestamp)} 진단 기록`}
				>
					<div className={styles.historyInfo}>
						<div className={styles.historyTimeRow}>
							<span className={styles.historyBadge}>#{sessions.length - idx}</span>
							<span className={styles.historyRelative}>{formatRelativeTime(s.timestamp)}</span>
							<span className={styles.historyAbsolute}>
								({new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })})
							</span>
						</div>
						<span className={styles.historyTitle}>{s.pageTitle}</span>
					</div>
					<div className={styles.historyActions}>
						<button
							className={styles.deleteBtn}
							onClick={(e) => onDeleteSession(e, s.scanId)}
							onKeyDown={(e) => {
								e.stopPropagation();
								handleKeyDown(e, () => onDeleteSession(e, s.scanId));
							}}
							title="삭제"
							aria-label="진단 기록 삭제"
						>
							<Trash2 size={14} />
						</button>
						<ChevronRight size={14} />
					</div>
				</div>
			))}
		</div>
	);
};