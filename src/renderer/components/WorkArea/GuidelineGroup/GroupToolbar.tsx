import React from 'react';
import { ManualEntryForm } from './tools/ManualEntryForm';
import { AltTextTool } from './tools/AltTextTool';
import { ContrastTool } from './tools/ContrastTool';
import { LinearizeTool } from './tools/LinearizeTool';
import { FocusTrackerTool } from './tools/FocusTrackerTool';

interface GroupToolbarProps {
	gid: string;
	// 수동 의견 추가
	manualEntryGid: string | null;
	onCloseManualEntry: () => void;
	manualItemName: string;
	setManualItemName: (name: string) => void;
	manualComment: string;
	setManualComment: (comment: string) => void;
	selectedJudgeStatus: string | null;
	setSelectedJudgeStatus: (status: string | null) => void;
	onSaveManualOpinion: () => void;
	// 1.1.1 대체텍스트
	isImageAltView: boolean;
	toggleImageAlt: () => void;
	// 1.4.3 명도대비
	isContrastOpen: boolean;
	setIsContrastOpen: (open: boolean) => void;
	contrastItemName: string;
	setContrastItemName: (name: string) => void;
	fgColor: string;
	bgColor: string;
	pickColor: (type: 'fg' | 'bg') => void;
	onSaveContrast: () => void;
	// 1.3.2 선형화
	isLinearView: boolean;
	toggleCSS: () => void;
	// 2.1.2 초점 순서
	isFocusTracking: boolean;
	toggleFocusTracking: () => void;
	resetFocusPath: () => void;
}

export const GroupToolbar: React.FC<GroupToolbarProps> = ({
	gid,
	manualEntryGid,
	onCloseManualEntry,
	manualItemName,
	setManualItemName,
	manualComment,
	setManualComment,
	selectedJudgeStatus,
	setSelectedJudgeStatus,
	onSaveManualOpinion,
	isImageAltView,
	toggleImageAlt,
	isContrastOpen,
	setIsContrastOpen,
	contrastItemName,
	setContrastItemName,
	fgColor,
	bgColor,
	pickColor,
	onSaveContrast,
	isLinearView,
	toggleCSS,
	isFocusTracking,
	toggleFocusTracking,
	resetFocusPath
}) => {
	return (
		<>
			<ManualEntryForm
				isOpen={manualEntryGid === gid}
				onClose={onCloseManualEntry}
				itemName={manualItemName}
				setItemName={setManualItemName}
				comment={manualComment}
				setComment={setManualComment}
				selectedStatus={selectedJudgeStatus}
				setSelectedStatus={setSelectedJudgeStatus}
				onSave={onSaveManualOpinion}
			/>

			{gid === '1.1.1' && (
				<AltTextTool
					isActive={isImageAltView}
					onToggle={toggleImageAlt}
				/>
			)}

			{gid === '1.4.3' && (
				<ContrastTool
					isOpen={isContrastOpen}
					setIsOpen={setIsContrastOpen}
					itemName={contrastItemName}
					setItemName={setContrastItemName}
					fgColor={fgColor}
					bgColor={bgColor}
					pickColor={pickColor}
					onSave={onSaveContrast}
				/>
			)}

			{gid === '1.3.2' && (
				<LinearizeTool
					isActive={isLinearView}
					onToggle={toggleCSS}
				/>
			)}

			{gid === '2.1.2' && (
				<FocusTrackerTool
					isActive={isFocusTracking}
					onToggle={toggleFocusTracking}
					onReset={resetFocusPath}
				/>
			)}
		</>
	);
};