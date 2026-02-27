# AAK (A11Y Assistant for KWCAG) Workbench / A11Y Browser Tester

> 🛡️ **한국 웹 접근성 전문가를 위한 정밀 진단 어시스턴트**
> 브라우저 사이드 패널(Side Panel)을 통해 실시간 접근성 진단 및 전문가 판정 프로세스를 통합합니다.

## 💡 핵심 철학 (Core Philosophy)
웹 접근성 검수는 자동화하기 어려운 '**인적 판단**'의 영역이 많습니다. AAK는 "100% 자동화"를 목표로 하지 않습니다. 대신 "**전문가가 판단해야 할 항목을 가장 빠르게 선별해주고, 판단에 필요한 모든 정보(지침 원문, 마크업, 위치)를 한곳에 모아주는 것**"에 집중합니다.

## 🚀 주요 기능
- **KWCAG 2.2 최적화 진단**: 국내 표준 지침(33개 항목)에 특화된 정밀 진단 엔진(A11Y Browser Tester) 탑재
- **Expert-in-the-loop 판정**: 자동 진단 결과에 대해 전문가가 즉시 '적절/오류/수정권고'를 판정하고 소견을 기록
- **전문가 전용 도구 (Expert Tools)**: 명도 대비 분석기(EyeDropper), 포커스 트래커(초점 이동 순서 시각화) 등 실무형 도구 제공
- **SVG Spotlight**: 위배 요소의 위치를 정확히 찾아주는 고해상도 시각적 피드백 제공
- **스마트 리포팅**: 검수 내역을 즉시 마크다운(Markdown), JSON, CSV 등 다양한 포맷으로 추출하여 업무 효율 극대화
- **성능 최적화**: 대규모 DOM 환경에서도 쾌적한 UX를 제공하는 Batch 통신 아키텍처
- **상태 영속성**: `chrome.storage.local` 연동으로 브라우저를 닫아도 검수 세션 완벽 유지


> 🛡️ **웹 접근성 전문가를 위한 정밀 진단 어시스턴트**
> 브라우저 사이드 패널(Side Panel)을 통해 실시간 접근성 진단 및 전문가 판정 프로세스를 통합합니다.

## 💡 핵심 철학 (Core Philosophy)
웹 접근성 검수는 자동화하기 어려운 '**인적 판단**'의 영역이 많습니다. AAK는 "100% 자동화"를 목표로 하지 않습니다. 대신 "**전문가가 판단해야 할 항목을 가장 빠르게 선별해주고, 판단에 필요한 모든 정보(지침 원문, 마크업, 위치)를 한곳에 모아주는 것**"에 집중합니다.

## 🚀 주요 기능
- **KWCAG 2.2 최적화 진단**: 국내 표준 지침(33개 항목)에 특화된 정밀 진단 엔진 탑재
- **Expert-in-the-loop 판정**: 자동 진단 결과에 대해 전문가가 즉시 '적절/오류/수정권고'를 판정하고 소견을 기록
- **SVG Spotlight**: 위배 요소의 위치를 정확히 찾아주는 고해상도 시각적 피드백 제공
- **스마트 리포팅**: 검수 내역을 마크다운(Markdown), JSON, CSV 등 다양한 포맷으로 추출하여 업무 효율 극대화
- **전문가 도구바**: CSS 선형화, 이미지 대체 텍스트 오버레이, EyeDropper 대비 검사기 등 전문가 전용 도구 제공
- **성능 최적화**: 대규모 DOM 환경에서도 쾌적한 UX를 제공하는 Batch 통신 아키텍처
- **상태 영속성**: `chrome.storage.local` 연동으로 브라우저를 닫아도 검수 세션 완벽 유지

## 🛠️ 기술 스택
- **Core**: React 18, TypeScript, SCSS (Module)
- **Extension**: Manifest V3, Chrome Side Panel API
- **Engine**: Custom JS Engine (`ABTCore`) + 33 Processors
- **Build**: Vite 4
- **State**: Zustand (Custom Persistence Middleware)
- **Icons**: Lucide React

## 📦 설치 및 실행
```bash
# 의존성 설치
npm install

# 프로덕션 빌드 (dist/ 폴더 생성)
npm run build
```

## 🔌 확장 프로그램 로드 방법
1. Chrome 브라우저에서 `chrome://extensions/` 주소로 이동합니다.
2. 우측 상단의 **'개발자 모드'**를 활성화합니다.
3. **'압축해제된 확장 프로그램을 로드합니다'** 버튼을 클릭합니다.
4. 프로젝트의 `dist` 폴더를 선택합니다.
5. 브라우저 툴바의 확장 프로그램 아이콘을 클릭하여 **AAK**를 실행하면 사이드 패널이 열립니다.

## 📂 프로젝트 구조
- `src/engine/`: 접근성 진단 코어 엔진 및 지침별 프로세서 (Content Script)
- `src/renderer/`: React 기반 Side Panel UI 대시보드
- `src/extension/`: 서비스 워커 및 익스텐션 배포 설정
- `docs/algorithms/`: 각 진단 알고리즘의 동작 원리 명세
- `.references/`: KWCAG 공식 지침 및 표준 데이터셋
## 🗺️ 로드맵 (Roadmap)
- **Phase 8 (진행 중)**: 전문가용 정밀 진단 도구(EyeDropper, 포커스 트래커) 완성 및 배포 필수 문서화
- **Phase 9 (계획)**: 도구 자체 접근성(Self-A11Y) 최적화 및 엔진 자동화 테스트 체계 구축
- **Phase 10 (계획)**: 크롬 웹스토어 공식 배포 및 전문가 커뮤니티 홍보

- **Phase 8 (진행 중)**: 정밀 진단 도구(EyeDropper, 포커스 트래커) 및 엔진 품질 관리(자동화 테스트) 강화
- **Phase 9 (계획)**: Web Worker 기반 성능 최적화 및 다국어(i18n) 지원
- **Phase 10 (계획)**: 전문가 가이드라인 내장 및 외부 이슈 트래커(Jira, GitHub) 연동

