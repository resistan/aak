import React from 'react';
import { Clock } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';

interface Session {
	scanId: number;
	timestamp: string;
	pageTitle: string;
}

interface SessionSelectorProps {
	selectedSessionId: number | null;
	setSelectedSessionId: (id: number) => void;
	sessions: Session[];
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
	selectedSessionId,
	setSelectedSessionId,
	sessions
}) => {
	return (
		<div className={styles.sessionSelector}>
			<Clock size={12} />
			<select
				value={selectedSessionId || ""}
				onChange={(e) => setSelectedSessionId(Number(e.target.value))}
				aria-label="진단 세션 선택"
			>
				{sessions.map(s => (
					<option key={s.scanId} value={s.scanId}>
						{new Date(s.timestamp).toLocaleString()} ({s.pageTitle})
					</option>
				))}
			</select>
		</div>
	);
};