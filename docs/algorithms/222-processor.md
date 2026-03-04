# ABT-2.2.2-Processor: 정지 기능 제공 v0.12

### 🔗 References
- KWCAG 2.2: 2.2.2 정지 기능 제공
- WCAG 2.2: 2.2.2 Pause, Stop, Hide (A) (Reference)

---

이 알고리즘은 **KWCAG 2.2.2(정지 기능 제공)** 지침을 준수하며, 자동으로 움직이거나 업데이트되는 콘텐츠를 사용자가 일시 정지하거나 멈출 수 있는지 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Media Elements:** `<video>`, `<audio>` 태그의 `autoplay`, `controls`, `loop` 속성.
- **Carousel/Slider:** 클래스명에 `carousel`, `slider`, `swiper`, `slick`이 포함되거나 `role="marquee"`, `role="timer"`인 요소.
- **Control Keywords:** 내부 버튼의 텍스트나 `aria-label`에서 '정지', '멈춤', 'pause', 'stop' 키워드 검색.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 미디어 요소 진단 (Media)
- **Rule 222. (Autoplay without Controls):** 자동 재생(`autoplay`)되지만 제어 수단(`controls`)이 없는 경우.
  - 결과: **[오류]**.
- **Rule 222. (Review Autoplay/Loop):** 자동 재생되거나 반복(`loop`)되는 미디어가 감지된 경우.
  - 결과: **[검토 필요]** (3초 이상 지속 여부 및 정지 가능 여부 확인).

### [단계 B] 캐러셀 및 슬라이더 진단 (Carousel)
- **Rule 222. (Carousel Controls):** 자동 갱신 가능성이 높은 라이브러리나 역할을 가진 요소 탐지.
  - 내부에서 정지 관련 키워드가 감지되면 안내 문구에 포함.
  - 결과: **[검토 필요]**.

### [단계 C] 일반 안내 (General Guidance)
- 탐지된 동적 요소가 없는 경우에도 페이지 전체에 대한 검토 안내를 제공함.
- 결과: **[참고자료]**.

## 3. 최종 상태 정의 (Final Status)
1. **오류:** 제어 수단 없이 자동 재생되는 미디어.
2. **검토 필요:** 슬라이더, 캐러셀, 자동 재생 미디어 등 정지 기능 작동 여부를 확인해야 하는 요소.
3. **참고자료:** 명시적인 동적 요소는 발견되지 않았으나 지침 준수 여부를 상기시키는 안내.
