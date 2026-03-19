# ABT-2.4.3-Processor: 적절한 링크 텍스트 v0.20

### 🔗 References
- KWCAG 2.2: 2.4.3 적절한 링크 텍스트
- WCAG 2.2: 2.4.4 Link Purpose (In Context) (A) (Reference)

---

이 알고리즘은 **KWCAG 2.4.3(적절한 링크 텍스트)** 지침을 준수하며, 링크의 accessible name이 목적을 명확히 설명하고 있는지 진단한다.

> **범위 주의**: 이 프로세서는 accessible name의 **명확성**만 평가한다.
> aria-label과 가시 텍스트 간의 불일치는 **2.5.3(레이블과 이름)**에서 처리한다.

---

## 1. 데이터 수집 단계 (Data Collection)

### 링크 유형 분류
- **텍스트 링크**: `innerText`가 있는 링크
- **시각적 콘텐츠 전용 링크**: `innerText`가 없고 `<img>` 또는 `<svg>` 요소만 포함
- **ARIA 레이블 링크**: `aria-label` 또는 `aria-labelledby` 속성이 있는 링크 (다른 유형과 중복 가능)

### Accessible Name 계산 우선순위 (ARIA 명세 기준)
1. `aria-labelledby` (링크에 선언) → 참조 요소(들)의 innerText 합산
2. `aria-label` (링크에 선언) → 속성값
3. `innerText` → 링크 내 가시 텍스트 (자식 요소 포함)
4. `img[alt]` → 이미지 전용 링크에서 img의 alt 속성
5. SVG accessible name → 아래 순서로 탐색:
   - `svg[aria-label]`
   - `svg[aria-labelledby]` → 참조 요소 텍스트
   - `svg > title` → title 자식 요소 텍스트
6. `title` → 링크의 title 속성

### 보조 데이터
- `aria-describedby` 참조 텍스트: 모호한 이름 판정 시 보완 정보로 활용

---

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] aria-labelledby 유효성 검사
`aria-labelledby`가 선언된 경우 우선 참조 유효성을 검사한다.

- **참조 ID가 DOM에 존재하지 않는 경우**:
  - 결과: **[오류]** — 어떤 ID가 없는지 메시지에 명시
- **참조 요소가 존재하나 텍스트가 비어있는 경우**:
  - 결과: **[오류]** — "참조 요소에 텍스트가 없음"
- **참조 유효**: accessible name = 참조 요소 텍스트 합산 → 이후 단계 계속

### [단계 B] 시각적 콘텐츠 전용 링크 처리
`innerText`가 없고 `aria-label`/`aria-labelledby`(링크에 선언)가 없는 경우.

**img 전용 링크** (`<img>` 자식 있음):
- `alt` 속성 자체가 없는 경우: **[오류]** — "alt 속성 없음"
- `alt`가 빈 문자열(`alt=""`)인 경우: **[오류]** — "alt가 비어있음"
- `alt`가 있는 경우: accessible name = alt → 이후 단계 계속

**SVG 전용 링크** (`<svg>` 자식 있음):
- `svg[aria-label]`, `svg[aria-labelledby]`, `svg > title` 중 하나라도 텍스트를 제공하면: accessible name = 해당 텍스트 → 이후 단계 계속
- 위 소스가 모두 없거나 비어있는 경우: **[오류]** — "SVG 링크에 accessible name 없음"

### [단계 C] Accessible Name 부재 검사
위 단계를 거친 후에도 accessible name이 빈 문자열인 경우.

- 결과: **[오류]** — "링크의 목적을 알 수 있는 텍스트(이름)가 제공되지 않았습니다"

### [단계 D] 모호한 표현 검사
accessible name이 '여기', '클릭', '더 보기', 'more', 'click', 'here' 등 단독으로는 의미 없는 단어인 경우.

- `aria-describedby`로 보조 설명이 제공된 경우: **[검토 필요]** — 링크 목록 탐색 시 의미 전달 여부 검토 요청
- 보조 설명 없는 경우: **[부적절]** — 맥락 없이 모호한 표현 사용

### [단계 E] URL 노출 검사
accessible name이 `http://` 또는 `https://`로 시작하는 경우.

- 결과: **[수정 권고]** — 서술적 문구로 대체 권장

---

## 3. 최종 상태 정의 (Final Status)

1. **오류**: accessible name이 없거나, aria-labelledby 참조가 유효하지 않거나, 이미지 링크 alt가 없는 경우
2. **부적절**: 맥락 정보 없이 모호한 단어만 사용된 경우
3. **검토 필요**: 모호한 표현이나 `aria-describedby`로 보조 설명이 제공된 경우
4. **수정 권고**: 서술적 문구 대신 URL이 노출된 경우
5. **적절**: 목적이 명확한 accessible name이 제공된 경우 (출처 무관)

---

## 4. 판정 예시

| 마크업 | 판정 | 이유 |
|--------|------|------|
| `<a href="#">링크</a>` (텍스트 없음) | 오류 | accessible name 없음 |
| `<a><img src="x.png" alt=""></a>` | 오류 | 이미지 링크 alt 비어있음 |
| `<a><img src="x.png"></a>` | 오류 | 이미지 링크 alt 속성 없음 |
| `<a><img src="x.png" alt="홈으로 이동"></a>` | 적절 | alt가 accessible name |
| `<a><svg aria-label="홈"></svg></a>` | 적절 | svg aria-label이 accessible name |
| `<a><svg><title>홈으로 이동</title></svg></a>` | 적절 | svg title이 accessible name |
| `<a><svg aria-hidden="true"></svg></a>` | 오류 | SVG 링크에 accessible name 없음 |
| `<a aria-labelledby="없는id">텍스트</a>` | 오류 | 참조 ID 없음 |
| `<a aria-label="게시글 상세 보기">더 보기</a>` | 적절 | aria-label이 accessible name |
| `<a aria-label="상세 보기">더 보기</a>` | 적절 | accessible name 명확 (2.5.3은 별도 판정) |
| `<a href="#">더 보기</a>` | 부적절 | 모호한 표현, 보조 설명 없음 |
| `<a href="#" aria-describedby="desc">더 보기</a>` | 검토 필요 | 모호하나 보조 설명 있음 |
| `<a href="#">https://example.com</a>` | 수정 권고 | URL 노출 |
