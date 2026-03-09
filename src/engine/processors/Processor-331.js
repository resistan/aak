/**
* ABT Processor 3.3.1 (Error Identification)
*
* KWCAG 2.2 지침 3.3.1 오류 정정
* 입력 오류가 발생한 경우, 오류가 발생한 항목과 내용을 사용자에게 텍스트로 명확히 알려주어야 합니다.
*
* [진단 범위]
* - <form> 및 필수 입력 요소 ([required], [aria-required])
* - [aria-invalid="true"] 상태인 요소
*
* [주요 로직]
* - 필수 항목 식별: 누락 시 오류를 유발할 수 있는 입력 폼 탐지
* - ARIA 오류 연결: aria-invalid가 설정된 경우 aria-describedby 또는 aria-errormessage를 통해 설명이 연결되어 있는지 검증
* - 수동 프로세스 검토: 실제 폼 제출 후 초점 이동 및 메시지 노출 여부 수동 점검 유도
*/
class Processor331 {
  constructor() {
    this.id = "3.3.1";
    this.utils = window.ABTUtils;
  }

  /**
  * 문서 내 입력 서식의 오류 처리 로직을 진단합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const reports = [];

    // Check forms that might require error correction (has required inputs)
    const forms = document.querySelectorAll('form');

    for (const form of forms) {
      if (this.utils.isHidden(form)) continue;

      const requiredInputs = form.querySelectorAll('input[required], select[required], textarea[required], [aria-required="true"]');
      if (requiredInputs.length > 0) {
        reports.push(this.analyze(form, requiredInputs.length));
      }
    }

    // If no forms found, we still add a manual review for custom input widgets
    if (reports.length === 0) {
      reports.push(this.createReport(
        document.body,
        "검토 필요",
        "서식(form) 요소는 없으나 입력 위젯이 있다면, 입력 오류 발생 시 그 원인과 정정 방법을 사용자에게 명확히 알려주는지 수동으로 검토하세요.",
        ["Rule 3.3.1 (Manual Review)"],
        "없음"
      ));
    }

    return reports;
  }

  analyze(el, reqCount) {
    let status = "검토 필요";
    let message = `[수동 검사 안내] 필수 입력 항목이 포함된 서식(form)입니다. (필수 항목 ${reqCount}개). 고의로 값을 비우거나 틀리게 입력한 후 폼을 제출해보세요. 오류 원인이 텍스트로 명확히 안내되고, 초점이 오류 항목으로 이동하는지 수동으로 확인해야 합니다.`;
    const rules = ["Rule 3.3.1 (Form Error Identification - Manual Check)"];

    // Check for aria-invalid on inputs to see if they use ARIA error handling
    const invalidInputs = el.querySelectorAll('[aria-invalid="true"]');
    if (invalidInputs.length > 0) {
      let hasErrorDesc = true;
      invalidInputs.forEach(input => {
        if (!input.hasAttribute('aria-describedby') && !input.hasAttribute('aria-errormessage')) {
          hasErrorDesc = false;
        }
      });

      if (!hasErrorDesc) {
        status = "오류";
        message = "aria-invalid='true'로 오류 상태가 렌더링된 항목이 있으나, 구체적인 오류 메시지(aria-errormessage 또는 aria-describedby)가 연결되지 않았습니다.";
        rules.push("Rule 3.3.1 (Missing Error Message Connection)");
      } else {
        status = "검토 필요";
        message = "오류 상태(aria-invalid)와 오류 메시지가 ARIA 속성으로 연결되어 있습니다. 실제로 폼을 제출했을 때 화면에 오류 텍스트가 잘 보이고 초점이 이동하는지 최종 확인하세요.";
        rules.push("Rule 3.3.1 (Verify ARIA Error Connection)");
      }
    }

    return this.createReport(el, status, message, rules, `Required inputs: ${reqCount}, invalid currently: ${invalidInputs.length}`);
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

if (window.ABTCore) { window.ABTCore.registerProcessor("3.3.1", new Processor331()); }
