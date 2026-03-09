import React from 'react';
import { X } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';

export interface ManualEntryFormProps {
	isOpen: boolean;
	onClose: () => void;
	itemName: string;
	setItemName: (name: string) => void;
	comment: string;
	setComment: (comment: string) => void;
	selectedStatus: string | null;
	setSelectedStatus: (status: string | null) => void;
	onSave: () => void;
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
	isOpen,
	onClose,
	itemName,
	setItemName,
	comment,
	setComment,
	selectedStatus,
	setSelectedStatus,
	onSave
}) => {
	if (!isOpen) return null;

	const handleClose = () => {
		onClose();
		setItemName("");
		setComment("");
		setSelectedStatus(null);
	};

	return (
		<div className={styles.manualEntrySection}>
			<div className={styles.manualEntryForm}>
				<div className={styles.formHeader}>
					<span>새 검토 의견 추가</span>
					<button onClick={handleClose} aria-label="닫기">
						<X size={14} />
					</button>
				</div>
				<input
					type="text"
					placeholder="항목 이름 (예: 누락된 팝업 타이틀)"
					value={itemName}
					onChange={e => setItemName(e.target.value)}
					className={styles.manualInput}
				/>
				<textarea
					placeholder="평가 소견을 입력하세요..."
					value={comment}
					onChange={e => setComment(e.target.value)}
					aria-label="전문가 소견 입력"
					style={{
						boxSizing: 'border-box',
						width: '100%',
						background: 'var(--bg-primary)',
						border: '1px solid var(--border-color)',
						borderRadius: '4px',
						padding: '8px',
						minHeight: '60px',
						marginTop: '8px',
						fontSize: '12px',
						color: 'var(--text-color)'
					}}
				/>
				<div className={styles.formFooter}>
					<div className={styles.judgeStatusSelector}>
						<button
							className={`${styles.jsBtn} ${styles.pass} ${selectedStatus === '적절' ? styles.active : ''}`}
							onClick={() => setSelectedStatus('적절')}
						>
							적절
						</button>
						<button
							className={`${styles.jsBtn} ${styles.fail} ${selectedStatus === '오류' ? styles.active : ''}`}
							onClick={() => setSelectedStatus('오류')}
						>
							오류
						</button>
					</div>
					<button
						className={styles.saveBtn}
						onClick={onSave}
						disabled={!selectedStatus || !itemName.trim()}
					>
						평가 저장
					</button>
				</div>
			</div>
		</div>
	);
};