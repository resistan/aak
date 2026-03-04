# ABT-2.4.4-Processor: 고정된 참조 위치 정보 v0.13

### 🔗 References
- KWCAG 2.2: 2.4.4 고정된 참조 위치 정보
- WCAG 2.2: 2.4.13 Page Break Locators (A) (Reference)

---

이 알고리즘은 **KWCAG 2.4.4(고정된 참조 위치 정보)** 지침을 준수하며, 고정된 페이지 번호가 있는 매체(PDF 등)와 병행 제공되는 경우 위치 정보의 일관성을 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Standard Markers:** `role="doc-pagebreak"`, `epub:type="pagebreak"` 속성을 가진 요소.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 표준 페이지 마커 탐지
- **Rule 2.4.4 (Page Reference Detection):** 표준 마크업을 사용한 페이지 구분선 탐지.
  - 결과: **[검토 필요]** (원본 매체와 위치 일치 여부 확인).

### [단계 B] 전역 안내 제공
- **Rule 2.4.4 (Fixed Reference Location):** 지침의 특성상 기계적 판별이 어려우므로 모든 페이지에 안내 정보를 제공함.
  - 결과: **[참고자료]**.

## 3. 최종 상태 정의 (Final Status)
1. **검토 필요:** 표준 페이지 마커가 탐지되어 실제 매체와의 대조가 필요한 상태.
2. **참고자료:** 지침 적용 대상 여부 및 수동 검토 방법을 안내하는 정보.
