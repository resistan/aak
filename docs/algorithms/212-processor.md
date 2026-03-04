# ABT-2.1.2-Processor: 초점 이동과 표시 v0.12

### 🔗 References
- KWCAG 2.2: 2.1.2 초점 이동과 표시
- WCAG 2.2: 2.4.3 Focus Order (A) (Reference)

---

이 알고리즘은 **KWCAG 2.1.2(초점 이동과 표시)** 지침을 준수하며, 초점 이동의 논리성(`tabindex`)과 시각적 명확성(`outline` 가시성)을 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Focusable Elements:** `a[href]`, `button`, `input`, `select`, `textarea`, `[tabindex]:not([tabindex="-1"])`, `details`, `summary`.
- **Styles:** 인라인 `style` 속성 내의 `outline` 정의.
- **Geometry:** `getBoundingClientRect()`를 통한 요소의 시각적 위치.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 초점 이동 순서 (Focus Order)
- **Rule 1.1 (양수 Tabindex):** `tabindex > 0`인 요소 탐지.
  - **예외 처리 (Heuristics):**
    - 시각적으로 페이지 상단 15% 이내에 위치한 경우.
    - DOM 구조상 부모의 첫 5번째 이내 자식으로 최상위 그룹에 속하는 경우.
  - **결과:** 예외에 해당하지 않는 양수 `tabindex` 발견 시 **[수정 권고]**.

### [단계 B] 초점 표시 가시성 (Focus Visible)
- **Rule 2.1 (인라인 아웃라인 제거):** 요소에 `style="outline: none"` 또는 `style="outline: 0"`이 직접 적용된 경우.
  - 결과: **[오류]**.
- **Rule 2.2 (수동 검사 안내):** `getComputedStyle`의 한계로 인해 페이지 전체의 초점 가시성은 수동 검토를 유도함.
  - 결과: 항상 **[검토 필요]** 리포트를 1건 발행.

## 3. 최종 상태 정의 (Final Status)
1. **오류:** 인라인 스타일로 초점 표시가 강제로 제거된 경우.
2. **검토 필요:** 전문가가 직접 Tab 키를 눌러 시각적 초점 표시를 확인해야 하는 상태.
3. **수정 권고:** 논리적 초점 이동 순서를 방해하는 양수 `tabindex`가 사용된 경우.
