/**
 * ABT Processor 2.4.4 (Fixed Reference Location Information)
 * 
 * KWCAG 2.2 지침 2.4.4 고정된 참조 위치 정보
 * 웹 페이지가 종이 문서나 PDF 등 고정된 페이지 번호가 있는 매체와 병행 제공되는 경우, 해당 매체와 일치하는 위치 정보를 제공해야 합니다.
 * 
 * [진단 범위]
 * - 페이지 번호 관련 클래스/레이블 (.page-number, [aria-label*="페이지"] 등)
 * - 문서 전체 (Body 레벨)
 * 
 * [주요 로직]
 * - 휴리스틱 탐지: 페이지 번호 표시로 추정되는 요소를 찾아 원본 매체와의 일관성 검토 유도
 * - 수동 가이드 자동 생성: 기계적으로 매체 일관성을 100% 확인할 수 없으므로 모든 페이지에 기본 검토 안내 발행
 */

class Processor244 {
  constructor() {
    this.id = "2.4.4";
    this.utils = window.ABTUtils;
  }

  /**
   * 원본 매체와 웹 페이지 간의 참조 위치 일관성을 진단합니다.
   * @returns {Promise<Array>} 진단 결과 리포트 배열
   */
  async scan() {
    const reports = [];
    
    // 1. 명시적인 표준 마크업 탐지 (오탐 방지를 위해 매우 보수적으로 접근)
    const explicitMarkers = document.querySelectorAll('[role="doc-pagebreak"], [epub\\:type="pagebreak"]');

    if (explicitMarkers.length > 0) {
      for (const el of explicitMarkers) {
        reports.push(this.createReport(el, "검토 필요", `표준 페이지 마커('${el.innerText.trim() || '숨겨진 마커'}')가 탐지되었습니다. 원본 매체(PDF 등)와 위치 정보가 일치하는지 확인하세요.`));
      }
    }

    // 2. 기본적으로는 모든 페이지에 대해 '참고자료'로 안내만 제공 (점수 미반영)
    reports.push({
      guideline_id: this.id,
      elementInfo: { tagName: "document", selector: "body" },
      context: { smartContext: "원본 매체와의 참조 위치 일관성 안내" },
      result: { 
        status: "참고자료", 
        message: "이 지침은 전자책(EPUB)이나 PDF 등 고정된 페이지 번호가 있는 매체와 병행 제공되는 경우에만 해당됩니다. 필요 시 수동으로 검토하세요.",
        rules: ["Rule 2.4.4 (Fixed Reference Location)"]
      },
      currentStatus: "참고자료",
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "안내 정보 생성" }]
    });

    return reports;
  }

  createReport(el, status, message, rules = ["Rule 2.4.4 (Page Reference Detection)"]) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: { smartContext: `Detected text: "${el.innerText.trim()}"` },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.4.4", new Processor244()); }
