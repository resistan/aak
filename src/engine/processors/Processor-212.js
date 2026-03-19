/**
* ABT Processor 2.1.2 (초점 이동과 표시)
*
* KWCAG 2.2 지침 2.1.2 초점 이동과 표시
* 키보드로 초점이 진입한 요소에서 다시 빠져나올 수 있어야 하며(Focus Trap 방지), 초점의 위치가 시각적으로 표시되어야 합니다.
*
* [진단 범위]
* - 모든 대화형 요소
*
* [주요 로직]
* - 인라인 outline:none 탐지: 인라인 스타일로 포커스 인디케이터가 강제 제거된 요소 자동 검출
* - 양수 tabindex 탐지: 논리적 초점 순서를 방해하는 tabindex > 0 요소 검출
* - 수동 검사 안내 (2건):
*   1. 초점 이동 순서 — 초점 시각화 도구를 활용한 Tab 순서 확인
*   2. 초점 아웃라인 표시 — Tab 탐색 시 포커스 인디케이터 시각적 확인
*/
class Processor212 {
  constructor() {
    this.id = "2.1.2";
    this.utils = window.ABTUtils;
    this.focusableSelectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), details, summary';
  }

  async scan() {
    const reports = [];
    // 중복 요소 제거 (querySelectorAll 결과에 중복이 있을 수 있음)
    const focusableElements = [...new Set(document.querySelectorAll(this.focusableSelectors))];

    for (const el of focusableElements) {
      if (this.utils.isHidden(el)) continue;

      const report = await this.analyze(el);
      if (report) reports.push(report);
    }

    const tabindexedElements = Array.from(document.querySelectorAll('[tabindex]'))
    .filter(el => parseInt(el.getAttribute('tabindex') || '0', 10) > 0);

    const problematicTabindexes = tabindexedElements.filter(el => {
      // 페이지 상단 15% 이내(헤더/GNB 영역 등)에 시각적으로 위치해 있다면 예외 처리
      const rect = el.getBoundingClientRect();
      const isAtTopVisually = rect.top < window.innerHeight * 0.15;

      // DOM 트리 구조 상 최상위 그룹에 속하는지 계산 (단순화된 휴리스틱)
      let current = el;
      let isEarlyInDom = true;

      while (current && current !== document.body) {
        // 부모의 자식 요소 중 첫 5번째 이내에 들지 못하면 문서 뒤쪽으로 판단
        const index = Array.from(current.parentElement?.children || []).indexOf(current);
        if (index > 5) {
          isEarlyInDom = false;
          break;
        }
        current = current.parentElement;
      }

      // 시각적으로도 상단이 아니고, 마크업 구조로도 초반이 아닐 때만 문제로 간주
      return !(isAtTopVisually || isEarlyInDom);
    });

    if (problematicTabindexes.length > 0) {
      reports.push(this.createGeneralReport("수정 권고", `문서 중간/하단에 위치한 요소들에 양수 값의 tabindex(${problematicTabindexes.length}개)가 존재합니다. 이는 논리적인 초점 이동 순서를 방해할 수 있으므로, 가급적 DOM 구조를 통해 순서를 제어할 것을 권장합니다.`, "Rule 2.1.2 (Focus Order)"));
    }

    // 가시적인 포커스 가능 요소 개수 산출 (수동 검사 안내에 활용)
    const visibleFocusableCount = focusableElements.filter(el => !this.utils.isHidden(el)).length;

    // [수동 검사 1] 초점 이동 순서
    // :focus 상태 스타일은 정적 스캔으로 읽을 수 없으므로 전문가 직접 확인 필요
    reports.push(this.createGeneralReport(
      "검토 필요",
      `[수동 검사] 초점 이동 순서 — 총 ${visibleFocusableCount}개의 포커스 가능 요소가 확인되었습니다. 상단 툴바의 '초점 순서 시각화' 버튼을 켠 후 Tab 키로 페이지를 탐색하세요. 초점이 시각적 배치 및 콘텐츠의 논리적 흐름과 일치하는 순서로 이동하는지 확인하고 적절/오류로 판정하세요.`,
      "Rule 2.1.2 (Focus Order)"
    ));

    // [수동 검사 2] 초점 아웃라인 표시
    // CSS :focus 스타일은 정적 스캔으로 읽을 수 없으므로 전문가 직접 확인 필요
    reports.push(this.createGeneralReport(
      "검토 필요",
      `[수동 검사] 초점 아웃라인 표시 — 총 ${visibleFocusableCount}개의 포커스 가능 요소가 확인되었습니다. Tab 키로 각 요소를 순서대로 이동하면서 포커스 인디케이터(아웃라인, 배경색 변화 등)가 모든 요소에 명확하게 표시되는지 육안으로 확인하고 적절/오류로 판정하세요.`,
      "Rule 2.1.2 (Focus Visibility)"
    ));

    return reports;
  }

  async analyze(el) {
    // [수동 검사 항목으로 전환하는 이유]
    // window.getComputedStyle(el)은 요소가 현재 포커스를 받고 있지 않으면 :focus 상태의 스타일을 반환하지 않습니다.
    // 따라서 정적 스캔 상태에서는 브라우저의 기본 브라우저 스타일(outline)조차 잡히지 않아,
    // 정상적인 요소도 "outline이 없다"고 오탐(False Positive)하게 됩니다.
    // CSS 파싱을 통해 :focus 룰을 찾는 것은 CORS 이슈와 CSS-in-JS 환경 때문에 극히 불안정합니다.

    // 인라인 스타일로 outline: none을 하드코딩한 극단적인 안티 패턴만 잡고, 나머지는 수동 검사로 유도합니다.
    const inlineStyle = el.getAttribute('style') || "";
    const hasInlineOutlineNone = inlineStyle.replace(/\s/g, '').includes('outline:none') || inlineStyle.replace(/\s/g, '').includes('outline:0');

    if (hasInlineOutlineNone) {
      return this.createReport(el, "오류", "요소에 인라인 스타일로 outline: none이 적용되어 키보드 포커스가 강제로 제거되었습니다. 접근성에 치명적이므로 제거해야 합니다.");
    }

    // 나머지 모든 focusable 요소에 대해서는 일괄적으로 단일 수동 검사 리포트만 남기기 위해 null 반환.
    // scan() 함수에서 종합해서 리포팅합니다.
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
        outline: window.getComputedStyle(el).outline
      },
      result: { status, message, rules: ["Rule 2.1.2 (Focus Visibility)"] },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }

  createGeneralReport(status, message, rule = "Rule 2.1.2 (Focus Order)") {
    return {
      guideline_id: this.id,
      elementInfo: { tagName: 'BODY', selector: 'document' },
      context: { smartContext: "페이지 전체 초점 흐름 검사" },
      result: { status, message, rules: [rule] },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.1.2", new Processor212()); }
