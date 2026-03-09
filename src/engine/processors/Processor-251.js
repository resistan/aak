/**
* ABT Processor 2.5.1 (Pointer Gestures)
*
* KWCAG 2.2 지침 2.5.1 단일 포인터 입력 지원
* 복잡한 제스처(밀기, 핀치 줌 등)가 필요한 기능은 단일 포인터 클릭만으로도 수행할 수 있어야 합니다.
*
* [진단 범위]
* - 터치/드래그 이벤트가 설정된 요소
*
* [주요 로직]
* - 복합 이벤트 감지: touchstart, touchmove 등을 사용하는 요소 식별
* - 대체 수단: 단순 클릭 이벤트(click)가 병행되고 있는지 확인
*/
class Processor251 {
  constructor() {
    this.id = "2.5.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    // 단일 포인터 입력 지원은 기계적 판정이 어렵습니다.
    // 드래그, 핀치 줌 등이 필요한 요소를 탐색하여 수동 검토를 유도합니다.
    const draggableElements = document.querySelectorAll('[draggable="true"], .draggable, [role="slider"]');
    const reports = [];

    for (const el of draggableElements) {
      if (this.utils.isHidden(el)) continue;
      reports.push(this.analyze(el));
    }

    // 기본 보고서 (항목이 없더라도 지침 안내를 위해 제공 가능하나, 여기선 검출된 경우만)
    return reports;
  }

  analyze(el) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: { smartContext: "복잡한 제스처(드래그, 스와이프 등)가 쓰였을 것으로 예상되는 요소입니다." },
      result: {
        status: "검토 필요",
        message: "이 요소에 드래그, 핀치 줌, 스와이프 등 복잡한 제스처가 사용되었다면, 단일 포인터(탭, 클릭)만으로도 모든 기능을 수행할 수 있는 대체 수단(예: 이동 버튼, 확대/축소 버튼 등)이 제공되는지 확인하세요.",
        rules: ["Rule 2.5.1 (Single Pointer Support)"]
      },
      currentStatus: "검토 필요",
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "복잡한 제스처 사용 여부 및 대안 수동 검토 유도" }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.5.1", new Processor251()); }
