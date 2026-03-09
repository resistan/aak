# ABT-2.1.1-Processor: 키보드 사용 보장 v0.13

### 🔗 References
- KWCAG 2.2: 2.1.1 키보드 사용 보장
- WCAG 2.2: 2.1.1 Keyboard (A) (Reference)

---

이 알고리즘은 **KWCAG 2.1.1(키보드 사용 보장)** 지침을 준수하며, 모든 기능을 마우스 없이 키보드만으로도 수행할 수 있는지 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Interactive Tags:** `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<details>`, `<summary>`.
- **Event Handlers:** `onclick` 속성 또는 이벤트 리스너 존재 여부.
- **Attributes:** `tabindex`, `role`, `aria-modal`, `aria-hidden`.
- **Visibility:** `offsetParent`를 통한 실제 노출 여부 확인.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [케이스 A] 모달 대화상자 진단
- **Rule 3.1 (Modal Exit):** `role="dialog"`, `role="alertdialog"` 또는 `aria-modal="true"` 요소에서 닫기 버튼('닫기', 'close', '취소', 'cancel', 'x')이 없는 경우
  - 결과: **[검토 필요]**
  - 가이드: "사용자가 키보드(Esc 키 등)나 다른 수단으로 이 영역을 빠져나갈 수 있는지 확인하세요."

- **Rule 3.1 (Modal Trapping):** 닫기 버튼은 있으나 Focus Trap 및 초점 복귀 검증이 필요한 경우
  - 결과: **[검토 필요]**
  - 가이드: "키보드 초점이 모달 내부에 정상적으로 갇히는지와 닫힌 후 원래 위치로 초점이 복귀하는지 검토하세요."

### [케이스 B] 비표준 대화형 요소 탐지
- **Rule 1.1 (Keyboard Interaction):** 비대화형 태그에 클릭 이벤트가 있으나 `tabindex`가 없는 경우
  - 결과: **[오류]**
  - 가이드: "키보드만 사용하는 사용자는 이 기능을 실행할 수 없습니다."

- **Rule 1.1 (Keyboard Interaction):** 클릭 이벤트와 `tabindex`는 있으나 `role`이 명시되지 않은 경우
  - 결과: **[수정 권고]**
  - 가이드: "스크린 리더 사용자를 위해 적절한 role 속성 추가를 권장합니다."

### [케이스 C] 초점 차단 및 순서 왜곡
- **Rule 1.1 (Keyboard Interaction):** 대화형 태그임에도 `tabindex="-1"`이 설정된 경우 (숨김 처리 제외)
  - 결과: **[수정 권고]**

- **Rule 1.1 (Keyboard Interaction):** `tabindex`가 0보다 큰 양수로 설정된 경우
  - 결과: **[수정 권고]**
  - 가이드: "tabindex='0' 또는 마크업 순서 조정을 권장합니다."

### [케이스 D] 이벤트 짝 맞춤 검사
- **Rule 1.1 (Keyboard Interaction):** 클릭 핸들러는 있으나 키보드 이벤트(keydown 등) 핸들러가 없는 비표준 요소
  - 결과: **[검토 필요]**
  - 가이드: "Enter/Space 키로 작동하는지 확인하세요."

## 3. 최종 상태 정의 (Final Status)

1. **오류:** 키보드 접근성 완전 차단 (tabindex 누락 등).
2. **검토 필요:** 모달 대화상자, 키보드 이벤트 누락 등 수동 확인이 필요한 항목.
3. **수정 권고:** 접근은 가능하나 의미 전달(role) 누락, 탭 순서 왜곡 등.
4. **적절:** 키보드 접근성이 정상적으로 보장된 요소.
