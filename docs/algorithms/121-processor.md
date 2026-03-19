# ABT-1.2.1-Processor: 자막 제공 v0.13

### 🔗 References
- KWCAG 2.2: 1.2.1 자막 제공
- WCAG 2.2: 1.2.2 Captions (Prerecorded) (A) (Reference)

---

이 알고리즘은 **KWCAG 1.2.1(자막 제공)** 지침을 준수하며, 멀티미디어 콘텐츠에 청각 장애인을 위한 자막, 대본 또는 수어 등의 대체 수단이 제공되는지 진단한다.

> **배점 방식:** 전수 조사형 (Exhaustive Scan). 페이지 내 모든 미디어 요소를 수집하여 각각 판정하며, 비율 기반으로 점수를 산정한다.

> **자동화 도구의 한계:** 열린 자막(Open Caption), 외부 플레이어 내장 자막, 별도 제공 대본 등은 정적 분석으로 확인 불가. 대부분의 항목은 "검토 필요"로 수집되어 전문가 판정을 유도한다.

## 1. 데이터 수집 단계 (Data Collection)

**대상 요소:** `video`, `audio`, YouTube/Vimeo `iframe`

**수집 정보:**
- `<track kind="captions|subtitles">` 존재 여부
- 플레이어 주변 150자 텍스트의 키워드 포함 여부: `자막`, `대본`, `원고`, `transcript`, `caption`, `script`
- `title`, `muted`, `autoplay` 속성

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### `<video>`, `<audio>` 요소

| 케이스 | 조건 | 상태 | Rule |
|---|---|---|---|
| A. 배경 영상 | `video` + `muted` + `autoplay` | 적절 | Rule 1.1 |
| B. 자막 트랙 있음 | `<track kind="captions|subtitles">` 존재 | 검토 필요 | Rule 2.1 |
| C. 자막 없음, 키워드 없음 | track 없음 + 주변 키워드 없음 | 검토 필요 | Rule 2.2 |
| D. 원고 키워드 발견 | track 없음 + 주변 키워드 있음 | 검토 필요 | Rule 2.3 |

- **Rule 1.1 (Background Video):** muted+autoplay 배경 영상은 자막 제공 대상 제외.
- **Rule 2.1 (Track Detected):** track 요소가 있어도 실제 내용과 일치하는지 육안 확인 필요.
- **Rule 2.2 (Manual Subtitle Review):** track 없고 키워드도 없음. 열린 자막 또는 별도 대본 제공 여부 확인 필요.
- **Rule 2.3 (Manual Script Check):** track 없으나 주변에 관련 키워드 발견. 실제 원고 제공 여부 확인 필요.

### `<iframe>` 요소 (YouTube/Vimeo)

| 케이스 | 조건 | 상태 | Rule |
|---|---|---|---|
| title 없음 | `title` 속성 누락 | 수정 권고 | Rule 3.1 |
| title 있음 | `title` 속성 있음 | 검토 필요 | Rule 3.2 |

- **Rule 3.1 (Missing Frame Title):** iframe 제목 누락. 자막 여부와 별개로 수정 필요.
- **Rule 3.2 (External Player Check):** 외부 플레이어는 자막 제공 여부를 자동 판단 불가.

## 3. 최종 상태 정의 (Final Status)

1. **적절:** 배경 영상(muted+autoplay), 또는 전문가가 자막/대본 제공 확인한 경우.
2. **수정 권고:** iframe에 title 속성 누락.
3. **검토 필요:** 자막/대본 포함 여부를 자동으로 알 수 없는 미디어 요소.
4. **N/A:** 페이지 내에 미디어 요소가 전혀 없는 경우.
