# ABT-1.4.2-Processor: 자동 재생 금지 v0.14

### 🔗 References
- KWCAG 2.2: 1.4.2 자동 재생 금지
- WCAG 2.2: 1.4.2 Audio Control (A) (Reference)

---

이 알고리즘은 지침 1.4.2(자동 재생 금지)를 준수하며, 페이지 로드 시 자동으로 재생되는 음성 정보가 사용자에게 방해를 주지 않고 제어 가능한지 진단한다.

> **배점 방식:** 전수 조사형 (Exhaustive Scan). 페이지 내 모든 미디어 요소를 수집하여 각각 판정하며, 비율 기반으로 점수를 산정한다.

> **자동화 도구의 한계:** 미디어의 실제 오디오 트랙 유무는 정적 분석으로 판단할 수 없다. 오류로 탐지된 항목도 소리가 없는 미디어라면 전문가가 '적절'로 변경해야 한다.

## 1. 데이터 수집 단계 (Data Collection)

**대상 요소:**
- `<video>` 요소
- `<audio>` 요소
- `iframe[src*="youtube.com"]`
- `iframe[src*="vimeo.com"]`

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### `<video>`, `<audio>` 요소

| 조건 | 상태 | Rule |
|---|---|---|
| `autoplay` 있음 + `controls` 없음 | 오류 | Rule 1.1 |
| `autoplay` 있음 + `controls` 있음 | 수정 권고 | Rule 1.2 |
| `autoplay` 없음 | 검토 필요 | Rule 1.3 |

- **Rule 1.1 (오류):** autoplay가 설정되어 있고 제어 수단이 없는 경우. 소리가 있는 미디어라면 명확한 위반. 오디오 트랙이 없거나 음소거가 확실한 경우 전문가가 '적절'로 판정.
- **Rule 1.2 (수정 권고):** autoplay가 설정되어 있으나 controls 속성이 있는 경우. 소리가 있다면 페이지 로드 시 자동 재생되지 않도록 수정 권장.
- **Rule 1.3 (검토 필요):** autoplay 속성 없음. JavaScript를 통한 자동 재생 가능성이 있으므로 육안 확인 필요.

### YouTube/Vimeo `<iframe>` 요소

| 조건 | 상태 | Rule |
|---|---|---|
| URL에 `autoplay=1` 파라미터 있음 | 오류 | Rule 1.1 |
| URL에 `autoplay` 파라미터 없음 | 검토 필요 | Rule 1.3 |

## 3. 최종 상태 정의 (Final Status)

1. **오류:** autoplay 설정 + 제어 수단 없음. 소리가 있는 경우 즉시 수정 필요.
2. **수정 권고:** autoplay 설정 + 제어 수단 있음. 자동 재생 자체를 제거할 것을 권장.
3. **검토 필요:** autoplay 속성 없음 또는 iframe 임베드. 육안으로 자동 재생 여부 확인 필요.
4. **적절:** 전문가가 자동 재생 없음 또는 소리 없음을 확인한 경우.
5. **N/A:** 페이지 내에 해당 미디어 요소가 전혀 없는 경우.
