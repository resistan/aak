import React from 'react';
import { X, PlusCircle } from 'lucide-react';
import styles from '@/renderer/styles/App.module.scss';
import { getContrastRatio } from '@/renderer/utils/color';

export interface ContrastToolProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	itemName: string;
	setItemName: (name: string) => void;
	fgColor: string;
	bgColor: string;
	pickColor: (type: 'fg' | 'bg') => void;
	onSave: () => void;
}

export const ContrastTool: React.FC<ContrastToolProps> = ({
	isOpen,
	setIsOpen,
	itemName,
	setItemName,
	fgColor,
	bgColor,
	pickColor,
	onSave
}) => {
	const handleClose = () => {
		setIsOpen(false);
		setItemName("");
	};

	return (
		<div className={styles.manualEntrySection}>
			{!isOpen ? (
				<button
					className={styles.addCaseBtn}
					onClick={() => setIsOpen(true)}
					title="수동 명도 대비 측정 항목 추가"
				>
					<PlusCircle size={14} /> 명도 대비 케이스 추가
				</button>
			) : (
				<div className={styles.manualEntryForm}>
					<div className={styles.formHeader}>
						<span>새 명도 대비 측정</span>
						<button onClick={handleClose} aria-label="닫기">
							<X size={14} />
						</button>
					</div>
					<input
						type="text"
						placeholder="항목 이름 (예: 메인 배너 텍스트)"
						value={itemName}
						onChange={e => setItemName(e.target.value)}
						className={styles.manualInput}
					/>
					<div className={styles.pickerRow}>
						<div className={styles.pickerBox}>
							<span>전경색</span>
							<button
								className={styles.colorBtn}
								style={{ backgroundColor: fgColor }}
								onClick={() => pickColor('fg')}
								title="전경색 추출"
							>
								{fgColor.toUpperCase()}
							</button>
						</div>
						<div className={styles.pickerBox}>
							<span>배경색</span>
							<button
								className={styles.colorBtn}
								style={{ backgroundColor: bgColor }}
								onClick={() => pickColor('bg')}
								title="배경색 추출"
							>
								{bgColor.toUpperCase()}
							</button>
						</div>
					</div>
					<div className={styles.formFooter}>
						<div className={styles.previewRatio}>
							대비 {getContrastRatio(fgColor, bgColor)}:1
						</div>
						<button className={styles.saveBtn} onClick={onSave}>
							저장
						</button>
					</div>
				</div>
			)}
		</div>
	);
};