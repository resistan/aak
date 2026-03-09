/**
* ABT Processor 1.4.1 (Use of Color)
*
* KWCAG 2.2 지침 1.4.1 색에 무관한 콘텐츠 인식
* 색상만으로 정보를 구분하거나 강조하지 않아야 합니다. (예: 문장 내 링크)
*
* [진단 범위]
* - <a> 링크 요소 (문장 내 포함 여부 정밀 분석)
* - 배경색만 있고 텍스트가 없는 UI 요소
* - 차트 및 그래프 콘텐츠 (Canvas, SVG)
*
* [주요 로직]
* - 지능형 문맥 분석: 링크가 독립적인 UI 항목(메뉴 등)인지, 문장 속 일부인지 레이아웃 스타일(Flex/Grid)과 인접 텍스트 노드를 통해 식별
* - 배경색 요소 탐지: 텍스트 없이 색상만으로 상태를 나타내는 요소(예: 상태 점) 탐지
* - 시각 정보 콘텐츠: 차트 등 색상 구분이 필수적인 영역에 대한 수동 검토 유도
*/
class Processor141 {
  constructor() {
    this.id = "1.4.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const reports = [];
    const links = document.querySelectorAll('a');

    for (const link of links) {
      if (this.utils.isHidden(link)) continue;
      const style = window.getComputedStyle(link);
      const parent = link.parentElement;
      if (!parent) continue;
      const parentStyle = window.getComputedStyle(parent);

      // 1. 링크 밑줄 여부 확인
      const hasUnderline = style.textDecorationLine.includes('underline') ||
      style.borderBottomStyle !== 'none' ||
      style.textDecoration.includes('underline');

      if (!hasUnderline && link.innerText.trim().length > 0) {
        // 부모와 색상이 다른지 확인
        const isColorDifferent = style.color !== parentStyle.color;

        // [개선] 문맥 판단 로직 강화
        // A. 레이아웃 기반: 부모가 Flex/Grid면 독립 요소일 가능성이 높음
        const isFlexOrGrid = parentStyle.display === 'flex' || parentStyle.display === 'grid';

        // B. 인라인 텍스트 기반: 직계 자식 중 비어있지 않은 '텍스트 노드'가 있는지 확인
        const hasDirectTextSibling = Array.from(parent.childNodes).some(node =>
          node !== link && node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
        );

        // C. 제목/버튼 성격: 링크 자체가 블록 요소이거나 주변에 제목 요소만 있는 경우 제외
        const isBlockLike = style.display === 'block' || style.display === 'inline-block';

        // D. 문장 내 포함 여부 최종 판단
        // - 색상이 다르고,
        // - 직계 텍스트 노드와 섞여 있으며 (문장의 일부),
        // - 레이아웃상 분리된 구조(Flex/Grid)가 아니고,
        // - 링크가 인라인 상태일 때만 경고
        if (isColorDifferent && hasDirectTextSibling && !isFlexOrGrid && !isBlockLike) {
          reports.push(this.createReport(link, "검토 필요", "문장이나 텍스트 뭉치 안에 포함된 링크가 밑줄 없이 색상으로만 구분되고 있습니다. 색을 인지하지 못하는 사용자를 위해 밑줄 등 추가적인 시각적 구분을 제공하세요."));
        }
      }
    }

    // 2. 배경색만 있고 텍스트가 없는 요소 (아이콘 버튼 등)
    const elementsWithBg = document.querySelectorAll('div, span, i, b');
    for (const el of elementsWithBg) {
      if (this.utils.isHidden(el)) continue;
      const style = window.getComputedStyle(el);
      const hasBgColor = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
      const hasNoText = el.innerText.trim().length === 0;
      const hasNoAria = !el.getAttribute('aria-label') && !el.getAttribute('title');

      if (hasBgColor && hasNoText && hasNoAria && (parseInt(style.width) > 0 || parseInt(style.height) > 0)) {
        reports.push(this.createReport(el, "검토 필요", "요소에 배경색은 있으나 텍스트나 레이블이 없습니다. 색상만으로 정보를 전달하고 있다면 패턴이나 텍스트를 추가하세요."));
      }
    }

    // 3. 그래프/차트 콘텐츠 탐지 (Canvas, SVG, Chart-related containers)
    const potentialCharts = document.querySelectorAll('canvas, svg:not([role="img"]), .chart, [id*="chart"], .graph, [id*="graph"]');
    const processedCharts = new Set();

    for (const el of potentialCharts) {
      if (this.utils.isHidden(el)) continue;

      // 이미 분석된 요소나 부모가 차트 컨테이너인 경우 중복 방지
      let parent = el.parentElement;
      let isNested = false;
      while (parent) {
        if (processedCharts.has(parent)) {
          isNested = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (isNested) continue;

      const style = window.getComputedStyle(el);
      const width = parseInt(style.width);
      const height = parseInt(style.height);

      // 너무 작은 요소(아이콘 등)는 제외
      if (width > 50 && height > 50) {
        processedCharts.add(el);
        reports.push(this.createReport(el, "검토 필요", "그래프나 차트 등 시각적 정보를 담은 콘텐츠가 탐지되었습니다. 데이터의 계열이나 값을 구분할 때 색상뿐만 아니라 패턴, 모양, 레이블 등 색에 무관하게 인식할 수 있는 수단이 함께 제공되는지 검토하세요."));
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
        message: message,
        rules: ["Rule 1.1 (Color Independence)"]
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
  window.ABTCore.registerProcessor("1.4.1", new Processor141());
}
