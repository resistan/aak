/**
* ABT Processor 2.4.1 (Bypass Blocks)
*
* KWCAG 2.2 지침 2.4.1 반복 영역 건너뛰기
* 페이지 상단에는 본문으로 바로 이동할 수 있는 건너뛰기 링크(Skip Navigation)를 제공해야 합니다.
*
* [진단 범위]
* - 페이지 최상단의 건너뛰기 링크 그룹
*
* [주요 로직]
* - 그룹 탐지: 첫 번째 a[href^="#"]가 포커스 가능 요소 5번째 이내에 있으면 건너뛰기 링크 그룹으로 인정
* - 그룹 수집: 첫 번째 건너뛰기 링크부터 연속된 a[href^="#"] 전체를 그룹으로 수집
* - 개별 검사: 그룹 내 각 링크의 대상 유효성(target ID 존재·가시성), 링크 텍스트 존재 여부 검사
* - 수동 검사: 포커스 시 링크 자체가 화면에 표시되는지 전문가 육안 확인 안내
*/
class Processor241 {
  constructor() {
    this.id = "2.4.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];

    const allFocusable = Array.from(document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !this.utils.isHidden(el));

    // 최상단 건너뛰기 링크 그룹 수집
    // 조건: 첫 번째 a[href^="#"]가 포커스 순서 5번째 이내에 위치해야 유효
    const skipLinkGroup = [];
    let groupStarted = false;

    for (let i = 0; i < allFocusable.length; i++) {
      const el = allFocusable[i];
      const isSkipLink = el.tagName === 'A' && (el.getAttribute('href') || '').startsWith('#');

      if (isSkipLink) {
        if (!groupStarted) {
          // 첫 번째 건너뛰기 링크가 5번째 이후면 건너뛰기 링크 없는 것으로 판단
          if (i >= 5) break;
          groupStarted = true;
        }
        skipLinkGroup.push(el);
      } else if (groupStarted) {
        // 건너뛰기 링크 그룹이 끊기면 수집 종료
        break;
      } else if (i >= 4) {
        // 아직 그룹 시작 전인데 5번째 이후면 없는 것으로 판단
        break;
      }
    }

    if (skipLinkGroup.length === 0) {
      reports.push(this.createReport(
        document.body,
        "오류",
        "문서 최상단에 본문으로 바로가기(건너뛰기) 링크가 제공되지 않았습니다.",
        ["Rule 2.4.1 (Missing Skip Link)"]
      ));
      return reports;
    }

    // 그룹 내 각 링크 개별 검사 (대상 유효성, 링크 텍스트)
    for (const link of skipLinkGroup) {
      reports.push(this.analyze(link));
    }

    // 포커스 시 가시성은 정적 스캔으로 판단 불가 → 수동 검사 안내 1건 추가
    reports.push(this.createReport(
      document.body,
      "검토 필요",
      `[수동 검사] 초점 가시성 — 총 ${skipLinkGroup.length}개의 건너뛰기 링크가 확인되었습니다. Tab 키로 페이지에 진입했을 때 건너뛰기 링크가 화면에 표시되는지 직접 확인하세요.`,
      ["Rule 2.4.1 (Focus Visibility)"]
    ));

    return reports;
  }

  analyze(el) {
    const href = el.getAttribute('href') || '';
    const targetId = href.startsWith('#') ? href.substring(1) : '';
    const targetEl = targetId ? document.getElementById(targetId) : null;

    let status = "적절";
    let message = `건너뛰기 링크("${el.innerText.trim() || el.getAttribute('aria-label') || targetId}")가 적절히 제공되었습니다.`;
    const rules = [];

    if (!el.innerText.trim() && !el.getAttribute('aria-label')) {
      status = "오류";
      message = "건너뛰기 링크의 텍스트가 제공되지 않았습니다.";
      rules.push("Rule 2.4.1 (Empty Link Text)");
    } else if (!targetEl && targetId.length > 0) {
      status = "오류";
      message = `건너뛰기 링크의 대상(id="${targetId}")이 문서에 존재하지 않습니다.`;
      rules.push("Rule 2.4.1 (Invalid Target)");
    } else if (targetEl && this.utils.isHidden(targetEl)) {
      status = "수정 권고";
      message = `건너뛰기 링크의 대상(id="${targetId}")이 숨겨져 있어 초점을 받을 수 없을 수 있습니다.`;
      rules.push("Rule 2.4.1 (Hidden Target)");
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
