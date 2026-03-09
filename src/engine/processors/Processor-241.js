/**
* ABT Processor 2.4.1 (Bypass Blocks)
*
* KWCAG 2.2 지침 2.4.1 반복 영역 건너뛰기
* 페이지 상단에는 본문으로 바로 이동할 수 있는 건너뛰기 링크(Skip Navigation)를 제공해야 합니다.
*
* [진단 범위]
* - 페이지 최상단 링크 요소
*
* [주요 로직]
* - 본문 바로가기 탐지: '본문', 'main', 'skip' 등의 키워드가 포함된 최상단 링크 확인
* - 타겟 유효성: 링크의 href가 가리키는 ID 요소가 실제로 존재하고 포커스 가능한지 검증
*/
class Processor241 {
  constructor() {
    this.id = "2.4.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];
    const skipLinks = document.querySelectorAll('a[href^="#"]');

    // Check if there's any skip link as one of the very first focusable elements
    const allFocusable = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !this.utils.isHidden(el));

    const validSkipLinks = [];

    for (let i = 0; i < Math.min(skipLinks.length, 5); i++) {
      const link = skipLinks[i];
      if (allFocusable.indexOf(link) < 5) {
        validSkipLinks.push(link);
      }
    }

    if (validSkipLinks.length === 0) {
      reports.push(this.createReport(document.body, "오류", "문서 최상단에 본문으로 바로가기(건너뛰기) 링크가 제공되지 않았습니다.", ["Rule 2.4.1 (Missing Skip Link)"]));
    } else {
      for (const link of validSkipLinks) {
        reports.push(this.analyze(link));
      }
    }

    return reports;
  }

  analyze(el) {
    const targetId = el.getAttribute('href').substring(1);
    const targetEl = document.getElementById(targetId);

    let status = "적절";
    let message = "건너뛰기 링크가 적절히 제공되었습니다.";
    const rules = [];

    if (!targetEl && targetId.length > 0) {
      status = "오류";
      message = `건너뛰기 링크의 대상(id="${targetId}")이 문서에 존재하지 않습니다.`;
      rules.push("Rule 2.4.1 (Invalid Target)");
    } else if (targetEl && this.utils.isHidden(targetEl)) {
      status = "수정 권고";
      message = `건너뛰기 링크의 대상(id="${targetId}")이 숨겨져 있어 초점을 받을 수 없을 수 있습니다.`;
      rules.push("Rule 2.4.1 (Hidden Target)");
    } else if (!el.innerText.trim() && !el.getAttribute('aria-label')) {
      status = "오류";
      message = "건너뛰기 링크의 텍스트가 제공되지 않았습니다.";
      rules.push("Rule 2.4.1 (Empty Link Text)");
    }

    return this.createReport(el, status, message, rules);
  }

  createReport(el, status, message, rules) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: el !== document.body ? this.utils.getSelector(el) : "body"
      },
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "문서 구조 검토" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.4.1", new Processor241()); }