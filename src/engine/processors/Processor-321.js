/**
* ABT Processor 3.2.1 (On Focus)
*
* KWCAG 2.2 지침 3.2.1 사용자 요구에 따른 실행
* 사용자가 예측하지 못한 상황에서 초점이 이동하거나 창이 열리는 등 컨텍스트의 급격한 변화가 없어야 합니다.
*
* [진단 범위]
* - 모든 대화형 요소 (<a>, <button>, <input> 등)
* - [autofocus] 속성이 부여된 요소
* - target="_blank" 링크
*
* [주요 로직]
* - 새 창 안내 검사: target="_blank"인 링크에 '새 창' 관련 텍스트나 title 속성이 있는지 확인
* - 자동 초점 탐지: 페이지 로드 시 강제로 초점을 뺏는 autofocus 속성 식별
* - 인라인 핸들러 분석: onfocus, onchange 속성을 통해 예측 불가능한 동작 수행 여부 검토 유도
*/
class Processor321 {
  constructor() {
    this.id = "3.2.1";
    this.utils = window.ABTUtils;
  }

  /**
  * 문서 내 컨텍스트 변화를 유발할 수 있는 요소를 전수 조사합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const reports = [];
    const allElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');

    for (const el of allElements) {
      if (this.utils.isHidden(el)) continue;

      // 1. 인라인 이벤트 핸들러 확인 (onfocus, onblur, onchange)
      // 주의: addEventListener로 바인딩된 스크립트는 확장에서 감지할 수 없으므로 제한적입니다.
      const hasOnFocus = el.hasAttribute('onfocus');
      const hasOnBlur = el.hasAttribute('onblur');
      const hasOnChange = el.hasAttribute('onchange');

      if (hasOnFocus || hasOnBlur || hasOnChange) {
        reports.push(this.createReport(el, "검토 필요", `요소에 인라인 이벤트(onfocus/onblur/onchange)가 감지되었습니다. 요소에 초점이 가거나 입력값이 변경될 때 사용자가 예측하지 못한 창 열림, 양식 전송 등의 컨텍스트 변화가 발생하지 않는지 수동으로 확인하세요.`));
      }
      // 2. target="_blank" 이면서 경고 메시지 없는 링크
      if (el.tagName.toLowerCase() === 'a' && el.getAttribute('target') === '_blank') {
        const text = (el.innerText || "").trim().toLowerCase();
        const title = (el.getAttribute('title') || "").toLowerCase();
        const ariaLabel = (el.getAttribute('aria-label') || "").toLowerCase();

        const hasWarning = text.includes('새창') || text.includes('새 창') || text.includes('new window') ||
        title.includes('새창') || title.includes('새 창') || title.includes('new window') ||
        ariaLabel.includes('새창') || ariaLabel.includes('새 창');

        if (!hasWarning) {
          reports.push(this.createReport(el, "수정 권고", "새 창으로 열리는 링크입니다. 요소 활성화 시 컨텍스트가 변할 수 있으므로, 텍스트나 title 속성에 '새 창' 등의 사전 안내를 제공할 것을 권장합니다."));
        }
      }
    }

    // 3. 페이지 로드 시 자동 포커스 (Autofocus)
    const autoFocusEl = document.querySelector('[autofocus]');
    if (autoFocusEl) {
      reports.push(this.createReport(autoFocusEl, "검토 필요", "페이지 로드 시 특정 요소에 자동으로 초점(autofocus)이 이동됩니다. 사용자가 원치 않는 컨텍스트 변화가 아닌지 확인하세요."));
    }

    return reports;
  }

  createReport(el, status, message, rules = ["Rule 3.2.1 (On Focus Context Change)"]) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: {
        smartContext: this.utils.getSmartContext(el, 50)
      },
      result: {
        status: status,
        message: message,
        rules: rules
      },
      currentStatus: status,
      history: [{
        timestamp: new Date().toLocaleTimeString(),
        status: "탐지",
        comment: message
      }]
    };
  }
}

if (window.ABTCore) {
  window.ABTCore.registerProcessor("3.2.1", new Processor321());
}
