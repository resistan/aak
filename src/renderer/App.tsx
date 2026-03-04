import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shield, Info, Search, Edit3, Clock, ChevronRight, ChevronDown, ChevronLeft, Filter, FileText, CheckCircle2, AlertCircle, Trash2, Folder, FolderOpen, FileCode2, RotateCcw, X, Image as ImageIcon, PlusCircle, ExternalLink, PanelRightClose, LayoutList, Pipette, MousePointer2, ListOrdered } from 'lucide-react';
import styles from './styles/App.module.scss';
import { useStore, kwcagHierarchy, ABTItem } from './store/useStore';
import rawStandards from '../engine/kwcag-standards.json';
import { getContrastRatio } from './utils/color';

// Vite 번들링 결과물(default 래핑)을 안정적으로 파싱하는 글로벌 함수
const getStandardItems = () => {
  if (!rawStandards) return null;
  if ('items' in rawStandards) return (rawStandards as any).items;
  if ('default' in rawStandards && (rawStandards as any).default.items) return (rawStandards as any).default.items;
  return null;
};
const standardItemsDict = getStandardItems();

const guidelineNames: Record<string, string> = {
  "ALL": "전체 지침"
};

const normalizeUrl = (u: string) => u.replace(/\/$/, "").split('?')[0].split('#')[0];

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));

  if (diffInMins < 1) return '방금 전';
  if (diffInMins < 60) return `${diffInMins}분 전`;
  
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (isToday) return `오늘 ${timeStr}`;
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `어제 ${timeStr}`;
  
  return date.toLocaleDateString() + ' ' + timeStr;
};

const App = () => {
  const { items, setItems, addReport, addReportsBatch, updateItemStatus, setGuidelineScore, removeSession, removeSessionById, clearItems, projectName } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [judgingId, setJudgingId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [copyStatus, setCopyStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isPropPanelOpen, setIsPropPanelOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [currentTabInfo, setCurrentTabInfo] = useState<{url: string, title: string} | null>(null);
  const [isManualDashboard, setIsManualDashboard] = useState(false);
  const [lastTriggeredScanTime, setLastTriggeredScanTime] = useState<number>(0);
  const [isAuditing, setIsAuditing] = useState(false);
  const [currentGuideline, setCurrentGuideline] = useState<string | null>(null);
  const [selectedGuidelineInfo, setSelectedGuidelineInfo] = useState<string | null>(null);
  const [isLinearView, setIsLinearView] = useState(false);
  const [isImageAltView, setIsImageAltView] = useState(false);
  const [isContrastOpen, setIsContrastOpen] = useState(false);
  const [isFocusTracking, setIsFocusTracking] = useState(false);
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#000000");
  const [manualContrastName, setManualContrastName] = useState("");

  const propPanelRef = useRef<HTMLDivElement>(null);
  const guidelineInfoRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const collapsedByUser = useRef<Set<string>>(new Set());
  const isPopup = useMemo(() => new URLSearchParams(window.location.search).get('mode') === 'popup', []);
  const sourceWindowId = useMemo(() => {
    const id = new URLSearchParams(window.location.search).get('windowId');
    return id ? parseInt(id) : null;
  }, []);

  const toggleCSS = () => {
    const nextState = !isLinearView;
    setIsLinearView(nextState);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ 
        type: 'TOGGLE_CSS', 
        enable: nextState,
        windowId: isPopup ? sourceWindowId : null
      });
    }
  };

  const toggleImageAlt = () => {
    const nextState = !isImageAltView;
    setIsImageAltView(nextState);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ 
        type: 'TOGGLE_IMAGE_ALT', 
        enable: nextState,
        windowId: isPopup ? sourceWindowId : null
      });
    }
  };
  const pickColor = async (type: 'fg' | 'bg') => {
    if (!window.EyeDropper) {
      alert("현재 브라우저에서 EyeDropper API를 지원하지 않습니다.");
      return;
    }
    try {
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      if (type === 'fg') setFgColor(result.sRGBHex);
      else setBgColor(result.sRGBHex);
    } catch (e) {
      console.log("EyeDropper canceled or failed");
    }
  };
  const handleAddManualContrast = () => {
    if (!selectedSessionId) return;
    const session = sessions.find(s => s.scanId === selectedSessionId);
    if (!session) return;

    const ratio = getContrastRatio(fgColor, bgColor);
    const status = ratio >= 4.5 ? "적절" : "수정 권고";
    const message = `[수동 추가] '${manualContrastName || '명도 대비 케이스'}'의 대비는 ${ratio}:1 입니다.`;

    const manualReport = {
      guideline_id: "1.4.3",
      elementInfo: { tagName: "MANUAL", selector: "manual-contrast" },
      context: { 
        smartContext: manualContrastName || "수동 측정 항목", 
        color: fgColor, 
        backgroundColor: bgColor 
      },
      result: { status, message, rules: ["Manual Contrast Check"] },
      pageInfo: { ...session }
    };

    addReport(manualReport);
    setManualContrastName("");
    setIsContrastOpen(false);
  };
  const deleteManualItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("이 수동 추가 항목을 삭제하시겠습니까?")) {
      setItems(items.filter(i => i.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  // Accessibility helper for Enter/Space interaction
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  const toggleFocusTracking = () => {
    const nextState = !isFocusTracking;
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ 
        type: 'TOGGLE_FOCUS_TRACKING', 
        enable: nextState,
        windowId: isPopup ? sourceWindowId : null
      }, (res) => {
        if (res?.status === 'success') setIsFocusTracking(nextState);
      });
    }
  };

  const resetFocusPath = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ 
        type: 'RESET_FOCUS_TRACKING',
        windowId: isPopup ? sourceWindowId : null
      });
    }
  };

  // Global Keyboard Handlers (ESC to close panels)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPropPanelOpen(false);
        setSelectedGuidelineInfo(null);
        setIsContrastOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Focus Restore logic
  useEffect(() => {
    if (!isPropPanelOpen && !selectedGuidelineInfo && lastFocusedRef.current) {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
    }
  }, [isPropPanelOpen, selectedGuidelineInfo]);

  // Focus Traps
  useEffect(() => {
    if (isPropPanelOpen && propPanelRef.current) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      const focusableElements = propPanelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isPropPanelOpen]);

  useEffect(() => {
    if (selectedGuidelineInfo && guidelineInfoRef.current) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      const focusableElements = guidelineInfoRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [selectedGuidelineInfo]);

  // Sync state between windows
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes['abt-storage']) {
        (useStore.persist as any).rehydrate();
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  // Track active tab
  useEffect(() => {
    const updateCurrentTab = () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const queryOptions = (isPopup && sourceWindowId) 
          ? { active: true, windowId: sourceWindowId } 
          : { active: true, lastFocusedWindow: true };

        chrome.tabs.query(queryOptions, (tabs) => {
          const validTab = tabs.find(t => t.url && !t.url.startsWith('chrome-extension://')) || tabs[0];
          if (validTab) {
            setCurrentTabInfo({
              url: validTab.url || "",
              title: validTab.title || ""
            });
          }
        });
      }
    };

    updateCurrentTab();
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabListener = (tabId: number, changeInfo: any, tab: chrome.tabs.Tab) => {
        if (changeInfo.status === 'complete' && tab.active) updateCurrentTab();
      };
      const activeListener = () => updateCurrentTab();
      chrome.tabs.onUpdated.addListener(tabListener);
      chrome.tabs.onActivated.addListener(activeListener);
      return () => {
        chrome.tabs.onUpdated.removeListener(tabListener);
        chrome.tabs.onActivated.removeListener(activeListener);
      };
    }
  }, [isPopup, sourceWindowId]);

  const handleStartAudit = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      setIsAuditing(true);
      setLastTriggeredScanTime(Date.now());
      
      if (chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'RUN_AUDIT' }, (response) => {
              if (chrome.runtime.lastError) {
                chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id },
                  files: ['engine/abt-engine.js']
                }).then(() => {
                  setTimeout(() => chrome.tabs.sendMessage(tabs[0].id, { type: 'RUN_AUDIT' }), 200);
                });
              }
            });
          }
        });
      } else {
        chrome.runtime.sendMessage({ type: 'RUN_AUDIT', windowId: isPopup ? sourceWindowId : null });
      }
      setTimeout(() => setIsAuditing(false), 10000);
    }
  };

  const sessions = useMemo(() => {
    const map = new Map<number, any>();
    const sortedItems = [...items].sort((a, b) => (b.pageInfo?.scanId || 0) - (a.pageInfo?.scanId || 0));
    
    sortedItems.forEach(item => {
      const pInfo = item.pageInfo;
      if (!pInfo || !pInfo.scanId) return;
      if (!map.has(pInfo.scanId)) {
        map.set(pInfo.scanId, {
          ...pInfo,
          pageTitle: pInfo.pageTitle || "Untitled Page"
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.scanId - a.scanId);
  }, [items]);

  useEffect(() => {
    if (!currentTabInfo?.url) return;
    const latestSessionForUrl = sessions.find(s => normalizeUrl(s.url) === normalizeUrl(currentTabInfo.url));
    if (latestSessionForUrl) {
      const sessionTime = new Date(latestSessionForUrl.timestamp).getTime();
      if (!selectedSessionId && !isManualDashboard && lastTriggeredScanTime === 0) {
        setSelectedSessionId(latestSessionForUrl.scanId);
      } else if (lastTriggeredScanTime > 0 && sessionTime > lastTriggeredScanTime - 1000) {
        setSelectedSessionId(latestSessionForUrl.scanId);
        setIsManualDashboard(false);
        setLastTriggeredScanTime(0);
        setIsAuditing(false);
      }
    }
  }, [currentTabInfo?.url, sessions, selectedSessionId, isManualDashboard, lastTriggeredScanTime]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedSessionId(null);
      setIsManualDashboard(false);
    } else if (selectedSessionId && !items.some(i => i.pageInfo?.scanId === selectedSessionId)) {
      setSelectedSessionId(null);
    }
  }, [items, selectedSessionId]);

  const toggleGroup = (gid: string) => {
    setExpandedGroups(prev => {
      if (prev.includes(gid)) {
        collapsedByUser.current.add(gid);
        return prev.filter(id => id !== gid);
      } else {
        collapsedByUser.current.delete(gid);
        return [...prev, gid];
      }
    });
  };

  const getGuidelineName = (id: string) => {
    for (const group of kwcagHierarchy) {
      const found = group.items.find(item => item.id === id);
      if (found) return found.label;
    }
    return id;
  };

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;
    const handleMessage = (message: any) => {
      if (message.type === 'UPDATE_ABT_LIST_BATCH' || message.type === 'UPDATE_ABT_BATCH') {
        setIsConnected(true);
        addReportsBatch(message.items || message.data);
      } else if (message.type === 'UPDATE_ABT_LIST') {
        setIsConnected(true);
        addReport(message.data);
      } else if (message.type === 'SCAN_PROGRESS') {
        setCurrentGuideline(message.guideline_id);
        setIsAuditing(true);
      } else if (message.type === 'SCAN_FINISHED') {
        setIsAuditing(false);
        setSelectedSessionId(message.scanId);
        setIsManualDashboard(false);
      }
    };

    const port = chrome.runtime.connect({ name: 'abt-sidepanel' });
    port.onMessage.addListener(handleMessage);
    const runtimeListener = (message: any) => handleMessage(message);
    chrome.runtime.onMessage.addListener(runtimeListener);
    
    return () => {
      port.onMessage.removeListener(handleMessage);
      port.disconnect();
      chrome.runtime.onMessage.removeListener(runtimeListener);
    };
  }, [addReport, addReportsBatch]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedSessionId) result = result.filter(i => i.pageInfo?.scanId === selectedSessionId);
    if (activeTab !== "ALL") result = result.filter(i => i.guideline_id === activeTab);
    if (statusFilter !== "ALL") result = result.filter(i => i.currentStatus === statusFilter);
    return result;
  }, [items, selectedSessionId, activeTab, statusFilter]);

  const allGroupedItems = useMemo(() => {
    const itemMap: Record<string, ABTItem[]> = {};
    filteredItems.forEach(item => {
      if (!itemMap[item.guideline_id]) itemMap[item.guideline_id] = [];
      itemMap[item.guideline_id].push(item);
    });

    const result: {gid: string, label: string, items: ABTItem[]}[] = [];
    kwcagHierarchy.forEach(principle => {
      principle.items.forEach(item => {
        const itemsInGroup = itemMap[item.id] || [];
        
        // [정렬 로직] MANUAL 항목 우선 배치 + 최신순 정렬
        const sortedItems = [...itemsInGroup].sort((a, b) => {
          const aManual = a.elementInfo?.tagName === 'MANUAL';
          const bManual = b.elementInfo?.tagName === 'MANUAL';
          if (aManual && !bManual) return -1;
          if (!aManual && bManual) return 1;
          // 시간순 (최신 항목 상단)
          const aTime = new Date(a.pageInfo?.timestamp || 0).getTime();
          const bTime = new Date(b.pageInfo?.timestamp || 0).getTime();
          return bTime - aTime;
        });
        
        result.push({ gid: item.id, label: item.label, items: sortedItems });
      });
    });
    return result;
  }, [filteredItems]);

  useEffect(() => {
    const errorGids = allGroupedItems.filter(g => g.items.some(i => i.currentStatus === '오류')).map(g => g.gid);
    if (errorGids.length > 0) {
      setExpandedGroups(prev => {
        const newGids = errorGids.filter(gid => !collapsedByUser.current.has(gid));
        return [...new Set([...prev, ...newGids])];
      });
    }
  }, [allGroupedItems]);

  const sessionItems = useMemo(() => items.filter(i => i.pageInfo?.scanId === selectedSessionId), [items, selectedSessionId]);

  const handleSaveComment = (id: string) => {
    updateItemStatus(id, items.find(i => i.id === id)?.currentStatus || "검토 필요", tempComment);
    setJudgingId(null);
    setTempComment("");
  };

  const handleJudge = (id: string, nextStatus: string) => {
    updateItemStatus(id, nextStatus, tempComment);
    setJudgingId(null);
    setTempComment("");
  };

  const generateMarkdownReport = async () => {
    const date = new Date().toLocaleDateString();
    let md = `# 🛡️ AAK 접근성 진단 리포트 (${date})\n\n`;
    const fails = sessionItems.filter(i => i.currentStatus === '오류').length;
    const inapps = sessionItems.filter(i => i.currentStatus === '부적절').length;
    const recs = sessionItems.filter(i => i.currentStatus === '수정 권고').length;
    md += `## 📊 진단 요약\n- **❌ 오류:** ${fails}건\n- **🚫 부적절:** ${inapps}건\n- **⚠️ 수정 권고:** ${recs}건\n\n---\n\n`;

    const activeGuidelines = Array.from(new Set(sessionItems.filter(i => i.currentStatus !== '적절').map(i => i.guideline_id)));
    activeGuidelines.forEach(gid => {
      md += `## 📘 ${getGuidelineName(gid)}\n\n`;
      const gidItems = sessionItems.filter(i => i.guideline_id === gid && i.currentStatus !== '적절');
      gidItems.forEach(item => {
        const statusIcon = item.currentStatus === '오류' ? '❌' : item.currentStatus === '부적절' ? '🚫' : '⚠️';
        md += `### ${statusIcon} [${item.currentStatus}] ${item.elementInfo.selector}\n`;
        md += `- **진단 결과:** ${item.result.message}\n`;
        if (item.finalComment) md += `- **QA 전문가 소견:** ${item.finalComment}\n`;
        md += `- **대상 요소:** \`${item.elementInfo.tagName}\`\n`;
        md += `- **주변 맥락:** *"${item.context.smartContext}"*\n\n`;
      });
    });
    md += `---\n*Generated by AAK Workbench (A11Y Browser Tester)*`;
    
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `AAK_Report_${new Date().toISOString().split('T')[0]}.md`,
          types: [{ description: 'Markdown File', accept: { 'text/markdown': ['.md'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(md);
        await writable.close();
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') copyToClipboard(md);
      }
    } else copyToClipboard(md);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  const handleLocate = (selector: string) => {
    chrome.runtime.sendMessage({ 
      type: 'locate-element', 
      selector,
      windowId: isPopup ? sourceWindowId : null
    });
  };

  const handleDeleteSession = (e: React.MouseEvent | React.KeyboardEvent, scanId: number) => {
    e.stopPropagation();
    if (window.confirm("이 진단 기록을 삭제하시겠습니까?")) {
      removeSessionById(scanId);
    }
  };

  const selectedItem = items.find(i => i.id === selectedId);
  const guidelineData = selectedGuidelineInfo && standardItemsDict ? standardItemsDict[selectedGuidelineInfo] : null;

  return (
    <div className={`${styles.container} ${isPopup ? styles.isPopup : ''}`}>
      <header className={styles.extHeader}>
        <div className={styles.brand}>
          <Shield size={18} className={styles.logo} />
          <div className={styles.titleInfo}>
            <h1>AAK Workbench</h1>
            <span>{isPopup ? 'Window' : 'Extension'}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {selectedSessionId !== null && (
            <button onClick={() => { setSelectedSessionId(null); setIsManualDashboard(true); }} title="새 진단" aria-label="새 진단 시작" className={styles.iconBtn}><PlusCircle size={16} /></button>
          )}
          
          {sessionItems.length > 0 && (isPopup ? (
            <button 
              onClick={() => {
                if (typeof chrome !== 'undefined' && chrome.sidePanel) {
                  const targetWinId = sourceWindowId || chrome.windows.WINDOW_ID_CURRENT;
                  (chrome as any).sidePanel.open({ windowId: targetWinId }, () => {
                    window.close();
                  });
                }
              }} 
              title="사이드 패널로 돌리기" 
              aria-label="사이드 패널로 돌리기"
              className={styles.iconBtn}
            >
              <PanelRightClose size={16} />
            </button>
          ) : (
            <button 
              onClick={() => {
                if (typeof chrome !== 'undefined' && chrome.windows) {
                  chrome.windows.getCurrent((currentWin) => {
                    const winId = currentWin.id;
                    chrome.windows.create({
                      url: chrome.runtime.getURL(`sidepanel.html?mode=popup&windowId=${winId}`),
                      type: 'popup',
                      width: 750,
                      height: 900
                    });
                    if (winId) chrome.runtime.sendMessage({ type: 'POP_OUT', windowId: winId });
                  });
                }
              }} 
              title="창 분리하기" 
              aria-label="창 분리하기"
              className={styles.iconBtn}
            >
              <ExternalLink size={16} />
            </button>
          ))}

          {selectedSessionId !== null && (
            <button onClick={generateMarkdownReport} title="리포트 추출" aria-label="마크다운 리포트 추출" className={`${styles.iconBtn} ${copyStatus ? styles.success : ''}`}><FileText size={16} /></button>
          )}
        </div>
      </header>

      {isAuditing ? (
        <div className={styles.dashboard} aria-busy="true" aria-live="polite">
          <div className={styles.hero}>
            <div className={styles.heroIcon} style={{ animationDuration: '1s' }}><RotateCcw size={48} /></div>
            <h2>Precision Audit in Progress</h2>
            {currentGuideline && (

              <p style={{ color: 'var(--accent-highlight)', fontWeight: 'bold', fontSize: '1rem', margin: '0.8rem 0' }}>
                검사항목 {currentGuideline} 분석 중...
              </p>
            )}

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>
              KWCAG 2.2 표준 지침에 따라<br/>페이지의 모든 요소를 정밀 진단하고 있습니다.
            </p>
            <div className={styles.loadingBar}><div className={styles.progress}></div></div>
          </div>
        </div>
      ) : !selectedSessionId ? (
        <div className={styles.dashboard}>
          <div className={styles.hero}>
            <div className={styles.heroIcon}><Shield size={48} /></div>
            <h2>Ready to Audit</h2>
            <p>현재 페이지의 접근성을 진단합니다.</p>
            {currentTabInfo && (
              <div className={styles.pagePreview}>
                <span className={styles.pageTitle}>{currentTabInfo.title}</span>
                <span className={styles.pageUrl}>{currentTabInfo.url}</span>
              </div>
            )}
            <div className={styles.refreshNotice}>
              <AlertCircle size={14} />
              <span>정확한 진단을 위해 페이지를 <strong>새로고침</strong>한 후 시작해 주세요.</span>
            </div>
            <button 
              className={styles.startBtn} 
              onClick={handleStartAudit}
              disabled={isAuditing}
              aria-label="진단 시작"
            >
              {isAuditing ? '진단 중...' : '진단 시작 (Start Audit)'}
            </button>
            {sessions.length > 0 && (
              <div className={styles.historyOption}>
                <div className={styles.historyHeader}>
                  <p>과거 진단 기록 ({sessions.length}건)</p>
                  <button 
                    onClick={clearItems} 
                    title="전체 삭제" 
                    aria-label="모든 진단 기록 삭제" 
                    className={styles.deleteAllBtn}
                  >
                    <Trash2 size={14} />
                    전체 삭제
                  </button>
                </div>
                <div className={styles.historyList}>
                  {sessions.map((s, idx) => (
                    <div 
                      key={s.scanId} 
                      className={styles.historyItem} 
                      onClick={() => setSelectedSessionId(s.scanId)}
                      onKeyDown={(e) => handleKeyDown(e, () => setSelectedSessionId(s.scanId))}
                      tabIndex={0}
                      role="button"
                      aria-label={`${s.pageTitle}, ${formatRelativeTime(s.timestamp)} 진단 기록`}
                    >
                      <div className={styles.historyInfo}>
                        <div className={styles.historyTimeRow}>
                          <span className={styles.historyBadge}>#{sessions.length - idx}</span>
                          <span className={styles.historyRelative}>{formatRelativeTime(s.timestamp)}</span>
                          <span className={styles.historyAbsolute}>({new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })})</span>
                        </div>
                        <span className={styles.historyTitle}>{s.pageTitle}</span>
                      </div>
                      <div className={styles.historyActions}>
                        <button 
                          className={styles.deleteBtn} 
                          onClick={(e) => handleDeleteSession(e, s.scanId)}
                          onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e, () => handleDeleteSession(e, s.scanId)); }}
                          title="삭제"
                          aria-label="진단 기록 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className={styles.features}>
            <div className={styles.featItem}><CheckCircle2 size={14} /> KWCAG 2.2 지침</div>
            <div className={styles.featItem}><CheckCircle2 size={14} /> 실시간 판정</div>
          </div>
        </div>
      ) : (
        <div className={styles.workArea}>
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

          <div className={styles.statsSummary} role="tablist">
            <button 
              className={`${styles.statLine} ${statusFilter === 'ALL' ? styles.active : ''}`} 
              onClick={() => setStatusFilter('ALL')}
              role="tab"
              aria-selected={statusFilter === 'ALL'}
            >
              전체 <span>{sessionItems.length}</span>
            </button>
            <button 
              className={`${styles.statLine} ${styles.fail} ${statusFilter === '오류' ? styles.active : ''}`} 
              onClick={() => setStatusFilter('오류')}
              role="tab"
              aria-selected={statusFilter === '오류'}
            >
              오류 <span>{sessionItems.filter(i => i.currentStatus === '오류').length}</span>
            </button>
            <button 
              className={`${styles.statLine} ${styles.review} ${statusFilter === '검토 필요' ? styles.active : ''}`} 
              onClick={() => setStatusFilter('검토 필요')}
              role="tab"
              aria-selected={statusFilter === '검토 필요'}
            >
              검토 필요 <span>{sessionItems.filter(i => i.currentStatus === '검토 필요').length}</span>
            </button>
            <button 
              className={`${styles.statLine} ${styles.pass} ${statusFilter === '적절' ? styles.active : ''}`} 
              onClick={() => setStatusFilter('적절')}
              role="tab"
              aria-selected={statusFilter === '적절'}
            >
              검토 완료 <span>{sessionItems.filter(i => i.currentStatus === '적절').length}</span>
            </button>
          </div>
          
          <div className={styles.groupedList}>
            {allGroupedItems.map((group) => {
              const isExpanded = expandedGroups.includes(group.gid);
              const hasError = group.items.some(i => i.currentStatus === '오류');

              return (
                <section key={group.gid} className={styles.groupSection}>
                  <button 
                    className={`${styles.groupHeader} ${hasError ? styles.hasError : ''}`} 
                    onClick={() => toggleGroup(group.gid)}
                    aria-expanded={isExpanded}
                    aria-controls={`group-content-${group.gid}`}
                  >
                    <div className={styles.headerLeft}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className={styles.gidLabel}>{group.gid} {group.label}</span>
                    </div>
                    <div className={styles.headerRight}>
                      {(() => {
                        const total = group.items.length;
                        const manualScore = total > 0 ? group.items[0].manualScore : undefined;

                        if (manualScore !== undefined) {
                          return (
                            <span 
                              className={`${styles.scoreBadge} ${manualScore < 60 ? styles.bad : manualScore < 90 ? styles.warning : styles.good}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const val = prompt("점수 입력 (0-100):", manualScore.toString());
                                if (val !== null && selectedSessionId) setGuidelineScore(selectedSessionId, group.gid, parseInt(val));
                              }}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                handleKeyDown(e, () => {
                                  const val = prompt("점수 입력 (0-100):", manualScore.toString());
                                  if (val !== null && selectedSessionId) setGuidelineScore(selectedSessionId, group.gid, parseInt(val));
                                });
                              }}
                              tabIndex={0}
                              role="button"
                              title="클릭하여 점수를 수정할 수 있습니다."
                              aria-label={`수동 점수 ${manualScore}점, 수정하려면 클릭`}
                            >
                              {manualScore}점 (수동)
                            </span>
                          );
                        }

                        if (total === 0) return (
                          <span 
                            className={styles.naBadge}
                            onClick={(e) => {
                              e.stopPropagation();
                              alert("N/A 항목은 검출된 요소가 없어 점수를 저장할 수 없습니다.");
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label="N/A 항목"
                          >
                            N/A
                          </span>
                        );

                        let pass = 0, fail = 0, review = 0, calcTotal = 0;
                        group.items.forEach(i => {
                          if (i.currentStatus === '참고자료') return; // 점수 계산에서 제외
                          const weight = (i as any).isSummary && (i as any).passCount ? (i as any).passCount : 1;
                          calcTotal += weight;
                          if (i.currentStatus === '적절') pass += weight;
                          else if (['오류', '부적절'].includes(i.currentStatus)) fail += weight;
                          else if (['검토 필요', '수정 권고'].includes(i.currentStatus)) review += weight;
                        });
                        
                        // '수동 검사 필요' 문구로 점수를 가리는 로직 완화 (1.1.1, 3.1.1 등 핵심 지침은 점수를 우선 표시)
                        const skipManualBadgeGids = ['1.1.1', '3.1.1'];
                        if (fail === 0 && review > 0 && group.items.some(i => i.currentStatus === '검토 필요') && !skipManualBadgeGids.includes(group.gid)) {
                          return (
                            <span 
                              className={`${styles.scoreBadge} ${styles.manual}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const val = prompt("수동 검사 점수 입력 (0-100):");
                                if (val !== null && selectedSessionId) setGuidelineScore(selectedSessionId, group.gid, parseInt(val));
                              }}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                handleKeyDown(e, () => {
                                  const val = prompt("수동 검사 점수 입력 (0-100):");
                                  if (val !== null && selectedSessionId) setGuidelineScore(selectedSessionId, group.gid, parseInt(val));
                                });
                              }}
                              tabIndex={0}
                              role="button"
                              title="자동 진단이 어려운 항목입니다. 클릭하여 직접 점수를 입력하세요."
                              aria-label="수동 검사 필요, 점수를 입력하려면 클릭"
                            >
                              수동 검사 필요
                            </span>
                          );
                        }

                        let score = 100;
                        const exhaustiveGids = ['1.1.1', '1.3.1', '1.4.3', '2.1.1', '2.4.2', '2.4.3', '2.5.3', '3.1.1', '3.3.2'];
                        if (exhaustiveGids.includes(group.gid)) {
                          score = Math.round(((pass * 100 + review * 50) / (calcTotal * 100)) * 100);
                        } else {
                          const rawScore = 100 * Math.pow(0.8, fail) * Math.pow(0.95, review);
                          score = Math.round(rawScore);
                          if (calcTotal > 0 && pass === calcTotal) score = 100;
                        }

                        return (
                          <span 
                            className={`${styles.scoreBadge} ${score < 60 ? styles.bad : score < 90 ? styles.warning : styles.good}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const val = prompt("점수 직접 수정 (0-100):", score.toString());
                              if (val !== null && selectedSessionId) setGuidelineScore(selectedSessionId, group.gid, parseInt(val));
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              handleKeyDown(e, () => {
                                const val = prompt("점수 직접 수정 (0-100):", score.toString());
                                if (val !== null && selectedSessionId) setGuidelineScore(selectedSessionId, group.gid, parseInt(val));
                              });
                            }}
                            tabIndex={0}
                            role="button"
                            title="클릭하여 점수를 직접 수정할 수 있습니다."
                            aria-label={`진단 점수 ${score}점, 수정하려면 클릭`}
                          >
                            {score}점
                          </span>
                        );
                      })()}
                      <span className={styles.countBadge} aria-label={`검출 항목 ${group.items.length}개`}>{group.items.length}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedGuidelineInfo(group.gid); }} 
                        className={styles.iconBtn}
                        title="지침 판정 기준 보기"
                        aria-label={`${group.gid} 지침 판정 기준 보기`}
                        style={{ padding: '0.2rem' }}
                      >
                        <Info size={14} />
                      </button>
                    </div>
                  </button>
                          
                  {isExpanded && (
                    <div className={styles.groupContent} id={`group-content-${group.gid}`}>
                      {group.gid === '1.1.1' && (
                        <div className={styles.manualEntrySection}>
                          <div className={styles.focusTrackerControls}>
                            <button 
                              className={`${styles.focusToggleBtn} ${isImageAltView ? styles.active : ''}`} 
                              onClick={toggleImageAlt}
                              title="이미지 대체 텍스트 오버레이 표시"
                            >
                              <ImageIcon size={14} />
                              {isImageAltView ? "이미지 보기" : "대체텍스트 보기"}
                            </button>
                          </div>
                        </div>
                      )}
                      {group.gid === '1.4.3' && (
                        <div className={styles.manualEntrySection}>
                          {!isContrastOpen ? (
                            <button 
                              className={styles.addCaseBtn} 
                              onClick={() => setIsContrastOpen(true)}
                              title="수동 명도 대비 측정 항목 추가"
                            >
                              <PlusCircle size={14} /> 명도 대비 케이스 추가
                            </button>
                          ) : (
                            <div className={styles.manualEntryForm}>
                              <div className={styles.formHeader}>
                                <span>새 명도 대비 측정</span>
                                <button onClick={() => { setIsContrastOpen(false); setManualContrastName(""); }} aria-label="닫기"><X size={14} /></button>
                              </div>
                              <input 
                                type="text" 
                                placeholder="항목 이름 (예: 메인 배너 텍스트)" 
                                value={manualContrastName}
                                onChange={e => setManualContrastName(e.target.value)}
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
                                <div className={styles.previewRatio}>대비 {getContrastRatio(fgColor, bgColor)}:1</div>
                                <button className={styles.saveBtn} onClick={handleAddManualContrast}>저장</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {group.gid === '1.3.2' && (
                        <div className={styles.manualEntrySection}>
                          <div className={styles.focusTrackerControls}>
                            <button 
                              className={`${styles.focusToggleBtn} ${isLinearView ? styles.active : ''}`} 
                              onClick={toggleCSS}
                              title="CSS 비활성화를 통한 선형 구조 확인"
                            >
                              <LayoutList size={14} />
                              {isLinearView ? "CSS 켜기" : "선형화(CSS 끄기)"}
                            </button>
                          </div>
                        </div>
                      )}
                      {group.gid === '2.1.2' && (
                        <div className={styles.manualEntrySection}>
                          <div className={styles.focusTrackerControls}>
                            <button 
                              className={`${styles.focusToggleBtn} ${isFocusTracking ? styles.active : ''}`} 
                              onClick={toggleFocusTracking}
                              title="초점 이동 경로 및 순서 시각화"
                            >
                              <MousePointer2 size={14} />
                              {isFocusTracking ? "시각화 끄기" : "초점 순서 시각화"}
                            </button>
                            {isFocusTracking && (
                              <button 
                                className={styles.focusResetBtn} 
                                onClick={resetFocusPath}
                                title="표시된 경로 초기화"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {group.items.length === 0 ? (
                        <div className={styles.emptyState}>검출된 항목이 없습니다.</div>
                      ) : (
                        group.items.map((item) => {
                          const isJudged = item.history.length > 1 || !!item.finalComment;
                          return (
                            <article 
                              key={item.id} 
                              onClick={() => { setSelectedId(item.id); handleLocate(item.elementInfo.selector); }} 
                              onKeyDown={(e) => handleKeyDown(e, () => { setSelectedId(item.id); handleLocate(item.elementInfo.selector); })}
                              tabIndex={0}
                              role="button"
                              aria-selected={selectedId === item.id}
                              className={`${styles.miniCard} ${selectedId === item.id ? styles.selected : ''} ${isJudged ? styles.judged : ''}`}
                            >
                              <div className={styles.cardLayout}>
                                {!isJudged && item.elementInfo.src && item.elementInfo.src !== 'N/A' && (
                                  <div className={styles.thumbBox}><img src={item.elementInfo.src} alt="미리보기" /></div>
                                )}
                                <div className={styles.cardMain}>
                                  <div className={styles.cardTop}>
                                    <div className={`${styles.miniStatus} ${styles[item.currentStatus.replace(' ', '_')]}`}>{item.currentStatus}</div>
                                    {item.elementInfo.selector !== 'outline' && (
                                      <div className={styles.quickJudge}>
                                        <button className={styles.qPass} onClick={(e) => { e.stopPropagation(); handleJudge(item.id, '적절'); }} title="적절로 판정" aria-label="적절로 판정">적절</button>
                                        <button className={styles.qFail} onClick={(e) => { e.stopPropagation(); handleJudge(item.id, '오류'); }} title="오류로 판정" aria-label="오류로 판정">오류</button>
                                      </div>
                                    )}
                                  </div>
                                  <h3 className={isJudged ? styles.judgedTitle : ''}>{item.result?.message}</h3>
                                  {!isJudged && (
                                    <>
                                      {item.guideline_id === '1.1.1' && (
                                        <div className={styles.markupSnippet}>
                                          &lt;{item.elementInfo.tagName.toLowerCase()} <span className={styles.attrName}>{(item.elementInfo as any).sourceAttr || 'alt'}</span>=<span className={styles.attrVal}>"{item.elementInfo.alt || ''}"</span> ... /&gt;
                                        </div>
                                      )}
                                      {item.guideline_id === '1.4.3' && (item.context as any).color && (
                                        <div className={styles.contrastPreview} style={{ color: (item.context as any).color, backgroundColor: (item.context as any).backgroundColor }}>
                                          Aa 가나다 (Text: {(item.context as any).color} / BG: {(item.context as any).backgroundColor})
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {item.elementInfo.selector === 'outline' ? (
                                    <span className={styles.outlineLabel}>Heading Outline</span>
                                  ) : (
                                    <code className={styles.selector}>{item.elementInfo.selector}</code>
                                  )}
                                </div>
                              </div>
                              {selectedId === item.id && (
                                <div className={styles.miniDetail}>
                                  <div className={styles.smartContextView}>
                                    {item.guideline_id === '1.1.1' ? (
                                      <>
                                        <span>...{item.context.smartContext.split(item.elementInfo.alt || "")[0]}</span>
                                        <span className={styles.highlight}>[{((item.elementInfo as any).sourceAttr || 'alt')}="{item.elementInfo.alt || ''}"]</span>
                                        <span>{item.context.smartContext.split(item.elementInfo.alt || "")[1]}...</span>
                                      </>
                                    ) : item.guideline_id === '2.4.2' && item.elementInfo.selector === 'outline' ? (
                                      <div className={styles.outlineView}>
                                        {(item.context as any).outline?.map((h: any, idx: number) => (
                                          <div key={idx} className={`${styles.outlineItem} ${styles['h'+h.level]}`}>
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
                                      <button onClick={(e) => { e.stopPropagation(); setJudgingId(item.id); setTempComment(item.finalComment); }} aria-label={item.finalComment ? '의견 수정' : '의견 작성'}>
                                        <Edit3 size={12} /> {item.finalComment ? '의견 수정' : '의견 작성'}
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); setIsPropPanelOpen(true); }} aria-label="상세 정보 보기">상세</button>
                                      {item.elementInfo.tagName === 'MANUAL' && (
                                        <button 
                                          className={styles.deleteManualBtn} 
                                          onClick={(e) => deleteManualItem(e, item.id)}
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
                              {judgingId === item.id && (
                                <div className={styles.miniJudge} onClick={e => e.stopPropagation()}>
                                  <textarea 
                                    placeholder="의견을 입력하세요..." 
                                    value={tempComment} 
                                    onChange={e => setTempComment(e.target.value)} 
                                    aria-label="전문가 소견 입력"
                                  />
                                  <div className={styles.judgeBtns}>
                                    <button onClick={() => setJudgingId(null)} className={styles.cBtn}>취소</button>
                                    <button onClick={() => handleSaveComment(item.id)} className={styles.sBtn}>저장</button>
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        })
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {selectedGuidelineInfo && guidelineData && (
        <div className={styles.fullPropPanel} ref={guidelineInfoRef} role="dialog" aria-modal="true" aria-label={`${selectedGuidelineInfo} 지침 상세 정보`}>
          <header>
            <h3>{selectedGuidelineInfo} {guidelineData.name || '지침 정보'}</h3>
            <button onClick={() => setSelectedGuidelineInfo(null)} aria-label="닫기"><X size={18} /></button>
          </header>
          <div className={styles.propBody}>
            <section className={styles.guidelineSection}>
              <h4>준수 기준</h4>
              <p>{guidelineData.compliance_criteria || guidelineData.criteria || '내용 없음'}</p>
            </section>
            
            {guidelineData.error_types && typeof guidelineData.error_types === 'object' && (
              <section className={styles.guidelineSection}>
                <h4>오류 유형</h4>
                <ul className={styles.errorTypeList}>
                  {Object.entries(guidelineData.error_types).map(([code, desc]) => (
                    <li key={code}>
                      <strong>{code}</strong>
                      <span>{String(desc)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {Array.isArray(guidelineData.detailed_descriptions) && guidelineData.detailed_descriptions.length > 0 && (
              <section className={styles.guidelineSection}>
                <h4>세부 설명</h4>
                <ul className={styles.detailList}>
                  {guidelineData.detailed_descriptions.map((desc: string, i: number) => (
                    <li key={i}>{desc}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}

      {isPropPanelOpen && selectedItem && (
        <div className={styles.fullPropPanel} ref={propPanelRef} role="dialog" aria-modal="true" aria-label="요소 상세 정보">
          <header>
            <h3>Detail View</h3>
            <button onClick={() => setIsPropPanelOpen(false)} aria-label="닫기"><X size={18} /></button>
          </header>
          <div className={styles.propBody}>
            <section>
              <h4>Selector</h4>
              <code>{selectedItem.elementInfo.selector}</code>
            </section>
            <section>
              <h4>Context</h4>
              <p>{selectedItem.context.smartContext}</p>
            </section>
            <section>
              <h4>History</h4>
              {selectedItem.history.map((h: any, i: number) => (
                <div key={i} className={styles.histItem}>
                  <span>{h.timestamp}</span>
                  <strong>{h.status}</strong>
                  <p>{h.comment}</p>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}


    </div>
  );
};

export default App;
