/**
 * ABT Background Service Worker (Stable)
 * 사이드 패널을 기본 진입점으로 사용합니다.
 */

const abtPorts = new Set();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'abt-sidepanel') {
    abtPorts.add(port);
    port.onDisconnect.addListener(() => {
      abtPorts.delete(port);
    });
  }
});

// Relay messages from Engine to UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("ABT: Background message received", message.type, sender.tab ? "from tab" : "from extension");
  if (sender.tab) {
    const relayTypes = ['UPDATE_ABT_LIST', 'UPDATE_ABT_LIST_BATCH', 'UPDATE_ABT_BATCH', 'SCAN_PROGRESS', 'SCAN_FINISHED'];
    if (relayTypes.includes(message.type)) {
      abtPorts.forEach(port => {
        try { port.postMessage(message); } catch (e) { abtPorts.delete(port); }
      });
      chrome.runtime.sendMessage(message);
    }
  } 

  // Relay commands from UI to Engine
  else if (message.type === 'locate-element' || message.type === 'RUN_AUDIT' || message.type === 'TOGGLE_CSS' || message.type === 'TOGGLE_IMAGE_ALT' || message.type === 'TOGGLE_FOCUS_TRACKING' || message.type === 'RESET_FOCUS_TRACKING' || message.type === 'VISUALIZE_FULL_FOCUS_ORDER') {
    const targetWinId = message.windowId;
    
    const findAndSend = (queryOptions) => {
      chrome.tabs.query(queryOptions, (tabs) => {
        // Filter out extension pages
        const targetTab = tabs.find(t => t.url && !t.url.startsWith('chrome-extension://'));
        
        if (targetTab) {
          chrome.tabs.sendMessage(targetTab.id, message, (response) => {
            if (chrome.runtime.lastError) {
              chrome.scripting.executeScript({
                target: { tabId: targetTab.id },
                files: ['engine/abt-engine.js']
              }).then(() => {
                setTimeout(() => chrome.tabs.sendMessage(targetTab.id, message), 200);
              });
            }
            if (sendResponse) sendResponse(response);
          });
        } else if (queryOptions.windowId) {
          // Fallback to global active tab if window-specific query failed
          findAndSend({ active: true });
        }
      });
    };

    const options = targetWinId 
      ? { active: true, windowId: targetWinId }
      : { active: true, lastFocusedWindow: true };
    
    findAndSend(options);
    return true; 
  }
});

// 아이콘 클릭 시 사이드 패널 열기 설정 (기본값 복구)
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// 이전에 설정된 팝업이 있다면 제거하여 사이드 패널이 우선순위를 갖게 함
chrome.action.setPopup({ popup: '' });
