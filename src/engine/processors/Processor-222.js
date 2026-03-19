/**
* ABT Processor 2.2.2 (Pause, Stop, Hide)
*
* KWCAG 2.2 지침 2.2.2 정지 기능 제공
* 자동으로 움직이거나 업데이트되는 콘텐츠는 사용자가 이를 일시 정지하거나 멈출 수 있어야 합니다.
*/
class Processor222 {
  constructor() {
    this.id = "2.2.2";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];

    // 1. 미디어 요소 탐색 (자동 재생 및 반복 여부 확인)
    const mediaElements = document.querySelectorAll('video, audio');
    for (const el of mediaElements) {
      const report = this.analyzeMedia(el);
      if (report) reports.push(report);
    }

    // 2. 캐러셀 및 슬라이더 탐지 (클래스명/역할 기반 휴리스틱)
    const carousels = document.querySelectorAll('[class*="carousel"], [class*="slider"], [class*="swiper"], [role="marquee"], [role="timer"]');
    for (const el of carousels) {
      const report = this.analyzeCarousel(el);
      if (report) reports.push(report);
    }

    // 3. 탐지된 결과가 없는 경우 전문가 확인 요청
    if (reports.length === 0) {
      reports.push(this.createReport(
        document.body,
        "검토 필요",
        "페이지 내에 자동으로 재생되거나 갱신되는 콘텐츠(슬라이더, 롤링 배너 등)가 있는지 확인하세요.",
        ["Rule 222. (General Manual Review)"]
      ));
    }

    return reports;
  }

  analyzeMedia(el) {
    const isAutoplay = el.hasAttribute('autoplay');
    const hasControls = el.hasAttribute('controls');
    const isLoop = el.hasAttribute('loop');

    let status = "검토 필요";
    let message = "";
    const rules = [];

    if (isAutoplay && !hasControls) {
      status = "오류";
      message = "자동 재생되는 미디어에 정지/제어 수단(controls)이 제공되지 않았습니다.";
      rules.push("Rule 222. (Autoplay without Controls)");
    } else if (isAutoplay || isLoop) {
      status = "검토 필요";
      message = "자동 재생되거나 반복되는 미디어가 감지되었습니다. 3초 이상 지속되는 경우 사용자가 정지할 수 있는지 확인하세요.";
      rules.push("Rule 222. (Review Autoplay/Loop)");
    } else {
      // 일반적인 정적 미디어는 2.2.2 진단 대상이 아님 (노이즈 방지)
      return null;
    }

    return this.createReport(el, status, message, rules);
  }

  analyzeCarousel(el) {
    const controls = el.querySelectorAll('button, [role="button"], a');
    let hasPauseText = false;

    controls.forEach(ctrl => {
      const text = (ctrl.textContent + ' ' + (ctrl.getAttribute('aria-label') || '')).toLowerCase();
      if (text.includes('정지') || text.includes('멈춤') || text.includes('pause') || text.includes('stop')) {
        hasPauseText = true;
      }
    });

    let detectedLibrary = "";
    if (el.className.toLowerCase().includes('swiper')) detectedLibrary = "Swiper";
    else if (el.className.toLowerCase().includes('slick')) detectedLibrary = "Slick";

    const status = "검토 필요";
    let message = detectedLibrary
    ? `자동 갱신 가능성이 높은 '${detectedLibrary}' 라이브러리 요소가 탐지되었습니다.`
    : "자동으로 갱신되는 슬라이더/캐러셀일 경우, 정지(Pause) 버튼이 제공되는지 수동으로 확인하세요.";

    if (hasPauseText) {
      message += " 내부에서 정지(Pause/Stop) 관련 키워드가 감지되었습니다. 실제로 기능이 동작하는지 확인하세요.";
    } else if (detectedLibrary) {
      message += " 내부에 명시적인 정지 버튼이 보이지 않습니다. 정지 수단 제공 여부를 확인하세요.";
    }

    return this.createReport(el, status, message, ["Rule 222. (Carousel Controls)"]);
  }

  createReport(el, status, message, rules) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: el !== document.body ? this.utils.getSelector(el) : "body"
      },
      context: { smartContext: el !== document.body ? this.utils.getSmartContext(el) : "자동 변경 콘텐츠 검토" },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("2.2.2", new Processor222()); }
