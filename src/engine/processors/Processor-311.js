/**
* ABT Processor 3.1.1 (Language of Page)
*
* KWCAG 2.2 지침 3.1.1 기본 언어 표시
* 모든 웹 페이지에는 해당 페이지의 기본 언어를 프로그래밍적으로 명시해야 합니다.
*
* [진단 범위]
* - <html> 요소의 lang 속성
*
* [주요 로직]
* - lang 속성 존재 여부: <html> 태그에 lang 속성이 정의되어 있는지 확인
* - 유효한 코드: 'ko', 'en' 등 ISO 표준 언어 코드를 사용하는지 검증
*/
class Processor311 {
  constructor() {
    this.id = "3.1.1";
    this.utils = window.ABTUtils;
  }

  async scan() {
    const html = document.documentElement;
    return [this.analyze(html)];
  }

  analyze(el) {
    const lang = el.getAttribute('lang');
    const xmlLang = el.getAttribute('xml:lang');

    const targetLang = lang || xmlLang;

    let status = "적절";
    let message = `기본 언어가 적절히 제공되었습니다. (lang="${targetLang}")`;
    const rules = [];

    if (!targetLang) {
      status = "오류";
      message = "<html> 요소에 lang(또는 xml:lang) 속성이 제공되지 않았습니다.";
      rules.push("Rule 3.1.1 (Missing lang attribute)");
    } else if (targetLang.trim() === "") {
      status = "오류";
      message = "<html> 요소의 lang 속성값이 비어있습니다.";
      rules.push("Rule 3.1.1 (Empty lang attribute)");
    } else {
      // 1단계: BCP 47 정규식 형식을 만족하는지 기본 검증
      const isValidBCP47 = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(targetLang.trim());

      if (!isValidBCP47) {
        status = "오류";
        message = `lang 속성값("${targetLang}")이 올바른 BCP 47 언어 코드(예: ko, en-US) 형식이 아닙니다.`;
        rules.push("Rule 3.1.1 (Invalid lang format)");
      } else {
        // 2단계: 자주 쓰이는 핵심 BCP 47 코드 화이트리스트 대조
        // 사용자가 제안한 핵심 5국, 유럽, 북남미, 기타 전략 국가 코드 (대소문자 무시 비교를 위해 소문자로 통일)
        // 참고: 'ko', 'en' 등 Primary Subtag 단독 사용도 허용
        const commonLangs = [
          // 단일 언어 코드 (Primary)
          'ko', 'en', 'ja', 'zh', 'fr', 'de', 'es', 'it', 'pt', 'vi', 'th', 'ru',
          // 지역 포함 코드 (Primary-Region)
          'ko-kr', 'en-us', 'ja-jp', 'zh-cn', 'zh-tw',
          'fr-fr', 'de-de', 'es-es', 'it-it',
          'fr-ca', 'es-mx', 'pt-br',
          'vi-vn', 'th-th', 'ru-ru'
        ];

        const normalizedLang = targetLang.trim().toLowerCase();

        // 언어 코드 → 한국어 명칭 매핑
        const langNames = {
          'ko': '한국어', 'en': '영어', 'ja': '일본어', 'zh': '중국어',
          'fr': '프랑스어', 'de': '독일어', 'es': '스페인어', 'it': '이탈리아어',
          'pt': '포르투갈어', 'vi': '베트남어', 'th': '태국어', 'ru': '러시아어'
        };
        const primaryLang = normalizedLang.split('-')[0];

        if (!commonLangs.includes(normalizedLang)) {
          status = "검토 필요";
          message = `lang="${targetLang}"가 감지되었습니다. 올바른 언어 코드인지 확인하세요.`;
          rules.push("Rule 3.1.1 (Uncommon lang code check)");
        } else {
          const langName = langNames[primaryLang];
          status = "검토 필요";
          message = langName
            ? `${langName}(${targetLang})로 설정되어 있습니다. 실제 페이지 본문의 기본 언어가 맞는지 확인하세요.`
            : `lang="${targetLang}"가 감지되었습니다. 실제 페이지 본문의 기본 언어가 맞는지 확인하세요.`;
          rules.push("Rule 3.1.1 (Manual Content Check Required)");
        }
      }
    }

    return this.createReport(el, status, message, rules, targetLang);
  }

  createReport(el, status, message, rules, targetLang) {
    return {
      guideline_id: this.id,
      elementInfo: {
        tagName: el.tagName,
        selector: "html"
      },
      context: { smartContext: `lang: ${targetLang || '없음'}` },
      result: { status, message, rules },
      currentStatus: status,
      history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
    };
  }
}

if (window.ABTCore) { window.ABTCore.registerProcessor("3.1.1", new Processor311()); }