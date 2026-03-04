# ABT-1.2.1-Processor: 자막 제공 v0.11

### 🔗 References
- KWCAG 2.2: 1.2.1 자막 제공
- WCAG 2.2: 1.2.2 Captions (Prerecorded) (A) (Reference)

---

## 1. 데이터 수집 단계 (Data Collection)
대상 요소(`video`, `audio`, `object`, `embed`, 유튜브 등 `iframe` 기반 플레이어)를 발견하면 다음 정보를 수집한다.
- **Target Type:** `HTML5 Video`, `HTML5 Audio`, `Iframe Player`, `Object/Embed`
- **Tracks:** `<track>` 요소의 존재 여부, `kind` 속성(`captions`, `subtitles`, `descriptions`), `srclang`, `label`.
- **Related Context:** 플레이어 주변 텍스트 중 "자막", "대본", "스크립트", "수어", "해설" 키워드 포함 여부.
- **Metadata:** `title` 속성, `aria-label`, `aria-describedby`.

## 2. 분석 및 분류 로직 (Analysis Pipeline)

### [단계 A] 기술적 결함 검사 (Technical Defect)
- **Rule 1.1:** `video` 또는 `audio` 요소가 있으나 `<track>` 요소가 전혀 없는가?
  - 결과: **[검토 필요]** (자동화 도구의 한계로 자막이 영상에 입혀져 있는지 알 수 없으므로 전문가 확인 유도)
- **Rule 1.2:** `iframe` 기반 플레이어(YouTube 등)에 `title` 속성이 없는가?
  - 결과: **[수정 권고]** (프레임의 목적을 알 수 없으므로 제목 추가 권장)

### [단계 B] 텍스트 대안 검사 (Text Alternatives)
- **Rule 2.1:** 플레이어 주변 텍스트 노드에 "대본", "스크립트" 링크나 텍스트가 존재하는가?
  - 결과: **[적절]** (청각 장애인을 위한 텍스트 대안 제공 확인)
  - 미존재 시: **[수정 권고]** (대본 제공 권장)

### [단계 C] 화면 해설 및 수어 검사 (Audio Description & Sign Language)
- **Rule 3.1:** `<track kind="descriptions">`가 존재하는가?
  - 존재 시: **[적절]**
  - 미존재 시: **[검토 필요]** (시각 장애인을 위한 화면 해설 제공 여부 확인 필요)
### [단계 D] 자동화 도구의 한계 대응 (Manual Review)
- **Rule 4.1:** `<track>`이 없더라도 영상 자체에 자막이 포함(열린 자막)되어 있거나, 별도의 텍스트 대안(대본)이 제공될 수 있음.
  - 결과: **[검토 필요]** (기존 '오류'에서 '검토 필요'로 완화하여 전문가의 육안 확인 유도)
## 3. 최종 상태 정의 (Final Status)
1. **오류:** 비디오/오디오 스트림 식별 불가 등 치명적 결함.
2. **부적절:** 자막이나 대본이 있으나 실제 내용과 일치하지 않거나 불충분함(전문가 판정).
3. **수정 권고:** `iframe` 제목 누락, 자막은 있으나 대본이 없는 경우 등 품질 개선 사항.
4. **검토 필요:** 기계적으로 자막/해설 포함 여부를 알 수 없는 멀티미디어 요소 전체.
5. **적절:** 표준 지침에 따른 트랙 및 대안 제공 확인.
