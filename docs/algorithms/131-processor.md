# ABT-1.3.1-Processor: 표의 구성 v0.11

### 🔗 References
- KWCAG 2.2: 1.3.1 표의 구성
- WCAG 2.2: 1.3.1 Info and Relationships (A) (Reference)

---

## 1. 데이터 수집 단계 (Data Collection)
대상 요소(`table`)를 발견하면 다음 정보를 수집한다.

- **Structural Tags:** `caption`, `th`, `td`, `[role="columnheader"]`, `[role="rowheader"]`.
- **Attributes:** `summary`, `scope`, `headers`, `aria-label`, `aria-labelledby`, `role`.
- **Context:** 표 주변 50자 텍스트.
- **Nesting:** 중첩된 표의 캡션/헤더가 섞이지 않도록 `closest('table')` 필터링.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [사전 필터링] 레이아웃 표 제외
- `role="presentation"` 또는 `role="none"` 속성이 있는 표는 진단에서 제외.
- 크기가 0인 숨겨진 표는 제외.

### [단계 A] 제목 및 요약 검사
- **Rule 1.1 (Missing Caption):** `<caption>`, `aria-label`, `aria-labelledby` 모두 없는가?
  - HTML5 이전: `summary` 속성이 있으면 허용
  - 결과: **[오류]** (데이터 표의 제목 제공 필수)

- **Rule 1.2 (Obsolete Summary):** HTML5 문서에서 `summary` 속성을 사용하는가?
  - 결과: **[수정 권고]**
  - 가이드: "HTML5 표준에서는 summary 속성이 폐기되었습니다. `<caption>` 요소를 사용하세요."

### [단계 B] 제목 셀 및 관계 검사
- **Rule 2.1 (Missing Headers):** 데이터 표에 `th` 또는 `[role="columnheader/rowheader"]`가 전혀 없는가?
  - 결과: **[오류]** (제목 셀 누락)

- **Rule 2.2 (Missing Semantic Association):** `th`에 `scope` 속성이 없고, `td`에 `headers` 속성도 없는가?
  - 결과: **[수정 권고]**
  - 가이드: "제목 셀에 scope 속성을 사용하여 행/열 제목임을 명시할 것을 권장합니다."

## 3. 최종 상태 정의 (Final Status)

1. **오류:** `<caption>` 누락(ARIA 대체 수단도 없음), 데이터 표 내 `th` 누락.
2. **수정 권고:** HTML5에서 `summary` 사용, `scope` 누락.
3. **적절:** 용도에 맞는 마크업 및 제목/요약 제공 확인.
