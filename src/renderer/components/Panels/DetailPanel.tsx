import React from 'react';
import { X } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';
import { ABTItem } from '@/renderer/store/useStore';

interface DetailPanelProps {
	item: ABTItem;
	onClose: () => void;
	panelRef: React.RefObject<HTMLDivElement>;
}

	export const DetailPanel: React.FC<DetailPanelProps> = ({ item, onClose, panelRef }) => {
	return (
		<div className={styles.fullPropPanel} ref={panelRef} role="dialog" aria-modal="true" aria-label="요소 상세 정보">
			<header>
				<h3>상세 보기</h3>
				<button onClick={onClose} aria-label="닫기"><X size={18} /></button>
			</header>
			<div className={styles.propBody}>
				<section>
					<h4>Selector</h4>
					<code>{item.elementInfo.selector}</code>
				</section>
				<section>
					<h4>Context</h4>
					<p>{item.context.smartContext}</p>
				</section>
				<section>
					<h4>History</h4>
					{item.history.map((h: any, i: number) => (
						<div key={i} className={styles.histItem}>
							<span>{h.timestamp}</span>
							<strong>{h.status}</strong>
							<p>{h.comment}</p>
						</div>
					))}
				</section>
			</div>
		</div>
	);
};