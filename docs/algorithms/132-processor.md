# ABT-1.3.2-Processor: 콘텐츠의 선형구조 v0.12

### 🔗 References
- KWCAG 2.2: 1.3.2 콘텐츠의 선형구조
- WCAG 2.2: 1.3.2 Meaningful Sequence (A) (Reference)

---

이 알고리즘은 **KWCAG 1.3.2(콘텐츠의 선형 구조)** 지침을 준수하며, 콘텐츠가 선형화(스크린 리더 등 보조공학기기 읽기 순서)되었을 때 논리적인 흐름을 유지하는지 진단한다.

> **참고:** 헤딩(Heading) 구조 검사는 2.4.2(제목 제공) 지침으로 이동되었습니다.

## 1. 데이터 수집 단계 (Data Collection)
- **DOM Order:** 문서 내 요소의 출현 순서.
- **CSS Layout:** `flex-direction`, `order` 등 순서 변경 속성.
- **ARIA:** `aria-flowto` 속성 사용 여부.
- **Layout Tables:** `role="presentation"` 또는 `role="none"` 표.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [검사 1] CSS order 속성 사용
- **Rule 1.1 (Logical Ordering):** CSS `order` 속성이 0이 아닌 값으로 설정된 경우
  - 결과: **[검토 필요]**
  - 가이드: "CSS 'order' 속성이 사용되었습니다. 시각적 순서와 마크업 순서가 일치하여 논리적 맥락을 유지하는지 확인하세요."

### [검사 2] Flex direction reverse 사용
- **Rule 1.1 (Logical Ordering):** `flex-direction: row-reverse` 또는 `column-reverse`가 설정된 경우
  - 결과: **[검토 필요]**
  - 가이드: "Flex 방향이 reverse로 설정되었습니다. 콘텐츠의 읽기 순서가 논리적인지 검토가 필요합니다."

### [검사 3] aria-flowto 사용
- **Rule 1.1 (Logical Ordering):** `aria-flowto` 속성이 사용된 경우
  - 결과: **[검토 필요]**
  - 가이드: "aria-flowto 속성이 사용되었습니다. 보조기술 사용자가 예상한 읽기 순서대로 작동하는지 확인하세요."

### [검사 4] 레이아웃 표 사용
- **Rule 1.1 (Logical Ordering):** `table[role="presentation"]` 또는 `table[role="none"]`이 감지된 경우
  - 결과: **[검토 필요]**
  - 가이드: "레이아웃용 표가 감지되었습니다. CSS 레이아웃(Flex/Grid)으로 전환을 권장하며, 제거 시에도 선형 구조가 유지되는지 확인하세요."

## 3. 최종 상태 정의 (Final Status)

1. **검토 필요:** CSS 순서 변경, aria-flowto, 레이아웃 표 등 전문가의 정성적 판단이 필요한 경우.
2. **적절:** 시각적 배치와 마크업 순서가 일치하고 논리적 흐름이 유지됨.
3. **N/A:** 순서 변경 속성이나 레이아웃 표가 사용되지 않은 경우.
