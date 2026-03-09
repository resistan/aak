import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';
import { handleKeyDown } from '@/renderer/utils/keyhelper';
import { ABTItem } from '@/renderer/store/useStore';

interface ItemCardProps {
	item: ABTItem;
	isSelected: boolean;
	isJudging: boolean;
	onSelect: () => void;
	onLocate: () => void;
	// 빠른 판정
	onQuickJudge: (status: string) => void;
	// 상세 판정
	onStartJudging: () => void;
	tempComment: string;
	setTempComment: (comment: string) => void;
	selectedJudgeStatus: string | null;
	setSelectedJudgeStatus: (status: string | null) => void;
	onSaveComment: () => void;
	onCancelJudging: () => void;
	// 상세 패널
	onOpenDetail: () => void;
	// 수동 항목 삭제
	onDeleteManual?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
	item,
	isSelected,
	isJudging,
	onSelect,
	onLocate,
	onQuickJudge,
	onStartJudging,
	tempComment,
	setTempComment,
	selectedJudgeStatus,
	setSelectedJudgeStatus,
	onSaveComment,
	onCancelJudging,
	onOpenDetail,
	onDeleteManual
}) => {
	const isJudged = item.history.length > 1 || !!item.finalComment;

	const handleClick = () => {
		onSelect();
		onLocate();
	};

	return (
		<article
			onClick={handleClick}
			onKeyDown={(e) => handleKeyDown(e, handleClick)}
			tabIndex={0}
			role="button"
			aria-selected={isSelected}
			className={`${styles.miniCard} ${isSelected ? styles.selected : ''} ${isJudged ? styles.judged : ''}`}
		>
			<div className={styles.cardLayout}>
				{/* 썸네일 */}
				{!isJudged && item.elementInfo.src && item.elementInfo.src !== 'N/A' && item.guideline_id !== '1.2.1' && (
					<div className={styles.thumbBox}>
						<img src={item.elementInfo.src} alt="미리보기" />
					</div>
				)}

				<div className={styles.cardMain}>
					{/* 상단: 상태 + 빠른 판정 */}
					<div className={styles.cardTop}>
						<div className={`${styles.miniStatus} ${styles[item.currentStatus.replace(' ', '_')]}`}>
							{item.currentStatus}
						</div>
						{item.elementInfo.selector !== 'outline' && (
							<div className={styles.quickJudge}>
								<button
									className={styles.qPass}
									onClick={(e) => { e.stopPropagation(); onQuickJudge('적절'); }}
									title="적절로 판정"
									aria-label="적절로 판정"
								>
									적절
								</button>
								<button
									className={styles.qFail}
									onClick={(e) => { e.stopPropagation(); onQuickJudge('오류'); }}
									title="오류로 판정"
									aria-label="오류로 판정"
								>
									오류
								</button>
							</div>
						)}
					</div>

					{/* 메시지 */}
					<h3 className={isJudged ? styles.judgedTitle : ''}>{item.result?.message}</h3>

					{/* 지침별 추가 정보 */}
					{!isJudged && (
						<>
							{item.guideline_id === '1.1.1' && (
								<div className={styles.markupSnippet}>
									&lt;{item.elementInfo.tagName.toLowerCase()} <span className={styles.attrName}>{(item.elementInfo as any).sourceAttr || 'alt'}</span>=<span
className={styles.attrVal}>"{item.elementInfo.alt || ''}"</span> ... /&gt;
								</div>
							)}
							{item.guideline_id === '1.4.3' && (item.context as any).color && (
								<div
									className={styles.contrastPreview}
									style={{
										color: (item.context as any).color,
										backgroundColor: (item.context as any).backgroundColor
									}}
								>
									Aa 가나다 (Text: {(item.context as any).color} / BG: {(item.context as any).backgroundColor})
								</div>
							)}
						</>
					)}

					{/* 셀렉터 */}
					{item.elementInfo.selector === 'outline' ? (
						<span className={styles.outlineLabel}>Heading Outline</span>
					) : (
						<code className={styles.selector}>{item.elementInfo.selector}</code>
					)}
				</div>
			</div>

			{/* 선택 시 상세 정보 */}
			{isSelected && (
				<div className={styles.miniDetail}>
					<div className={styles.smartContextView}>
						{item.guideline_id === '1.1.1' ? (
							<>
								<span>...{item.context.smartContext.split(item.elementInfo.alt || "")[0]}</span>
								<span className={styles.highlight}>
									[{((item.elementInfo as any).sourceAttr || 'alt')}="{item.elementInfo.alt || ''}"]
								</span>
								<span>{item.context.smartContext.split(item.elementInfo.alt || "")[1]}...</span>
							</>
						) : item.guideline_id === '2.4.2' && item.elementInfo.selector === 'outline' ? (
							<div className={styles.outlineView}>
								{(item.context as any).outline?.map((h: any, idx: number) => (
									<div key={idx} className={`${styles.outlineItem} ${styles['h' + h.level]}`}>
										<span className={styles.level}>H{h.level}</span>
										<span className={styles.text}>{h.text || '(텍스트 없음)'}</span>
									</div>
								))}
							</div>
						) : (
							<span>"{item.context.smartContext}"</span>
						)}
					</div>

					{item.currentStatus !== '참고자료' && (
						<div className={styles.miniActions}>
							<button
								onClick={(e) => { e.stopPropagation(); onStartJudging(); }}
								aria-label="전문가 판정 및 소견 기록"
							>
								<Edit3 size={12} /> {item.finalComment ? '판정 수정' : '전문가 판정'}
							</button>
							<button
								onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
								aria-label="상세 정보 보기"
							>
								상세
							</button>
							{item.elementInfo.tagName === 'MANUAL' && onDeleteManual && (
								<button
									className={styles.deleteManualBtn}
									onClick={(e) => { e.stopPropagation(); onDeleteManual(); }}
									title="항목 삭제"
									aria-label="수동 항목 삭제"
								>
									<Trash2 size={12} />
								</button>
							)}
						</div>
					)}
				</div>
			)}

			{/* 판정 폼 */}
			{isJudging && (
				<div className={styles.miniJudge} onClick={e => e.stopPropagation()}>
					<textarea
						placeholder="평가 소견을 입력하세요..."
						value={tempComment}
						onChange={e => setTempComment(e.target.value)}
						aria-label="전문가 소견 입력"
						style={{ boxSizing: 'border-box' }}
					/>
					<div className={styles.judgeBtns}>
						<div className={styles.judgeStatusSelector}>
							<button
								className={`${styles.jsBtn} ${styles.pass} ${selectedJudgeStatus === '적절' ? styles.active : ''}`}
								onClick={() => setSelectedJudgeStatus('적절')}
							>
								적절
							</button>
							<button
								className={`${styles.jsBtn} ${styles.fail} ${selectedJudgeStatus === '오류' ? styles.active : ''}`}
								onClick={() => setSelectedJudgeStatus('오류')}
							>
								오류
							</button>
						</div>
						<div className={styles.actionBtns}>
							<button onClick={onCancelJudging} className={styles.cBtn}>취소</button>
							<button
								onClick={onSaveComment}
								className={styles.sBtn}
								disabled={!selectedJudgeStatus && item.currentStatus === '검토 필요'}
							>
								평가 저장
							</button>
						</div>
					</div>
				</div>
			)}
		</article>
	);
};