# ABT-2.5.1-Processor: 단일 포인터 입력 지원 v0.12

### 🔗 References
- KWCAG 2.2: 2.5.1 단일 포인터 입력 지원
- WCAG 2.2: 2.5.1 Pointer Gestures (A) (Reference)

---

이 알고리즘은 **KWCAG 2.5.1(단일 포인터 입력 지원)** 지침을 준수하며, 복잡한 제스처(드래그, 핀치 줌 등)가 필요한 기능에 대해 단일 포인터(탭/클릭)만으로 조작 가능한 대체 수단이 제공되는지 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Potential Gesture Elements:** `[draggable="true"]`, `.draggable`, `[role="slider"]`.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [검사 1] 제스처 사용 예상 영역 식별
- **Rule 2.5.1 (Single Pointer Support):** 드래그 속성(`[draggable="true"]`, `.draggable`)이나 슬라이더 역할(`[role="slider"]`)이 부여된 요소 탐지.
  - 결과: **[검토 필요]**
  - 가이드: "이 요소에 드래그, 핀치 줌, 스와이프 등 복잡한 제스처가 사용되었다면, 단일 포인터(탭, 클릭)만으로도 모든 기능을 수행할 수 있는 대체 수단(예: 이동 버튼, 확대/축소 버튼 등)이 제공되는지 확인하세요."

## 3. 최종 상태 정의 (Final Status)
1. **검토 필요:** 복잡한 제스처 사용이 의심되는 영역. 전문가가 실제 제스처 사용 여부와 단일 클릭 대안 존재 여부를 최종 판정함.
