# ABT-3.3.2-Processor: 레이블 제공 v0.10

### 🔗 References
- KWCAG 2.2: 3.3.2 레이블 제공
- WCAG 2.2: 3.3.2 Labels or Instructions (A) (Reference)

---

이 알고리즘은 **KWCAG 3.3.2(레이블 제공)** 지침을 준수하며, 폼 컨트롤(사용자 입력 서식) 요소가 스크린 리더와 같은 보조기술에 정확한 목적이나 용도(Name)를 전달할 수 있도록 명시적인 레이블이 제공되었는지 진단한다.

## 1. 대상 식별 및 데이터 수집 (Data Collection)

### [대상 요소 추출]
- **데이터 입력 요소**: `<input>` (type이 text, checkbox, radio, password, file 등), `<textarea>`, `<select>`
- **사용자 상호작용 요소**: ARIA role이 입력 서식인 요소 (`[role="textbox"]`, `[role="combobox"]`, `[role="slider"]`, `[role="spinbutton"]`, `[role="searchbox"]` 등)
- **제외 대상**: 
  - 서브밋 버튼, 리셋 버튼, 이미지 버튼 (`type="submit"`, `type="reset"`, `type="image"`, `type="button"`, `<button>`)은 7.3.2 검사 대상에서 제외하고 주로 대체 텍스트(5.1.1)나 네임(6.5.3) 항목에서 평가한다.
  - 화면에서 완전히 숨겨진 요소 (`type="hidden"`, `display: none`, `aria-hidden="true"`).

## 2. 분석 및 분류 로직 (Analysis Pipeline)

모든 대상 입력 서식에 대해 다음 우선순위에 따라 레이블(Accessible Name)의 존재를 검사한다.

### [단계 A] 명시적 <label> 연결 검사 (가장 권장됨)
- 대상 요소의 `id` 속성값과 동일한 `for` 속성을 가진 `<label>` 태그가 존재하는가?
- 혹은 대상 요소가 `<label>` 태그의 자식 요소로 직접 감싸져 있는가(Implicit connection)?
- 결과: 연결된 `<label>`이 존재하고 내부에 유효한 텍스트가 있다면 **[적절(Pass)]** 판정.

### [단계 B] ARIA 속성을 통한 대체 레이블 검사
- 명시적 `<label>`이 없는 경우, 다음 속성 중 하나로 대체 제공되었는가?
  1. `aria-labelledby`를 통한 텍스트 노드 연결 (**적절**)
2. `aria-label`을 통한 텍스트 직접 삽입 (**적절**)
3. `title` 속성을 통한 텍스트 제공 (**수정 권고**) - HTML5 스펙상 유효한 대체 레이블이나 시각적 레이블 제공 권장.

### [단계 C] Placeholder 의존성 검사 (오류 분류)
- `<label>`, `title`, `aria` 속성들이 모두 없고, 오직 `placeholder` 속성만 제공되었는가?
- KWCAG 2.2 가이드라인 및 웹 접근성 표준 상, `placeholder`는 입력 힌트일 뿐 레이블을 대체할 수 없다.
- 결과: 레이블 제공 없이 `placeholder`만 존재하면 **[오류]**.

## 3. 최종 상태 정의 (Final Status)
1. **오류 (Fail):**
   - 입력 폼 요소에 `label`(명시적/암시적 연결), `title`, `aria-label`, `aria-labelledby` 중 그 어떤 속성도 제공되지 않은 경우.
   - 연결된 `<label>`이나 `aria-labelledby` 대상이 존재하지만 텍스트 내용이 텅 빈 경우.
   - 레이블 수단 없이 `placeholder` 속성만 단독으로 제공된 경우.
2. **검토 필요 (Needs Review):**
   - 복잡한 다중 폼 제어(`fieldset` / `legend`) 구조 등에서, 기계적 매핑은 완료되었으나 실제 문맥상 레이블이 폼의 용도를 정확히 설명하는지 사람이 확인해야 할 때.
3. **수정 권고 (Suggestion):**
   - `title` 속성으로 레이블을 대체한 경우 (접근성 스펙상 오류는 아니나, 시각적 레이블 노출이 더 권장됨).
4. **적절 (Pass):**
   - `id`-`for`로 연결된 유효한 `<label>`이 존재함.
   - 암묵적 래핑(`<label><input></label>`) 방식이 올바르게 사용됨.
   - 유효한 텍스트를 가진 `aria-label` 또는 `aria-labelledby`가 제공됨.
5. **N/A:**
   - 페이지 내에 사용자 입력 서식 요소가 존재하지 않음.
