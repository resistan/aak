/**
* ABT Processor 1.3.1 (Info and Relationships - Tables)
*
* KWCAG 2.2 지침 1.3.1 표의 구성
* 표는 내용과 구조를 이해할 수 있도록 제목 셀과 내용 셀을 구분하고 요약을 제공해야 합니다.
*
* [진단 범위]
* - 모든 <table> 요소
*
* [주요 로직]
* - 레이아웃 표 제외: <table> 내에 <th>가 하나도 없으면 디자인용 표로 간주하여 필터링
* - 제목 셀(<th>) 검사: <th> 부재 시 오류 판정
* - 캡션(<caption>) 검사: <caption> 또는 aria-describedby 부재 시 오류 판정
* - 데이터 연관성: scope 속성 사용을 권장하는 수정 권고 로직 포함
*/
class Processor131 {
  constructor() {
    this.id = "1.3.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const tables = document.querySelectorAll('table');
    const reports = [];

    console.log(`ABT: Found ${tables.length} raw table elements.`);

    for (const table of tables) {
      const role = table.getAttribute('role');
      if (['presentation', 'none'].includes(role)) {
        console.log(`ABT: Skipping layout table (role="${role}"):`, this.utils.getSelector(table));
        continue;
      }

      // isHidden이 너무 강력할 수 있으므로 로그 추가 및 조건 완화 고려
      if (this.utils.isHidden(table)) {
        const rect = table.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          console.log(`ABT: Skipping zero-size table:`, this.utils.getSelector(table));
          continue;
        }
        console.log(`ABT: Warning - table is considered hidden but has size:`, this.utils.getSelector(table));
      }

      reports.push(this.analyze(table));
    }
    return reports;
  }

  analyze(table) {
    // [1] 캡션 및 제목 분석 - 중첩된 표의 캡션이 섞이지 않도록 처리
    const allCaptions = Array.from(table.querySelectorAll('caption'));
    const captionEl = allCaptions.find(c => c.closest('table') === table);

    const ariaLabel = table.getAttribute('aria-label');
    const ariaLabelledBy = table.getAttribute('aria-labelledby');

    let hasCaption = !!(captionEl && captionEl.textContent.trim().length > 0);
    let captionText = hasCaption ? captionEl.textContent.trim() : "";

    if (!hasCaption && ariaLabel) {
      hasCaption = true;
      captionText = ariaLabel.trim();
    } else if (!hasCaption && ariaLabelledBy) {
      const labelEl = document.getElementById(ariaLabelledBy);
      if (labelEl && labelEl.textContent.trim()) {
        hasCaption = true;
        captionText = labelEl.textContent.trim();
      }
    }

    // [2] 제목 셀(th) 분석 - 중첩된 표의 셀은 정확히 필터링
    const allCells = table.querySelectorAll('th, [role="columnheader"], [role="rowheader"]');
    const directHeaders = Array.from(allCells).filter(cell => cell.closest('table') === table);

    const hasScope = directHeaders.some(th => th.hasAttribute('scope'));
    const summary = table.getAttribute('summary');

    // [3] HTML5 여부 판단
    const isHTML5 = (document.doctype?.publicId === "" || !document.doctype);

    let status = "적절";
    let message = "표의 구조가 적절하게 구성되었습니다.";
    const rules = [];

    // 진단 로직
    if (!hasCaption) {
      if (!isHTML5 && summary && summary.trim()) {
        message = "데이터 표에 <caption>은 없으나, summary 속성이 적절히 제공되었습니다.";
      } else {
        status = "오류";
        message = "데이터 표에 제목(<caption> 또는 ARIA label)이 누락되었습니다. 표의 내용을 요약하거나 제목을 제공해야 합니다.";
        rules.push("Rule 1.1 (Missing Caption)");
      }
    }

    if (directHeaders.length === 0) {
      if (status === "적절") {
        status = "오류";
        message = "데이터 표에 제목 셀(<th>)이 존재하지 않습니다. 행이나 열의 성격을 정의해야 합니다.";
      } else {
        message += " 또한 제목 셀(<th>)도 발견되지 않았습니다.";
      }
      rules.push("Rule 2.1 (Missing Headers)");
    }

    if (directHeaders.length > 0 && !hasScope) {
      const allTds = Array.from(table.querySelectorAll('td')).filter(td => td.closest('table') === table);
      if (!allTds.some(td => td.hasAttribute('headers'))) {
        if (status === "적절") {
          status = "수정 권고";
          message = "제목 셀(<th>)에 scope 속성을 사용하여 행/열 제목임을 명시할 것을 권장합니다.";
        }
        rules.push("Rule 2.2 (Missing Semantic Association)");
      }
    }

    if (summary && isHTML5) {
      if (status === "적절") {
        status = "수정 권고";
        message = "HTML5 표준에서는 summary 속성이 폐기되었습니다. <caption> 요소를 사용하세요.";
      }
      rules.push("Rule 1.2 (Obsolete Summary)");
    }

    return this.createReport(table, status, message, rules, hasCaption, directHeaders.length, captionText);
  }

  createReport(el, status, message, rules, hasCaption, headerCount, captionText) {
    return {
      guideline_id: "1.3.1",
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: {
        smartContext: this.utils.getSmartContext(el, 50),
        hasCaption: hasCaption,
        headerCount: headerCount,
        captionText: captionText
      },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) {
  window.ABTCore.registerProcessor("1.3.1", new Processor131());
}
