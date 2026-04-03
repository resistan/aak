/**
* ABT Processor 1.1.1 (Non-text Content)
*
* KWCAG 2.2 지침 1.1.1 적절한 대체 텍스트 제공
* 시각적 정보를 텍스트가 아닌 형태로 제공할 때, 그와 동등한 정보를 전달하는 텍스트를 제공해야 합니다.
*
* [진단 범위]
* 1. <img>, <area>, <input type="image">, <svg>, [role="img"]
* 2. 배경 이미지 (background-image)
*
* [주요 로직]
* - [단계 A] 누락 오류: 의미 있는 요소에 alt, aria-label 등이 없는 경우
* - [단계 B] 기능형 검사: 클릭 가능한 요소 내의 이미지가 목적을 설명하는지
* - [단계 C] 불필요 단어: '사진', '이미지' 등 의미 중복 단어 필터링
* - [단계 D] 문맥 유사도: 주변 텍스트와 겹쳐서 발생하는 스크린 리더 중복 낭독 방지
*/
class Processor111 {
  constructor() {
    this.id = "1.1.1";
    this.forbiddenWords = ["이미지", "사진", "아이콘", "그림", "스냅샷", "image", "photo", "icon"];
    this.utils = window.ABTUtils;
  }

  /**
  * 현재 문서의 모든 비텍스트 콘텐츠를 수집하고 정밀 진단을 수행합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const reports = [];
    // 1. 일반 이미지 요소 수집
    const nonTextElements = Array.from(document.querySelectorAll('img, area, input[type="image"], svg, [role="img"]'));
    const uniqueElements = [...new Set(nonTextElements)];
    for (const el of uniqueElements) {
      reports.push(this.analyze(el));
    }

    // 2. 배경 이미지가 있는 요소 수집 (성능을 위해 주요 컨테이너 대상)
    const containers = document.querySelectorAll('div, section, article, span, a, button');
    for (const el of containers) {
      const bgImg = window.getComputedStyle(el).backgroundImage;
      if (bgImg && bgImg !== 'none' && bgImg.includes('url(')) {
        const urlMatch = bgImg.match(/url\(['"]?(.*?)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          reports.push(this.analyzeBackground(el, urlMatch[1]));
        }
      }
    }
    return reports;
  }

  analyzeBackground(el, url) {
    const smartContext = this.utils.getSmartContext(el, 50);
    const functionalContext = this.getFunctionalContext(el);
    let accessibleName = (el.getAttribute("aria-label") || el.title || "").trim();

    // IR 기법으로 숨겨진 텍스트가 있는지 확인
    if (!accessibleName && this.utils.isImageReplacement(el)) {
      accessibleName = el.innerText.trim();
    }
    let status = "검토 필요";
    let message = "배경 이미지로 구현된 요소입니다. 의미 있는 정보가 포함되어 있다면 대체 텍스트(aria-label 등) 제공 여부를 확인하세요.";
    const rules = ["Rule 1.1 (Background Image)"];

    if (accessibleName) {
      status = "적절";
      if (this.utils.isImageReplacement(el)) {
        message = `배경 이미지 요소에 IR 기법으로 대체 텍스트("${accessibleName}")가 제공되었습니다.`;
      } else {
        message = "배경 이미지 요소에 대체 텍스트(aria-label 등)가 제공되었습니다.";
      }
    }

    return this.createReport(el, status, message, rules, accessibleName, smartContext, functionalContext, false, url, "style");
  }

  analyze(el) {
    const tagName = el.tagName.toLowerCase();
    let accessibleName = "";
    let isDecorative = false;
    let src = "";

    if (tagName === "svg") {
      const titleEl = el.querySelector("title");
      accessibleName = (el.getAttribute("aria-label") || (titleEl ? titleEl.textContent : "")).trim();
      isDecorative = el.getAttribute("aria-hidden") === "true" || el.getAttribute("focusable") === "false";

      // SVG 데이터 추출 (미리보기용)
      try {
        const svgClone = el.cloneNode(true);
        svgClone.setAttribute("width", "100");
        svgClone.setAttribute("height", "100");
        const svgString = new XMLSerializer().serializeToString(svgClone);
        const svgBase64 = window.btoa(unescape(encodeURIComponent(svgString)));
        src = `data:image/svg+xml;base64,${svgBase64}`;
      } catch (e) {
        src = "SVG Data";
      }
    } else if (tagName === "input" && el.type === "image") {
      accessibleName = (el.getAttribute("alt") || el.getAttribute("aria-label") || el.title || "").trim();
      src = el.src;
    } else {
      const altAttr = el.getAttribute("alt");
      accessibleName = (altAttr || el.getAttribute("aria-label") || "").trim();
      src = el.src;

      if (altAttr === "" || ["presentation", "none"].includes(el.getAttribute("role"))) {
        isDecorative = true;
      }
    }

    const smartContext = this.utils.getSmartContext(el, 50);
    const functionalContext = this.getFunctionalContext(el);

    let status = "적절";
    let message = "적절한 대체 텍스트가 제공되었습니다.";
    const rules = [];

    // [단계 A] 누락 오류 판정
    if (!isDecorative && !accessibleName) {
      // 부모 대화형 요소에 텍스트가 있으면 장식용 처리 누락으로 간주 (수정 권고)
      if (functionalContext.isFunctional && functionalContext.parentText) {
        const preview = functionalContext.parentText.length > 20
          ? functionalContext.parentText.substring(0, 20) + '...'
          : functionalContext.parentText;
        status = "수정 권고";
        message = `대화형 요소 내 이미지에 대체 텍스트가 없습니다. 부모에 텍스트("${preview}")가 있으므로 장식용 처리(aria-hidden="true" 또는 alt="")를 권고합니다.`;
        rules.push("Rule 1.2 (Missing Alt in Functional)");
      } else {
        status = "오류";
        if (tagName === "input") {
          message = "이미지 버튼(input type='image')에 대체 텍스트(alt 등)가 누락되었습니다.";
        } else if (tagName === "svg") {
          message = "의미 있는 SVG 요소에 <title> 또는 aria-label이 제공되지 않았습니다.";
        } else {
          message = "대체 텍스트 속성(alt 등)이 누락되었습니다. 수정을 요청하세요.";
        }
        rules.push("Rule 1.1 (Missing Alt)");
      }
    }

    // [단계 B] 장식용 + 기능형 검사
    if (isDecorative && functionalContext.isFunctional) {
      if (!functionalContext.parentText) {
        status = "오류";
        message = "대화형 요소(링크/버튼) 내의 유일한 콘텐츠이나, 대체 텍스트가 비어있습니다(alt=''). 목적을 설명해야 합니다.";
        rules.push("Rule 4.2 (Functional Decorative)");
      }
    }

    // [단계 C] 불필요 단어 포함 여부
    const foundForbidden = this.forbiddenWords.find(word => accessibleName.toLowerCase().includes(word));
    if (foundForbidden && status === "적절") {
      status = "수정 권고";
      message = `대체 텍스트에 불필요한 단어('${foundForbidden}')가 포함되어 있습니다. 의미에 맞게 간결하게 수정 권고하세요.`;
      rules.push("Rule 2.1 (Forbidden Words)");
    }

    // [단계 D] 주변 문맥과의 유사도
    if (accessibleName && status === "적절" && smartContext) {
      const similarity = this.utils.calculateSimilarity(accessibleName, smartContext);
      if (similarity > 0.9) {
        status = "부적절";
        message = "주변 정보와 동일하게 중복되어 스크린 리더 사용자에게 혼란을 줍니다. 장식용(alt='') 처리를 요청하세요.";
        rules.push("Rule 3.1 (High Similarity)");
      } else if (similarity > 0.6) {
        status = "검토 필요";
        message = "주변 텍스트와 내용이 비슷합니다. 중복 여부를 확인 후 수정을 요청하세요.";
        rules.push("Rule 3.1 (Medium Similarity)");
      }
    }

    // [단계 E] 기능형 이미지 목적 확인
    if (functionalContext.isFunctional && status === "적절" && !isDecorative) {
      status = "검토 필요";
      message = "대화형 요소 내 이미지입니다. 대체 텍스트가 시각적 설명이 아닌 기능/목적(예: '홈으로 이동')을 설명하는지 검토하세요.";
      rules.push("Rule 4.1 (Functional Alt Check)");
    }

    // [단계 F] 장식용 이미지가 적절하게 처리된 경우 명시
    if (isDecorative && status === "적절") {
      if (functionalContext.isFunctional && functionalContext.parentText) {
        message = `동일 링크/버튼 내에 텍스트("${functionalContext.parentText}")가 존재하여, 중복 방지를 위해 적절하게 비움 처리(alt="")되었습니다.`;
      } else {
        message = "장식용 요소로 올바르게 숨김 처리(alt='' 등) 되었습니다.";
      }
    }

    // 마크업 소스 및 속성 식별
    let sourceAttr = "alt";
    if (tagName === "svg") {
      sourceAttr = el.querySelector("title") ? "title" : "aria-label";
    } else if (el.getAttribute("aria-label")) {
      sourceAttr = "aria-label";
    } else if (el.title) {
      sourceAttr = "title";
    }

    return this.createReport(el, status, message, rules, accessibleName, smartContext, functionalContext, isDecorative, src, sourceAttr);
  }

  getFunctionalContext(el) {
    const parent = el.closest('a, button, [role="button"], [role="link"]');
    let parentText = '';
    if (parent) {
      parentText = parent.innerText.replace(/\s+/g, ' ').trim();
      // innerText가 시각적으로 숨겨진 텍스트를 놓치는 경우
      // isImageReplacement로 CSS 패턴 기반 감지 (클래스명 무관)
      if (!parentText) {
        Array.from(parent.children).forEach(child => {
          if (child !== el && !parentText && this.utils.isImageReplacement(child)) {
            parentText = (child.textContent || '').replace(/\s+/g, ' ').trim();
          }
        });
      }
    }
    return {
      isFunctional: !!parent,
      parentTag: parent ? parent.tagName.toLowerCase() : null,
      parentText: parentText
    };
  }

  createReport(el, status, message, rules, accessibleName, smartContext, functionalContext, isDecorative, src, sourceAttr) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        src: src || (el.tagName.toLowerCase() === 'svg' ? 'SVG Data' : 'N/A'),
        alt: accessibleName,
        sourceAttr: sourceAttr,
        selector: this.utils.getSelector(el)
      },
      context: {
        smartContext: smartContext,
        isFunctional: functionalContext.isFunctional,
        parentTag: functionalContext.parentTag,
        parentText: functionalContext.parentText,
        isDecorative: isDecorative
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
      }],
      imageInfo: {
        dimensions: `${el.naturalWidth || el.width || el.offsetWidth || 0}x${el.naturalHeight || el.height || el.offsetHeight || 0}`,
        isDecorative: isDecorative,
        fileExtension: src ? src.split('.').pop().split(/[?#]/)[0] : 'N/A'
      }
    };
  }
}

if (window.ABTCore) {
  window.ABTCore.registerProcessor("1.1.1", new Processor111());
}
