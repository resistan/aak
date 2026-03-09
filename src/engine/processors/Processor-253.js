/**
* ABT Processor 2.5.3 (Label in Name)
*
* KWCAG 2.2 지침 2.5.3 레이블과 네임
* 텍스트 또는 텍스트 이미지가 포함된 인터페이스 구성 요소의 레이블(Label)과 보조 공학 기기가 인식하는 이름(Name)이 일치해야 합니다.
*
* [진단 범위]
* - <a>, <button>, <label> 요소
*
* [주요 로직]
* - 가시적 레이블 추출: 요소 표면에 보이는 텍스트 확인
* - 프로그래밍적 이름 추출: aria-label, aria-labelledby 등 속성 확인
* - 일치 여부: 가시적 레이블이 프로그래밍적 이름의 일부로 포함되어 있는지 검증
*/
class Processor253 {
  constructor() {
    this.id = "2.5.3";
    this.utils = window.ABTUtils;
  }

  async scan() {
    // 2.5.3 지침은 사용자가 조작 가능한 '대화형 요소'에 적용됩니다.
    const interactiveElements = document.querySelectorAll('a, button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [role="link"], label');
    const reports = [];

    for (const el of interactiveElements) {
      if (this.utils.isHidden(el)) continue;

      const report = this.analyze(el);
      if (report) reports.push(report);
    }
    return reports;
  }

  analyze(el) {
    // W3C AccName 1.2 규칙에 따른 '프로그램적 네임(Accessible Name)'과
    // 화면에 표시되는 '시각적 레이블(Visible Label)'을 비교합니다.

    // 1. 시각적 레이블 추출 (화면에 렌더링된 텍스트)
    const visibleText = el.innerText ? el.innerText.trim() : "";

    // 시각적 텍스트가 없는 요소(예: 아이콘만 있는 버튼)는 2.5.3 검사 대상이 아닙니다.
    // 2.5.3은 "시각적 레이블이 있는 경우, 그것이 프로그램적 네임에 포함되어야 한다"는 지침입니다.
    if (!visibleText) return null;

    // 2. 프로그램적 네임(Accessible Name) 추출 (우선순위: aria-labelledby > aria-label > native > title)
    // 참고: 텍스트 노드 자체가 네임이 되는 경우는 위 visibleText와 100% 동일하므로 검사할 필요가 없습니다.
    // 따라서 명시적으로 '네임을 덮어쓰는(Override)' 속성이 있는 경우만 검사합니다.
    if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby') && !el.hasAttribute('title') && !el.hasAttribute('alt')) {
      return null;
    }

    // W3C AccName 1.2 경량 알고리즘 적용 (유틸리티 사용)
    const accName = this.utils.getAccessibleName(el);

    // 3. 비교를 위한 문자열 정규화 (Normalization)
    // 사용자 눈에 보이는 구두점, 대소문자, 다중 공백의 차이로 인해 오탐이 발생하지 않도록 합니다.
    const normalize = (str) => {
      if (!str) return "";
      // 대소문자 통일, 특수기호/구두점 제거, 연속된 공백 하나로 압축
      return String(str)
      .toLowerCase()
      .replace(/[.,!?'"(){}[\]<>-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    };

    const normVisible = normalize(visibleText);
    const normAccName = normalize(accName);

    // 4. 판단: 프로그램적 네임이 존재하고, 시각적 텍스트가 포함되어 있지 않으면 오류
    if (normAccName && normVisible && !normAccName.includes(normVisible)) {
      return this.createReport(
        el,
        "오류",
        `시각적 레이블("${visibleText}")이 프로그램적 네임("${accName}")에 포함되어 있지 않습니다. 음성 제어 사용자의 혼란을 방지하기 위해 시각적 텍스트를 네임의 시작 부분에 포함하세요.`,
        ["Rule 2.5.3 (Label in Name)"],
        visibleText,
        accName
      );
    }

    return null;
  }

  createReport(el, status, message, rules, visibleText, accName) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: {
        smartContext: `Visual: "${visibleText}" / AccName: "${accName}"`
      },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.5.3", new Processor253()); }
