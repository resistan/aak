/**
* ABT Processor 1.3.3 (Sensory Characteristics)
*
* KWCAG 2.2 지침 1.3.3 명확한 지시사항 제공
* 지시사항은 모양, 크기, 위치, 소리 등 감각적 특징에만 의존하여 전달되지 않아야 합니다.
*
* [진단 범위]
* - 텍스트 콘텐츠 전체
*
* [주요 로직]
* - 키워드 매칭: '왼쪽', '오른쪽', '빨간 버튼', '동그란 아이콘' 등 위치/색상에 의존한 지시어 탐지
* - 문맥 분석: 해당 지시어가 실제 UI 요소의 물리적 특징만을 가리키는지 검토 유도
*/
class Processor133 {
  constructor() {
    this.id = "1.3.3";
    this.utils = window.ABTUtils;

    // 지능형 패턴 매칭 (감각적 표현 + 지시어 결합)
    // 단순 단어 포함이 아닌, 문맥적으로 지시사항임이 의심되는 구문을 탐지합니다.
    this.detectionPatterns = [
      // 1. 위치 기반 지시 (예: "왼쪽 버튼을 클릭", "상단 메뉴 참조")
      /(왼쪽|오른쪽|위쪽|아래쪽|상단|하단|옆|측면|앞|뒤)[\s\w]*(버튼|링크|아이콘|메뉴|항목|탭|클릭|누르|선택|참조|확인|사용)/i,

      // 2. 색상 기반 지시 (예: "빨간색 버튼", "초록색은 완료")
      /(빨간|파란|노란|초록|검정|흰색|어두운|밝은)[\s\w]*(색|버튼|링크|아이콘|클릭|누르|항목)/i,

      // 3. 형태/크기 기반 지시 (예: "동그란 아이콘", "큰 항목")
      /(동그란|네모난|원형|사각형|둥근|모양|큰|작은)[\s\w]*(버튼|링크|아이콘|클릭|누르|항목)/i,

      // 4. 소리 기반 지시 (예: "신호음이 들리면")
      /(소리|신호음|비프|벨|음성)[\s\w]*(로|를|가|이|들리면|나면|확인)/i
    ];
  }

  async scan() {
    const reports = [];
    // 텍스트가 포함된 모든 요소를 탐색
    const textElements = document.querySelectorAll('p, span, div, li, label, h1, h2, h3, h4, h5, h6');

    for (const el of textElements) {
      // 직접 텍스트 노드만 추출
      const directText = Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .join(' ');

      if (!directText) continue;

      // 패턴 매칭 수행
      let foundPattern = null;
      for (const pattern of this.detectionPatterns) {
        const match = directText.match(pattern);
        if (match) {
          foundPattern = match[0];
          break;
        }
      }

      if (foundPattern) {
        reports.push(this.createReport(el, "검토 필요", `지시사항에 감각적 표현이 포함된 구문("${foundPattern}")이 탐지되었습니다. 시각이나 청각 등 특정 감각에만 의존하여 정보를 전달하고 있지 않은지 수동으로 검토하세요.`));
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
        rules: ["Rule 1.3.3 (Sensory Characteristics)"]
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
  window.ABTCore.registerProcessor("1.3.3", new Processor133());
}
