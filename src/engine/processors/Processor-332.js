/**
* ABT Processor 3.3.2 (Labels or Instructions)
*
* KWCAG 2.2 지침 3.3.2 레이블 제공
* 사용자가 정보를 입력하거나 제어하는 모든 구성 요소에는 명확한 레이블이나 지시사항을 제공해야 합니다.
*
* [진단 범위]
* - <input>, <select>, <textarea>
*
* [주요 로직]
* - <label> 연결: for-id 매칭 또는 암시적 연결 여부 확인
* - aria-label: 시각적 레이블이 없을 경우 프로그래밍적 대체 수단 존재 여부 검사
*/
class Processor332 {
  constructor() {
    this.id = "3.3.2";
    this.utils = window.ABTUtils;
  }

  async scan() {
    // 입력 서식 및 ARIA 입력 롤을 가진 요소 모두 포함 (submit, reset, hidden 등 제외)
    const inputs = document.querySelectorAll(`
      input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),
      select,
      textarea,
      [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="searchbox"]
    `);
      const reports = [];

      for (const el of inputs) {
        // 화면에서 숨겨져 있고, focus도 받을 수 없는 상태면 제외
        if (this.utils.isHidden(el)) continue;
        reports.push(this.analyze(el));
      }
      return reports;
    }

    analyze(el) {
      let status = "적절";
      let message = "입력 서식에 적절한 레이블이 제공되었습니다.";
      const rules = [];

      let hasLabel = false;
      let labelMethod = "";

      if (el.hasAttribute('aria-label') && el.getAttribute('aria-label').trim() !== "") {
        hasLabel = true;
        labelMethod = "aria-label";
      }
      else if (el.hasAttribute('aria-labelledby')) {
        const ids = el.getAttribute('aria-labelledby').trim().split(/\s+/);
        const labelText = ids.map(id => {
          const ref = document.getElementById(id);
          return ref ? ref.textContent.trim() : "";
        }).join(" ").trim();
        if (labelText !== "") {
          hasLabel = true;
          labelMethod = "aria-labelledby";
        } else {
          status = "오류";
          message = `aria-labelledby 대상(id="${ids.join(', ')}")이 없거나 내용이 비어있습니다.`;
          rules.push("Rule 3.3.2 (Invalid aria-labelledby)");
        }
      }
      else if (el.id) {
        const labelEl = document.querySelector(`label[for="${el.id}"]`);
        if (labelEl && labelEl.textContent.trim() !== "") {
          hasLabel = true;
          labelMethod = "label[for]";
        } else if (labelEl) {
          status = "오류";
          message = "<label> 요소가 연결되어 있으나 텍스트 내용이 비어있습니다.";
          rules.push("Rule 3.3.2 (Empty explicit label)");
        }
      }

      if (!hasLabel) {
        const parentLabel = el.closest('label');
        if (parentLabel && parentLabel.textContent.replace(el.value || '', '').trim() !== "") {
          hasLabel = true;
          labelMethod = "implicit wrapper label";
        }
      }

      // placeholder 단독 사용 검사 (레이블 대체 불가)
      if (!hasLabel && el.hasAttribute('placeholder') && el.getAttribute('placeholder').trim() !== "") {
        status = "오류";
        message = "레이블 없이 placeholder 속성만 제공되었습니다. placeholder는 힌트일 뿐 레이블을 대체할 수 없으므로 <label> 또는 title, aria-label을 추가하세요.";
        rules.push("Rule 3.3.2 (Placeholder is not a label)");
        return this.createReport(el, status, message, rules, "placeholder only");
      }

      if (!hasLabel && el.hasAttribute('title') && el.getAttribute('title').trim() !== "") {
        hasLabel = true;
        labelMethod = "title attribute";
        status = "수정 권고";
        message = "title 속성으로 레이블을 제공했습니다. 시각적 label 태그나 aria-label 사용을 권장합니다.";
        rules.push("Rule 3.3.2 (Title used as label)");
      }

      if (!hasLabel && status === "적절") {
        status = "오류";
        message = "입력 서식에 레이블(<label>, title, aria-label 등)이 제공되지 않았습니다.";
        rules.push("Rule 3.3.2 (Missing Label)");
      }

      return this.createReport(el, status, message, rules, labelMethod);
    }

    createReport(el, status, message, rules, labelMethod) {
      return {
        guideline_id: this.id,
        elementInfo: {
          tagName: el.tagName,
          selector: this.utils.getSelector(el)
        },
        context: { smartContext: `Label Method: ${labelMethod || "None found"}` },
        result: { status, message, rules },
        currentStatus: status,
        history: [{ timestamp: new Date().toLocaleTimeString(), status: "탐지", comment: message }]
      };
    }
  }

  if (window.ABTCore) { window.ABTCore.registerProcessor("3.3.2", new Processor332()); }
