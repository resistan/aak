# ABT-1.3.1-Processor: 표의 구성 v0.10

### 🔗 References
- KWCAG 2.2: 1.3.1 표의 구성
- WCAG 2.2: 1.3.1 Info and Relationships (A) (Reference)

---

## 1. 데이터 수집 단계 (Data Collection)
대상 요소(`table`)를 발견하면 다음 정보를 수집한다.
- **Structural Tags:** `caption`, `thead`, `tbody`, `tfoot`, `th`, `td`, `colgroup`.
- **Attributes:** `summary`, `scope`, `headers`, `id`, `role`.
- **Context:** 표 바로 이전/이후 형제 요소의 텍스트 및 스타일(Heading 여부).

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 데이터 표 vs 레이아웃 표 판별 (Heuristics)
- **Layout Table 판별:** `role="presentation/none"`이 있거나, `th`가 전혀 없고 중첩된 표가 있는 경우.
- **Data Table 판별:** `th`, `caption`, `scope` 중 하나라도 존재하거나 데이터 타입이 규칙적인 경우.

### [단계 B] 제목 및 요약 검사 (Caption & Summary)
- **Rule 1.1:** `<caption>`이 없는가?
  - 결과: **[오류]** (데이터 표의 제목 제공은 필수 사항)
- **Rule 1.2 (HTML5):** `summary` 속성이 존재하는가?
  - 결과: **[수정 권고]** (HTML5에서 폐기된 속성이므로 `aria-describedby` 또는 `caption` 활용 권장)
- **Rule 1.3 (Legacy):** `summary`와 `caption`이 모두 없는가?
  - 결과: **[오류]** (표의 목적 파악 불가)

### [단계 C] 제목 셀 및 관계 검사 (TH & Relationship)
- **Rule 2.1:** `th`가 전혀 없고 `td`로만 구성된 데이터 표인가?
  - 결과: **[오류]** (제목 셀 누락)
- **Rule 2.2:** `th`에 `scope` 속성이 누락되었는가? (병합된 셀이 있는 경우 필수)
  - 결과: **[수정 권고]** (데이터와 제목의 관계 명확화 필요)

## 3. 최종 상태 정의 (Final Status)
1. **오류:** `<caption>` 누락, 데이터 표 내 `th` 누락, 제목/요약 완전 누락.
2. **부적절:** 레이아웃 표에 `caption`/`th`를 사용하여 구조 혼란 유발.
3. **수정 권고:** HTML5 `summary` 사용, `scope` 누락, "가짜 제목"(표 외부 텍스트) 사용.
4. **검토 필요:** 복잡하게 병합된 표의 `id/headers` 관계 적절성.
5. **적절:** 용도에 맞는 마크업 및 제목/요약 제공 확인.
