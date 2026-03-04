/**
 * ABT Processor 2.4.2 (Page Titled)
 * 
 * KWCAG 2.2 지침 2.4.2 제목 제공
 * 웹 페이지와 각 프레임에는 그 목적을 이해할 수 있는 명확한 제목을 제공해야 합니다.
 * 
 * [진단 범위]
 * - <title> 요소 (Head)
 * - <iframe>, <frame> 요소
 * - <h1> 제목 요소 및 전체 헤딩 구조 (h1~h6)
 * 
 * [주요 로직]
 * - 누락 체크: <title> 또는 프레임의 title 속성이 비어있는 경우 탐지
 * - 의미 없는 제목 필터링: 무의미한 기본값(untitled 등) 사용 여부 검증
 * - 헤딩 아웃라인 분석: 페이지 전체의 제목 계층 구조(h1~h6) 수집 및 단계 건너뛰기 탐지
 */
class Processor242 {
  constructor() {
    this.id = "2.4.2";
    this.utils = window.ABTUtils;
    this.meaninglessTitles = [
      'untitled', 'document', '새 탭', 'home', 'main', 'index', 'index.html',
      'iframe', 'content', 'empty', '빈 페이지', '제목 없음'
    ];
  }

  /**
   * 페이지 및 프레임의 제목 제공 여부를 전수 조사합니다.
   * @returns {Promise<Array>} 진단 결과 리포트 배열
   */
  async scan() {
    const reports = [];

    const titleEl = document.head.querySelector('title');
    const pageTitle = titleEl ? titleEl.textContent.trim() : "";
    if (!titleEl || !pageTitle) {
      reports.push(this.createPageReport("오류", "페이지 제목(<title>)이 <head> 내에 존재하지 않거나 비어있습니다.", "title"));
    } else if (this.meaninglessTitles.includes(pageTitle.toLowerCase())) {
      reports.push(this.createPageReport("부적절", `페이지 제목('${pageTitle}')이 구체적이지 않거나 의미 없는 기본값입니다.`, "title"));
    } else {
      reports.push(this.createPageReport("검토 필요", `페이지 제목('${pageTitle}')이 존재합니다. 해당 문구가 페이지의 내용을 핵심적으로 설명하고 있는지 검토하세요.`, "title"));
    }

    const frames = document.querySelectorAll('iframe, frame');
    for (const frame of frames) {
      const title = frame.getAttribute('title') ? frame.getAttribute('title').trim() : "";
      
      if (!title) {
        reports.push(this.createReport(frame, "오류", "프레임(iframe)의 title 속성이 누락되었습니다."));
      } else if (this.meaninglessTitles.includes(title.toLowerCase())) {
        reports.push(this.createReport(frame, "부적절", `프레임 제목('${title}')이 프레임의 용도를 설명하기에 부적절합니다.`));
      } else {
        reports.push(this.createReport(frame, "검토 필요", `프레임 제목('${title}')이 프레임의 용도나 목적을 적절히 설명하고 있는지 검토하세요.`));
      }
    }

    const h1 = document.querySelector('h1');
    if (!h1) {
      reports.push(this.createPageReport("검토 필요", "페이지 내에 대주제(<h1>)가 존재하지 않습니다. 문서의 핵심 주제가 적절하게 식별되는지 검토하세요.", "h1"));
    } else {
      reports.push(this.createPageReport("적절", "페이지 내에 구조적 대주제(<h1>)가 존재합니다.", "h1"));
    }

    // [단계 F] 헤딩 아웃라인 수집 (h1~h6) - 문서의 구조적 순서 확인
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      const outline = Array.from(headings).map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.innerText.trim(),
        selector: this.utils.getSelector(h)
      }));
      
      reports.push({
        guideline_id: this.id,
        elementInfo: { tagName: 'BODY', selector: 'outline' },
        context: { smartContext: "페이지 헤딩 구조(Heading Outline) 분석 결과입니다.", outline: outline },
        result: { status: "참고자료", message: `페이지 내에 총 ${headings.length}개의 헤딩이 존재합니다.` },
        currentStatus: "참고자료",
        currentStatus: "적절",
        history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "헤딩 아웃라인 수집 완료" }]
      });

      // 헤딩 순서 논리성 검사
      let prevLevel = 0;
      for (const h of outline) {
        if (prevLevel > 0 && h.level > prevLevel + 1) {
          reports.push({
            guideline_id: this.id,
            elementInfo: { tagName: `H${h.level}`, selector: h.selector },
            context: { smartContext: `이전 헤딩(H${prevLevel})에서 바로 H${h.level}로 건너뛰었습니다.` },
            result: { status: "수정 권고", message: "헤딩 수준을 순차적으로 사용하는 것을 권장합니다 (예: h1 -> h2 -> h3)." },
            currentStatus: "수정 권고",
            history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "헤딩 순서 건너뜀 탐지" }]
          });
        }
        prevLevel = h.level;
      }
    }
    return reports;
  }

  createReport(el, status, message) {
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
        message: message
      },
      currentStatus: status,
      history: [{
        timestamp: new Date().toLocaleTimeString(),
        status: "탐지",
        comment: message
      }]
    };
  }

  createPageReport(status, message, type = "title") {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: type === "title" ? 'HEAD' : 'BODY',
        selector: type
      },
      context: {
        smartContext: type === "title" ? `현재 페이지 제목: ${document.title || '(없음)'}` : "페이지 내 <h1> 존재 여부 검사"
      },
      result: {
        status: status,
        message: message
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
  window.ABTCore.registerProcessor("2.4.2", new Processor242());
}
