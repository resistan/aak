# ABT-1.1.1-Processor: 적절한 대체 텍스트 제공 v0.12

### 🔗 References
- KWCAG 2.2: 1.1.1 적절한 대체 텍스트 제공
- WCAG 2.2: 1.1.1 Non-text Content (A) (Reference)

---

## 1. 데이터 수집 단계 (Data Collection)
대상 요소(`img`, `area`, `input[type="image"]`, `svg`, `[role="img"]`, CSS `background-image`)를 발견하면 다음 정보를 수집한다.

- **Target:** 대상 요소의 `alt`, `aria-label`, `title` 값.
- **SVG:** `<title>` 요소 또는 `aria-label` 속성.
- **Parent Context:** 상위 요소 중 `<a>`, `<button>`, `role="button/link"` 존재 여부 및 부모의 텍스트.
- **Smart Context:** 요소 전후 50자 내외의 텍스트 노드 콘텐츠.
- **Background Images:** CSS `background-image`가 적용된 주요 컨테이너(`div`, `section`, `article`, `span`, `a`, `button`)에서 이미지 URL 추출.
- **IR 기법 감지:** 이미지 대체 기법으로 숨겨진 텍스트가 있는지 확인.
- **Exhaustive Scan:** 페이지 내의 모든 이미지 요소를 전수 수집하여 분석.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 누락 오류 판정
- **Rule 1.1 (Missing Alt):** 의미 있는 요소에 대체 수단(`alt`, `aria-label` 등)이 아예 없는가?
  - 조건: 대화형 부모 내에 다른 텍스트가 없거나, 대화형 부모 자체가 없는 경우
  - 결과: **[오류]**
  - SVG: `<title>` 또는 `aria-label`이 없는 경우
  - input[type="image"]: `alt` 속성이 없는 경우
- **Rule 1.2 (Missing Alt in Functional):** 대체 수단이 없으나, 대화형 부모(`<a>`, `<button>` 등)에 이미 텍스트가 존재하는가?
  - 조건: `isFunctional === true` && `parentText` 존재
  - 결과: **[수정 권고]**
  - 가이드: "부모 텍스트가 있으므로 중복 낭독 방지를 위해 장식용 처리(`aria-hidden=\"true\"` 또는 `alt=\"\"`)를 권고합니다."

### [단계 B] 장식용 + 기능형 검사
- **Rule 4.2 (Functional Decorative):** 장식용으로 처리된 이미지(`alt=""`)가 대화형 요소(`<a>`, `<button>`) 내의 유일한 콘텐츠인가?
  - 조건: 부모 요소에 다른 텍스트가 없음
  - 결과: **[오류]** (목적을 설명해야 함)

### [단계 C] 불필요 단어 포함 여부
- **Rule 2.1 (Forbidden Words):** `alt` 값에 금지어("이미지", "사진", "아이콘", "그림", "스냅샷", "image", "photo", "icon")가 포함되어 있는가?
  - 결과: **[수정 권고]**
  - 가이드: "이미 해당 요소가 그래픽임을 안내하고 있으므로 불필요한 단어 삭제를 수정 권고(요청)하세요."

### [단계 D] 맥락적 중복 검사
- **Rule 3.1 (High Similarity):** `alt` 값과 `Smart Context` 간의 유사도가 0.9 이상인가?
  - 결과: **[부적절]** (주변 정보와 동일하게 중복되어 스크린 리더 사용자에게 혼란)
- **Rule 3.1 (Medium Similarity):** 유사도가 0.6 이상 0.9 미만인가?
  - 결과: **[검토 필요]** (중복 여부 확인 후 수정 요청)

### [단계 E] 기능형 이미지 목적 확인
- **Rule 4.1 (Functional Alt Check):** 요소가 대화형 부모(`<a>`, `<button>` 등) 안에 있고, 장식용이 아닌 경우
  - 결과: **[검토 필요]**
  - 가이드: "대체 텍스트가 시각적 설명이 아닌 기능/목적(예: '홈으로 이동')을 설명하는지 검토하세요."

### [단계 F] 장식용 이미지 적절 처리 확인
- 장식용 이미지가 올바르게 처리된 경우:
  - 동일 링크/버튼 내에 텍스트가 존재: "중복 방지를 위해 적절하게 비움 처리(alt='')되었습니다."
  - 단독 장식용: "장식용 요소로 올바르게 숨김 처리(alt='' 등) 되었습니다."

### [배경 이미지 분석]
- **Rule 1.1 (Background Image):** CSS `background-image`로 구현된 요소에 대체 수단이 없는가?
  - IR 기법으로 숨겨진 텍스트가 존재: **[적절]**
  - `aria-label` 등 제공: **[적절]**
  - 대체 수단 없음: **[검토 필요]** (의미 있는 정보 포함 여부 수동 확인)

## 3. 최종 상태 정의 (Final Status)

1. **오류:** 대체 수단 누락(Rule 1.1), 기능형 장식 이미지의 목적 미설명(Rule 4.2).
2. **부적절:** 대체 수단이 존재하나 주변 맥락과 90% 이상 중복(Rule 3.1).
3. **수정 권고:** 금지어 포함(Rule 2.1), 대화형 부모에 텍스트가 있으나 이미지에 대체 수단 누락(Rule 1.2).
4. **검토 필요:** 기능형 이미지 목적 확인(Rule 4.1), 유사도 60%~90%(Rule 3.1), 배경 이미지 의미 확인(Rule 1.1).
5. **적절:** 적절한 대체 수단 제공됨.

## 4. 데이터 중복 방지 전략 (Deduplication)
- 동일한 지침 ID, 셀렉터, 이미지 URL(`src`), 그리고 대체 텍스트(`alt`)가 모두 일치할 때만 중복으로 간주.
- 배경 이미지의 경우 스타일 URL을 추출하여 기술적 식별자로 활용.
