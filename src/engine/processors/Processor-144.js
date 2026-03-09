/**
* ABT Processor 1.4.4 (Content Differentiation)
*
* KWCAG 2.2 지침 1.4.4 콘텐츠 간의 구분
* 테두리, 구분선, 배경색 등을 사용하여 이웃한 콘텐츠가 시각적으로 구분되어야 합니다.
*
* [진단 범위]
* - 입력 필드(Input, Select, Textarea)
* - 인접한 버튼 그룹
* - 주요 레이아웃 블록
*
* [주요 로직]
* - 입력 필드 구분: 배경색과 부모 배경색의 차이, 또는 테두리 존재 여부 확인
* - 버튼 간격 검사: 인접한 버튼 사이의 물리적 간격을 측정하여 너무 좁은 경우 탐지
* - 시각적 숨김 필터: isHidden()을 사용하여 실제 보이는 콘텐츠에 대해서만 구분 검사 수행
*/
class Processor144 {
  constructor() {
    this.id = "1.4.4";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];

    // 1. 입력 필드 및 버튼 구분 검사
    const inputs = document.querySelectorAll('input, select, textarea');
    for (const el of inputs) {
      if (this.utils.isHidden(el)) continue;

      const style = window.getComputedStyle(el);
      const border = style.borderWidth;
      const borderStyle = style.borderStyle;
      const bgColor = style.backgroundColor;
      const parentBg = window.getComputedStyle(el.parentElement).backgroundColor;

      const hasVisibleBorder = border !== '0px' && borderStyle !== 'none';
      const hasBgDifference = bgColor !== parentBg && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';

      if (!hasVisibleBorder && !hasBgDifference) {
        reports.push(this.createReport(el, "수정 권고", "입력 필드가 배경과 시각적으로 잘 구분되지 않습니다. 테두리나 배경색을 달리하여 입력 영역을 명확히 구분하세요."));
      }
    }

    // 2. 인접한 버튼 간의 간격 확인
    const buttons = Array.from(document.querySelectorAll('button')).filter(el => !this.utils.isHidden(el));
    for (let i = 0; i < buttons.length - 1; i++) {
      const b1 = buttons[i];
      const b2 = buttons[i+1];
      if (b1.parentElement === b2.parentElement) {
        const rect1 = b1.getBoundingClientRect();
        const rect2 = b2.getBoundingClientRect();
        const horizontalGap = Math.abs(rect2.left - rect1.right);
        if (horizontalGap < 2 && rect1.width > 0 && rect2.width > 0) {
          reports.push(this.createReport(b1, "검토 필요", "인접한 버튼 간의 간격이 매우 좁습니다. 시각적 구분선이나 충분한 여백이 있는지 확인하세요."));
        }
      }
    }

    // 3. 대형 레이아웃 영역 구분 검사 (전역 검토 유도)
    reports.push({
      guideline_id: this.id,
      elementInfo: { tagName: "document", selector: "body" },
      context: { smartContext: "레이아웃 블록 구분 검토" },
      result: {
        status: "검토 필요",
        message: "웹 페이지의 주요 영역(헤더, 본문, 사이드바 등)이 테두리, 구분선, 배경색 또는 여백을 통해 시각적으로 명확하게 구분되는지 확인하세요.",
        rules: ["Rule 1.4.4 (Layout Differentiation)"]
      },
      currentStatus: "검토 필요",
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "레이아웃 시각적 구분 검토 필요" }]
    });

    return reports;
  }

  createReport(el, status, message) {
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
        rules: ["Rule 1.4.4 (Visual Distinction)"]
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

if (window.ABTCore) { window.ABTCore.registerProcessor("1.4.4", new Processor144()); }
