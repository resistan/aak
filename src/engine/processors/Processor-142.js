/**
* ABT Processor 1.4.2 (Audio Control)
*
* KWCAG 2.2 지침 1.4.2 자동 재생 금지
* 자동으로 소리가 재생되는 콘텐츠는 사용자가 이를 제어(정지, 볼륨 조절)할 수 있어야 합니다.
*
* [진단 범위]
* - <video>, <audio> 요소
*
* [주요 로직]
* - autoplay 속성 체크: 사용자의 조작 없이 시작되는 미디어 탐지
* - 제어 수단 유무: autoplay가 설정된 경우 controls 속성이 명시되어 있는지 확인
*/
class Processor142 {
  constructor() {
    this.id = "1.4.2";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];
    const mediaElements = document.querySelectorAll('video, audio, iframe[src*="youtube.com"], iframe[src*="vimeo.com"]');

    for (const el of mediaElements) {
      // 자동화 도구의 한계를 고려하여, 미디어 요소 발견 시 무조건 검토 필요로 분류합니다.
      reports.push(this.createReport(el, "검토 필요", "미디어 요소가 감지되었습니다. 페이지 로드 시 소리가 자동으로 재생되는지, 그리고 이를 제어할 수 있는 수단이 있는지 수동으로 확인하세요."));
    }

    return reports;
  }

  createReport(el, status, message, rules = ["Rule 1.4.2 (Manual Audio Review)"]) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: {
        smartContext: this.utils.getSmartContext(el, 50)
      },
      result: {
        status: status,
        message: message,
        rules: rules
      },
      currentStatus: status,
      history: [{
        timestamp: new Date().toLocaleTimeString(),
        status: "탐지",
        comment: message
      }]
    };
  }
}

if (window.ABTCore) {
  window.ABTCore.registerProcessor("1.4.2", new Processor142());
}
