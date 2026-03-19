# ABT-2.1.3-Processor: 조작 가능 v0.13

### 🔗 References
- KWCAG 2.2: 2.1.3 조작 가능
- WCAG 2.2: 2.5.5 Target Size (Enhanced) (AAA) (Reference)

---

이 알고리즘은 **KWCAG 2.1.3(조작 가능)** 지침을 준수하며, 대화형 요소가 오조작을 방지하기 위해 충분한 크기(최소 24x24px)를 갖추고 있는지 진단한다.

> **배점 방식:** 전수 조사형 (Exhaustive Scan). 페이지 내 모든 대화형 요소를 수집하여 각각 판정하며, 비율 기반으로 점수를 산정한다.

## 1. 데이터 수집 단계 (Data Collection)

**대상 요소:** `button`, `a`, `input`, `select`, `textarea`, `[role="button"]`, `[role="link"]`, `[role="menuitem"]`

**제외 조건:**
- `display` 값이 `inline`으로 시작하는 요소 (`inline`, `inline-block`, `inline-flex`, `inline-grid` 등) → 본문 흐름 내 인라인 링크로 간주하여 터치 타겟 평가 대상에서 제외
- `isHidden()`으로 판정된 비가시 요소

**측정 방법:** `getBoundingClientRect()` 기반의 실제 렌더링 너비·높이

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [검사 1] 터치 타겟 크기 검사

| 조건 | 상태 | Rule |
|---|---|---|
| 너비 또는 높이가 24px 미만 | 검토 필요 | Rule 2.1.3 |
| 24x24px 이상 | 적절 | — |

- **Rule 2.1.3 (Small Target Size):** 요소의 렌더링 크기가 24x24px 미만인 경우. 모바일 환경에서 오조작 가능성 있음.
- 너비·높이 중 하나라도 0인 경우(렌더링되지 않은 요소)는 크기 측정 대상에서 제외하고 "적절"로 처리.

## 3. 최종 상태 정의 (Final Status)

1. **검토 필요:** 최소 권장 크기(24x24px) 미달 요소. 모바일 환경에서의 조작 편의성을 수동으로 확인해야 함.
2. **적절:** 요소가 충분한 크기를 가지거나 예외 대상(인라인 요소)인 경우.
3. **N/A:** 페이지 내에 대화형 요소가 전혀 없는 경우.

> **참고:** 인접 요소 간의 간격(Spacing)은 자동으로 계산하지 않으며, 크기 기반의 진단에 집중한다.
