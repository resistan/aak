# ABT-4.1.1-Processor: 마크업 오류 방지 v0.12

### 🔗 References
- KWCAG 2.2: 4.1.1 마크업 오류 방지
- WCAG 2.2: 4.1.1 Parsing (Deprecated) (A) (Reference)

---

이 알고리즘은 **KWCAG 4.1.1(마크업 오류 방지)** 지침을 준수하며, 웹 페이지의 HTML 마크업에 표준을 위반하는 치명적인 오류(태그 중첩 오류, 속성 중복 선언, ID 중복 등)가 없는지 진단한다. 경미한 경고성 오류보다는 보조기술의 해석에 직접적인 영향을 미치는 주요 오류를 중심으로 진단한다.

## 1. 대상 식별 및 데이터 수집 (Data Collection)

### [대상 요소 추출]
- 페이지 전체의 HTML 문서(`document.documentElement.outerHTML`).
- 브라우저의 DOM 파서가 생성한 유효한 DOM 트리.

### [오류 정보 파악]
- `document.querySelectorAll('[id]')`를 통해 모든 ID 속성값 추출.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [검사 1] 중복 ID 속성 검사
- **Rule 4.1.1 (Duplicate ID):** 문서 내에 동일한 `id` 속성값이 중복 사용되었는가?
  - 결과: 발견 시 **[검토 필요]** (1건 요약 리포트)
  - 메시지: "전체 N개 ID 중 M개가 중복 사용되었습니다. 중복된 ID: xxx, yyy..."
  - 전문가가 비율을 참조하여 수동으로 점수를 입력한다.

### [검사 2] 기타 마크업 오류 (수동 검사 권고)
- **Rule 4.1.1 (Manual Markup Review Required):** 브라우저의 DOM 파서는 잘못된 HTML을 자동으로 보정하므로, 자바스크립트 API만으로는 완벽한 구문 검사(태그 중첩, 속성 중복 등)가 불가능합니다.
  - 결과: 중복 ID가 없는 경우 **[검토 필요]** 리포트를 생성하여 외부 도구 사용을 권고합니다.
  - 메시지: "중복된 ID 속성은 발견되지 않았습니다. Nu HTML Checker를 이용해 최종 마크업 유효성을 검사하세요."

> **Nu HTML Checker 링크:** 두 경우 모두 `result.link` 필드에 `https://validator.w3.org/nu/?doc={현재페이지URL}`을 포함하여 UI에서 클릭 가능한 링크로 렌더링한다.

## 3. 최종 상태 정의 (Final Status)
1. **검토 필요 (Needs Review):**
   - 중복 ID 발견 시: 전체/중복 수치를 제공하며 전문가 판정 및 수동 점수 입력 유도.
   - 중복 ID 미발견 시: 기타 마크업 오류에 대해 Nu HTML Checker를 통한 확인 필요.
