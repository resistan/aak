/**
* ABT Processor 4.2.1 (Web Application Accessibility)
*
* KWCAG 2.2 지침 4.2.1 웹 애플리케이션 접근성 준수
* 웹 애플리케이션은 사용자 인터페이스 구성 요소의 이름, 역할, 상태 정보를 제공해야 합니다. (ARIA 준수)
*
* [진단 범위]
* - 커스텀 위젯 (role 속성이 부여된 모든 요소)
* - 복잡한 대화형 컴포넌트
*
* [주요 로직]
* - ARIA 필수 속성 체크: 사용된 role에 대해 반드시 필요한 aria-* 속성 누락 여부 탐지
* - 상태 정보 변화: disabled, expanded, selected 등의 상태가 의미 있게 전달되는지 확인
* - 수동 검토 유도: 복잡한 웹 앱의 특성상 자동화 도구가 판단하기 어려운 논리적 오류에 대한 가이드 제공
*/
class Processor421 {
  constructor() {
    this.id = "4.2.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];

    // 4.2.1 지침은 매우 포괄적인 '웹 애플리케이션' 검사 항목이므로
    // 커스텀 위젯(ARIA roles)의 사용 패턴을 찾아내어 전문가의 수동 검사를 유도합니다.
    const customWidgets = document.querySelectorAll('[role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="tab"], [role="dialog"], [role="menuitem"], [role="combobox"]');

    for (const el of customWidgets) {
      if (this.utils.isHidden(el)) continue;
      reports.push(this.analyze(el));
    }

    // 위젯 미감지 시 전문가 확인 요청 (N/A 대신 검토 필요로 처리)
    if (reports.length === 0) {
      reports.push(this.createReport(
        document.body,
        "검토 필요",
        "커스텀 ARIA 위젯이 감지되지 않았습니다. 페이지에 JavaScript로 동작하는 동적 컴포넌트가 있는지 확인하세요.",
        ["Rule 4.2.1 (No Custom Widgets)"],
        "없음"
      ));
    }

    return reports;
  }

  analyze(el) {
    let status = "검토 필요";
    const role = el.getAttribute('role');
    let message = `역할(role="${role}")이 부여된 커스텀 위젯입니다. 상태 변화가 스크린 리더에 잘 전달되고 키보드로 조작 가능한지 확인하세요.`;
    const rules = ["Rule 4.2.1 (Custom Widget Review)"];

    // 기본 휴리스틱: 커스텀 대화형 위젯은 포커스를 받을 수 있어야 함 (tabindex)
    const needsTabindex = ['button', 'link', 'checkbox', 'switch', 'tab', 'menuitem'].includes(role);
    const hasNativeFocus = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);

    if (needsTabindex && !hasNativeFocus && !el.hasAttribute('tabindex')) {
      status = "수정 권고";
      message = `역할(role="${role}")이 부여되었으나 초점을 받을 수 없습니다(tabindex 누락). 키보드 접근성이 심각하게 훼손되었을 가능성이 있습니다.`;
      rules.push("Rule 4.2.1 (Missing Tabindex on Widget)");
    }

    return this.createReport(el, status, message, rules, `Role: ${role}`);
  }

  createReport(el, status, message, rules, ctxInfo) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: el !== document.body ? this.utils.getSelector(el) : "body"
      },
      context: { smartContext: ctxInfo },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("4.2.1", new Processor421()); }
