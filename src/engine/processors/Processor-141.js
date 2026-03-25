/**
* ABT Processor 1.4.1 (Use of Color)
*
* KWCAG 2.2 지침 1.4.1 색에 무관한 콘텐츠 인식
* 색상만으로 정보를 구분하거나 강조하지 않아야 합니다.
*
* [진단 범위]
* - <a> 링크 요소: 문장 내 링크가 밑줄 없이 색상으로만 구분되는 경우
* - 형제 색상 비교: 같은 부모 안에서 서로 다른 배경색으로 상태/구분을 나타내는 요소 그룹
* - 클래스명 기반 상태 요소: status, badge, dot 등 의미론적 힌트가 있는 배경색 전용 요소
* - 시각적 데이터 콘텐츠: 차트, 그래프 등 색상 구분이 필수적인 영역
*
* [주요 로직]
* - 링크 문맥 분석: 부모 레이아웃(Flex/Grid), 인접 텍스트 노드, 인라인 여부로 문장 내 포함 판단
* - 형제 색상 비교: 텍스트 없는 요소들이 같은 부모 아래 서로 다른 배경색을 가질 때 색 구분 구조로 탐지
* - 클래스명 탐지: status/badge/dot/indicator 등 클래스명에 의미론적 힌트가 있는 요소 중 색상만 존재하는 경우
* - 장식 요소 제외: aria-hidden, 인터랙티브 요소(button, a 등) 내부 자식은 탐지 대상에서 제외
* - SVG 아이콘 제외: 도형 요소(path, rect 등) 5개 미만은 아이콘으로 간주
*   canvas, .chart, [id*="chart"] 등은 클래스/태그 자체가 의미론적 근거이므로 크기 조건 불필요
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

    const INTERACTIVE_SELECTOR = 'button, a[href], [role="button"], [role="link"], [role="menuitem"]';

    // 공통 필터: 숨김/장식/인터랙티브 자식 제외
    const isDecorative = (el) =>
      this.utils.isHidden(el) ||
      el.getAttribute('aria-hidden') === 'true' ||
      !!el.closest(INTERACTIVE_SELECTOR);

    const getEffectiveBg = (el) => {
      const bg = window.getComputedStyle(el).backgroundColor;
      return (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') ? null : bg;
    };

    // 2. 형제 색상 비교: 같은 부모 안에서 서로 다른 배경색을 가진 텍스트 없는 요소가 2개 이상
    // 예: 빨강/초록/노랑 상태 점 그룹, 색상 범례 등
    const siblingCandidates = Array.from(document.querySelectorAll('div, span, li, td, th'))
      .filter(el => !isDecorative(el))
      .filter(el => el.innerText.trim().length === 0)
      .filter(el => !!getEffectiveBg(el));

    const parentMap = new Map();
    for (const el of siblingCandidates) {
      const parent = el.parentElement;
      if (!parent) continue;
      if (!parentMap.has(parent)) parentMap.set(parent, []);
      parentMap.get(parent).push({ el, bg: getEffectiveBg(el) });
    }

    for (const [parent, items] of parentMap) {
      if (items.length < 2) continue;
      const uniqueColors = new Set(items.map(i => i.bg));
      if (uniqueColors.size < 2) continue; // 색상이 모두 같으면 색 비교가 아님

      reports.push(this.createReport(
        parent,
        "검토 필요",
        `같은 영역 안에 서로 다른 배경색을 가진 텍스트 없는 요소가 ${items.length}개 있습니다. 색상만으로 상태나 구분을 나타내고 있다면 텍스트, 패턴 등 추가 구분 수단이 필요합니다.`
      ));
    }

    // 3. 클래스명 기반 상태/분류 요소: status, badge, dot 등 의미론적 힌트가 있는 요소
    const STATUS_SELECTOR = [
      '[class*="status"]', '[class*="badge"]', '[class*="dot"]',
      '[class*="indicator"]', '[class*="tag"]', '[class*="chip"]',
      '[class*="pill"]', '[class*="state"]', '[class*="label"]'
    ].join(', ');

    const statusElements = document.querySelectorAll(STATUS_SELECTOR);
    for (const el of statusElements) {
      if (isDecorative(el)) continue;
      const bg = getEffectiveBg(el);
      if (!bg) continue;
      // 텍스트나 접근성 레이블이 있으면 색 외 수단이 있으므로 제외
      if (el.innerText.trim().length > 0) continue;
      if (el.getAttribute('aria-label') || el.getAttribute('title')) continue;

      reports.push(this.createReport(
        el,
        "검토 필요",
        "상태나 분류를 나타낼 수 있는 요소가 배경색만으로 표현되고 있습니다. 색상 외에 텍스트, 아이콘, 패턴 등 추가 구분 수단이 있는지 검토하세요."
      ));
    }

    // 4. 그래프/차트 콘텐츠 탐지 (Canvas, SVG, Chart-related containers)
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

      // SVG는 크기 대신 자식 도형 요소 수로 아이콘/차트 구분
      // 도형 요소가 5개 미만이면 단순 아이콘 SVG로 간주하고 제외
      if (el.tagName.toLowerCase() === 'svg') {
        const shapeCount = el.querySelectorAll('path, rect, circle, line, polygon, polyline, ellipse').length;
        if (shapeCount < 5) continue;
      }

      // canvas, .chart, [id*="chart"] 등은 클래스/태그 자체가 의미론적 근거이므로 크기 조건 없이 탐지
      processedCharts.add(el);
      reports.push(this.createReport(el, "검토 필요", "그래프나 차트 등 시각적 정보를 담은 콘텐츠가 탐지되었습니다. 데이터의 계열이나 값을 구분할 때 색상뿐만 아니라 패턴, 모양, 레이블 등 색에 무관하게 인식할 수 있는 수단이 함께 제공되는지 검토하세요."));
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
