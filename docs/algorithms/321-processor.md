# ABT-3.2.1-Processor: 사용자 요구에 따른 실행 v0.11

### 🔗 References
- KWCAG 2.2: 3.2.1 사용자 요구에 따른 실행
- WCAG 2.2: 3.2.1 On Focus (A) (Reference)

---

이 알고리즘은 **KWCAG 3.2.1(사용자 요구에 따른 실행)** 지침을 준수하며, 사용자의 명시적인 요청 없이 초점(focus) 이동이나 입력만으로 문맥을 변경하는 요소를 진단한다.

> **배점 방식:** 전수 조사형 (Exhaustive Scan). 컨텍스트 변화 가능성이 있는 요소를 수집하여 각각 판정하며, 비율 기반으로 점수를 산정한다. 정적 분석으로 탐지 가능한 위험 요소가 없는 경우 N/A로 처리된다.

> **자동화 도구의 한계:** `addEventListener`로 바인딩된 스크립트 이벤트는 감지할 수 없다. 인라인 속성(`onfocus`, `onchange` 등)만 탐지되므로 전문가의 실제 Tab 키 이동 및 폼 조작 테스트가 병행되어야 한다.

## 1. 데이터 수집 단계 (Data Collection)

- **Interactive Elements:** `a`, `button`, `input`, `select`, `textarea`, `[tabindex]`
- **Event Attributes:** `onfocus`, `onblur`, `onchange`
- **Target Attributes:** `target="_blank"`
- **Autofocus:** `autofocus` 속성

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [검사 1] 인라인 이벤트에 의한 맥락 변화 의심

| 조건 | 상태 | Rule |
|---|---|---|
| `onfocus`, `onblur`, `onchange` 속성 존재 | 검토 필요 | Rule 3.2.1 |

가이드: "요소에 인라인 이벤트(onfocus/onblur/onchange)가 감지되었습니다. 초점 이동이나 입력값 변경 시 사용자가 예측하지 못한 창 열림, 양식 전송 등의 컨텍스트 변화가 발생하지 않는지 확인하세요."

### [검사 2] 새 창 열림 사전 경고 누락

| 조건 | 상태 | Rule |
|---|---|---|
| `target="_blank"` + 텍스트·title·aria-label에 새 창 안내 없음 | 수정 권고 | Rule 3.2.1 |

가이드: "새 창으로 열리는 링크입니다. 텍스트나 title 속성에 '새 창' 등의 사전 안내를 제공할 것을 권장합니다."

### [검사 3] 자동 초점 이동

| 조건 | 상태 | Rule |
|---|---|---|
| `autofocus` 속성 존재 | 검토 필요 | Rule 3.2.1 |

가이드: "페이지 로드 시 특정 요소에 자동으로 초점(autofocus)이 이동됩니다. 사용자가 원치 않는 컨텍스트 변화가 아닌지 확인하세요."

## 3. 최종 상태 정의 (Final Status)

1. **수정 권고:** 새 창 안내가 누락된 `target="_blank"` 링크.
2. **검토 필요:** 인라인 이벤트 핸들러 또는 autofocus가 감지된 요소. 전문가의 실제 동작 확인 필요.
3. **적절:** 전문가가 컨텍스트 변화가 사용자 명시적 요청에 의해서만 발생함을 확인한 경우.
4. **N/A:** 위험 요소(인라인 핸들러, 새 창 링크, autofocus)가 감지되지 않은 경우.
