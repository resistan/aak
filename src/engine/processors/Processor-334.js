/**
* ABT Processor 3.3.4 (Redundant Entry)
*
* KWCAG 2.2 지침 3.3.4 반복 입력 정보
* 동일한 프로세스 내에서 이미 입력한 정보를 다시 요구할 경우, 자동 입력 또는 선택 기능을 제공해야 합니다.
*
* [진단 범위]
* - 개인정보 및 배송지 관련 입력 필드 (이름, 주소, 연락처 등)
* - '이전과 동일' 체크박스
*
* [주요 로직]
* - 반복 입력 필드 식별: name, id 속성 키워드 분석을 통해 사용자 정보를 묻는 필드 탐지
* - 자동 입력 수단 검증: autocomplete 속성 부재 또는 '동일 옵션' 체크박스 유무를 확인하여 사용자 수고를 더는지 진단
*/
class Processor334 {
  constructor() {
    this.id = "3.3.4";
    this.utils = window.ABTUtils;
  }

  /**
  * 동일 프로세스 내 중복 입력 요구 여부를 진단합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const reports = [];

    // 1. 페이지 내 주요 개인정보/배송지 관련 입력 필드 (반복 입력이 잦은 필드) 탐지
    // name이나 id 속성에 특정 키워드가 들어간 요소들
    const redundantKeywords = ['name', '이름', 'email', '이메일', 'phone', 'tel', '전화', 'address', '주소', 'zip', '우편번호'];
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');

    let suspectInputs = [];
    for (const input of inputs) {
      if (this.utils.isHidden(input)) continue;
      const nameAttr = (input.getAttribute('name') || "").toLowerCase();
      const idAttr = (input.getAttribute('id') || "").toLowerCase();

      if (redundantKeywords.some(kw => nameAttr.includes(kw) || idAttr.includes(kw))) {
        suspectInputs.push(input);
      }
    }

    // 2. '이전 정보와 동일' 같은 체크박스 탐지
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let hasSameAsCheckbox = false;
    for (const cb of checkboxes) {
      const labelText = this.utils.getAccessibleName(cb) || cb.parentElement?.innerText || "";
      if (labelText.includes('동일') || labelText.includes('같음') || labelText.includes('same as')) {
        hasSameAsCheckbox = true;
        break;
      }
    }

    if (suspectInputs.length > 0) {
      // 반복 가능 필드가 발견되었을 때, autocomplete 속성이 누락되었는지 확인
      const missingAutocomplete = suspectInputs.filter(el => !el.hasAttribute('autocomplete') || el.getAttribute('autocomplete') === 'off');

      if (missingAutocomplete.length > 0 && !hasSameAsCheckbox) {
        reports.push({
          guideline_id: this.id,
          elementInfo: { tagName: "form/input", selector: this.utils.getSelector(missingAutocomplete[0]) },
          context: { smartContext: `이름/주소 등 반복 입력 의심 필드 ${missingAutocomplete.length}건 발견됨` },
          result: {
            status: "검토 필요",
            message: "[수동 검사 안내] 이름, 연락처, 주소 등을 입력하는 필드가 발견되었으나 autocomplete 속성이 없으며 '이전 정보와 동일' 체크박스도 보이지 않습니다. 만약 다단계 폼(주문 등)에서 이전 단계에 입력했던 정보를 다시 묻는 것이라면 오류입니다. 수동으로 프로세스를 확인하세요.",
            rules: ["Rule 3.3.4 (Missing Autocomplete & Checkbox)"]
          },
          currentStatus: "검토 필요",
          history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "반복 입력 가능성 높음" }]
        });
      } else {
        reports.push({
          guideline_id: this.id,
          elementInfo: { tagName: "form/input", selector: "body" },
          context: { smartContext: `autocomplete 부여됨 또는 '동일' 체크박스 감지됨` },
          result: {
            status: "검토 필요",
            message: "[수동 검사 안내] 반복 입력 필드에 autocomplete 속성이나 '이전과 동일' 옵션이 발견되었습니다. 실제로 폼을 작성할 때 이전 정보가 잘 채워지는지 수동으로 확인하세요.",
            rules: ["Rule 3.3.4 (Verify Auto-population)"]
          },
          currentStatus: "검토 필요",
          history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "대체 수단 존재 의심, 실제 동작 확인 필요" }]
        });
      }
    } else {
      reports.push({
        guideline_id: this.id,
        elementInfo: { tagName: "document", selector: "body" },
        context: { smartContext: "반복 입력 의심 폼 없음" },
        result: {
          status: "N/A",
          message: "페이지 내에서 이름, 주소, 연락처 등 프로세스 간 반복 입력이 주로 발생하는 입력 서식을 발견하지 못했습니다. 단일 프로세스일 가능성이 높습니다.",
          rules: ["Rule 3.3.4 (No Suspect Forms)"]
        },
        currentStatus: "N/A",
        history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "특이 사항 없음" }]
      });
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
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "자동 초점/리다이렉트 동작 검토" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("3.3.4", new Processor334()); }