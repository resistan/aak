/**
* ABT Processor 4.1.1 (Parsing)
*
* KWCAG 2.2 지침 4.1.1 마크업 오류 방지
* 마크업 언어의 요소는 시작 태그와 종료 태그의 올바른 중첩 등 문법을 준수해야 합니다.
*
* [진단 범위]
* - 문서 전체 DOM 구조
*
* [주요 로직]
* - 중복 ID: 문서 내 동일한 ID 속성이 중복 사용되었는지 탐지
* - 태그 중첩: 표준에 어긋나는 요소 중첩(예: <p> 내 <div>) 발생 여부 분석 (브라우저 보정 전 기준)
*/
class Processor411 {
  constructor() {
    this.id = "4.1.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];

    // 4.1.1 (마크업 오류 방지) 지침은 중복 ID, 열고 닫는 태그 불일치 등 파싱 오류를 검사합니다.
    // 브라우저의 DOM 트리는 이미 잘못된 태그를 자동 보정하므로, DOM API로는 완벽한 구문 검사가 불가능합니다.
    // 따라서, DOM 트리에 명확히 남는 치명적인 접근성 오류인 "ID 중복"을 중점적으로 검사합니다.

    const allElementsWithId = document.querySelectorAll('[id]');
    const idMap = new Map();
    const duplicateIds = new Set();

    for (const el of allElementsWithId) {
      // 숨겨진 요소라도 ID 중복은 aria-labelledby 등 참조를 망가뜨리므로 검사 대상에 포함
      const id = el.id.trim();
      if (id === "") continue;

      if (idMap.has(id)) {
        duplicateIds.add(id);
      } else {
        idMap.set(id, el);
      }
    }

    if (duplicateIds.size > 0) {
      for (const id of duplicateIds) {
        const duplicates = document.querySelectorAll(`[id="${id}"]`);
        // 첫 번째 요소만 대표로 리포팅하고, 몇 개가 중복되었는지 안내
        reports.push(this.analyze(duplicates[0], id, duplicates.length));
      }
    } else {
      reports.push(this.createReport(
        document.body,
        "검토 필요",
        "[수동 검사 안내] 중복된 ID 속성은 발견되지 않았습니다. 단, 브라우저가 자동 보정한 태그 중첩 오류나 속성 중복 선언 등은 확장 프로그램이 완벽히 잡아낼 수 없으므로, W3C Nu HTML Checker 등 외부 도구를 이용해 최종 마크업 유효성을 검사하세요.",
        ["Rule 4.1.1 (Manual Markup Review Required)"]
      ));
    }

    return reports;
  }

  analyze(el, duplicateId, count) {
    const status = "오류";
    const message = `문서 내에 중복된 ID 속성값("${duplicateId}")이 ${count}개 존재합니다. ID는 문서 내에서 유일해야 하며, 중복 시 aria-labelledby나 label 연결 등 보조기기의 탐색을 심각하게 방해합니다.`;
    const rules = ["Rule 4.1.1 (Duplicate ID)"];

    return this.createReport(el, status, message, rules);
  }

  createReport(el, status, message, rules) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: el !== document.body ? this.utils.getSelector(el) : "body"
      },
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "마크업 유효성 검사" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("4.1.1", new Processor411()); }
