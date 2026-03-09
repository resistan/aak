/**
* ABT Processor 3.3.3 (Accessible Authentication)
*
* KWCAG 2.2 지침 3.3.3 접근 가능한 인증
* 인증 과정에서 퍼즐 풀기, 비밀번호 암기 등 인지 능력에만 의존하는 방식 외에 대체 수단을 제공해야 합니다.
*
* [진단 범위]
* - <input type="password"> 및 로그인 서식
*
* [주요 로직]
* - 자동 완성 차단 탐지: autocomplete="off" 설정을 통해 비밀번호 관리자 사용을 방해하는지 확인
* - 붙여넣기 차단 검사: onpaste="return false" 등으로 비밀번호 복사/붙여넣기를 막는지 식별
* - 인지 테스트 대체: 캡차(CAPTCHA) 등에 대한 SNS 로그인, 이메일 링크 등 대체 수단 유무 검토 가이드
*/
class Processor333 {
  constructor() {
    this.id = "3.3.3";
    this.utils = window.ABTUtils;
  }

  /**
  * 로그인 및 인증 과정의 인지적 장벽 존재 여부를 진단합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    // KWCAG 2.2 신설 지침 3.3.3 (접근 가능한 인증)
    // 인지 기능 테스트(비밀번호 암기, 퍼즐 풀기 등)에만 의존하지 않는 대체 수단을 제공해야 합니다.
    // 가장 대표적인 사례는 패스워드 입력란에서 복사/붙여넣기를 막거나(onpaste="return false"),
    // 패스워드 매니저의 자동 완성을 막는(autocomplete="off") 행위입니다.

    const reports = [];
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    if (passwordInputs.length > 0) {
      passwordInputs.forEach(input => {
        if (this.utils.isHidden(input)) return;

        let hasIssue = false;
        let issueMsg = [];

        // 1. 자동 완성 제한 검사
        if (input.getAttribute('autocomplete') === 'off') {
          hasIssue = true;
          issueMsg.push("autocomplete 속성이 off로 제한되어 패스워드 매니저 사용을 방해할 수 있습니다.");
        }

        // 2. 붙여넣기 방지 검사 (인라인 속성 기준)
        if (input.hasAttribute('onpaste') && input.getAttribute('onpaste').includes('return false')) {
          hasIssue = true;
          issueMsg.push("onpaste 방지로 인해 비밀번호 복사/붙여넣기가 차단되었습니다.");
        }

        if (hasIssue) {
          reports.push(this.createReport(
            input,
            "오류",
            issueMsg.join(" ") + " 비밀번호를 기억하지 않아도 로그인할 수 있도록 보조 수단(비밀번호 관리자, 붙여넣기)을 허용해야 합니다.",
            ["Rule 3.3.3 (Cognitive Test Barrier)"]
          ));
        } else {
          // 패스워드 필드는 정상적이나, 캡차나 다른 인지 테스트가 있을 수 있으므로 수동 검사 안내
          reports.push(this.createReport(
            input,
            "검토 필요",
            "[수동 검사 안내] 비밀번호 입력란이 감지되었습니다. 만약 이 페이지에 퍼즐 맞추기나 문자 입력 캡차(CAPTCHA) 등 추가적인 인지 테스트가 있다면, SNS 로그인이나 이메일 인증 링크 등 인지에 의존하지 않는 대체 수단이 함께 제공되는지 확인하세요.",
            ["Rule 3.3.3 (Manual Auth Review)"]
          ));
        }
      });
    } else {
      // 인증 폼이 아예 없는 경우 N/A 처리
      reports.push(this.createReport(
        document.body,
        "N/A",
        "페이지 내에 비밀번호 입력란 등 전형적인 인증(로그인) 서식이 발견되지 않았습니다. 해당 지침이 적용되지 않을 가능성이 높습니다.",
        ["Rule 3.3.3 (No Auth Detected)"]
      ));
    }

    return reports;
  }

  createReport(el, status, message, rules) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: el !== document.body ? this.utils.getSelector(el) : "body"
      },
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "로그인 폼 탐색" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("3.3.3", new Processor333()); }
