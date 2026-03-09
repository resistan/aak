# ABT-1.2.1-Processor: 자막 제공 v0.12

### 🔗 References
- KWCAG 2.2: 1.2.1 자막 제공
- WCAG 2.2: 1.2.2 Captions (Prerecorded) (A) (Reference)

---

## 1. 데이터 수집 단계 (Data Collection)
대상 요소(`video`, `audio`, YouTube/Vimeo `iframe`)를 발견하면 다음 정보를 수집한다.

- **Target Type:** `HTML5 Video`, `HTML5 Audio`, `Iframe Player`
- **Tracks:** `<track>` 요소의 존재 여부, `kind` 속성(`captions`, `subtitles`).
- **Related Context:** 플레이어 주변 150자 텍스트 중 "자막", "대본", "원고", "transcript", "caption", "script" 키워드 포함 여부.
- **Metadata:** `title` 속성, `muted`, `autoplay` 속성.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [케이스 A] 배경 영상
- **Rule 1.1 (Background Video):** `video` 요소가 `muted`이면서 `autoplay`인가?
  - 결과: **[적절]**
  - 가이드: "소리가 없는 배경 영상으로 판단되어 자막 제공 대상에서 제외되었습니다."

### [케이스 B] 자막 트랙 존재
- **Rule 2.1 (Track Detected):** `<track kind="captions">` 또는 `<track kind="subtitles">`가 존재하는가?
  - 결과: **[검토 필요]**
  - 가이드: "자막 트랙이 탐지되었습니다. 실제 영상 내용과 자막이 일치하는지 확인하세요."

### [케이스 C] 자막 트랙 없음
- **Rule 2.2 (Manual Subtitle Review):** 자막 트랙이 없고 주변에 원고 키워드도 없는가?
  - 결과: **[검토 필요]**
  - 가이드: "자막 트랙이 탐지되지 않았습니다. 열린 자막(Open Caption) 제공 여부 또는 별도의 대본 제공 여부를 수동으로 확인하세요."

### [케이스 D] 원고 키워드 발견
- **Rule 2.3 (Manual Script Check):** 자막 트랙은 없으나 주변 맥락에서 관련 키워드가 발견되었는가?
  - 결과: **[검토 필요]**
  - 가이드: "주변 맥락에서 관련 키워드(대본, 원고 등)가 발견되었습니다. 실제 원고 제공 여부를 확인하세요."

### [iframe 케이스] 외부 플레이어 검사
- **Rule 3.1 (Missing Frame Title):** `iframe`에 `title` 속성이 없는가?
  - 결과: **[수정 권고]**
  - 가이드: "외부 영상 프레임에 식별 가능한 title 속성이 누락되었습니다."
- **Rule 3.2 (External Player Check):** `iframe`에 `title`이 있는 경우
  - 결과: **[검토 필요]**
  - 가이드: "외부 플랫폼 영상이 감지되었습니다. 플레이어 내 자막 제공 여부 및 페이지 내 원고 포함 여부를 확인하세요."

## 3. 최종 상태 정의 (Final Status)

1. **수정 권고:** `iframe` 제목 누락.
2. **검토 필요:** 자막/대본 포함 여부를 기계적으로 알 수 없는 미디어 요소.
3. **적절:** 배경 영상(muted+autoplay), 또는 전문가가 자막/대본 제공 확인.
