/**
* ABT Processor 2.4.3 (Link Purpose - In Context)
*
* KWCAG 2.2 지침 2.4.3 적절한 링크 텍스트
* 링크의 용도나 목적을 accessible name만으로 명확히 알 수 있어야 합니다.
*
* [진단 범위]
* - 모든 <a> 요소 및 role="link" 요소
*
* [Accessible Name 계산 우선순위]
* aria-labelledby → aria-label → innerText → img[alt] → svg > title → title 속성
*
* [주요 로직]
* - 단계 A: aria-labelledby 참조 유효성 검사 (ID 존재 여부, 텍스트 여부)
* - 단계 B: 이미지 전용 링크의 alt 부재 탐지
* - 단계 C: accessible name 부재 탐지
* - 단계 D: 모호한 표현 필터링 ('여기', '클릭', '더 보기' 등)
* - 단계 E: URL 노출 탐지
*
* [범위 외]
* - aria-label과 가시 텍스트의 불일치는 2.5.3(레이블과 이름)에서 처리
*/
class Processor243 {
  constructor() {
    this.id = "2.4.3";
    this.utils = window.ABTUtils;
    this.vagueWords = ['여기', '클릭', '더 보기', '자세히', 'go', 'link', 'more', 'click', 'here'];
  }

  /**
  * ARIA 명세 우선순위에 따라 링크의 accessible name과 출처를 계산합니다.
  * @param {HTMLElement} el - <a> 또는 role="link" 요소
  * @returns {{ name: string, source: string }}
  */
  getAccessibleNameForLink(el) {
    // 1. aria-labelledby (유효성은 단계 A에서 별도 검사)
    if (el.hasAttribute('aria-labelledby')) {
      const ids = el.getAttribute('aria-labelledby').split(/\s+/);
      const text = ids
        .map(id => { const t = document.getElementById(id); return t?.innerText?.trim() || ""; })
        .filter(Boolean)
        .join(" ")
        .trim();
      if (text) return { name: text, source: 'aria-labelledby' };
      // 텍스트가 없어도 aria-labelledby는 선언됐으므로 출처 표기
      return { name: '', source: 'aria-labelledby' };
    }

    // 2. aria-label
    if (el.hasAttribute('aria-label')) {
      const name = el.getAttribute('aria-label').trim();
      return { name, source: 'aria-label' };
    }

    // 3. innerText (자식 요소 가시 텍스트 포함)
    const innerText = (el.innerText || "").trim();
    if (innerText) return { name: innerText, source: 'text' };

    // 4. 이미지 전용 링크: img[alt]
    const imgEl = el.querySelector('img');
    if (imgEl) {
      const alt = imgEl.getAttribute('alt');
      // alt 속성 자체가 없으면 null, 빈 문자열이면 "" — 둘 다 반환해서 단계 B에서 처리
      return { name: alt || '', source: 'img-alt', imgAltMissing: alt === null };
    }

    // 5. SVG 전용 링크: aria-label → aria-labelledby → title 자식 요소 순으로 탐색
    const svgEl = el.querySelector('svg');
    if (svgEl) {
      const svgAriaLabel = svgEl.getAttribute('aria-label')?.trim();
      if (svgAriaLabel) return { name: svgAriaLabel, source: 'svg-aria-label' };

      const svgLabelledBy = svgEl.getAttribute('aria-labelledby');
      if (svgLabelledBy) {
        const text = svgLabelledBy.split(/\s+/)
          .map(id => document.getElementById(id)?.textContent?.trim() || "")
          .filter(Boolean)
          .join(" ")
          .trim();
        if (text) return { name: text, source: 'svg-labelledby' };
      }

      const svgTitle = svgEl.querySelector('title');
      if (svgTitle?.textContent?.trim()) {
        return { name: svgTitle.textContent.trim(), source: 'svg-title' };
      }

      // SVG에 accessible name 소스 없음
      return { name: '', source: 'svg-no-label' };
    }

    // 6. title 속성
    if (el.hasAttribute('title')) {
      const name = el.getAttribute('title').trim();
      if (name) return { name, source: 'title' };
    }

    return { name: '', source: 'none' };
  }

  /**
  * 문서 내 모든 링크의 목적성(accessible name 적절성)을 전수 조사합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const reports = [];
    const links = document.querySelectorAll('a, [role="link"]');

    for (const el of links) {
      // [단계 A] aria-labelledby 참조 유효성 검사
      if (el.hasAttribute('aria-labelledby')) {
        const ids = el.getAttribute('aria-labelledby').split(/\s+/);
        const missingIds = ids.filter(id => !document.getElementById(id));

        if (missingIds.length > 0) {
          reports.push(this.createReport(
            el, "오류",
            `aria-labelledby가 참조하는 요소(#${missingIds.join(', #')})가 DOM에 존재하지 않습니다.`
          ));
          continue;
        }

        const combinedText = ids
          .map(id => document.getElementById(id)?.innerText?.trim() || "")
          .filter(Boolean)
          .join(" ")
          .trim();

        if (!combinedText) {
          reports.push(this.createReport(
            el, "오류",
            `aria-labelledby가 참조하는 요소(#${ids.join(', #')})에 텍스트가 없습니다.`
          ));
          continue;
        }
      }

      const { name: accessibleName, source, imgAltMissing } = this.getAccessibleNameForLink(el);

      // [단계 B] 시각적 콘텐츠 전용 링크 accessible name 부재
      if (source === 'img-alt' && (!accessibleName || imgAltMissing)) {
        const msg = imgAltMissing
          ? "이미지로만 구성된 링크에 alt 속성이 없습니다. alt 또는 aria-label로 링크 목적을 제공해야 합니다."
          : "이미지로만 구성된 링크의 alt가 비어있습니다. 링크 목적을 설명하는 대체 텍스트를 제공해야 합니다.";
        reports.push(this.createReport(el, "오류", msg));
        continue;
      }

      if (source === 'svg-no-label') {
        reports.push(this.createReport(
          el, "오류",
          "SVG로만 구성된 링크에 접근 가능한 이름이 없습니다. SVG에 aria-label이나 title 요소를 추가하거나, 링크에 aria-label을 제공해야 합니다."
        ));
        continue;
      }

      // [단계 C] accessible name 부재
      if (!accessibleName) {
        reports.push(this.createReport(
          el, "오류",
          "링크의 목적을 알 수 있는 텍스트(이름)가 제공되지 않았습니다."
        ));
        continue;
      }

      // [단계 D] 모호한 표현 검사
      if (this.vagueWords.includes(accessibleName.toLowerCase())) {
        const describedByIds = el.getAttribute('aria-describedby');
        let descriptionText = "";
        if (describedByIds) {
          descriptionText = describedByIds.split(/\s+/)
            .map(id => document.getElementById(id)?.innerText?.trim() || "")
            .filter(Boolean)
            .join(" ");
        }

        if (descriptionText) {
          const report = this.createReport(
            el, "검토 필요",
            `링크 이름('${accessibleName}')은 모호하지만, aria-describedby를 통해 보조 설명이 제공되었습니다. 스크린리더의 '링크 목록' 탐색 시 의미가 전달되는지 검토가 필요합니다.`
          );
          report.context.smartContext += `\n[참조 설명(aria-describedby)]: "${descriptionText}"`;
          reports.push(report);
        } else {
          reports.push(this.createReport(
            el, "부적절",
            `링크 텍스트('${accessibleName}')가 너무 모호하여 목적을 파악하기 어렵습니다.`
          ));
        }
        continue;
      }

      // [단계 E] URL 노출
      if (/^https?:\/\//i.test(accessibleName)) {
        reports.push(this.createReport(
          el, "수정 권고",
          "링크 텍스트로 기계적인 URL이 노출되고 있습니다. 서술적인 문구로 대체를 권장합니다."
        ));
        continue;
      }

      // 적절
      reports.push(this.createReport(el, "적절", "적절한 링크 텍스트가 제공되었습니다."));
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
}

if (window.ABTCore) {
  window.ABTCore.registerProcessor("2.4.3", new Processor243());
}
