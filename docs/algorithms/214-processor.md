# ABT-2.1.4-Processor: 문자 단축키 v0.12

### 🔗 References
- KWCAG 2.2: 2.1.4 문자 단축키
- WCAG 2.2: 2.1.4 Character Key Shortcuts (A) (Reference)

---

이 알고리즘은 **KWCAG 2.1.4(문자 단축키)** 지침을 준수하며, 특수키(Ctrl, Alt 등) 조합 없는 단일 문자 단축키에 대한 제어 수단 제공 여부를 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Inline Keyboard Listeners:** `onkeydown`, `onkeyup`, `onkeypress` 속성이 적용된 요소.
- **Handler Analysis:** 핸들러 문자열 내 `ctrlKey`, `altKey`, `metaKey` 키워드 포함 여부.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 인라인 단일 문자 단축키 의심 탐지
- **Rule 1.1 (Single Key Shortcut Suspected):** 
  - 인라인 키보드 이벤트 핸들러가 존재하나, 코드 내에 특수키 검사 로직(`ctrlKey`, `altKey`, `metaKey`)이 없는 경우.
  - 결과: **[검토 필요]**.

### [단계 B] 전역 스크립트 기반 단축키 수동 검토
- **Rule 2.1 (Global Check):** 
  - `addEventListener`로 등록된 전역 단축키는 정적 분석이 어려우므로, 페이지 전체에 대한 수동 검토 가이드를 제공함.
  - 결과: 항상 **[검토 필요]** 리포트 1건 발행.

## 3. 최종 상태 정의 (Final Status)
1. **검토 필요:** 단일 문자 단축키 사용이 의심되거나 전역 단축키 확인이 필요한 상태. 전문가가 단축키 존재 여부 및 제어 수단(끄기/변경) 제공 여부를 확인해야 함.
