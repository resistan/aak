# ABT-2.1.3-Processor: 조작 가능 v0.12

### 🔗 References
- KWCAG 2.2: 2.1.3 조작 가능
- WCAG 2.2: 2.5.5 Target Size (Enhanced) (AAA) (Reference)

---

이 알고리즘은 **KWCAG 2.1.3(조작 가능)** 지침을 준수하며, 대화형 요소가 오조작을 방지하기 위해 충분한 크기(최소 24x24px)를 갖추고 있는지 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Target Elements:** `button`, `a`, `input`, `select`, `textarea`, `[role="button"]`, `[role="link"]`, `[role="menuitem"]`.
- **Metrics:** `getBoundingClientRect()` 기반의 렌더링 너비와 높이.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [검사 1] 터치 타겟 크기 검사
- **Rule 2.1.3 (Small Target Size):** 대상 요소의 크기가 **24x24px 미만**인 경우.
  - **예외 대상:** `display: inline`인 `<a>` 태그 (문장 내 인라인 링크).
  - 결과: **[검토 필요]**
  - 가이드: "터치 타겟 크기가 너무 작을 수 있습니다. 모바일 환경인 경우 약 24px 이상인지 확인하세요."

## 3. 최종 상태 정의 (Final Status)
1. **검토 필요:** 최소 권장 크기(24x24px) 미달 요소. 모바일 환경에서의 조작 편의성을 수동으로 확인해야 함.
2. **적절:** 요소가 충분한 크기를 가지거나 예외 대상(인라인 링크)인 경우.

> **참고:** 현재 버전에서는 인접 요소 간의 간격(Spacing)은 자동으로 계산하지 않으며, 크기 기반의 진단에 집중합니다.
