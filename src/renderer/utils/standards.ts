import rawStandards from '@/engine/kwcag-standards.json';
import { kwcagHierarchy } from '@/renderer/store/useStore';

	const getStandardItems = () => {
	if (!rawStandards) return null;
	if ('items' in rawStandards) return (rawStandards as any).items;
	if ('default' in rawStandards && (rawStandards as any).default.items)
		return (rawStandards as any).default.items;
	return null;
};

export const standardItemsDict = getStandardItems();

export const guidelineNames: Record<string, string> = {
	"ALL": "전체 지침"
};

export const getGuidelineName = (id: string): string => {
	for (const group of kwcagHierarchy) {
		const found = group.items.find(item => item.id === id);
		if (found) return found.label;
	}
	return id;
};
