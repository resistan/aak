# ABT-2.2.2-Processor: 정지 기능 제공 v0.13

### 🔗 References
- KWCAG 2.2: 2.2.2 정지 기능 제공
- WCAG 2.2: 2.2.2 Pause, Stop, Hide (A) (Reference)

---

이 알고리즘은 **KWCAG 2.2.2(정지 기능 제공)** 지침을 준수하며, 자동으로 움직이거나 업데이트되는 콘텐츠를 사용자가 일시 정지하거나 멈출 수 있는지 진단한다.

> **배점 방식:** 전수 조사형 (Exhaustive Scan). 동적 콘텐츠 요소를 수집하여 각각 판정하며, 비율 기반으로 점수를 산정한다. 동적 요소가 감지되지 않은 경우에도 전문가 확인 요청 리포트를 1건 생성한다.

## 1. 데이터 수집 단계 (Data Collection)

- **Media Elements:** `<video>`, `<audio>` — `autoplay`, `controls`, `loop` 속성
- **Carousel/Slider:** 클래스명에 `carousel`, `slider`, `swiper`, `slick` 포함 또는 `role="marquee"`, `role="timer"`인 요소
- **Control Keywords:** 내부 버튼의 텍스트·`aria-label`에서 `정지`, `멈춤`, `pause`, `stop` 키워드 검색

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [검사 1] 미디어 요소

| 조건 | 상태 | Rule |
|---|---|---|
| `autoplay` 있음 + `controls` 없음 | 오류 | Rule 222. (Autoplay without Controls) |
| `autoplay` 또는 `loop` 있음 | 검토 필요 | Rule 222. (Review Autoplay/Loop) |
| `autoplay`, `loop` 모두 없음 | 수집 안함 | — |

- 정적 미디어(autoplay/loop 없음)는 2.2.2 진단 대상이 아니므로 수집 제외.

### [검사 2] 캐러셀 및 슬라이더

| 조건 | 상태 | Rule |
|---|---|---|
| carousel/slider/swiper 클래스 또는 marquee/timer 역할 | 검토 필요 | Rule 222. (Carousel Controls) |

- 내부에서 정지 관련 키워드(`정지`, `멈춤`, `pause`, `stop`)가 감지되면 안내 문구에 포함.
- 라이브러리(Swiper, Slick 등) 감지 시 명칭 포함하여 안내.

### [검사 3] 감지 없음

동적 요소가 감지되지 않은 경우에도 전문가 확인 요청 리포트 1건 생성.

- 상태: **검토 필요**
- 가이드: "페이지 내에 자동으로 재생되거나 갱신되는 콘텐츠(슬라이더, 롤링 배너 등)가 있는지 확인하세요."

## 3. 최종 상태 정의 (Final Status)

1. **오류:** 제어 수단 없이 자동 재생되는 미디어.
2. **검토 필요:** 슬라이더, 캐러셀, 자동 재생 미디어 등 정지 기능 작동 여부를 확인해야 하는 요소. 또는 동적 요소 미감지로 전문가 직접 확인이 필요한 경우.
3. **적절:** 전문가가 정지 기능이 올바르게 제공됨을 확인한 경우.
