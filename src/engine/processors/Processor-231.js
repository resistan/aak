/**
* ABT Processor 2.3.1 (Three Flashes or Below Threshold)
*
* KWCAG 2.2 지침 2.3.1 번쩍임 제한
* 광과민성 발작을 예방하기 위해 초당 3~50회의 주기로 번쩍이는 콘텐츠를 제공하지 않아야 합니다.
*
* [진단 범위]
* - <marquee>, <blink> 태그 (폐기 대상)
* - <video> 및 화려한 애니메이션 요소
*
* [주요 로직]
* - 레거시 태그 탐지: 웹 표준에서 금지된 marquee, blink 사용 시 즉시 오류 판정
* - 동적 미디어 식별: 비디오가 포함된 경우 광과민성 발작 주의 문구와 함께 수동 검토 유도
* - 전역 진단: 특정 요소가 없더라도 페이지 전체에 대해 번쩍임 여부를 확인하도록 안내
*/
class Processor231 {
  constructor() {
    this.id = "2.3.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];
    const elements = document.querySelectorAll('marquee, blink, video');

    if (elements.length > 0) {
      for (const el of elements) {
        reports.push(this.analyze(el));
      }
    } else {
      reports.push(this.analyze(document.body, true));
    }
    return reports;
  }

  analyze(el, isDocumentLevel = false) {
    let status = "검토 필요";
    let message = "초당 3~50회의 주기로 번쩍이는 콘텐츠가 있는지 수동으로 검토하세요. (광과민성 발작 주의)";
    const rules = ["Rule 2.3.1 (Manual Review)"];

    if (!isDocumentLevel) {
      if (["marquee", "blink"].includes(el.tagName.toLowerCase())) {
        status = "오류";
        message = `<${el.tagName.toLowerCase()}> 태그가 사용되었습니다. 이 태그는 접근성을 심각하게 저해하며 최신 웹 표준에서 폐기되었으므로 사용을 금지합니다.`;
        rules.push("Rule 2.3.1 (Deprecated Tags)");
      } else {
        message = "페이지 내에 동적 미디어 요소(비디오 등)가 감지되었습니다. 1초에 3회 이상 번쩍이는 콘텐츠가 포함되어 있는지 수동으로 확인하세요.";
        rules.push("Rule 2.3.1 (Check Media Content)");
      }
    }
    return this.createReport(el, status, message, rules);
  }

  createReport(el, status, message, rules) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: isNaN(el) && el !== document.body ? this.utils.getSelector(el) : "body"
      },
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "문서 전체 검토" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.3.1", new Processor231()); }