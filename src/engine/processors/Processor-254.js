/**
* ABT Processor 2.5.4 (Motion Actuation)
*
* KWCAG 2.2 지침 2.5.4 동작기반 작동
* 기기를 흔들거나 기울이는 동작으로 기능을 수행하는 경우, 일반적인 버튼 클릭 등으로도 수행할 수 있는 대체 수단을 제공해야 합니다.
*
* [진단 범위]
* - 문서 전체 (Body 레벨)
*
* [주요 로직]
* - 전면 수동 검토 안내: 기기 센서(가속도계, 자이로스코프) 의존성은 런타임 분석이 어려우므로 사용자에게 대체 수단 및 기능 끄기 옵션 확인 유도
*/
class Processor254 {
  constructor() {
    this.id = "2.5.4";
    this.utils = window.ABTUtils;
  }

  /**
  * 물리적 동작 의존 기능을 수동으로 점검하도록 가이드를 생성합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    // 2.5.4(동작기반 작동) 지침은 기기를 흔들거나 기울이는 물리적 동작에 의존하는 기능을 평가합니다.
    // 브라우저 확장 프로그램의 Content Script 단에서는 기기 센서 사용 여부나
    // 모바일 환경의 제스처 의존성을 정확히 기계적으로 판별할 수 없으므로,
    // 억지 휴리스틱 탐지(오탐 유발)를 제거하고 전면 수동 검사 항목으로 전환합니다.

    return [{
      guideline_id: this.id,
      elementInfo: { tagName: "document", selector: "body" },
      context: { smartContext: "기기 동작(Motion/Orientation) 센서 사용 여부 전면 수동 검사" },
      result: {
        status: "검토 필요",
        message: "[수동 검사 항목] 이 페이지(또는 앱)에서 기기를 흔들거나 기울이는 동작을 요구하는 기능이 있다면, 버튼 클릭 등 정적인 입력으로도 동일한 기능을 수행할 수 있는지 수동으로 점검하세요.",
        rules: ["Rule 2.5.4 (Manual Inspection Required)"]
      },
      currentStatus: "검토 필요",
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "자동 진단 불가 항목 (수동 점검 안내)" }]
    }];
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.5.4", new Processor254()); }
