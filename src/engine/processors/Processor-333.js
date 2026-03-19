/**
* ABT Processor 3.3.3 (Accessible Authentication) v0.11
*
* KWCAG 2.2 지침 3.3.3 접근 가능한 인증
* 인증 과정에서 퍼즐 풀기, 비밀번호 암기 등 인지 능력에만 의존하는 방식 외에 대체 수단을 제공해야 합니다.
*
* [진단 범위]
* - <input type="password"> 및 로그인 서식
* - auth 신호: 폼 action, 링크·버튼의 href·텍스트 기반 탐지
*
* [주요 로직]
* - Rule 1.1: autocomplete="off" → 오류 (패스워드 매니저 차단)
* - Rule 1.2: onpaste 방지 → 오류 (붙여넣기 차단)
* - Rule 1.3: 패스워드 필드 정상 → 검토 필요 (캡차 등 수동 확인)
* - Rule 2.1: 패스워드 없음 + auth 신호 감지 → 검토 필요 (대체 인증 수단 확인)
* - Rule 2.2: 아무것도 감지 안됨 → 검토 필요 (직접 확인 요청)
*/
class Processor333 {
  constructor() {
    this.id = "3.3.3";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    if (passwordInputs.length > 0) {
      // 패스워드 필드별 개별 리포트
      passwordInputs.forEach(input => {
        if (this.utils.isHidden(input)) return;

        const issues = [];

        if (input.getAttribute('autocomplete') === 'off') {
          issues.push({ msg: "autocomplete 속성이 off로 설정되어 패스워드 매니저 사용을 방해할 수 있습니다.", rule: "Rule 1.1" });
        }

        if (input.hasAttribute('onpaste') && input.getAttribute('onpaste').includes('return false')) {
          issues.push({ msg: "onpaste 방지로 인해 비밀번호 복사/붙여넣기가 차단되었습니다.", rule: "Rule 1.2" });
        }

        if (issues.length > 0) {
          reports.push(this.createReport(
            input,
            "오류",
            issues.map(i => i.msg).join(" ") + " 비밀번호를 기억하지 않아도 로그인할 수 있도록 보조 수단(비밀번호 관리자, 붙여넣기)을 허용해야 합니다.",
            issues.map(i => i.rule)
          ));
        } else {
          reports.push(this.createReport(
            input,
            "검토 필요",
            "비밀번호 입력란이 감지되었습니다. 이 페이지에 퍼즐·캡차 등 추가적인 인지 테스트가 있다면, SNS 로그인이나 이메일 인증 등 인지에 의존하지 않는 대체 수단이 함께 제공되는지 확인하세요.",
            ["Rule 1.3"]
          ));
        }
      });
    } else if (this._detectAuthSignals()) {
      // 패스워드 없음 + auth 신호 감지
      reports.push(this.createReport(
        document.body,
        "검토 필요",
        "인증 관련 요소가 감지되었습니다. 인지 능력에만 의존하지 않는 대체 인증 수단(소셜 로그인, 이메일 인증 등)이 제공되는지 확인하세요.",
        ["Rule 2.1"]
      ));
    } else {
      // 아무것도 감지 안됨
      reports.push(this.createReport(
        document.body,
        "검토 필요",
        "이 페이지에 인증 과정이 있는지 확인하세요.",
        ["Rule 2.2"]
      ));
    }

    return reports;
  }

  // 폼 action, 링크·버튼 href·텍스트 기반 auth 신호 탐지
  _detectAuthSignals() {
    const actionKeywords = ['login', 'auth', 'signin', 'oauth', 'sso'];
    for (const form of document.querySelectorAll('form[action]')) {
      const action = (form.getAttribute('action') || '').toLowerCase();
      if (actionKeywords.some(kw => action.includes(kw))) return true;
    }

    const hrefKeywords = ['/login', '/auth', '/signin', '/oauth', '/sso', 'kakao', 'naver', 'google', 'github'];
    const textKeywords = ['로그인', '인증', 'sign in', 'log in', 'signin', 'login'];
    for (const el of document.querySelectorAll('a[href], button')) {
      const href = (el.getAttribute('href') || '').toLowerCase();
      const text = (el.textContent || '').trim().toLowerCase();
      if (hrefKeywords.some(kw => href.includes(kw))) return true;
      if (textKeywords.some(kw => text.includes(kw))) return true;
    }

    return false;
  }

  createReport(el, status, message, rules) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: el !== document.body ? this.utils.getSelector(el) : "body"
      },
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "인증 폼 탐색" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("3.3.3", new Processor333()); }
