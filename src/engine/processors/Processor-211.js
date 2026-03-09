/**
* ABT Processor 2.1.1 (Keyboard Accessibility)
*
* KWCAG 2.2 지침 2.1.1 키보드 사용 보장
* 모든 기능은 마우스 없이 키보드만으로도 사용할 수 있어야 합니다.
*
* [진단 범위]
* - 대화형 요소 (<a>, <button>, <input> 등)
* - 클릭 이벤트 핸들러가 있는 모든 비표준 요소
* - 모달 대화상자 ([role="dialog"])
*
* [주요 로직]
* - [케이스 A] 미보장 탐지: 클릭 핸들러가 있으나 tabindex가 없는 요소
* - [케이스 B] 접근 차단: 대화형 요소인데 tabindex="-1"로 포커스가 막힌 경우
* - [케이스 C] 순서 왜곡: tabindex가 0보다 큰 양수인 경우
* - [케이스 D] 모달 검토: 닫기 버튼 부재 또는 Focus Trap 가능성 탐지
*/
class Processor211 {
  constructor() {
    this.id = "2.1.1";
    this.utils = window.ABTUtils;
    // 포커스가 가야 하는 대화형 태그 목록
    this.interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];
  }

  /**
  * 문서 내 모든 요소의 키보드 접근성 및 포커스 가능 여부를 진단합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const reports = [];

    // 1. 모든 요소 탐색 (이벤트 리스너가 있는 비표준 요소 찾기 위해)
    const allElements = document.querySelectorAll('*');

    for (const el of allElements) {
      const report = this.analyze(el);
      if (report) {
        reports.push(report);
      }
    }

    return reports;
  }

  analyze(el) {
    const tagName = el.tagName.toLowerCase();
    const hasClick = el.onclick || el.getAttribute('onclick');
    const hasTabindex = el.hasAttribute('tabindex');
    const tabindex = parseInt(el.getAttribute('tabindex') || '0', 10);
    const role = el.getAttribute('role');
    const isInteractiveTag = this.interactiveTags.includes(tagName);
    const ariaModal = el.getAttribute('aria-modal') === 'true';

    // [케이스 D] 모달 대화상자 탐지 (키보드 트랩 및 초점 가둠 검토)
    if (role === 'dialog' || role === 'alertdialog' || ariaModal) {
      // 모달 내부에 명확한 닫기 버튼이 있는지 추가 확인
      const hasCloseButton = Array.from(el.querySelectorAll('button, [role="button"], a[href]')).some(child => {
        const text = child.textContent.toLowerCase() + (child.getAttribute('aria-label') || "").toLowerCase() + (child.getAttribute('title') || "").toLowerCase();
        return text.includes('닫기') || text.includes('close') || text.includes('취소') || text.includes('cancel') || text.includes('x');
      });

      if (!hasCloseButton) {
        return this.createReport(el, "검토 필요", "모달 대화상자가 탐지되었으나, 내부에서 명확한 닫기 버튼(텍스트 '닫기', 'X' 등)을 찾을 수 없습니다. 사용자가 키보드(Esc 키 등)나 다른 수단으로 이 영역을 빠져나갈 수 있는지 반드시 확인하세요.", ["Rule 3.1 (Modal Exit)"]);
      } else {
        return this.createReport(el, "검토 필요", "모달 대화상자가 탐지되었습니다. 닫기 버튼은 존재하나, 키보드 초점이 모달 내부에 정상적으로 갇히는지(Focus Trap)와 닫힌 후 원래 위치로 초점이 복귀하는지 수동으로 검토하세요.", ["Rule 3.1 (Modal Trapping)"]);
      }
    }

    if (!isInteractiveTag && hasClick && !hasTabindex && !['presentation', 'none'].includes(role)) {
      return this.createReport(el, "오류", "요소에 클릭 이벤트가 있으나 키보드 포커스(tabindex)가 제공되지 않았습니다. 키보드만 사용하는 사용자는 이 기능을 실행할 수 없습니다.");
    }

    // [케이스 A-2] 비표준 대화형 요소인데 role이 누락된 경우 (의미 전달 결함)
    if (!isInteractiveTag && hasClick && hasTabindex && !role) {
      return this.createReport(el, "수정 권고", "키보드로 접근은 가능하나, 요소의 역할(role='button' 등)이 명시되지 않았습니다. 스크린 리더 사용자를 위해 적절한 role 속성 추가를 권장합니다.");
    }

    // [케이스 B] 대화형 요소인데 tabindex="-1"로 포커스가 차단된 경우
    if (isInteractiveTag && hasTabindex && tabindex < 0) {
      // 의도적인 숨김(aria-hidden 등)이 아닌 경우만 체크
      if (el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null) {
        return this.createReport(el, "수정 권고", "대화형 요소에 tabindex='-1'이 설정되어 키보드 포커스가 차단되었습니다. 의도적인 처리가 아니라면 수정을 권고합니다.");
      }
    }

    // [케이스 C] tabindex가 0보다 큰 경우 (탭 순서 왜곡)
    if (hasTabindex && tabindex > 0) {
      return this.createReport(el, "수정 권고", "tabindex가 0보다 크게 설정되어 자연스러운 탭 순서를 방해합니다. tabindex='0' 또는 마크업 순서 조정을 권장합니다.");
    }

    if (hasClick && !el.onkeydown && !el.onkeypress && !isInteractiveTag) {
      return this.createReport(el, "검토 필요", "클릭 핸들러는 있으나 키보드 이벤트(keydown 등) 핸들러가 감지되지 않았습니다. Enter/Space 키로 작동하는지 확인하세요.");
    }

    if (isInteractiveTag || hasClick || hasTabindex) {
      return this.createReport(el, "적절", "키보드 접근성이 보장된 요소입니다.");
    }
    return null;
  }

  createReport(el, status, message) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: {
        smartContext: this.utils.getSmartContext(el, 50),
        tabindex: el.getAttribute('tabindex'),
        role: el.getAttribute('role')
      },
      result: {
        status: status,
        message: message,
        rules: ["Rule 1.1 (Keyboard Interaction)"]
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
  window.ABTCore.registerProcessor("2.1.1", new Processor211());
}
