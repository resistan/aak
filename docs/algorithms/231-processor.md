# ABT-2.3.1-Processor: 깜빡임과 번쩍임 사용 제한 v0.12

### 🔗 References
- KWCAG 2.2: 2.3.1 깜빡임과 번쩍임 사용 제한
- WCAG 2.2: 2.3.1 Three Flashes or Below Threshold (A) (Reference)

---

이 알고리즘은 **KWCAG 2.3.1(깜빡임과 번쩍임 사용 제한)** 지침을 준수하며, 광과민성 발작을 유발할 수 있는 초당 3~50회의 번쩍임이 포함된 콘텐츠의 유무를 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Target Elements:** `<marquee>`, `<blink>`, `<video>`.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 위험 태그 탐지 (Deprecated Tags)
- **Rule 2.3.1 (Deprecated Tags):** 웹 표준에서 폐기된 `<marquee>` 또는 `<blink>` 태그 사용 탐지.
  - 결과: **[오류]**.

### [단계 B] 동적 미디어 요소 안내 (Media Check)
- **Rule 2.3.1 (Check Media Content):** `<video>` 요소 탐지.
  - 결과: **[검토 필요]** (1초에 3회 이상 번쩍임 포함 여부 확인).

### [단계 C] 전역 수동 검토 (Manual Review)
- **Rule 2.3.1 (Manual Review):** 특정 요소가 없더라도 페이지 전체에 대해 번쩍임 여부를 확인하도록 안내.
  - 결과: **[검토 필요]**.

## 3. 최종 상태 정의 (Final Status)
1. **오류:** 폐기된 `<marquee>`, `<blink>` 태그 사용.
2. **검토 필요:** 동영상 존재 또는 페이지 전반의 번쩍임 여부 확인 필요.
