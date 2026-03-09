# ABT-2.5.3-Processor: 레이블과 네임 v0.21

### 🔗 References
- KWCAG 2.2: 2.5.3 레이블과 네임
- WCAG 2.2: 2.5.3 Label in Name (A) (Reference)
- W3C AccName 1.2: Text Alternative Computation

---

이 알고리즘은 사용자가 눈으로 보는 **시각적 레이블(Visible Label)**과 보조공학기기가 인식하는 **프로그램적 네임(Accessible Name)** 간의 일치성을 진단한다.

## 1. 데이터 수집 단계 (Data Collection)
- **Target Elements:** `a`, `button`, `input[type="button/submit/reset"]`, `[role="button/link"]`, `label`.
- **Exclusions:** 시각적 텍스트가 없는 요소, 또는 네임을 덮어쓰는 속성(`aria-label` 등)이 없는 요소는 제외.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [검사 1] 텍스트 정규화
- 대소문자 통일, 구두점(`.,!?'"()[]<>- `) 제거, 다중 공백 압축을 통해 미세한 차이로 인한 오탐 방지.

### [검사 2] 포함 관계 분석
- **Rule 2.5.3 (Label in Name):** 정규화된 프로그램적 네임이 정규화된 시각적 레이블을 포함하고 있는가?
  - 결과: 포함하지 않을 경우 **[오류]**
  - 가이드: "시각적 레이블이 프로그램적 네임에 포함되어 있지 않습니다. 음성 제어 사용자의 혼란을 방지하기 위해 시각적 텍스트를 네임의 시작 부분에 포함하세요."

## 3. 최종 상태 정의 (Final Status)
1. **오류:** 시각적 레이블이 프로그램적 네임에 포함되어 있지 않은 경우.
2. **적절:** 시각적 레이블이 프로그램적 네임에 포함되어 있거나, 별도의 네임 설정 속성이 없어 텍스트가 곧 네임인 경우.
