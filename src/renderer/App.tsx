import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActivitySquare, Scan, Info, Search, Edit3, Clock, ChevronRight, ChevronDown, ChevronLeft, Filter, FileText, CheckCircle2, AlertCircle, Trash2, Folder, FolderOpen, FileCode2, RotateCcw, X, Image as ImageIcon, PlusCircle, ExternalLink, PanelRightClose, LayoutList, Pipette, MousePointer2, ListOrdered, Home, Plus } from 'lucide-react';
import styles from './styles/App.module.scss';
import { useStore, kwcagHierarchy, ABTItem } from './store/useStore';
import { useToolsState } from './hooks/useToolsState';
import { useSessionManager } from './hooks/useSessionManager';
import { useAudit } from './hooks/useAudit';
import { useContrastPicker } from './hooks/useContrastPicker';
import { useModalState } from './hooks/useModalState';
import { formatRelativeTime, normalizeUrl } from './utils/format';
import { standardItemsDict, guidelineNames, getGuidelineName } from './utils/standards';
import { copyToClipboard } from './utils/clipboard';
import { handleKeyDown } from './utils/keyhelper';
import { getContrastRatio } from './utils/color';
import { Header } from './components/Header';
import { AuditingView } from './components/AuditingView';
import { SessionHistoryList } from './components/Dashboard/SessionHistoryList';
import { DashboardView } from './components/Dashboard/DashboardView';
import { SessionSelector } from './components/WorkArea/SessionSelector';
import { StatsFilter } from './components/WorkArea/StatsFilter';
import { ScoreBadge } from './components/WorkArea/GuidelineGroup/ScoreBadge';
import { GroupToolbar } from './components/WorkArea/GuidelineGroup/GroupToolbar';
import { ItemCard } from './components/WorkArea/GuidelineGroup/ItemCard';
import { DetailPanel } from './components/Panels/DetailPanel';
import { GuidelineInfoPanel } from './components/Panels/GuidelineInfoPanel';

const App = () => {
  const { items, setItems, addReport, addReportsBatch, updateItemStatus, setGuidelineScore, removeSession, removeSessionById, clearItems, projectName } = useStore();
  const [manualComment, setManualComment] = useState("");
  const [copyStatus, setCopyStatus] = useState(false);
  const [isManualDashboard, setIsManualDashboard] = useState(false);

  const isPopup = useMemo(() => new URLSearchParams(window.location.search).get('mode') === 'popup', []);
  const sourceWindowId = useMemo(() => {
    const id = new URLSearchParams(window.location.search).get('windowId');
    return id ? parseInt(id) : null;
  }, []);

  const {
		isLinearView,
		isImageAltView,
		isFocusTracking,
		toggleCSS,
		toggleImageAlt,
		toggleFocusTracking,
		resetFocusPath
	} = useToolsState(isPopup, sourceWindowId);

  const {
    selectedSessionId,
    setSelectedSessionId,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    expandedGroups,
    setExpandedGroups,
    manualEntryGid,
    setManualEntryGid,
    sessions,
    baseFilteredItems,
    filteredItems,
    itemStats,
    allGroupedItems,
    toggleGroup,
    collapsedByUser
  } = useSessionManager(items);

  const {
    isConnected,
    currentTabInfo,
    lastTriggeredScanTime,
    isAuditing,
    currentGuideline,
    handleStartAudit
  } = useAudit(
    addReport,
    addReportsBatch,
    setSelectedSessionId,
    setIsManualDashboard,
    sessions,
    selectedSessionId,
    isManualDashboard,
    isPopup,
    sourceWindowId
  );

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

  const {
    isContrastOpen,
    setIsContrastOpen,
    fgColor,
    bgColor,
    manualContrastName,
    setManualContrastName,
    pickColor,
    handleAddManualContrast,
    resetForm
  } = useContrastPicker(selectedSessionId, sessions, addReport);

  const {
    selectedId,
    setSelectedId,
    judgingId,
    setJudgingId,
    tempComment,
    setTempComment,
    selectedJudgeStatus,
    setSelectedJudgeStatus,
    isPropPanelOpen,
    setIsPropPanelOpen,
    selectedGuidelineInfo,
    setSelectedGuidelineInfo,
    propPanelRef,
    guidelineInfoRef
  } = useModalState(isContrastOpen, setIsContrastOpen);

  const deleteManualItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("이 수동 추가 항목을 삭제하시겠습니까?")) {
      setItems(items.filter(i => i.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleSaveComment = (id: string) => {
    const item = items.find(i => i.id === id);
    const finalStatus = selectedJudgeStatus || item?.currentStatus || "검토 필요";
    updateItemStatus(id, finalStatus, tempComment);
    setJudgingId(null);
    setTempComment("");
    setSelectedJudgeStatus(null);
  };

  const handleJudge = (id: string, nextStatus: string) => {
    updateItemStatus(id, nextStatus, tempComment);
    setJudgingId(null);
    setTempComment("");
    setSelectedJudgeStatus(null);
  };
  const handleSaveManualOpinion = (gid: string) => {
    if (!selectedSessionId) return;
    const session = sessions.find(s => s.scanId === selectedSessionId);
    if (!session) return;

    const finalStatus = selectedJudgeStatus || "검토 필요";
    const manualReport = {
      guideline_id: gid,
      elementInfo: { tagName: "MANUAL", selector: "manual-entry" },
      context: { smartContext: manualContrastName || "수동 추가 의견" },
      result: { status: finalStatus, message: manualContrastName || "전문가가 직접 추가한 검토 의견입니다.", rules: ["Manual Entry"] },
      finalComment: manualComment,
      pageInfo: { ...session }
    };

    addReport(manualReport as any);
    setManualEntryGid(null);
    setManualContrastName("");
    setManualComment("");
    setManualEntryGid(null);
    setManualContrastName("");
    setTempComment("");
    setSelectedJudgeStatus(null);
  };

  const generateMarkdownReport = async () => {
    const date = new Date().toLocaleDateString();
    let md = `# 🛡️ AAK 접근성 진단 리포트 (${date})\n\n`;
    const fails = filteredItems.filter(i => i.currentStatus === '오류').length;
    const inapps = filteredItems.filter(i => i.currentStatus === '부적절').length;
    const recs = filteredItems.filter(i => i.currentStatus === '수정 권고').length;
    md += `## 📊 진단 요약\n- **❌ 오류:** ${fails}건\n- **🚫 부적절:** ${inapps}건\n- **⚠️ 수정 권고:** ${recs}건\n\n---\n\n`;

    const activeGuidelines = Array.from(new Set(filteredItems.filter(i => i.currentStatus !== '적절').map(i => i.guideline_id)));
    activeGuidelines.forEach(gid => {
      md += `## 📘 ${getGuidelineName(gid)}\n\n`;
      const gidItems = filteredItems.filter(i => i.guideline_id === gid && i.currentStatus !== '적절');
      gidItems.forEach(item => {
        const statusIcon = item.currentStatus === '오류' ? '❌' : item.currentStatus === '부적절' ? '🚫' : '⚠️';
        md += `### ${statusIcon} [${item.currentStatus}] ${item.elementInfo.selector}\n`;
        md += `- **진단 결과:** ${item.result.message}\n`;
        if (item.finalComment) md += `- **QA 전문가 소견:** ${item.finalComment}\n`;
        md += `- **대상 요소:** \`${item.elementInfo.tagName}\`\n`;
        md += `- **주변 맥락:** *"${item.context.smartContext}"*\n\n`;
      });
    });
    md += `---\n*Generated by AAK*`;

    // 파일명 생성: AAK-도메인-일시.md
    const currentSession = sessions.find(s => s.scanId === selectedSessionId);
    let domain = 'unknown';
    if (currentSession?.url) {
      try {
        domain = new URL(currentSession.url).hostname.replace(/\./g, '_');
      } catch { domain = 'unknown'; }
    }
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
    const filename = `AAK-${domain}-${timestamp}.md`;

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
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
      <Header
        isPopup={isPopup}
        sourceWindowId={sourceWindowId}
        isAuditing={isAuditing}
        selectedSessionId={selectedSessionId}
        filteredItemsCount={filteredItems.length}
        copyStatus={copyStatus}
        onGoHome={() => { setSelectedSessionId(null); setIsManualDashboard(true); }}
        onGenerateReport={generateMarkdownReport}
      />

      {isAuditing ? (
        <AuditingView currentGuideline={currentGuideline} />
      ) : !selectedSessionId ? (
        <DashboardView
          currentTabInfo={currentTabInfo}
          isAuditing={isAuditing}
          sessions={sessions}
          onStartAudit={handleStartAudit}
          onSelectSession={setSelectedSessionId}
          onDeleteSession={handleDeleteSession}
          onClearAll={clearItems}
        />
      ) : (
        <div className={styles.workArea}>
          <SessionSelector
            selectedSessionId={selectedSessionId}
            setSelectedSessionId={setSelectedSessionId}
            sessions={sessions}
          />

          <StatsFilter
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            itemStats={itemStats}
          />

          <div className={styles.groupedList}>
            {allGroupedItems.map((group) => {
              const isExpanded = expandedGroups.includes(group.gid);
              const hasError = group.items.some(i => i.currentStatus === '오류');

              return (
                <section key={group.gid} className={styles.groupSection}>
                  <div
                    className={`${styles.groupHeader} ${hasError ? styles.hasError : ''}`}
                    onClick={() => toggleGroup(group.gid)}
                    onKeyDown={(e) => handleKeyDown(e, () => toggleGroup(group.gid))}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={`group-content-${group.gid}`}
                  >
                    <div className={styles.headerLeft}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className={styles.gidLabel}>{group.gid} {group.label}</span>
                      <span className={styles.countBadge} aria-label={`검출 항목 ${group.items.length}개`}>{group.items.length}</span>
                    </div>
                    <div className={styles.headerRight}>
                      <ScoreBadge
                        gid={group.gid}
                        items={group.items}
                        selectedSessionId={selectedSessionId}
                        setGuidelineScore={setGuidelineScore}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (manualEntryGid === group.gid && isExpanded) {
                            setManualEntryGid(null);
                          } else {
                            setManualEntryGid(group.gid);
                            if (!isExpanded) toggleGroup(group.gid);
                          }
                        }}
                        className={`${styles.iconBtn} ${manualEntryGid === group.gid ? styles.active : ''}`}
                        title="검토 의견 수동 추가"
                        aria-label={`${group.gid} 검토 의견 수동 추가`}
                        style={{ padding: '0.2rem' }}
                      >
                        <Plus size={14} />
                      </button>
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
                  </div>

                  {isExpanded && (
                    <div className={styles.groupContent} id={`group-content-${group.gid}`}>
                      <GroupToolbar
                        gid={group.gid}
                        manualEntryGid={manualEntryGid}
                        onCloseManualEntry={() => setManualEntryGid(null)}
                        manualItemName={manualContrastName}
                        setManualItemName={setManualContrastName}
                        manualComment={manualComment}
                        setManualComment={setManualComment}
                        selectedJudgeStatus={selectedJudgeStatus}
                        setSelectedJudgeStatus={setSelectedJudgeStatus}
                        onSaveManualOpinion={() => handleSaveManualOpinion(group.gid)}
                        isImageAltView={isImageAltView}
                        toggleImageAlt={toggleImageAlt}
                        isContrastOpen={isContrastOpen}
                        setIsContrastOpen={setIsContrastOpen}
                        contrastItemName={manualContrastName}
                        setContrastItemName={setManualContrastName}
                        fgColor={fgColor}
                        bgColor={bgColor}
                        pickColor={pickColor}
                        onSaveContrast={handleAddManualContrast}
                        isLinearView={isLinearView}
                        toggleCSS={toggleCSS}
                        isFocusTracking={isFocusTracking}
                        toggleFocusTracking={toggleFocusTracking}
                        resetFocusPath={resetFocusPath}
                      />
                      {group.items.length === 0 ? (
                        <p className={styles.emptyState}>검출된 항목이 없습니다.</p>
                      ) : (
                        group.items.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            isSelected={selectedId === item.id}
                            isJudging={judgingId === item.id}
                            onSelect={() => setSelectedId(item.id)}
                            onLocate={() => handleLocate(item.elementInfo.selector)}
                            onQuickJudge={(status) => handleJudge(item.id, status)}
                            onStartJudging={() => {
                              setJudgingId(item.id);
                              setTempComment(item.finalComment);
                              setSelectedJudgeStatus(item.currentStatus === '검토 필요' ? null : item.currentStatus);
                            }}
                            tempComment={tempComment}
                            setTempComment={setTempComment}
                            selectedJudgeStatus={selectedJudgeStatus}
                            setSelectedJudgeStatus={setSelectedJudgeStatus}
                            onSaveComment={() => handleSaveComment(item.id)}
                            onCancelJudging={() => { setJudgingId(null); setSelectedJudgeStatus(null); }}
                            onOpenDetail={() => setIsPropPanelOpen(true)}
                            onDeleteManual={item.elementInfo.tagName === 'MANUAL' ? () => deleteManualItem({ stopPropagation: () => {} } as React.MouseEvent, item.id) : undefined}
                          />
                        ))
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
        <GuidelineInfoPanel
          guidelineId={selectedGuidelineInfo}
          data={guidelineData}
          onClose={() => setSelectedGuidelineInfo(null)}
          panelRef={guidelineInfoRef}
        />
      )}

      {isPropPanelOpen && selectedItem && (
        <DetailPanel
          item={selectedItem}
          onClose={() => setIsPropPanelOpen(false)}
          panelRef={propPanelRef}
        />
      )}

    </div>
  );
};

export default App;
