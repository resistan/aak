import React from 'react';
import { X } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';

interface GuidelineData {
	name?: string;
	compliance_criteria?: string;
	criteria?: string;
	error_types?: Record<string, string>;
	detailed_descriptions?: string[];
}

interface GuidelineInfoPanelProps {
	guidelineId: string;
	data: GuidelineData;
	onClose: () => void;
	panelRef: React.RefObject<HTMLDivElement>;
}

export const GuidelineInfoPanel: React.FC<GuidelineInfoPanelProps> = ({
	guidelineId,
	data,
	onClose,
	panelRef
}) => {
	return (
		<div
			className={styles.fullPropPanel}
			ref={panelRef}
			role="dialog"
			aria-modal="true"
			aria-label={`${guidelineId} 지침 상세 정보`}
		>
			<header>
				<h3>{guidelineId} {data.name || '지침 정보'}</h3>
				<button onClick={onClose} aria-label="닫기"><X size={18} /></button>
			</header>
			<div className={styles.propBody}>
				<section className={styles.guidelineSection}>
					<h4>준수 기준</h4>
					<p>{data.compliance_criteria || data.criteria || '내용 없음'}</p>
				</section>

				{data.error_types && typeof data.error_types === 'object' && (
					<section className={styles.guidelineSection}>
						<h4>오류 유형</h4>
						<ul className={styles.errorTypeList}>
							{Object.entries(data.error_types).map(([code, desc]) => (
								<li key={code}>
									<strong>{code}</strong>
									<span>{String(desc)}</span>
								</li>
							))}
						</ul>
					</section>
				)}

				{Array.isArray(data.detailed_descriptions) && data.detailed_descriptions.length > 0 && (
					<section className={styles.guidelineSection}>
						<h4>세부 설명</h4>
						<ul className={styles.detailList}>
							{data.detailed_descriptions.map((desc: string, i: number) => (
								<li key={i}>{desc}</li>
							))}
						</ul>
					</section>
				)}
			</div>
		</div>
	);
};