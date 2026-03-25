/**
* ABT-Connector: Browser to Extension Bridge
*/
class ABTConnector {
  constructor() {
    this.isConnected = true; // Chrome runtime is always available in content script
    this.setupListeners();
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        if (message.type === 'locate-element' && window.ABTCore) {
          window.ABTCore.highlightElement(message.selector);
          sendResponse({ status: 'success' });
        } else if (message.type === 'RUN_AUDIT' && window.ABTQuickScan) {
          // console.log("ABT: Audit triggered via Extension UI");
          window.ABTQuickScan();
          sendResponse({ status: 'started' });
        } else if (message.type === 'TOGGLE_CSS' && window.ABTCore) {
          window.ABTCore.toggleLinearView(message.enable);
          sendResponse({ status: 'success', isLinear: message.enable });
        } else if (message.type === 'TOGGLE_IMAGE_ALT' && window.ABTCore) {
          window.ABTCore.toggleImageAltView(message.enable);
          sendResponse({ status: 'success', isImageAlt: message.enable });
        } else if (message.type === 'TOGGLE_FOCUS_TRACKING' && window.ABTCore) {
          window.ABTCore.toggleFocusTracking(message.enable);
          sendResponse({ status: 'success', isFocusTracking: message.enable });
        } else if (message.type === 'RESET_FOCUS_TRACKING' && window.ABTCore) {
          window.ABTCore.resetFocusTracking();
          sendResponse({ status: 'success' });
        } else if (message.type === 'VISUALIZE_FULL_FOCUS_ORDER' && window.ABTCore) {
          window.ABTCore.visualizeFullFocusOrder();
          sendResponse({ status: 'success' });
        }
      } catch (e) {
        console.warn("ABT: Failed to handle message from extension", e);
        sendResponse({ status: 'error', message: e.message });
      }
      return true; // Keep channel open for async response if needed
    });
  }

  /**
  * 진단 데이터를 확장 프로그램(Background/Sidepanel)으로 전송합니다.
  */
  send(data) {
    try {
      // 이미 type이 정의된 제어 메시지(SCAN_FINISHED 등)는 그대로 전송,
      // 일반 데이터는 기존처럼 UPDATE_ABT_LIST로 래핑하여 전송합니다.
      const message = (data && data.type) ? data : {
        type: 'UPDATE_ABT_LIST',
        data: data
      };
      chrome.runtime.sendMessage(message);
      return true;
    } catch (e) {
      console.error("ABT: Failed to send message to extension", e);
      return false;
    }
  }
  /**
  * 진단 데이터를 배치(Batch) 단위로 확장 프로그램으로 전송합니다.
  */
  sendBatch(items) {
    if (!items || items.length === 0) return true;
    try {
      chrome.runtime.sendMessage({
        type: 'UPDATE_ABT_LIST_BATCH',
        items: items
      });
      return true;
    } catch (e) {
      console.error("ABT: Failed to send batch to extension", e);
      return false;
    }
  }

}

// Global Export 및 초기화
window.ABTConnector = new ABTConnector();

// 엔진의 scan 결과를 자동으로 전송하는 래퍼 함수 (브라우저 콘솔에서 실행 가능)
window.ABTQuickScan = async () => {
  if (!window.ABTCore) return console.error('ABTCore not found');
  window.ABTCore.runFullAudit();
};
