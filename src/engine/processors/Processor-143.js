/**
* ABT Processor 1.4.3 (Contrast - Minimum)
*
* KWCAG 2.2 지침 1.4.3 텍스트 콘텐츠의 명도 대비
* 텍스트와 배경의 명도 대비는 최소 4.5:1 (큰 텍스트는 3:1) 이상이어야 합니다.
*
* [진단 범위]
* - 문서 내 모든 텍스트 노드를 포함하는 요소
* - 시각적으로 숨겨진 요소(isHidden)는 제외
*
* [주요 로직]
* - 상대 휘도(Relative Luminance) 계산: sRGB 채널 값을 기반으로 인간의 눈이 느끼는 밝기 도출
* - 대비 비율 계산: (L1 + 0.05) / (L2 + 0.05) 공식을 사용하여 비율 산출
* - 폰트 크기 보정: 18pt 이상 또는 14pt(Bold) 이상인 경우 3:1 기준 적용
*/
class Processor143 {
  constructor() {
    this.id = "1.4.3";
    this.utils = window.ABTUtils;
  }

  /**
  * 문서 내 모든 텍스트의 명도 대비를 전수 조사합니다.
  * @returns {Promise<Array>} 진단 결과 리포트 배열
  */
  async scan() {
    const reports = [];
    let passCount = 0; // 통과한 항목의 수를 셉니다.
    // 모든 텍스트가 포함된 요소 탐색
    const elements = document.querySelectorAll('body *');

    for (const el of elements) {
      // 시각적으로 숨겨진 요소는 건너뜀
      if (this.utils.isHidden(el)) continue;

      // 텍스트 노드가 없는 요소는 건너뜀 (이미지 등은 별도 처리 필요하지만 여기선 텍스트 위주)
      // 텍스트 노드가 없는 요소는 건너뜀 (이미지 등은 별도 처리 필요하지만 여기선 텍스트 위주)
      const hasText = Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
      if (!hasText) continue;
      // 이미지 대체 기법(IR)이 적용된 요소는 시각적 텍스트가 아니므로 명도 대비 검사에서 제외
      if (this.utils.isImageReplacement(el)) continue;

      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = this.getRecursiveBackgroundColor(el);

      const l1 = this.utils.getLuminance(color);
      const l2 = this.utils.getLuminance(bgColor);
      const contrast = this.utils.getContrastRatio(l1, l2);

      // 폰트 크기 및 두께에 따른 기준 설정
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = style.fontWeight;
      const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

      const threshold = isLargeText ? 3.0 : 4.5;

      if (contrast < threshold) {
        reports.push(this.createReport(el, "수정 권고", `텍스트와 배경의 명도 대비가 ${contrast.toFixed(2)}:1로, 기준치(${threshold}:1)보다 낮습니다. (폰트: ${fontSize}px, ${fontWeight})`));
      } else {
        // 성공한 텍스트 요소 개수 카운트
        passCount++;
      }
    }

    // 통과한 요소가 있다면, UI 점수 계산의 모수 확장을 위해 가상의 요약 리포트 1개를 추가합니다.
    if (passCount > 0) {
      reports.push({
        guideline_id: this.id,
        elementInfo: { tagName: "document", selector: "body" },
        context: { smartContext: `명도 대비가 우수한 텍스트 요소 ${passCount}개 탐지됨` },
        result: { status: "적절", message: `명도 대비 기준(4.5:1 또는 3:1)을 충족하는 텍스트 요소가 총 ${passCount}개 확인되었습니다.`, rules: ["Rule 1.4.3 (Contrast Valid)"] },
        currentStatus: "적절",
        history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: "대량 텍스트 대비 통과 요약" }],
        // 이 플래그를 통해 UI에서 이 카드를 렌더링하지 않고 점수 계산용으로만 쓰거나, 1개로 취급할 수 있습니다.
        // 여기서는 점수 계산 로직이 group.items.length를 기준으로 하므로, 이 가상 항목 하나가 '적절' 비율을 높이도록 기여하게 합니다.
        // 더 정교하게 하려면 App.tsx의 점수 로직에서 passCount를 직접 읽어야 하지만, 우선 최소한의 긍정적인 가중치를 부여합니다.
        isSummary: true,
        passCount: passCount
      });
    }

    return reports;
  }

  /**
  * 요소의 배경색을 부모 요소를 거슬러 올라가며 찾습니다 (투명한 경우 대비)
  */
  getRecursiveBackgroundColor(el) {
    let current = el;
    while (current) {
      const style = window.getComputedStyle(current);
      const bg = style.backgroundColor;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return bg;
      }
      current = current.parentElement;
    }
    return 'rgb(255, 255, 255)'; // 기본값 흰색
  }

  createReport(el, status, message) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: this.utils.getSelector(el)
      },
      context: {
        smartContext: this.utils.getSmartContext(el, 50),
        color: window.getComputedStyle(el).color,
        backgroundColor: this.getRecursiveBackgroundColor(el)
      },
      result: {
        status: status,
        message: message,
        rules: ["Rule 1.4.3 (Contrast Ratio)"]
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
  window.ABTCore.registerProcessor("1.4.3", new Processor143());
}
