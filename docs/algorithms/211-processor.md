# ABT-2.1.1-Processor: 키보드 사용 보장 v0.12

### 🔗 References
- KWCAG 2.2: 2.1.1 키보드 사용 보장
- WCAG 2.2: 2.1.1 Keyboard (A) (Reference)

---

이 알고리즘은 **KWCAG 2.1.1(키보드 사용 보장)** 지침을 준수하며, 모든 기능을 마우스 없이 키보드만으로도 수행할 수 있는지 진단한다. 특히 비표준 이벤트 핸들러가 사용된 요소와 모달 대화상자의 접근성을 집중 분석한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Interactive Tags:** `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<details>`, `<summary>`.
- **Event Handlers:** `onclick` 속성 또는 `onclick` 이벤트 리스너 존재 여부.
- **Attributes:** `tabindex`, `role`, `aria-modal`, `aria-hidden`.
- **Visibility:** `offsetParent`를 통한 실제 노출 여부 확인.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 모달 대화상자 진단 (Modal Dialogs)
- **Rule 3.1 (Modal Exit & Trapping):** `role="dialog"`, `role="alertdialog"` 또는 `aria-modal="true"` 요소 탐지.
  - **닫기 버튼 부재:** 내부 텍스트나 레이블에 '닫기', 'close', '취소', 'cancel', 'x'가 포함된 버튼/링크가 없는 경우.
    - 결과: **[검토 필요]** (Modal Exit - 탈출 수단 확인 필요).
  - **닫기 버튼 존재:** 닫기 버튼은 있으나 초점 가둠(Focus Trap) 및 복귀 여부 확인이 필요한 경우.
    - 결과: **[검토 필요]** (Modal Trapping - 동작 검증 필요).

### [단계 B] 비표준 대화형 요소 탐지 (Non-standard Controls)
- **Rule 1.1 (Focus Accessibility):** 비대화형 태그에 클릭 이벤트가 있으나 `tabindex`가 없어 키보드 접근이 불가능한 경우.
  - 결과: **[오류]**.
- **Rule 1.2 (Semantic Role):** 클릭 이벤트와 `tabindex`는 있으나 `role`이 명시되지 않은 경우.
  - 결과: **[수정 권고]**.

### [단계 C] 초점 차단 및 순서 왜곡 (Focus Blocking & Order)
- **Rule 2.1 (Focus Blocked):** 대화형 태그임에도 `tabindex="-1"`이 설정되어 포커스가 막힌 경우 (숨김 처리 제외).
  - 결과: **[수정 권고]**.
- **Rule 2.2 (Positive Tabindex):** `tabindex`가 0보다 큰 양수로 설정되어 자연스러운 탭 순서를 방해하는 경우.
  - 결과: **[수정 권고]**.

### [단계 D] 이벤트 짝 맞춤 검사 (Event Pairing)
- **Rule 4.1:** 클릭 핸들러는 있으나 키보드 이벤트(`keydown`, `keypress`) 핸들러가 없는 비표준 요소.
  - 결과: **[검토 필요]** (Enter/Space 키 작동 여부 확인 필요).

## 3. 최종 상태 정의 (Final Status)
1. **오류:** 키보드 접근성 완전 차단 (tabindex 누락 등).
2. **검토 필요:** 모달 대화상자, 키보드 이벤트 누락 등 수동 확인이 필요한 항목.
3. **수정 권고:** 접근은 가능하나 의미 전달(role) 누락, 탭 순서 왜곡, 의도치 않은 포커스 차단 등.
4. **적절:** 키보드 접근성이 정상적으로 보장된 요소.
