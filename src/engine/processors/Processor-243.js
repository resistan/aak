/**
* ABT Processor 2.4.3 (Link Purpose - In Context)
*
* KWCAG 2.2 지침 2.4.3 적절한 링크 텍스트
* 링크의 용도나 목적을 링크 텍스트만으로, 또는 링크가 포함된 맥락을 통해 명확히 알 수 있어야 합니다.
*
* [진단 범위]
* - 모든 <a> 요소 및 role="link" 요소
*
* [주요 로직]
* - 텍스트 부재 탐지: 링크 내부에 텍스트, aria-label, alt 등이 전혀 없는 경우 오류 판정
* - 모호한 표현 필터링: '여기', '클릭', '자세히' 등 맥락 없이는 의미를 알 수 없는 단어 식별
* - URL 노출 방지: 기계적인 URL(http...)을 그대로 링크 텍스트로 사용하는 경우 수정 권고
*/
class Processor243 {
  constructor() {
    this.id = "2.4.3";
    this.utils = window.ABTUtils;
    this.vagueWords = ['여기', '클릭', '더 보기', '자세히', 'go', 'link', 'more', 'click', 'here'];
  }

  /**
  * 문서 내 모든 링크의 목적성(텍스트 적절성)을 전수 조사합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const reports = [];
    const links = document.querySelectorAll('a, [role="link"]');

    for (const el of links) {
      const text = el.innerText ? el.innerText.trim() : "";
      const ariaLabel = el.getAttribute('aria-label');
      const title = el.getAttribute('title');
      const alt = el.querySelector('img') ? el.querySelector('img').getAttribute('alt') : null;

      const accessibleName = (text || ariaLabel || title || alt || "").trim();

      const describedByIds = el.getAttribute('aria-describedby');
      let descriptionText = "";

      if (describedByIds) {
        const ids = describedByIds.split(/\s+/);
        ids.forEach(id => {
          const target = document.getElementById(id);
          if (target && target.innerText) {
            descriptionText += target.innerText.trim() + " ";
          }
        });
        descriptionText = descriptionText.trim();
      }

      if (!accessibleName) {
        reports.push(this.createReport(el, "오류", "링크의 목적을 알 수 있는 텍스트(이름)가 제공되지 않았습니다."));
      } else if (this.vagueWords.includes(accessibleName.toLowerCase())) {
        if (descriptionText) {
          const report = this.createReport(el, "검토 필요", `링크 이름('${accessibleName}')은 모호하지만, aria-describedby를 통해 보조 설명이 제공되었습니다. 스크린리더의 '링크 목록' 탐색 시 의미가 전달되는지 검토가 필요합니다.`);
          report.context.smartContext += `\n[참조 설명(aria-describedby)]: "${descriptionText}"`;
          reports.push(report);
        } else {
          reports.push(this.createReport(el, "부적절", `링크 텍스트('${accessibleName}')가 너무 모호하여 목적을 파악하기 어렵습니다.`));
        }
      } else if (/^https?:\/\//i.test(accessibleName)) {
        reports.push(this.createReport(el, "수정 권고", "링크 텍스트로 기계적인 URL이 노출되고 있습니다. 서술적인 문구로 대체를 권장합니다."));
      } else {
        reports.push(this.createReport(el, "적절", "적절한 링크 텍스트가 제공되었습니다."));
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
}

if (window.ABTCore) {
  window.ABTCore.registerProcessor("2.4.3", new Processor243());
}
