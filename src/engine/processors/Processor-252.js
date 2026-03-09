/**
* ABT Processor 2.5.2 (Pointer Abort)
*
* KWCAG 2.2 지침 2.5.2 포인터 입력 취소
* 터치나 클릭 시, 요소를 누르는 순간 기능이 실행되지 않고 떼는 순간 실행되어 실수를 방지하고 취소할 기회를 주어야 합니다.
*
* [진단 범위]
* - 모든 대화형 요소 및 인라인 이벤트 핸들러가 있는 요소
*
* [주요 로직]
* - 이벤트 의존성 분석: mousedown/touchstart 단계에서만 작동하고 click/mouseup 단계의 처리가 누락된 요소 탐지
* - 인라인 속성 검사: 속성 레벨에서 즉각 실행 로직이 구현된 경우 수동 검토 권고
*/
class Processor252 {
  constructor() {
    this.id = "2.5.2";
    this.utils = window.ABTUtils;
  }

  /**
  * 문서 내 입력 취소 가능 여부(이벤트 실행 시점)를 진단합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    // 포인터 입력 취소는 mousedown/touchstart 단계에서만 이벤트가 발생하는지 검사합니다.
    // 기술적 한계: JavaScript(addEventListener)로 등록된 동적 리스너는 탐지가 불가능하여 인라인 속성 위주로 분석합니다.
    const allElements = document.querySelectorAll('a, button, [role="button"], [onclick], [onmousedown], [ontouchstart]');
    const reports = [];

    for (const el of allElements) {
      if (this.utils.isHidden(el)) continue;

      // 인라인 핸들러 검사
      const hasMouseDown = el.hasAttribute('onmousedown');
      const hasTouchStart = el.hasAttribute('ontouchstart');
      const hasMouseUp = el.hasAttribute('onmouseup');
      const hasTouchEnd = el.hasAttribute('ontouchend');
      const hasClick = el.hasAttribute('onclick');

      if ((hasMouseDown || hasTouchStart) && !hasMouseUp && !hasTouchEnd && !hasClick) {
        reports.push(this.createReport(el, "검토 필요", "이 요소에는 누르는 즉시(onmousedown/ontouchstart) 기능이 실행될 가능성이 있는 인라인 핸들러가 포함되어 있습니다. 마우스 버튼을 떼기 전에 동작을 취소할 수 있는지 수동으로 확인하세요."));
      }
    }

    return reports;
  }

  createReport(el, status, message) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: { smartContext: "포인터 다운 이벤트 핸들러가 감지되었습니다." },
      result: {
        status: status,
        message: message,
        rules: ["Rule 2.5.2 (Pointer Abort)"]
      },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.5.2", new Processor252()); }
