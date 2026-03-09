/**
* ABT Processor 2.1.3 (Touch Target Size)
*
* KWCAG 2.2 지침 2.1.3 조작 가능
* 사용자 입력이 가능한 대화형 요소는 오작동을 방지하기 위해 충분한 크기의 터치 타겟을 제공해야 합니다.
*
* [진단 범위]
* - 모든 대화형 요소 (<a>, <button>, <input> 등)
* - role="button", role="link" 등이 부여된 요소
* - 단, 문장 내에 포함된 인라인 링크(inline links)는 예외 대상으로 간주
*
* [주요 로직]
* - 물리적 크기 측정: getBoundingClientRect()를 사용하여 요소의 실제 렌더링 너비와 높이 산출
* - 기준값 검증: KWCAG 2.2 권장 기준인 최소 24x24px(또는 상황에 따라 44x44px) 미만인 요소 탐지
* - 시각적 숨김 필터: isHidden()을 사용하여 실제 보이지 않는 요소는 제외
*/
class Processor213 {
  constructor() {
    this.id = "2.1.3";
    // window.ABTUtils가 정의되어 있는지 확인 (런타임 안정성 강화)
    this.utils = window.ABTUtils || { isHidden: () => false, getSelector: (el) => el.tagName, getSmartContext: () => "" };
  }

  /**
  * 문서 내 모든 대화형 요소의 터치 타겟 크기를 전수 조사합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const interactables = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="menuitem"]');
    const reports = [];

    for (const el of interactables) {
      // Inline links inside text blocks are usually exempt
      if (el.tagName.toLowerCase() === 'a' && window.getComputedStyle(el).display === 'inline') {
        continue;
      }

      // utils.isHidden 메서드가 존재하는지 다시 한번 확인
      if (this.utils && typeof this.utils.isHidden === 'function') {
        if (this.utils.isHidden(el)) continue;
      }

      reports.push(this.analyze(el));
    }
    return reports;
  }

  analyze(el) {
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    let status = "적절";
    let message = `터치 타겟 크기가 충분합니다. (${Math.round(width)}x${Math.round(height)}px)`;
    const rules = [];

    // KWCAG 2.2: 최소 24x24px 권장
    if (width > 0 && height > 0 && (width < 24 || height < 24)) {
      status = "검토 필요";
      message = `터치 타겟 크기가 너무 작을 수 있습니다 (${Math.round(width)}x${Math.round(height)}px). 모바일 환경인 경우 약 24px 이상인지 확인하세요.`;
      rules.push("Rule 2.1.3 (Small Target Size)");
    }

    return this.createReport(el, status, message, rules, width, height);
  }

  createReport(el, status, message, rules, width, height) {
    const selector = (this.utils && typeof this.utils.getSelector === 'function')
    ? this.utils.getSelector(el)
    : el.tagName;

    const smartContext = (this.utils && typeof this.utils.getSmartContext === 'function')
    ? this.utils.getSmartContext(el)
    : "";

    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: selector,
      },
      context: { smartContext: `Size: ${Math.round(width)}x${Math.round(height)}px | ${smartContext}` },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) {
  window.ABTCore.registerProcessor("2.1.3", new Processor213());
}
