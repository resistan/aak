import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const kwcagHierarchy = [
  {
    id: "1",
    title: "1. 인식의 용이성 (Perceivable)",
    items: [
      { id: "1.1.1", label: "적절한 대체 텍스트 제공" },
      { id: "1.2.1", label: "자막 제공" },
      { id: "1.3.1", label: "표의 구성" },
      { id: "1.3.2", label: "콘텐츠의 선형구조" },
      { id: "1.3.3", label: "명확한 지시사항 제공" },
      { id: "1.4.1", label: "색에 무관한 콘텐츠 인식" },
      { id: "1.4.2", label: "자동 재생 금지" },
      { id: "1.4.3", label: "텍스트 콘텐츠의 명도 대비" },
      { id: "1.4.4", label: "콘텐츠 간의 구분" }
    ]
  },
  {
    id: "2",
    title: "2. 운용의 용이성 (Operable)",
    items: [
      { id: "2.1.1", label: "키보드 사용 보장" },
      { id: "2.1.2", label: "초점 이동과 표시" },
      { id: "2.1.3", label: "조작 가능" },
      { id: "2.1.4", label: "문자 단축키" },
      { id: "2.2.1", label: "응답시간 조절" },
      { id: "2.2.2", label: "정지 기능 제공" },
      { id: "2.3.1", label: "깜빡임과 번쩍임 사용 제한" },
      { id: "2.4.1", label: "반복 영역 건너뛰기" },
      { id: "2.4.2", label: "제목 제공" },
      { id: "2.4.3", label: "적절한 링크 텍스트" },
      { id: "2.4.4", label: "고정된 참조 위치 정보" },
      { id: "2.5.1", label: "단일 포인터 입력 지원" },
      { id: "2.5.2", label: "포인터 입력 취소" },
      { id: "2.5.3", label: "레이블과 네임" },
      { id: "2.5.4", label: "동작기반 작동" }
    ]
  },
  {
    id: "3",
    title: "3. 이해의 용이성 (Understandable)",
    items: [
      { id: "3.1.1", label: "기본 언어 표시" },
      { id: "3.2.1", label: "사용자 요구에 따른 실행" },
      { id: "3.2.2", label: "찾기 쉬운 도움 정보" },
      { id: "3.3.1", label: "오류 정정" },
      { id: "3.3.2", label: "레이블 제공" },
      { id: "3.3.3", label: "접근 가능한 인증" },
      { id: "3.3.4", label: "반복 입력 정보" }
    ]
  },
  {
    id: "4",
    title: "4. 견고성 (Robust)",
    items: [
      { id: "4.1.1", label: "마크업 오류 방지" },
      { id: "4.2.1", label: "웹 애플리케이션 접근성 준수" }
    ]
  }
];

export interface ABTItem {
  id: string;
  guideline_id: string;
  pageInfo?: {
    url: string;
    pageTitle: string;
    timestamp: string;
    scanId: number;
  };
  elementInfo: {
    selector: string;
    tagName: string;
    src?: string;
    alt?: string;
    sourceAttr?: string;
    openingTag?: string;
  };
  context: {
    smartContext: string;
    isFunctional?: boolean;
    parentTag?: string | null;
    parentText?: string;
    isDecorative?: boolean;
    whiteSpace?: string;
    color?: string;
    backgroundColor?: string;
  };
  result: {
    status: string;
    message: string;
    rules: string[];
    link?: string;
  };
  currentStatus: string;
  finalComment: string;
  history: {
    timestamp: string;
    status: string;
    comment: string;
  }[];
  imageInfo?: {
    dimensions: string;
    isDecorative: boolean;
    fileExtension: string;
  };
  manualScore?: number;
}

interface ABTStore {
  items: ABTItem[];
  projectName: string;
  addReport: (report: any) => void;
  addReportsBatch: (reports: any[]) => void;
  setItems: (items: ABTItem[]) => void;
  updateItemStatus: (id: string, status: string, comment?: string) => void;
  removeSession: (url: string) => void;
  removeSessionById: (scanId: number) => void;
  clearItems: () => void;
  setProjectName: (name: string) => void;
  setGuidelineScore: (scanId: number, gid: string, score: number) => void;
}

// Helper to generate a unique key for duplicate detection
const getItemKey = (item: any) => {
  const scanId = item.pageInfo?.scanId || 0;
  const gid = item.guideline_id || "";
  const selector = item.elementInfo?.selector || "";
  // result.status와 message가 다르면 다른 이슈로 간주해야 함
  const status = item.result?.status || "";
  const message = item.result?.message || "";
  return `${scanId}|${gid}|${selector}|${status}|${message.substring(0, 50)}`;
};

export const useStore = create<ABTStore>()(
  persist(
    (set) => ({
      items: [],
      projectName: 'Default Project',
      
      addReport: (report) => {
        if (!report) return;
        // Use the batch method for consistency and performance
        (useStore.getState() as any).addReportsBatch([report]);
      },

      addReportsBatch: (reports) => set((state) => {
        if (!reports || reports.length === 0) return state;

        const existingKeys = new Set(state.items.map(getItemKey));
        const newItemsToAdd: ABTItem[] = [];

        reports.forEach(report => {
          const newItem: ABTItem = {
            ...report,
            id: report.id || Math.random().toString(36).substr(2, 9),
            pageInfo: report.pageInfo || {
              url: "Unknown URL",
              pageTitle: "Unknown Page",
              timestamp: new Date().toISOString(),
              scanId: 0
            },
            currentStatus: report.result?.status || "검토 필요",
            finalComment: report.finalComment || "",
            history: report.history || [{
              timestamp: new Date().toLocaleTimeString(),
              status: report.result?.status || "탐지",
              comment: report.result?.message || "진단 데이터 수신"
            }]
          };

          const key = getItemKey(newItem);
          if (!existingKeys.has(key)) {
            newItemsToAdd.push(newItem);
            existingKeys.add(key); // Prevent duplicates within the same batch
          }
        });

        if (newItemsToAdd.length === 0) return state;

        return { items: [...state.items, ...newItemsToAdd] };
      }),

      setItems: (items) => set({ items }),
      
      updateItemStatus: (id, status, comment) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id ? { 
            ...item, 
            currentStatus: status, 
            finalComment: comment !== undefined ? comment : item.finalComment,
            history: [...item.history, {
              timestamp: new Date().toLocaleTimeString(),
              status: status,
              comment: comment || "상태 업데이트"
            }]
          } : item
        )
      })),

      removeSession: (url) => set((state) => ({
        items: state.items.filter((item) => item.pageInfo?.url !== url)
      })),

      removeSessionById: (scanId) => set((state) => ({
        items: state.items.filter((item) => item.pageInfo?.scanId !== scanId)
      })),
      
      clearItems: () => set({ items: [] }),
      setProjectName: (projectName) => set({ projectName }),
      
      setGuidelineScore: (scanId, gid, score) => set((state) => ({
        items: state.items.map(item => 
          (item.pageInfo?.scanId === scanId && item.guideline_id === gid) 
            ? { ...item, manualScore: score } 
            : item
        )
      })),
    }),
    {
      name: 'abt-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name): Promise<string | null> => {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const res = await chrome.storage.local.get(name);
            return (res[name] as string) || null;
          }
          return localStorage.getItem(name);
        },
        setItem: (name, value) => {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ [name]: value });
          } else {
            localStorage.setItem(name, value);
          }
        },
        removeItem: (name) => {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove(name);
          } else {
            localStorage.removeItem(name);
          }
        },
      })),
    }
  )
);
