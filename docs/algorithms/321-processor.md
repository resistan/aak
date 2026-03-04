# ABT-3.2.1-Processor: 사용자 요구에 따른 실행 v0.10

### 🔗 References
- KWCAG 2.2: 3.2.1 사용자 요구에 따른 실행
- WCAG 2.2: 3.2.1 On Focus (A) (Reference)

---

이 알고리즘은 **KWCAG 3.2.1(사용자 요구에 따른 실행)** 지침을 준수하며, 사용자의 명시적인 요청 없이 초점(focus) 이동이나 입력만으로 문맥을 변경하는 요소를 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Interactive Elements:** `a`, `button`, `input`, `select`, `textarea` 등 모든 초점 획득 가능 요소.
- **Event Attributes:** `onfocus`, `onblur`, `onchange`.
- **Target Attributes:** `target="_blank"`.
- **Autofocus:** `autofocus` 속성이 적용된 요소.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 인라인 이벤트에 의한 맥락 변화 의심 (On Focus / On Change)
- **Rule 1.1 (Event Trigger):** 요소에 `onfocus`, `onblur`, `onchange` 등의 인라인 이벤트 핸들러가 존재하는가?
  - 브라우저 확장의 한계로 `addEventListener`로 바인딩된 스크립트 이벤트는 검출할 수 없으나, 명시적 속성은 탐지하여 안내합니다.
  - 결과: 감지 시 **[검토 필요]**.
- **Rule 1.2 (Autofocus):** 페이지 로드 시 사용자 동의 없이 특정 위치로 초점이 강제 이동하는가?
  - 결과: 감지 시 **[검토 필요]**.

### [단계 B] 새 창 열림 사전 경고 (Context Change)
- **Rule 2.1 (Target Blank):** `target="_blank"` 속성 사용 시 링크 텍스트, `title` 속성, 또는 `aria-label`에 "새 창" 관련 안내가 포함되어 있는가?
  - 결과: 누락 시 **[수정 권고]**.

### [단계 C] 스크립트 기반 맥락 변화 (한계)
- **수동 검사 안내:** 데이터(select, input)를 선택하거나 입력하자마자 예고 없이 페이지가 이동하거나 폼이 전송되는 현상(예: 콤보박스 선택 시 즉시 페이지 이동)은 정적 분석만으로는 100% 잡아낼 수 없으므로, 전문가의 실제 탭(Tab) 키 이동 및 폼 조작 테스트가 필수적으로 병행되어야 합니다.

## 3. 최종 상태 정의 (Final Status)
1. **부적절:** (현재 3.2.1에서는 '검토 필요'로 통합 처리)
2. **검토 필요:** `onfocus` 이벤트가 바인딩되어 있어 비의도적 동작(팝업, 오디오 재생 등) 가능성이 있는 요소.
3. **수정 권고:** 새 창 안내가 누락된 링크.
4. **적절:** 모든 컨텍스트 변화가 사용자의 명시적 버튼 클릭 등을 통해 이루어짐.
