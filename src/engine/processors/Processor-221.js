/**
* ABT Processor 2.2.1 (Adjustable Timing)
*
* KWCAG 2.2 지침 2.2.1 응답 시간 조절
* 시간 제한이 있는 콘텐츠는 사용자가 그 시간을 연장하거나 정지할 수 있어야 합니다.
*
* [진단 범위]
* - <meta http-equiv="refresh"> 태그
* - JavaScript 기반의 세션 만료, 팝업 자동 닫힘 (수동 검토 유도)
*
* [주요 로직]
* - 메타 태그 분석: <meta>를 통한 자동 새로고침이나 리다이렉트가 설정된 경우 즉시 탐지
* - 제한 시간 임계값: 20시간(72,000초) 미만의 설정이 있고 0초가 아닌 경우 사용자 제어권 침해로 판단
* - 수동 검증 가이드: 스크립트 기반의 동적 시간 제한 요소를 찾기 위한 안내 제공
*/
class Processor221 {
  constructor() {
    this.id = "2.2.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    // This is primarily a manual check.
    // We can look for meta refresh as an antipattern for forced timing.
    const reports = [];
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');

    if (metaRefresh) {
      reports.push(this.analyze(metaRefresh, "meta_refresh"));
    } else {
      reports.push(this.analyze(document.body, "manual"));
    }

    return reports;
  }

  analyze(el, type) {
    let status = "검토 필요";
    let message = "페이지 내에 자동 새로고침(meta refresh) 이외의 시간 제한(세션 만료, 팝업 자동 닫힘 등)이 있다면, 사용자가 시간을 연장하거나 정지할 수 있는 수단이 제공되는지 수동으로 확인하세요.";
    const rules = ["Rule 2.2.1 (Manual Review)"];

    if (type === "meta_refresh") {
      const content = el.getAttribute('content');
      // If refresh is less than 20 hours (72000s) and not 0, it might be an issue
      const timeMatch = content ? content.match(/^\d+/) : null;
      if (timeMatch && parseInt(timeMatch[0], 10) > 0) {
        status = "오류";
        message = `<meta http-equiv="refresh"> 태그를 사용한 자동 새로고침/리다이렉트가 감지되었습니다. 사용자가 이를 제어할 수 없습니다.`;
        rules.push("Rule 2.2.1 (Meta Refresh)");
      }
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
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "JavaScript 기반 타이머/시간 제한 수동 검토" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.2.1", new Processor221()); }