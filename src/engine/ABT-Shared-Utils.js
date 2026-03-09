/**
* ABT Shared Utilities
* 모든 지침별 프로세서에서 공통으로 사용하는 유틸리티 모음
*/
window.ABTUtils = Object.assign(window.ABTUtils || {}, {
  /**
  * 요소의 CSS 셀렉터를 생성합니다.
  */
  /**
  * 요소의 고유성을 보장하기 위한 다중 선택자 전략을 생성합니다.
  * 단순히 하나의 선택자만 반환하는 것이 아니라, 폴백 가능한 정보를 포함할 수 있도록 합니다.
  */
  /**
  * 요소의 고유성을 보장하기 위한 다중 선택자 전략을 생성합니다.
  * 단순히 하나의 선택자만 반환하는 것이 아니라, 문서 전체에서 해당 요소를 유일하게 특정할 수 있는 경로를 생성합니다.
  */
  getSelector: function(el) {
    if (!el) return "";
    if (el.id) return `#${CSS.escape(el.id)}`;

    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === Node.ELEMENT_NODE) {
      let selector = cur.tagName.toLowerCase();
      if (cur.id) {
        selector = `#${CSS.escape(cur.id)}`;
        parts.unshift(selector);
        break;
      } else {
        let sibCount = 0;
        let sibIndex = 0;
        const siblings = cur.parentNode ? Array.from(cur.parentNode.children) : [];
        for (const sib of siblings) {
          if (sib.tagName === cur.tagName) {
            sibCount++;
            if (sib === cur) sibIndex = sibCount;
          }
        }
        if (sibCount > 1) {
          selector += `:nth-of-type(${sibIndex})`;
        }
      }
      parts.unshift(selector);
      cur = cur.parentNode;
      if (!cur || cur.tagName === 'HTML' || cur.tagName === 'BODY') break;
    }
    return parts.join(' > ');
  },

  /**
  * 요소 주변의 텍스트 맥락을 스마트하게 추출합니다.
  * @param {HTMLElement} el - 대상 요소
  * @param {number} length - 추출할 앞뒤 글자 수 (기본 50자)
  */
  getSmartContext: function(el, length = 50) {
    const parent = el.closest('div, section, article, li, a, button, p, h1, h2, h3, h4, h5, h6') || el.parentElement;
    if (!parent) return "";

    const fullText = parent.innerText.replace(/\s+/g, ' ').trim();
    // 요소가 가진 텍스트가 있다면 해당 위치를 기준으로, 없다면 전체에서 검색
    const targetText = el.innerText || el.getAttribute('alt') || "";
    const index = targetText ? fullText.indexOf(targetText) : -1;

    if (index === -1) return fullText.substring(0, length * 2);

    const start = Math.max(0, index - length);
    const end = Math.min(fullText.length, index + targetText.length + length);
    return fullText.substring(start, end);
  },

  /**
  * 두 문자열 간의 단어 기반 유사도를 계산합니다.
  */
  calculateSimilarity: function(str1, str2) {
    if (!str1 || !str2) return 0;
    const clean = (s) => s.toLowerCase().replace(/[^\w\sㄱ-힣]/g, '');
    const words1 = new Set(clean(str1).split(/\s+/).filter(Boolean));
    const words2 = clean(str2).split(/\s+/).filter(Boolean);

    if (words1.size === 0) return 0;

    const intersection = words2.filter(word => words1.has(word));
    return intersection.length / Math.max(words1.size, 1);
  },

  /**
  * RGB 색상 문자열(rgb(r,g,b))에서 상대 휘도(Luminance)를 계산합니다.
  */
  getLuminance: function(colorStr) {
    const rgb = colorStr.match(/\d+/g);
    if (!rgb || rgb.length < 3) return 0;

    const [r, g, b] = rgb.map(c => {
      let v = parseInt(c) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
  * 두 휘도 값 사이의 명도 대비를 계산합니다.
  */
  getContrastRatio: function(l1, l2) {
    const brighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (brighter + 0.05) / (darker + 0.05);
  },

  /**
  * 요소가 화면에 표시되는지(숨겨져 있지 않은지) 확인합니다.
  */
  isHidden: function(el) {
    if (!el) return true;
    const style = window.getComputedStyle(el);

    // 1. 명시적 숨김 속성 체크 (display: none은 스크린 리더도 무시하므로 유지)
    if (style.display === 'none') return true;

    // 2. visibility: hidden이나 opacity: 0은 스크린 리더가 읽을 수 있는 경우가 많으므로 지침에 따라 판단하도록 통과시킴
    // 단, 크기가 0이면서 opacity 0인 경우는 정말 숨겨진 것으로 간주할 수 있음
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && style.opacity === '0') return true;

    // 3. 부모 요소 체크 완화: 부모가 display: none이면 자식도 숨겨지므로 이 부분만 유지하되, 그 외엔 통과시킴
    let parent = el.parentElement;
    while (parent) {
      try {
        if (window.getComputedStyle(parent).display === 'none') return true;
      } catch (e) {}
      parent = parent.parentElement;
    }
    return false;
  },

  /**
  * 요소가 이미지 대체 기법(IR) 또는 스크린 리더 전용(SR-only)으로 숨겨져 있는지 확인합니다.
  */
  isImageReplacement: function(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);

    // 1. text-indent 기법
    const textIndent = parseInt(style.textIndent);
    if (Math.abs(textIndent) > 500) return true;

    // 2. font-size: 0 기법
    const fontSize = parseInt(style.fontSize);
    if (fontSize === 0) return true;

    // 3. sr-only / blind 클래스 표준 기법 (position: absolute + clip)
    const isAbsolute = style.position === 'absolute';
    const isClipped = style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clip === 'rect(1px, 1px, 1px, 1px)';
    const isClipPath = style.clipPath === 'inset(50%)' || style.clipPath === 'inset(100%)';

    if (isAbsolute && (isClipped || isClipPath)) return true;

    // 4. 위치를 화면 밖으로 밀어내는 기법
    const left = parseInt(style.left);
    const top = parseInt(style.top);
    if (isAbsolute && (left < -5000 || top < -5000)) return true;

    return false;
  },

  /**
  * W3C AccName 1.2 기반 Accessible Name 추출 (경량화 버전)
  * 참고: https://www.w3.org/TR/accname-1.2/
  * @param {HTMLElement} el
  * @returns {string}
  */
  getAccessibleName: function(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";

    // 1. aria-labelledby (가장 높은 우선순위)
    if (el.hasAttribute('aria-labelledby')) {
      const ids = el.getAttribute('aria-labelledby').split(/\s+/);
      const parts = ids.map(id => {
        const target = document.getElementById(id);
        // Note: W3C 표준에 따르면 여기서 target의 aria-labelledby는 무시해야 하지만,
        // 경량 구현이므로 innerText/textContent를 우선 가져옵니다.
        return target ? (target.innerText || target.textContent).trim() : "";
      });
      const name = parts.join(" ").trim();
      if (name) return name;
    }

    // 2. aria-label
    if (el.hasAttribute('aria-label')) {
      const name = el.getAttribute('aria-label').trim();
      if (name) return name;
    }

    // 3. Native markup (e.g., alt for img, value for inputs)
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'img' || tagName === 'area') {
      return el.getAttribute('alt') || "";
    }
    if (tagName === 'input' && (el.type === 'button' || el.type === 'submit' || el.type === 'reset')) {
      return el.value || "";
    }
    if (tagName === 'input' && el.type === 'image') {
      return el.getAttribute('alt') || el.value || "";
    }

    // 4. Text content (자식 요소 텍스트 포함)
    // input/select 등의 경우 연관된 label 요소를 찾아야 하나,
    // 기본적으로 innerText를 사용하여 화면에 보이는 텍스트를 추출
    const textContent = el.innerText || el.textContent;
    if (textContent && textContent.trim()) {
      return textContent.trim();
    }

    // 5. title attribute (가장 낮은 우선순위)
    if (el.hasAttribute('title')) {
      return el.getAttribute('title').trim();
    }

    return "";
  }
});
