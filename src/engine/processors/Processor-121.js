/**
* ABT Processor 1.2.1 (Captions - Prerecorded)
*
* KWCAG 2.2 지침 1.2.1 자막 제공
* 멀티미디어 콘텐츠에는 청각 장애인을 위한 자막, 대본 또는 수어 등의 대체 수단을 제공해야 합니다.
*
* [진단 범위]
* - <video>, <audio> 요소
*
* [주요 로직]
* - 트랙 요소 검사: <video> 내부에 <track kind="captions" 또는 "subtitles"> 존재 여부 확인
* - 자막 파일 링크: <source> 태그와 별도로 자막 리소스가 정상적으로 연결되어 있는지 검증
*/
class Processor121 {
  constructor() {
    this.id = "1.2.1";
    this.utils = window.ABTUtils;
    this.keywords = ["대본", "원고", "자막", "transcript", "caption", "script"];
  }

  async scan() {
    const mediaElements = document.querySelectorAll('video, audio, iframe[src*="youtube"], iframe[src*="vimeo"]');
    const reports = [];

    for (const el of mediaElements) {
      reports.push(this.analyze(el));
    }
    return reports;
  }

  analyze(el) {
    const tagName = el.tagName.toLowerCase();
    const hasTrack = el.querySelector('track[kind="captions"], track[kind="subtitles"]') !== null;
    const smartContext = this.utils.getSmartContext(el, 150);
    const isMuted = el.muted || el.hasAttribute('muted');
    const isAutoplay = el.autoplay || el.hasAttribute('autoplay');

    // 주변에 대본/원고 키워드가 있는지 확인
    const foundKeywords = this.keywords.filter(k => smartContext.toLowerCase().includes(k));

    let status = "검토 필요";
    let message = "";
    const rules = [];

    if (tagName === 'video' || tagName === 'audio') {
      // [케이스 A] 배경 영상 (소리 없음)
      if (tagName === 'video' && isMuted && isAutoplay) {
        status = "적절";
        message = "소리가 없는 배경 영상으로 판단되어 자막 제공 대상에서 제외되었습니다.";
        rules.push("Rule 1.1 (Background Video)");
      }
      // [케이스 B] 자막 트랙 있음
      else if (hasTrack) {
        status = "검토 필요";
        message = "자막 트랙(<track>)이 탐지되었습니다. 실제 영상 내용과 자막이 일치하는지 확인하세요.";
        rules.push("Rule 2.1 (Track Detected)");
      }
      // [케이스 C] 자막 트랙 없고 원고 키워드도 없음
      else if (foundKeywords.length === 0) {
        status = "오류";
        message = "미디어 콘텐츠에 자막(<track>) 또는 설명 원고가 제공되지 않았습니다. 자막 제공을 요청하세요.";
        rules.push("Rule 2.2 (Missing Captions)");
        status = "검토 필요";
        message = "미디어 콘텐츠에 자막 트랙(<track>)이 탐지되지 않았습니다. 열린 자막(Open Caption) 제공 여부 또는 별도의 대본 제공 여부를 수동으로 확인하세요.";
        rules.push("Rule 2.2 (Manual Subtitle Review)");
      }
      // [케이스 D] 자막 트랙은 없으나 주변에 원고 키워드 발견
      else {
        status = "검토 필요";
        message = `자막 트랙은 없으나 주변 맥락에서 관련 키워드(${foundKeywords.join(', ')})가 발견되었습니다. 실제 원고 제공 여부를 확인하세요.`;
        rules.push("Rule 2.3 (Manual Script Check)");
      }
    } else if (tagName === 'iframe') {
      const title = el.getAttribute('title');
      if (!title) {
        status = "수정 권고";
        message = "외부 영상 프레임(iframe)에 식별 가능한 title 속성이 누락되었습니다. (자막 제공 여부와 별개로 프레임 제목 제공 필요)";
        rules.push("Rule 3.1 (Missing Frame Title)");
      } else {
        status = "검토 필요";
        message = `외부 플랫폼 영상(${title})이 감지되었습니다. 플레이어 내 자막 제공 여부 및 페이지 내 원고 포함 여부를 확인하세요.`;
        rules.push("Rule 3.2 (External Player Check)");
      }
    }

    return this.createReport(el, status, message, rules, smartContext, hasTrack, foundKeywords);
  }

  createReport(el, status, message, rules, smartContext, hasTrack, foundKeywords) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        src: el.src || "Source Injected/Custom Player",
        selector: this.utils.getSelector(el)
      },
      context: {
        smartContext: smartContext,
        hasTrack: hasTrack,
        foundKeywords: foundKeywords
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

// Core에 등록
if (window.ABTCore) {
  window.ABTCore.registerProcessor("1.2.1", new Processor121());
}
