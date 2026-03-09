/**
* ABT Processor 3.2.2 (Consistent Help)
*
* KWCAG 2.2 지침 3.2.2 찾기 쉬운 도움 정보
* 도움말, 고객센터, 챗봇 등 지원 수단은 웹사이트 내에서 일관된 위치에 제공되어야 합니다.
*
* [진단 범위]
* - 도움말 관련 키워드가 포함된 모든 요소 (FAQ, 고객센터, 챗봇, help 등)
*
* [주요 로직]
* - 키워드 매칭: 텍스트 및 레이블 정보를 분석하여 지원 수단으로 추정되는 요소 식별
* - 위치 일관성 유도: 단일 페이지 스캔의 한계를 보완하기 위해 다른 페이지와의 위치 일관성 수동 검토 가이드 생성
*/
class Processor322 {
  constructor() {
    this.id = "3.2.2";
    this.utils = window.ABTUtils;
  }

  /**
  * 페이지 내 도움말 관련 요소의 존재 여부와 위치 일관성을 진단합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    // 3.2.2 (찾기 쉬운 도움 정보) 지침은 다중 페이지 간의 일관성을 요구합니다.
    // 단일 페이지 스캐너인 ABT 엔진은 이 일관성을 교차 검증할 수 없으므로,
    // 페이지 내에서 도움말 관련 요소(챗봇, FAQ, 고객센터 등)가 있는지 키워드로 탐지하고
    // 전문가에게 타 페이지와의 일관성 확인을 유도하는 '전면 수동 검사' 항목으로 동작합니다.

    const reports = [];
    const helpKeywords = ['faq', '고객센터', '도움말', '챗봇', '채팅', '문의', '연락처', 'help', 'contact', 'support', 'chat'];

    // 연락처나 도움말이 주로 위치하는 링크나 버튼 탐색
    const potentialHelpElements = document.querySelectorAll('a, button, [role="button"], [role="link"]');
    let foundHelpItems = [];

    for (const el of potentialHelpElements) {
      if (this.utils.isHidden(el)) continue;

      const text = (el.innerText || "").toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || "").toLowerCase();
      const title = (el.getAttribute('title') || "").toLowerCase();

      const isHelpRelated = helpKeywords.some(kw => text.includes(kw) || ariaLabel.includes(kw) || title.includes(kw));

      if (isHelpRelated) {
        foundHelpItems.push(el);
      }
    }

    if (foundHelpItems.length > 0) {
      // 너무 많은 리포트가 생성되는 것을 방지하기 위해 대표적인 요소 몇 개만 스냅샷으로 제공하거나 그룹화
      // 여기서는 첫 번째로 발견된 요소만 대표로 리포팅하고 전체 갯수를 알립니다.
      const el = foundHelpItems[0];
      const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || "").trim();

      reports.push({
        guideline_id: this.id,
        elementInfo: {
          tagName: el.tagName,
          selector: this.utils.getSelector(el)
        },
        context: { smartContext: `발견된 도움말 관련 키워드 텍스트: "${text}" 외 ${foundHelpItems.length - 1}건` },
        result: {
          status: "검토 필요",
          message: "[수동 검사 안내] 현재 페이지에서 도움말/문의 관련 요소가 탐지되었습니다. 이 웹사이트의 다른 페이지들에서도 이 요소가 동일한 상대적 순서와 위치(예: 하단 Footer, 우측 하단 플로팅)에 일관되게 제공되는지 수동으로 확인하세요.",
          rules: ["Rule 3.2.2 (Manual Consistency Check Required)"]
        },
        currentStatus: "검토 필요",
        history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "도움 정보(Help) 키워드 발견" }]
      });
    } else {
      // 키워드로 찾지 못한 경우에도 기본 안내를 제공 (N/A로 처리하되 수동 검사의 끈을 놓지 않음)
      reports.push({
        guideline_id: this.id,
        elementInfo: { tagName: "document", selector: "body" },
        context: { smartContext: "도움말 관련 키워드 미탐지" },
        result: {
          status: "N/A",
          message: "페이지 내에서 FAQ, 고객센터, 챗봇 등 명시적인 도움 정보 키워드가 탐지되지 않았습니다. 만약 이미지나 특이한 형태로 도움 정보가 존재한다면, 다른 페이지와 위치가 일관된지 확인하세요.",
          rules: ["Rule 3.2.2 (Help Keyword Not Found)"]
        },
        currentStatus: "N/A",
        history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "특이 사항 없음" }]
      });
    }

    return reports;
  }

  createReport(el, status, message, rules) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: el !== document.body ? this.utils.getSelector(el) : "body"
      },
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "키보드 탐색(Tab) 논리성 검토" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("3.2.2", new Processor322()); }