/**
* ABT Core Engine
* 지침별 프로세서들을 등록하고 통합 진단을 수행하는 중앙 컨트롤러
*/
class ABTCore {
  constructor() {
    this.processors = new Map();
    this.connector = window.ABTConnector;
    this.standards = null;
    this.isFocusTracking = false;
    this.focusPath = [];
    this.currentFocusIdx = -1; // 현재 포커스된 요소의 인덱스 추적용
    this.focusPath = [];
  }

  /**
  * 진단 기준 데이터를 로드합니다.
  */
  async loadStandards() {
    try {
      // 확장 프로그램 내 리소스 경로에서 로드 (Vite/Manifest 환경 고려)
      const response = await fetch(chrome.runtime.getURL('src/engine/kwcag-standards.json'));
      this.standards = await response.json();
      // console.log("ABT: KWCAG Standards loaded.", this.standards.version);
    } catch (error) {
      console.error("ABT: Failed to load standards JSON. Falling back to basic info.", error);
    }
  }

  /**
  * 새로운 프로세서를 등록합니다.
  * @param {string} id - 지침 번호 (예: '1.1.1')
  * @param {object} processor - scan() 메서드를 가진 프로세서 객체
  */
  registerProcessor(id, processor) {
    if (!/^[0-9]\.[0-9]\.[0-9]$/.test(id)) {
      console.warn(`ABT: Blocked registration of legacy processor [${id}].`);
      return;
    }
    this.processors.set(id, processor);
    // console.log(`ABT: Processor [${id}] registered.`);
  }

  /**
  * 등록된 모든 프로세서를 실행하여 통합 진단을 수행합니다.
  */
  async runFullAudit() {
    if (!this.connector || !this.connector.isConnected) {
      console.warn("ABT: Desktop 앱과 연결되어 있지 않습니다.");
    }

    console.log("ABT: Starting Full Audit...");
    let totalIssues = 0;

    const pageInfo = {
      url: window.location.href || "Unknown URL",
      pageTitle: document.title.trim() || window.location.hostname || "Untitled Page",
      timestamp: new Date().toISOString(),
      scanId: Date.now()
    };

    for (const [id, processor] of this.processors) {
      try {
        // 현재 진행 중인 지침 정보 전송
        this.connector.send({
          type: 'SCAN_PROGRESS',
          guideline_id: id
        });

        console.log(`ABT: Running Processor [${id}]...`);
        const reports = await processor.scan();
        console.log(`ABT: Processor [${id}] scanned, found ${reports?.length || 0} items.`);

        if (reports && reports.length > 0) {
          const batch = reports
          .filter(report => !!report)
          .map(report => {
            report.guideline_id = id;
            report.pageInfo = { ...pageInfo };

            // [매핑 로직 추가] 표준 데이터 결합
            if (this.standards && this.standards.items[id]) {
              const item = this.standards.items[id];
              report.guideline_info = {
                name: item.name,
                principle: this.standards.principles ? this.standards.principles[item.principle_id] : item.principle_id,
                compliance_criteria: item.compliance_criteria,
                detailed_descriptions: item.detailed_descriptions
              };

              // 오류 코드 매핑 (예: Rule 1.1 -> 1-1)
              if (report.result.rules && report.result.rules.length > 0) {
                report.result.detailed_errors = report.result.rules.map(rule => {
                  const match = rule.match(/Rule\s+(\d+\.\d+)/i);
                  if (match) {
                    const errorCode = match[1].replace('.', '-');
                    return {
                      code: errorCode,
                      description: item.error_types[errorCode] || "상세 설명 없음"
                    };
                  }
                  return { code: rule, description: "규칙 설명 없음" };
                });
              }
            }

            // DOM에서 오프닝 태그 스니펫 추출 (셀렉터로 요소 재조회)
            const sel = report.elementInfo?.selector;
            if (
              sel &&
              sel !== 'outline' &&
              sel !== 'body' &&
              !report.elementInfo.openingTag
            ) {
              try {
                const el = document.querySelector(sel);
                if (el) report.elementInfo.openingTag = window.ABTUtils.getOpeningTag(el);
              } catch (e) { /* 셀렉터 매칭 실패 시 무시 */ }
            }

            return report;
          });

          if (batch.length > 0) {
            this.connector.sendBatch(batch);
            totalIssues += batch.length;
          }
        }
      } catch (error) {
        console.error(`ABT: Error in Processor [${id}]:`, error);
      }
    }
    // 모든 지침 진단 완료 신호 전송
    this.connector.send({
      type: 'SCAN_FINISHED',
      scanId: pageInfo.scanId,
      totalIssues: totalIssues
    });

    console.log(`ABT: Audit Complete. Total ${totalIssues} issues sent.`);
  }

  /**
  * 특정 요소를 찾아 화면에 표시하고 고해상도 스포트라이트로 강조합니다.
  */
  highlightElement(selector) {
    try {
      if (!selector || selector === 'outline' || selector === 'document' || selector === 'body') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 1. 요소 탐색 (기본 선택자 -> 정밀 구조 폴백)
      let el = document.querySelector(selector);

      if (!el) {
        console.warn(`ABT: Selector failed: ${selector}. Trying structure fallback...`);
        try {
          const parts = selector.split(' > ');
          const lastPart = parts[parts.length - 1];
          const tagMatch = lastPart.match(/^([a-z0-9]+)/i);
          if (tagMatch) {
            const tagName = tagMatch[1];
            const nthMatch = lastPart.match(/:nth-of-type\((\d+)\)/) || lastPart.match(/:nth-child\((\d+)\)/);
            if (nthMatch) {
              const index = parseInt(nthMatch[1]) - 1;
              const candidates = Array.from(document.querySelectorAll(tagName)).filter(c => !window.ABTUtils.isHidden(c));
              el = candidates[index];
            }
          }
        } catch (e) {}
      }

      if (!el) {
        console.error(`ABT: Failed to locate element: ${selector}`);
        return;
      }

      // 2. 가려짐 방지 정밀 스크롤
      const rect = el.getBoundingClientRect();
      const absoluteTop = rect.top + window.pageYOffset;

      let headerOffset = 0;
      const fixies = Array.from(document.querySelectorAll('*')).filter(n => {
        const s = window.getComputedStyle(n);
        return (s.position === 'fixed' || s.position === 'sticky') &&
        parseInt(s.top) <= 0 && n.offsetHeight > 0 && n.offsetHeight < window.innerHeight / 3;
      });
      if (fixies.length > 0) headerOffset = Math.max(...fixies.map(n => n.offsetHeight));

      window.scrollTo({
        top: Math.max(0, absoluteTop - headerOffset - (window.innerHeight / 4)),
        behavior: 'smooth'
      });

      // 3. SVG 스포트라이트 오버레이
      const containerId = 'abt-spotlight-overlay-v2';
      const removeOld = () => {
        const old = document.getElementById(containerId);
        if (old) old.remove();
      };
      removeOld();

      const container = document.createElement('div');
      container.id = containerId;
      Object.assign(container.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '2147483647', transition: 'opacity 0.3s'
      });

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');

      const maskId = 'abt-mask-' + Math.random().toString(36).substr(2, 9);
      svg.innerHTML = `
        <defs>
          <mask id="${maskId}">
            <rect width="100%" height="100%" fill="white" />
            <rect id="abt-mask-hole" x="0" y="0" width="0" height="0" rx="4" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#${maskId})" />
        <rect id="abt-focus-rect" x="0" y="0" width="0" height="0" rx="4" fill="none" stroke="#ff00ff" stroke-width="4" />
      `;

      container.appendChild(svg);
      document.body.appendChild(container);

      const hole = svg.querySelector('#abt-mask-hole');
      const focusRect = svg.querySelector('#abt-focus-rect');

      // 4. 애니메이션 실시간 위치 추적
      let active = true;
      const update = () => {
        if (!active || !el) return;
        const r = el.getBoundingClientRect();
        const p = 8; // padding
        const attrs = {
          x: r.left - p, y: r.top - p,
          width: r.width + (p * 2), height: r.height + (p * 2)
        };

        [hole, focusRect].forEach(target => {
          for (let k in attrs) target.setAttribute(k, attrs[k]);
        });
        requestAnimationFrame(update);
      };
      requestAnimationFrame(update);

      // 5. 클린업
      const cleanup = () => {
        active = false;
        container.style.opacity = '0';
        setTimeout(removeOld, 300);
        document.removeEventListener('mousedown', cleanup);
      };
      document.addEventListener('mousedown', cleanup);
      setTimeout(cleanup, 4000);

    } catch (e) {
      console.error("ABT: Spotlight Error", e);
    }
  }
  /**
  * 이미지를 숨기고 대체 텍스트(alt)를 그 자리에 오버레이하여 시각적으로 표시합니다. (1.1.1 지침 검수용)
  * @param {boolean} enable - true면 이미지 끄기 및 alt 텍스트 표시, false면 복구
  */
  toggleImageAltView(enable) {
    try {
      const OVERLAY_CLASS = 'abt-alt-overlay-element';

      if (enable) {
        // 1. 기존 오버레이가 있다면 제거 (중복 방지)
        document.querySelectorAll(`.${OVERLAY_CLASS}`).forEach(el => el.remove());

        // 2. 모든 이미지 관련 요소 수집
        const imgElements = document.querySelectorAll('img, [role="img"], svg');

        imgElements.forEach(img => {
          // 이미지 원본 투명처리
          if (!img.dataset.originalOpacity) {
            img.dataset.originalOpacity = img.style.opacity || '1';
          }
          img.style.opacity = '0.1'; // 완전히 가리지 않고 형태만 어렴풋이 남김
          img.style.filter = 'grayscale(100%)';

          // 대체 텍스트 추출
          let altText = img.getAttribute('alt') || img.getAttribute('aria-label') || img.getAttribute('title') || '';
          if (img.tagName.toLowerCase() === 'svg') {
            const titleEl = img.querySelector('title');
            if (titleEl) altText = titleEl.textContent;
          }

          // 오버레이 생성
          const overlay = document.createElement('div');
          overlay.className = OVERLAY_CLASS;
          overlay.textContent = altText ? `[ALT: ${altText}]` : `[ALT 없음]`;

          // 스타일링
          Object.assign(overlay.style, {
            position: 'absolute',
            backgroundColor: altText ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)', // 녹색(있음) vs 빨간색(없음)
            color: 'white',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '4px',
            zIndex: '2147483646',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          });

          // 위치 지정 (이미지 바로 위에)
          const rect = img.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            overlay.style.top = `${rect.top + window.scrollY}px`;
            overlay.style.left = `${rect.left + window.scrollX}px`;
            document.body.appendChild(overlay);
          }
        });
      } else {
        // 복구 모드
        document.querySelectorAll(`.${OVERLAY_CLASS}`).forEach(el => el.remove());
        document.querySelectorAll('img, [role="img"], svg').forEach(img => {
          if (img.dataset.originalOpacity !== undefined) {
            img.style.opacity = img.dataset.originalOpacity;
            img.style.filter = '';
            delete img.dataset.originalOpacity;
          }
        });
      }
      console.log(`ABT: Image Alt View ${enable ? 'Enabled' : 'Disabled'}`);
    } catch (e) {
      console.error("ABT: Failed to toggle image alt view", e);
    }
  }

  /**
  * 모든 CSS 스타일시트를 비활성화하거나 활성화하여 선형 구조를 확인합니다. (1.3.2 지침 검수용)
  * @param {boolean} enable - true면 선형화(CSS 끔), false면 복구(CSS 켬)
  */
  toggleLinearView(enable) {
    try {
      Array.from(document.styleSheets).forEach(ss => {
        try {
          ss.disabled = !!enable;
        } catch (e) {}
      });
      console.log(`ABT: Linear View ${enable ? 'Enabled' : 'Disabled'}`);
    } catch (e) {
      console.error("ABT: Failed to toggle linear view", e);
    }
  }
  /**
  * 초점 이동 경로 및 순서 시각화 기능을 토글합니다.
  * 활성화 시 자동으로 페이지의 전체 초점 순서를 스캔하여 시각화합니다.
  */
  toggleFocusTracking(enable) {
    this.isFocusTracking = !!enable;

    if (this.isFocusTracking) {
      this.focusPath = [];
      this._setupFocusListeners();

      // 실시간 위치 동기화를 위한 이벤트 등록
      this._syncHandler = () => this._renderFocusPath();
      window.addEventListener('scroll', this._syncHandler, { passive: true });
      window.addEventListener('resize', this._syncHandler, { passive: true });

      // 기능을 켜는 순간 전체 경로 자동 시각화 실행
      this.visualizeFullFocusOrder();

      console.log("ABT: Focus Order Visualization Enabled");
    } else {
      this._removeFocusListeners();
      if (this._syncHandler) {
        window.removeEventListener('scroll', this._syncHandler);
        window.removeEventListener('resize', this._syncHandler);
      }
      this._removeFocusOverlay();
      console.log("ABT: Focus Order Visualization Disabled");
    }
  }

  /**
  * 페이지의 모든 초점 가능 요소를 찾아 전체 순서를 즉시 시각화합니다.
  */
  visualizeFullFocusOrder() {
    if (!this.isFocusTracking) return;

    const selector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contenteditable], audio[controls], video[controls]';
    const elements = Array.from(document.querySelectorAll(selector));

    const focusable = elements.filter(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const tabIndex = el.getAttribute('tabindex');
      if (tabIndex === '-1') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    const sorted = focusable.sort((a, b) => {
      const aIdx = parseInt(a.getAttribute('tabindex')) || 0;
      const bIdx = parseInt(b.getAttribute('tabindex')) || 0;
      const aPos = aIdx > 0 ? aIdx : Infinity;
      const bPos = bIdx > 0 ? bIdx : Infinity;
      if (aPos !== bPos) return aPos - bPos;
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    this.focusPath = sorted.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        selector: window.ABTUtils.getSelector(el),
        tagName: el.tagName,
        timestamp: Date.now(),
        absX: rect.left + rect.width / 2 + window.scrollX,
        absY: rect.top + rect.height / 2 + window.scrollY,
        absLeft: rect.left + window.scrollX,
        absTop: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      };
    });

    this._renderFocusPath();
    console.log(`ABT: Full focus order visualized (${this.focusPath.length} items)`);
  }

  resetFocusTracking() {
    this.focusPath = [];
    this._renderFocusPath();
    console.log("ABT: Focus Path Reset");
  }

  _setupFocusListeners() {
    this._focusHandler = (e) => {
      if (!this.isFocusTracking) return;
      const el = e.target;
      if (!el || el === document || el === window) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const info = {
        selector: window.ABTUtils.getSelector(el),
        tagName: el.tagName,
        timestamp: Date.now(),
        absX: rect.left + rect.width / 2 + window.scrollX,
        absY: rect.top + rect.height / 2 + window.scrollY,
        absLeft: rect.left + window.scrollX,
        absTop: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      };
      // 중복 체크: 이미 경로에 포함된 요소인지 확인
      const existingIdx = this.focusPath.findIndex(p => p.selector === info.selector);

      if (existingIdx !== -1) {
        // 이미 있는 요소면 강조 박스 위치만 업데이트하고 종료
        this.currentFocusIdx = existingIdx;
        this._renderFocusPath();
        return;
      }

      this.focusPath.push(info);
      this.currentFocusIdx = this.focusPath.length - 1;
      this._renderFocusPath();
      console.log(`ABT: Focus tracked [#${this.focusPath.length}]`, info.selector);

      const last = this.focusPath[this.focusPath.length - 1];
      if (last && last.selector === info.selector) return;

      this.focusPath.push(info);
      this._renderFocusPath();
    };
    window.addEventListener('focusin', this._focusHandler, true);
  }

  _removeFocusListeners() {
    if (this._focusHandler) {
      window.removeEventListener('focusin', this._focusHandler, true);
    }
  }

  _renderFocusPath() {
    const containerId = 'abt-focus-tracker-overlay';
    let container = document.getElementById(containerId);

    if (!container) {
      if (!this.isFocusTracking) return;
      container = document.createElement('div');
      container.id = containerId;
      Object.assign(container.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: '2147483647', overflow: 'visible'
      });
      document.body.appendChild(container);
    }

    if (!this.isFocusTracking || this.focusPath.length === 0) {
      container.innerHTML = '';
      return;
    }

    const svgNS = "http://www.w3.org/2000/svg";
    let svg = container.querySelector('svg');
    if (!svg) {
      svg = document.createElementNS(svgNS, 'svg');
      Object.assign(svg.style, { width: '100%', height: '100%', overflow: 'visible' });
      container.appendChild(svg);
    } else {
      svg.innerHTML = '';
    }

    const toVR = (pt) => ({
      x: pt.absX - window.scrollX,
      y: pt.absY - window.scrollY,
      left: pt.absLeft - window.scrollX,
      top: pt.absTop - window.scrollY
    });

    if (this.focusPath.length > 1) {
      const path = document.createElementNS(svgNS, 'path');
      const start = toVR(this.focusPath[0]);
      let d = `M ${start.x} ${start.y}`;
      for (let i = 1; i < this.focusPath.length; i++) {
        const next = toVR(this.focusPath[i]);
        d += ` L ${next.x} ${next.y}`;
      }
      Object.assign(path.style, {
        fill: 'none', stroke: '#3b82f6', strokeWidth: '3',
        strokeDasharray: '8,4', opacity: '0.6'
      });
      path.setAttribute('d', d);
      svg.appendChild(path);
    }

    this.focusPath.forEach((pt, idx) => {
      const coords = toVR(pt);
      const isCurrent = idx === this.currentFocusIdx;
      const g = document.createElementNS(svgNS, 'g');

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', coords.x);
      circle.setAttribute('cy', coords.y);
      circle.setAttribute('r', isCurrent ? '14' : '12');
      circle.setAttribute('fill', isCurrent ? '#ef4444' : '#3b82f6');
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      circle.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
      g.appendChild(circle);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', coords.x);
      text.setAttribute('y', coords.y + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.style.fontSize = '10px';
      text.style.fontWeight = '900';
      text.textContent = idx + 1;
      g.appendChild(text);

      if (isCurrent) {
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', coords.left - 4);
        rect.setAttribute('y', coords.top - 4);
        rect.setAttribute('width', pt.width + 8);
        rect.setAttribute('height', pt.height + 8);
        rect.setAttribute('fill', 'rgba(239, 68, 68, 0.15)');
        rect.setAttribute('stroke', '#ef4444');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('stroke-dasharray', '4,2');
        rect.setAttribute('rx', '4');
        g.appendChild(rect);
      }
      svg.appendChild(g);
    });
  }

  _removeFocusOverlay() {
    const container = document.getElementById('abt-focus-tracker-overlay');
    if (container) container.remove();
  }
}



// Global Singleton
window.ABTCore = new ABTCore();

// 기존 QuickScan 함수를 Core 기반으로 업데이트
window.ABTQuickScan = async () => {
  if (!window.ABTCore.standards) {
    await window.ABTCore.loadStandards();
  }
  return window.ABTCore.runFullAudit();
};
