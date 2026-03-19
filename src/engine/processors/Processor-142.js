/**
* ABT Processor 1.4.2 (Audio Control) v0.14
*
* KWCAG 2.2 지침 1.4.2 자동 재생 금지
* 자동으로 소리가 재생되는 콘텐츠는 사용자가 이를 제어(정지, 볼륨 조절)할 수 있어야 합니다.
*
* [진단 범위]
* - <video>, <audio>, YouTube/Vimeo <iframe>
*
* [주요 로직]
* - Rule 1.1: autoplay 있음 + controls 없음 → 오류 (소리 없음이 확실하면 '적절'로 변경)
* - Rule 1.2: autoplay 있음 + controls 있음 → 수정 권고 (자동재생 자체 제거 권장)
* - Rule 1.3: autoplay 없음 → 검토 필요 (JS 재생 가능성, 육안 확인 필요)
* - iframe: URL 파라미터로 autoplay=1 여부 판단
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
      const tag = el.tagName.toLowerCase();

      if (tag === 'iframe') {
        reports.push(this._analyzeIframe(el));
      } else {
        reports.push(this._analyzeMediaElement(el));
      }
    }

    return reports;
  }

  // <video>, <audio> 분석
  _analyzeMediaElement(el) {
    const hasAutoplay = el.hasAttribute('autoplay');
    const hasControls = el.hasAttribute('controls');

    // autoplay + 제어 수단 없음 (muted 여부 무관)
    // → 소리가 있는 미디어라면 위반. 오디오 트랙 유무는 육안으로 확인 필요.
    if (hasAutoplay && !hasControls) {
      return this.createReport(el, "오류",
        "자동 재생(autoplay)이 설정되어 있고 사용자 제어 수단(controls)이 없습니다. 미디어에 소리가 있는 경우 위반이며, 정지·볼륨 조절 기능을 제공해야 합니다. 오디오 트랙이 없거나 음소거가 확실하다면 '적절'로 변경하세요.",
        ["Rule 1.1"]
      );
    }

    // autoplay + 제어 수단 있음 → 자동재생 자체를 권고
    if (hasAutoplay && hasControls) {
      return this.createReport(el, "수정 권고",
        "자동 재생(autoplay)이 설정되어 있습니다. 제어 수단은 있으나, 소리가 있는 경우 페이지 로드 시 자동 재생되지 않도록 수정을 권장합니다.",
        ["Rule 1.2"]
      );
    }

    // autoplay 없음 → JS 재생 가능성 육안 확인
    return this.createReport(el, "검토 필요",
      "autoplay 속성이 없습니다. JavaScript로 자동 재생되는지 육안으로 확인하세요.",
      ["Rule 1.3"]
    );
  }

  // YouTube/Vimeo iframe 분석
  _analyzeIframe(el) {
    const src = el.getAttribute('src') || '';
    let hasAutoplay = false;

    try {
      const url = new URL(src, location.href);
      hasAutoplay = url.searchParams.get('autoplay') === '1';
    } catch (e) {
      // URL 파싱 실패 시 검토 필요로 처리
    }

    if (hasAutoplay) {
      return this.createReport(el, "오류",
        "iframe 미디어에 autoplay=1 파라미터가 설정되어 있습니다. 자동 재생 여부와 제어 수단을 확인하세요.",
        ["Rule 1.1"]
      );
    }

    return this.createReport(el, "검토 필요",
      "임베드된 미디어입니다. 페이지 로드 시 소리가 자동으로 재생되는지 육안으로 확인하세요.",
      ["Rule 1.3"]
    );
  }

  createReport(el, status, message, rules = ["Rule 1.3"]) {
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
