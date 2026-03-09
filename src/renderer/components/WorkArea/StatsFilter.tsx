import React from 'react';
import styles from '@/renderer/styles/App.module.scss';

interface ItemStats {
	total: number;
	error: number;
	review: number;
	pass: number;
}

interface StatsFilterProps {
	statusFilter: string;
	setStatusFilter: (filter: string) => void;
	itemStats: ItemStats;
}

export const StatsFilter: React.FC<StatsFilterProps> = ({
	statusFilter,
	setStatusFilter,
	itemStats
}) => {
	return (
		<div className={styles.statsSummary} role="tablist">
			<button
				className={`${styles.statLine} ${statusFilter === 'ALL' ? styles.active : ''}`}
				onClick={() => setStatusFilter('ALL')}
				role="tab"
				aria-selected={statusFilter === 'ALL'}
			>
				전체 <span>{itemStats.total}</span>
			</button>
			<button
				className={`${styles.statLine} ${styles.fail} ${statusFilter === '오류' ? styles.active : ''}`}
				onClick={() => setStatusFilter('오류')}
				role="tab"
				aria-selected={statusFilter === '오류'}
			>
				오류 <span>{itemStats.error}</span>
			</button>
			<button
				className={`${styles.statLine} ${styles.review} ${statusFilter === '검토 필요' ? styles.active : ''}`}
				onClick={() => setStatusFilter('검토 필요')}
				role="tab"
				aria-selected={statusFilter === '검토 필요'}
			>
				검토 필요 <span>{itemStats.review}</span>
			</button>
			<button
				className={`${styles.statLine} ${styles.pass} ${statusFilter === '적절' ? styles.active : ''}`}
				onClick={() => setStatusFilter('적절')}
				role="tab"
				aria-selected={statusFilter === '적절'}
			>
				검토 완료 <span>{itemStats.pass}</span>
			</button>
		</div>
	);
};