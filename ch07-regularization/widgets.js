/* ============================================================
   Chapter 07 — 정칙화 전용 위젯
   네임스페이스: CH7
   디자인 시스템 P2 (Atelier) 계승, ../assets/site.css 토큰 사용
   ============================================================ */
(function () {
  'use strict';
  const CH7 = (window.CH7 = window.CH7 || {});

  const css = getComputedStyle(document.documentElement);
  const C = {
    paper:        css.getPropertyValue('--paper').trim() || '#FAF7F0',
    paper2:       css.getPropertyValue('--paper-2').trim() || '#F3EEE3',
    paperSink:    css.getPropertyValue('--paper-sink').trim() || '#EDE6D7',
    ink:          css.getPropertyValue('--ink').trim() || '#26221C',
    inkSoft:      css.getPropertyValue('--ink-soft').trim() || '#5A5247',
    inkFaint:     css.getPropertyValue('--ink-faint').trim() || '#8E8576',
    structure:    css.getPropertyValue('--structure').trim() || '#2D5B7A',
    structureLo:  css.getPropertyValue('--structure-lo').trim() || '#6E97AF',
    style:        css.getPropertyValue('--style').trim() || '#C0492E',
    styleLo:      css.getPropertyValue('--style-lo').trim() || '#D98E73',
    synth:        css.getPropertyValue('--synth').trim() || '#A47B2E',
    line:         'rgba(38,34,28,0.13)',
    lineSoft:     'rgba(38,34,28,0.07)',
  };
  CH7.colors = C;

  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // 가시영역에 들어오면 한 번만 fn 실행
  CH7.onVisible = function (el, fn) {
    if (!el || !('IntersectionObserver' in window)) { fn && fn(); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) { fn && fn(); io.unobserve(el); }
      });
    }, { rootMargin: '120px' });
    io.observe(el);
  };

  // 사이드 네비 빌드 (Sub 목록 + 현재 표시)
  CH7.buildNav = function (currentNo) {
    const SUBS = [
      ['01', '일반화 격차란'],
      ['02', '정칙화의 정의'],
      ['03', 'L2와 가우시안 사전'],
      ['04', 'L2의 기하·고유값'],
      ['05', 'L1과 다이아몬드'],
      ['06', 'L1 vs L2'],
      ['07', '데이터 증강'],
      ['08', '노이즈 주입'],
      ['09', '라벨 스무딩'],
      ['10', '다중 작업 학습'],
      ['11', '조기 종료 ≈ L2'],
      ['12', '드롭아웃 기초'],
      ['13', '드롭아웃 앙상블'],
      ['14', '적대적 훈련'],
      ['15', '시험 대비'],
    ];
    const ol = document.querySelector('.ch-nav ol');
    if (!ol) return;
    ol.innerHTML = SUBS.map(([n, t]) => {
      const cls = (n === currentNo) ? ' class="current"' : '';
      return `<li><a href="${n}.html"${cls}>${t}</a></li>`;
    }).join('');

    // topbar
    const tb = document.querySelector('.topbar');
    if (tb && !tb.innerHTML) {
      const cur = SUBS.find(s => s[0] === currentNo) || ['', ''];
      tb.innerHTML = `
        <a class="home" href="index.html">← Ch.07 표지</a>
        <span class="ch-mini">SUB ${currentNo} / 15 · ${cur[1]}</span>`;
    }

    // ch-foot (prev/next)
    const foot = document.querySelector('.ch-foot');
    if (foot) {
      const idx = SUBS.findIndex(s => s[0] === currentNo);
      const prev = idx > 0 ? SUBS[idx - 1] : null;
      const next = idx < SUBS.length - 1 ? SUBS[idx + 1] : null;
      foot.innerHTML = `
        ${prev ? `<a href="${prev[0]}.html"><span class="dir">← Sub ${prev[0]}</span><span class="ti">${prev[1]}</span></a>` : '<span></span>'}
        ${next ? `<a class="next" href="${next[0]}.html"><span class="dir">Sub ${next[0]} →</span><span class="ti">${next[1]}</span></a>` : '<a class="next" href="index.html"><span class="dir">완료</span><span class="ti">표지로</span></a>'}
      `;
    }

    // 스크롤 진행
    const sp = document.querySelector('.scroll-progress');
    if (sp) {
      window.addEventListener('scroll', () => {
        const h = document.documentElement;
        const pct = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
        sp.style.width = (pct * 100).toFixed(2) + '%';
      });
    }
  };

  /* ============================================================
     1. L1 vs L2 등고선 + 손실 표면 — 시험 1순위
     2D (w1, w2) 평면에서 손실 등고선과 제약 영역(원/다이아몬드)을 그린다.
     사용자는 α 슬라이더로 제약 크기 조절 + 노름 선택.
     접점 = 정칙화된 해의 위치를 빨갛게 표시.
     ============================================================ */
  CH7.l1l2 = function (root) {
    root.innerHTML = `
      <div class="l1l2-stage">
        <canvas class="l1l2-cv" width="420" height="420"></canvas>
        <div class="l1l2-side">
          <div class="toggle-row" style="margin-bottom:.9rem;">
            <button class="btn ghost on" data-n="2">L2 (원)</button>
            <button class="btn ghost" data-n="1">L1 (다이아몬드)</button>
            <button class="btn ghost" data-n="both">겹쳐 보기</button>
          </div>
          <div class="l1l2-ctr">
            <div class="slider">
              <label>제약 크기 <b><span class="v-k">1.20</span></b></label>
              <input type="range" min="0.2" max="2.4" step="0.05" value="1.2" data-k>
            </div>
            <div class="slider">
              <label>손실 최저점 회전 <b><span class="v-rot">25°</span></b></label>
              <input type="range" min="-90" max="90" step="1" value="25" data-rot>
            </div>
            <div class="slider">
              <label>이방성(타원도) <b><span class="v-asp">2.0</span></b></label>
              <input type="range" min="1" max="6" step="0.1" value="2" data-asp>
            </div>
          </div>
          <div class="l1l2-read"></div>
        </div>
      </div>`;
    const cv = root.querySelector('.l1l2-cv');
    const ctx = cv.getContext('2d');
    const read = root.querySelector('.l1l2-read');
    const W = 420, H = 420;
    let mode = '2'; // '1', '2', 'both'
    let k = 1.2;
    let rotDeg = 25;
    let asp = 2.0;
    // 손실 unconstrained 최저점 (제약 없을 때의 해) - 원점에서 멀리
    const wStar = { x: 1.6, y: 1.1 };

    function toScreen(wx, wy) {
      const scale = 70;
      return [W / 2 + wx * scale, H / 2 - wy * scale];
    }
    function fromScreen(sx, sy) {
      const scale = 70;
      return [(sx - W / 2) / scale, -(sy - H / 2) / scale];
    }
    function lossAt(wx, wy) {
      const th = rotDeg * Math.PI / 180;
      const dx = wx - wStar.x, dy = wy - wStar.y;
      const u = dx * Math.cos(th) + dy * Math.sin(th);
      const v = -dx * Math.sin(th) + dy * Math.cos(th);
      // 이방성: 한 축 더 좁게
      return asp * asp * u * u + v * v;
    }
    // L1 또는 L2 제약 + 손실 합 최소화
    function solveConstrained(norm) {
      // 격자 탐색 (학습용 위젯이므로 정확도면 충분)
      let bestW = null, bestL = Infinity;
      const N = 220;
      const R = 3.0;
      for (let i = 0; i <= N; i++) {
        for (let j = 0; j <= N; j++) {
          const wx = -R + 2 * R * i / N;
          const wy = -R + 2 * R * j / N;
          // 제약 검사
          if (norm === 2) {
            if (wx * wx + wy * wy > k * k) continue;
          } else {
            if (Math.abs(wx) + Math.abs(wy) > k) continue;
          }
          const L = lossAt(wx, wy);
          if (L < bestL) { bestL = L; bestW = { x: wx, y: wy }; }
        }
      }
      return bestW;
    }

    function drawAxes() {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      // 격자
      ctx.strokeStyle = 'rgba(38,34,28,0.05)'; ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const [sx0, sy0] = toScreen(i, -3); const [sx1, sy1] = toScreen(i, 3);
        ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx1, sy1); ctx.stroke();
        const [tx0, ty0] = toScreen(-3, i); const [tx1, ty1] = toScreen(3, i);
        ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx1, ty1); ctx.stroke();
      }
      // 축
      ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1.2;
      const [ax0, ay0] = toScreen(-3, 0); const [ax1, ay1] = toScreen(3, 0);
      ctx.beginPath(); ctx.moveTo(ax0, ay0); ctx.lineTo(ax1, ay1); ctx.stroke();
      const [bx0, by0] = toScreen(0, -3); const [bx1, by1] = toScreen(0, 3);
      ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx1, by1); ctx.stroke();
      ctx.fillStyle = C.inkFaint; ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('w₁', W - 30, H / 2 - 6); ctx.fillText('w₂', W / 2 + 6, 16);
    }

    function drawContours() {
      // 손실 등고선 (타원)
      const levels = [0.15, 0.4, 0.9, 1.7, 2.9, 4.5, 6.5];
      ctx.strokeStyle = 'rgba(45,91,122,0.45)'; ctx.lineWidth = 1.4;
      levels.forEach((L) => {
        ctx.beginPath();
        // 타원 파라미터: asp² u² + v² = L
        // u = sqrt(L)/asp cos t, v = sqrt(L) sin t
        const a = Math.sqrt(L) / asp, b = Math.sqrt(L);
        const th = rotDeg * Math.PI / 180;
        let first = true;
        for (let t = 0; t <= 2 * Math.PI + 0.05; t += 0.04) {
          const u = a * Math.cos(t), v = b * Math.sin(t);
          const dx = u * Math.cos(th) - v * Math.sin(th);
          const dy = u * Math.sin(th) + v * Math.cos(th);
          const wx = wStar.x + dx, wy = wStar.y + dy;
          const [sx, sy] = toScreen(wx, wy);
          if (first) { ctx.moveTo(sx, sy); first = false; }
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      });
      // 최저점
      const [px, py] = toScreen(wStar.x, wStar.y);
      ctx.fillStyle = C.structure;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = C.inkSoft; ctx.font = '10px "Spline Sans Mono", monospace';
      ctx.fillText('θ* (unreg)', px + 6, py - 6);
    }

    function drawConstraint(norm, color) {
      ctx.strokeStyle = color;
      ctx.fillStyle = color.replace(')', ',0.10)').replace('rgb', 'rgba');
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (norm === 2) {
        const [cx, cy] = toScreen(0, 0);
        ctx.arc(cx, cy, 70 * k, 0, 2 * Math.PI);
      } else {
        const pts = [[k, 0], [0, k], [-k, 0], [0, -k]];
        pts.forEach((p, i) => {
          const [sx, sy] = toScreen(p[0], p[1]);
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
    }

    function draw() {
      drawAxes();
      drawContours();

      if (mode === '2' || mode === 'both') drawConstraint(2, 'rgb(45,91,122)');
      if (mode === '1' || mode === 'both') drawConstraint(1, 'rgb(192,73,46)');

      // 정칙화된 해
      const readNorms = (mode === 'both') ? [1, 2] : [parseInt(mode, 10)];
      let html = '';
      readNorms.forEach((n) => {
        const sol = solveConstrained(n);
        if (!sol) return;
        const [sx, sy] = toScreen(sol.x, sol.y);
        ctx.fillStyle = (n === 2) ? C.structure : C.style;
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        const wx0 = Math.abs(sol.x) < 0.04 ? 0 : sol.x.toFixed(2);
        const wy0 = Math.abs(sol.y) < 0.04 ? 0 : sol.y.toFixed(2);
        const sparse = (wx0 == 0 || wy0 == 0) ? ' <em>(축 위 — 희소!)</em>' : '';
        html += `<div class="ll-line"><b style="color:${n === 2 ? C.structure : C.style}">L${n}</b> 해: w₁=${wx0}, w₂=${wy0}${sparse}</div>`;
      });
      read.innerHTML = html + `<div class="ll-tip">제약 영역(색 면)과 손실 등고선(파란 타원)의 <b>접점</b>이 정칙화된 해다. L1의 다이아몬드는 축 위 꼭짓점에서 접하기 쉬워 <em>희소해</em>를 만든다.</div>`;
    }

    root.querySelectorAll('.toggle-row .btn').forEach(b => {
      b.addEventListener('click', () => {
        root.querySelectorAll('.toggle-row .btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); mode = b.dataset.n; draw();
      });
    });
    root.querySelector('[data-k]').addEventListener('input', (e) => {
      k = parseFloat(e.target.value); root.querySelector('.v-k').textContent = k.toFixed(2); draw();
    });
    root.querySelector('[data-rot]').addEventListener('input', (e) => {
      rotDeg = parseFloat(e.target.value); root.querySelector('.v-rot').textContent = rotDeg.toFixed(0) + '°'; draw();
    });
    root.querySelector('[data-asp]').addEventListener('input', (e) => {
      asp = parseFloat(e.target.value); root.querySelector('.v-asp').textContent = asp.toFixed(1); draw();
    });
    draw();
  };

  /* ============================================================
     2. L2 고유값별 축소 — λ/(λ+α) 시각화
     ============================================================ */
  CH7.l2eigen = function (root) {
    root.innerHTML = `
      <div class="l2eig-stage">
        <canvas class="l2eig-cv" width="600" height="240"></canvas>
        <div class="l2eig-ctr">
          <div class="slider">
            <label>α (정칙화 강도) <b><span class="v-a">0.50</span></b></label>
            <input type="range" min="0" max="5" step="0.05" value="0.5" data-a>
          </div>
        </div>
        <div class="l2eig-read"></div>
      </div>`;
    const cv = root.querySelector('.l2eig-cv');
    const ctx = cv.getContext('2d');
    const read = root.querySelector('.l2eig-read');
    const W = 600, H = 240;
    let alpha = 0.5;
    // 고유값 (각 파라미터 방향의 중요도)
    const lambdas = [4.5, 3.0, 1.8, 1.0, 0.5, 0.25, 0.12, 0.05];

    function draw() {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      const pad = { l: 60, r: 30, t: 30, b: 50 };
      const innerW = W - pad.l - pad.r;
      const innerH = H - pad.t - pad.b;
      const barW = innerW / lambdas.length;

      // 축
      ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + innerH);
      ctx.lineTo(pad.l + innerW, pad.t + innerH); ctx.stroke();
      ctx.fillStyle = C.inkFaint; ctx.font = '10px "Spline Sans Mono", monospace';
      ctx.fillText('축소되지 않은 값 = 1', pad.l - 50, pad.t - 8);
      ctx.fillText('λ (고유값, 중요도) →', pad.l + innerW - 130, pad.t + innerH + 30);
      // 1.0 기준선
      ctx.strokeStyle = 'rgba(45,91,122,0.4)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l + innerW, pad.t); ctx.stroke();
      ctx.setLineDash([]);

      lambdas.forEach((lam, i) => {
        const x = pad.l + barW * i + barW * 0.15;
        const w = barW * 0.7;
        const ratio = lam / (lam + alpha);  // 축소 비율
        const fullH = innerH * 1.0;
        const shrunkH = innerH * ratio;
        // 원본 (회색)
        ctx.fillStyle = C.paperSink;
        ctx.fillRect(x, pad.t + innerH - fullH, w, fullH);
        // 축소 후 (파랑)
        ctx.fillStyle = C.structure;
        ctx.fillRect(x, pad.t + innerH - shrunkH, w, shrunkH);
        // 라벨
        ctx.fillStyle = C.inkSoft; ctx.font = '10px "Spline Sans Mono", monospace';
        ctx.fillText('λ=' + lam.toFixed(2), x - 2, pad.t + innerH + 14);
        ctx.fillStyle = ratio < 0.5 ? C.style : C.ink;
        ctx.fillText('×' + ratio.toFixed(2), x - 2, pad.t + innerH + 28);
      });

      // 범례
      ctx.fillStyle = C.paperSink; ctx.fillRect(W - 180, 30, 12, 12);
      ctx.fillStyle = C.inkSoft; ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('원래 가중치 크기', W - 162, 40);
      ctx.fillStyle = C.structure; ctx.fillRect(W - 180, 48, 12, 12);
      ctx.fillStyle = C.inkSoft; ctx.fillText('L2 정칙화 후', W - 162, 58);

      read.innerHTML = `<b>핵심.</b> 큰 고유값(중요한 방향)은 거의 보존, 작은 고유값(덜 중요한 방향)은 강하게 축소. α = ${alpha.toFixed(2)}일 때 λ=4.50은 ${(4.5 / (4.5 + alpha)).toFixed(2)}배, λ=0.05는 ${(0.05 / (0.05 + alpha)).toFixed(2)}배. L2는 단순히 모든 가중치를 똑같이 줄이는 게 아니다.`;
    }
    root.querySelector('[data-a]').addEventListener('input', (e) => {
      alpha = parseFloat(e.target.value); root.querySelector('.v-a').textContent = alpha.toFixed(2); draw();
    });
    draw();
  };

  /* ============================================================
     3. 드롭아웃 무작위 마스킹 + 앙상블 평균
     ============================================================ */
  CH7.dropout = function (root) {
    root.innerHTML = `
      <div class="dro-stage">
        <canvas class="dro-cv" width="640" height="360"></canvas>
        <div class="dro-side">
          <div class="slider">
            <label>유지 확률 p <b><span class="v-p">0.50</span></b></label>
            <input type="range" min="0.1" max="1.0" step="0.05" value="0.5" data-p>
          </div>
          <div class="toggle-row" style="margin:.7rem 0;">
            <button class="btn ghost on" data-m="train">학습 (mask)</button>
            <button class="btn ghost" data-m="infer">추론 (scaled)</button>
            <button class="btn ghost" data-m="ens">앙상블 평균</button>
          </div>
          <button class="btn" data-resample>다시 샘플</button>
          <div class="dro-read"></div>
        </div>
      </div>`;
    const cv = root.querySelector('.dro-cv');
    const ctx = cv.getContext('2d');
    const read = root.querySelector('.dro-read');
    const W = 640, H = 360;
    let p = 0.5;        // 유지 확률
    let mode = 'train';
    // 작은 MLP: 입력 3, 은닉 6, 출력 2
    const layers = [3, 6, 6, 2];
    let masks = []; // 각 은닉층의 마스크
    let ensemble = []; // 앙상블 평균용 마스크 누적

    function resample() {
      masks = layers.slice(1, -1).map((n) => {
        const m = new Array(n);
        for (let i = 0; i < n; i++) m[i] = Math.random() < p ? 1 : 0;
        return m;
      });
    }
    function resampleEnsemble() {
      ensemble = [];
      for (let k = 0; k < 24; k++) {
        const m = layers.slice(1, -1).map((n) => {
          const arr = new Array(n);
          for (let i = 0; i < n; i++) arr[i] = Math.random() < p ? 1 : 0;
          return arr;
        });
        ensemble.push(m);
      }
    }
    resample(); resampleEnsemble();

    function nodePos(layerIdx, nodeIdx) {
      const N = layers[layerIdx];
      const xs = [W * 0.12, W * 0.38, W * 0.62, W * 0.86];
      const x = xs[layerIdx];
      const y = H / 2 + (nodeIdx - (N - 1) / 2) * 48;
      return [x, y];
    }
    function drawArch(maskFn, alphaMul) {
      // 엣지
      for (let l = 0; l < layers.length - 1; l++) {
        for (let i = 0; i < layers[l]; i++) {
          for (let j = 0; j < layers[l + 1]; j++) {
            const [x0, y0] = nodePos(l, i);
            const [x1, y1] = nodePos(l + 1, j);
            const liveL = (l === 0) ? 1 : maskFn(l, i);
            const liveR = (l + 1 === layers.length - 1) ? 1 : maskFn(l + 1, j);
            const alive = liveL && liveR;
            ctx.strokeStyle = alive ? `rgba(45,91,122,${0.35 * alphaMul})` : `rgba(38,34,28,${0.05 * alphaMul})`;
            ctx.lineWidth = alive ? 1.2 : 0.7;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          }
        }
      }
      // 노드
      for (let l = 0; l < layers.length; l++) {
        for (let i = 0; i < layers[l]; i++) {
          const [x, y] = nodePos(l, i);
          const isHidden = (l > 0 && l < layers.length - 1);
          const alive = isHidden ? maskFn(l, i) : 1;
          ctx.fillStyle = alive
            ? (l === 0 ? C.structure : (l === layers.length - 1 ? C.style : C.synth))
            : '#fff';
          ctx.strokeStyle = alive ? '#fff' : C.inkFaint;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, alive ? 13 : 9, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          if (isHidden && !alive) {
            // x 표시
            ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
            ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
          }
          if (mode === 'infer' && isHidden) {
            ctx.fillStyle = '#fff'; ctx.font = '9px "Spline Sans Mono", monospace';
            ctx.fillText('×p', x - 7, y + 3);
          }
        }
      }
    }
    function draw() {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      // 라벨
      ctx.fillStyle = C.inkFaint; ctx.font = '10px "Spline Sans Mono", monospace';
      ['INPUT', 'HIDDEN 1', 'HIDDEN 2', 'OUTPUT'].forEach((t, i) => {
        const xs = [W * 0.12, W * 0.38, W * 0.62, W * 0.86];
        ctx.fillText(t, xs[i] - 25, 30);
      });

      if (mode === 'train') {
        drawArch((l, i) => masks[l - 1][i], 1);
      } else if (mode === 'infer') {
        drawArch(() => 1, 1);
      } else {
        // 앙상블: 여러 마스크를 반투명으로 겹쳐 그리기
        const A = ensemble.length;
        for (let k = 0; k < A; k++) {
          const m = ensemble[k];
          drawArch((l, i) => m[l - 1][i], 1 / A);
        }
        // 마지막에 평균 강도로 한 번 더 (시각 명료성)
        ctx.globalAlpha = 0.0;
      }

      let msg = '';
      if (mode === 'train') {
        const alive = masks.flat().filter(x => x === 1).length;
        const total = masks.flat().length;
        msg = `<b>학습 단계.</b> 은닉 ${alive}/${total}개만 살아있다. 매 미니배치마다 새 마스크를 뽑는다.`;
      } else if (mode === 'infer') {
        msg = `<b>추론 단계.</b> 모든 뉴런을 쓰되, 학습 시 평균 가중치가 p배만 흘렀다는 사실을 보정하기 위해 활성에 ×p (또는 가중치에 ×p)를 곱한다. 이게 가중치 스케일링이다.`;
      } else {
        msg = `<b>앙상블 해석.</b> 위에 보이는 건 ${ensemble.length}개의 서로 다른 부분 신경망이 한 화면에 겹친 모습. 드롭아웃 학습은 사실상 이 모두를 동시에 학습한 것이고, 추론 시 ×p 스케일링은 이들의 기하 평균을 근사한다.`;
      }
      read.innerHTML = msg;
    }

    root.querySelector('[data-p]').addEventListener('input', (e) => {
      p = parseFloat(e.target.value); root.querySelector('.v-p').textContent = p.toFixed(2);
      resample(); resampleEnsemble(); draw();
    });
    root.querySelectorAll('.toggle-row .btn').forEach(b => {
      b.addEventListener('click', () => {
        root.querySelectorAll('.toggle-row .btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); mode = b.dataset.m; draw();
      });
    });
    root.querySelector('[data-resample]').addEventListener('click', () => {
      resample(); resampleEnsemble(); draw();
    });
    draw();
  };

  /* ============================================================
     4. 조기 종료 epoch 슬라이더 — 가중치 노름이 L2처럼 작아짐
     ============================================================ */
  CH7.earlystop = function (root) {
    root.innerHTML = `
      <div class="es-stage">
        <canvas class="es-cv" width="640" height="340"></canvas>
        <div class="es-ctr">
          <div class="slider" style="min-width:320px;flex:2;">
            <label>현재 epoch τ <b><span class="v-t">15</span></b></label>
            <input type="range" min="0" max="60" step="1" value="15" data-t>
          </div>
          <div class="slider" style="min-width:140px;flex:1;">
            <label>학습률 ε <b><span class="v-e">0.10</span></b></label>
            <input type="range" min="0.02" max="0.5" step="0.01" value="0.1" data-e>
          </div>
        </div>
        <div class="es-read"></div>
      </div>`;
    const cv = root.querySelector('.es-cv');
    const ctx = cv.getContext('2d');
    const read = root.querySelector('.es-read');
    const W = 640, H = 340;
    let tau = 15;
    let eps = 0.10;
    const lambdas = [3.0, 1.5, 0.7, 0.3, 0.1, 0.03];

    function draw() {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      const pad = { l: 60, r: 240, t: 30, b: 50 };
      const innerW = W - pad.l - pad.r;
      const innerH = H - pad.t - pad.b;

      // 축
      ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + innerH);
      ctx.lineTo(pad.l + innerW, pad.t + innerH); ctx.stroke();
      ctx.fillStyle = C.inkFaint; ctx.font = '10px "Spline Sans Mono", monospace';
      ctx.fillText('가중치 크기 비율 (vs θ*)', pad.l - 50, pad.t - 8);
      ctx.fillText('epoch τ →', pad.l + innerW - 60, pad.t + innerH + 30);

      // 1.0 기준선
      ctx.strokeStyle = 'rgba(45,91,122,0.3)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l + innerW, pad.t); ctx.stroke();
      ctx.setLineDash([]);

      const tauMax = 60;
      // 각 고유값 방향의 성장 곡선: 1 - (1 - ε·λ)^τ
      lambdas.forEach((lam, k) => {
        const color = `hsl(${210 - k * 30}, 50%, ${45 + k * 5}%)`;
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const tt = tauMax * i / 200;
          const factor = 1 - Math.pow(1 - eps * lam, tt);
          const x = pad.l + innerW * tt / tauMax;
          const y = pad.t + innerH * (1 - clamp(factor, 0, 1));
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = color; ctx.font = '10px "Spline Sans Mono", monospace';
        const final = 1 - Math.pow(1 - eps * lam, tauMax);
        ctx.fillText('λ=' + lam.toFixed(2), pad.l + innerW + 6, pad.t + innerH * (1 - clamp(final, 0, 1)) + 3);
      });

      // 현재 τ 위치 표시
      const xt = pad.l + innerW * tau / tauMax;
      ctx.strokeStyle = C.style; ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(xt, pad.t); ctx.lineTo(xt, pad.t + innerH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.style; ctx.fillText('τ = ' + tau, xt + 4, pad.t + 14);

      // 우측 박스: 등가 α 표시
      const eqAlpha = tau > 0 ? 1 / (eps * tau) : 9999;
      const boxX = pad.l + innerW + 110;
      ctx.fillStyle = C.paper2;
      ctx.fillRect(boxX, pad.t + 10, 210, 110);
      ctx.strokeStyle = C.line; ctx.strokeRect(boxX, pad.t + 10, 210, 110);
      ctx.fillStyle = C.inkSoft; ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('조기 종료 ↔ L2 동치', boxX + 14, pad.t + 32);
      ctx.fillStyle = C.style; ctx.font = '13px "Spline Sans Mono", monospace';
      ctx.fillText('α ≈ 1 / (ε · τ)', boxX + 14, pad.t + 56);
      ctx.fillStyle = C.ink; ctx.font = '12px "Spline Sans Mono", monospace';
      ctx.fillText('ε = ' + eps.toFixed(2), boxX + 14, pad.t + 80);
      ctx.fillText('τ = ' + tau, boxX + 14, pad.t + 96);
      ctx.fillStyle = C.style;
      ctx.fillText('α ≈ ' + (tau > 0 ? eqAlpha.toFixed(2) : '∞'), boxX + 100, pad.t + 96);

      read.innerHTML = `<b>읽는 법.</b> 각 곡선은 손실 헤시안 고유값 λ 방향에서 가중치가 θ* 쪽으로 얼마나 자랐는가의 비율. 큰 λ는 빨리 자라고, 작은 λ는 천천히 자란다. <b>τ가 작으면 작은 λ 방향은 거의 0에 머문다 = L2가 큰 α로 강하게 누른 것과 같다.</b> 이 그래프가 그대로 조기 종료 ≈ L2 동치성의 시각화.`;
    }
    root.querySelector('[data-t]').addEventListener('input', (e) => {
      tau = parseInt(e.target.value, 10); root.querySelector('.v-t').textContent = tau; draw();
    });
    root.querySelector('[data-e]').addEventListener('input', (e) => {
      eps = parseFloat(e.target.value); root.querySelector('.v-e').textContent = eps.toFixed(2); draw();
    });
    draw();
  };

  /* ============================================================
     5. 데이터 증강 — 이미지 회전·플립·노이즈 시연
     ============================================================ */
  CH7.augment = function (root) {
    root.innerHTML = `
      <div class="aug-stage">
        <div class="aug-grid"></div>
        <div class="aug-ctr">
          <div class="slider"><label>회전 각도 <b><span class="v-r">0°</span></b></label><input type="range" min="-60" max="60" step="1" value="0" data-r></div>
          <div class="slider"><label>밝기 <b><span class="v-b">0.0</span></b></label><input type="range" min="-0.4" max="0.4" step="0.02" value="0" data-b></div>
          <div class="slider"><label>노이즈 σ <b><span class="v-n">0.00</span></b></label><input type="range" min="0" max="0.3" step="0.01" value="0" data-n></div>
          <div class="toggle-row" style="margin-top:.6rem;">
            <button class="btn ghost" data-flip>좌우 반전</button>
            <button class="btn ghost" data-crop>임의 잘라내기</button>
            <button class="btn" data-reset>원본 복귀</button>
          </div>
        </div>
        <div class="aug-read"></div>
      </div>`;
    const gridEl = root.querySelector('.aug-grid');
    const read = root.querySelector('.aug-read');
    // 16개 패널 = 원본 + 15개 증강
    let cells = [];
    for (let i = 0; i < 16; i++) {
      const w = document.createElement('div'); w.className = 'aug-cell';
      const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96;
      const lab = document.createElement('span');
      w.appendChild(cv); w.appendChild(lab);
      gridEl.appendChild(w);
      cells.push({ cv, lab });
    }
    let rot = 0, brt = 0, noi = 0;
    let flip = false, crop = false;

    function drawDigit(ctx, size, op) {
      // op: { rot, brt, noi, flip, crop }
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((op.rot || 0) * Math.PI / 180);
      if (op.flip) ctx.scale(-1, 1);
      const s = op.crop ? 1.15 : 1;
      ctx.scale(s, s);
      if (op.crop) ctx.translate((Math.random() - 0.5) * size * 0.18, (Math.random() - 0.5) * size * 0.18);

      // 숫자 "3" 모양 (스타일라이즈된)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = size * 0.10;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      const r = size * 0.30;
      // 위쪽 곡선
      ctx.arc(0, -r * 0.55, r * 0.65, Math.PI * 0.9, Math.PI * 2.1, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, r * 0.55, r * 0.65, Math.PI * 0.9, Math.PI * 2.1, false);
      ctx.stroke();
      // 가운데
      ctx.beginPath();
      ctx.moveTo(-r * 0.05, 0); ctx.lineTo(r * 0.2, 0);
      ctx.stroke();
      ctx.restore();

      // 밝기
      if (op.brt) {
        ctx.fillStyle = `rgba(${op.brt > 0 ? 255 : 0},${op.brt > 0 ? 255 : 0},${op.brt > 0 ? 255 : 0},${Math.abs(op.brt)})`;
        ctx.fillRect(0, 0, size, size);
      }
      // 노이즈
      if (op.noi > 0) {
        const im = ctx.getImageData(0, 0, size, size);
        for (let i = 0; i < im.data.length; i += 4) {
          const n = (Math.random() - 0.5) * op.noi * 510;
          im.data[i] = clamp(im.data[i] + n, 0, 255);
          im.data[i + 1] = clamp(im.data[i + 1] + n, 0, 255);
          im.data[i + 2] = clamp(im.data[i + 2] + n, 0, 255);
        }
        ctx.putImageData(im, 0, 0);
      }
    }
    function draw() {
      cells.forEach((c, i) => {
        const ctx = c.cv.getContext('2d');
        if (i === 0) {
          drawDigit(ctx, 96, { rot: 0 });
          c.lab.textContent = '원본';
        } else {
          // 15개의 자동 증강 변형
          const op = {
            rot: (Math.random() - 0.5) * 2 * Math.abs(rot) + rot * 0.3,
            brt: (Math.random() - 0.5) * 0.6 * Math.abs(brt) + brt * 0.3,
            noi: Math.random() * noi,
            flip: flip && Math.random() < 0.5,
            crop: crop && Math.random() < 0.7,
          };
          drawDigit(ctx, 96, op);
          c.lab.textContent = '증강 ' + i;
        }
      });
      read.innerHTML = `<b>핵심.</b> 증강은 "이 변화는 모두 같은 '3'으로 보라"는 사전지식을 모형에 강제 주입한다. 회전 ${rot}°, 밝기 ${brt > 0 ? '+' : ''}${brt.toFixed(2)}, 노이즈 σ=${noi.toFixed(2)} 안에서도 같은 라벨이라는 뜻이다.`;
    }
    root.querySelector('[data-r]').addEventListener('input', (e) => {
      rot = parseFloat(e.target.value); root.querySelector('.v-r').textContent = rot + '°'; draw();
    });
    root.querySelector('[data-b]').addEventListener('input', (e) => {
      brt = parseFloat(e.target.value); root.querySelector('.v-b').textContent = (brt > 0 ? '+' : '') + brt.toFixed(2); draw();
    });
    root.querySelector('[data-n]').addEventListener('input', (e) => {
      noi = parseFloat(e.target.value); root.querySelector('.v-n').textContent = noi.toFixed(2); draw();
    });
    root.querySelector('[data-flip]').addEventListener('click', (e) => {
      flip = !flip; e.target.classList.toggle('on'); draw();
    });
    root.querySelector('[data-crop]').addEventListener('click', (e) => {
      crop = !crop; e.target.classList.toggle('on'); draw();
    });
    root.querySelector('[data-reset]').addEventListener('click', () => {
      rot = 0; brt = 0; noi = 0; flip = false; crop = false;
      root.querySelector('[data-r]').value = 0; root.querySelector('.v-r').textContent = '0°';
      root.querySelector('[data-b]').value = 0; root.querySelector('.v-b').textContent = '0.00';
      root.querySelector('[data-n]').value = 0; root.querySelector('.v-n').textContent = '0.00';
      root.querySelectorAll('[data-flip],[data-crop]').forEach(b => b.classList.remove('on'));
      draw();
    });
    draw();
  };

  /* ============================================================
     6. 라벨 스무딩 — soft vs hard
     ============================================================ */
  CH7.labelsmooth = function (root) {
    root.innerHTML = `
      <div class="ls-stage">
        <canvas class="ls-cv" width="540" height="280"></canvas>
        <div class="ls-ctr">
          <div class="slider">
            <label>스무딩 ε <b><span class="v-e">0.00</span></b></label>
            <input type="range" min="0" max="0.4" step="0.01" value="0" data-e>
          </div>
          <div class="slider">
            <label>클래스 수 K <b><span class="v-k">10</span></b></label>
            <input type="range" min="2" max="20" step="1" value="10" data-k>
          </div>
        </div>
        <div class="ls-read"></div>
      </div>`;
    const cv = root.querySelector('.ls-cv');
    const ctx = cv.getContext('2d');
    const read = root.querySelector('.ls-read');
    const W = 540, H = 280;
    let eps = 0.0, K = 10;

    function draw() {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      const pad = { l: 50, r: 30, t: 30, b: 40 };
      const innerW = W - pad.l - pad.r;
      const innerH = H - pad.t - pad.b;
      const barW = innerW / K;
      // 1.0 기준선
      ctx.strokeStyle = 'rgba(38,34,28,0.1)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l + innerW, pad.t); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.inkFaint; ctx.font = '10px "Spline Sans Mono", monospace';
      ctx.fillText('1.0', pad.l - 25, pad.t + 4);
      ctx.fillText('0.0', pad.l - 25, pad.t + innerH + 4);

      const trueIdx = Math.floor(K / 2);
      for (let i = 0; i < K; i++) {
        const x = pad.l + barW * i + barW * 0.15;
        const w = barW * 0.7;
        const isTrue = (i === trueIdx);
        const value = isTrue ? (1 - eps) : (eps / (K - 1));
        const barH = innerH * value;
        ctx.fillStyle = isTrue ? C.style : C.structureLo;
        ctx.fillRect(x, pad.t + innerH - barH, w, barH);
        ctx.fillStyle = C.inkFaint; ctx.font = '9px "Spline Sans Mono", monospace';
        ctx.fillText('c' + (i + 1), x + w / 2 - 7, pad.t + innerH + 14);
        if (isTrue) {
          ctx.fillStyle = C.ink; ctx.font = '10px "Spline Sans Mono", monospace';
          ctx.fillText(value.toFixed(2), x + w / 2 - 12, pad.t + innerH - barH - 4);
        } else if (eps > 0.01 && i === 0) {
          ctx.fillStyle = C.inkSoft; ctx.font = '9px "Spline Sans Mono", monospace';
          ctx.fillText(value.toFixed(3), x - 2, pad.t + innerH - barH - 4);
        }
      }

      ctx.fillStyle = C.inkSoft; ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText(eps < 0.01 ? '하드 라벨 (one-hot)' : `소프트 라벨 — 정답에 ${(1 - eps).toFixed(2)}, 나머지 ${(K - 1)}개 클래스에 ${(eps / (K - 1)).toFixed(3)}씩`, pad.l, 22);

      const entropy = eps > 0 ? -((1 - eps) * Math.log(1 - eps) + (K - 1) * (eps / (K - 1)) * Math.log(eps / (K - 1))) : 0;
      read.innerHTML = `<b>왜 정칙화인가.</b> 하드 라벨 (ε=0)은 정답 logit을 무한대로 보내야 손실이 0. 모형은 끝없이 자신감을 키운다. 스무딩은 목표 분포에 작은 엔트로피 ${entropy.toFixed(3)}을 심어, 무한한 자신감으로 가는 길을 막는다. 결과: 마진 일반화 성능과 캘리브레이션 모두 개선.`;
    }
    root.querySelector('[data-e]').addEventListener('input', (e) => {
      eps = parseFloat(e.target.value); root.querySelector('.v-e').textContent = eps.toFixed(2); draw();
    });
    root.querySelector('[data-k]').addEventListener('input', (e) => {
      K = parseInt(e.target.value, 10); root.querySelector('.v-k').textContent = K; draw();
    });
    draw();
  };

  /* ============================================================
     7. 노이즈 주입 — 입력 vs 가중치 노이즈로 본 결정 경계
     ============================================================ */
  CH7.noise = function (root) {
    root.innerHTML = `
      <div class="ni-stage">
        <canvas class="ni-cv" width="400" height="400"></canvas>
        <div class="ni-side">
          <div class="toggle-row" style="margin-bottom:.7rem;">
            <button class="btn ghost on" data-w="none">노이즈 없음</button>
            <button class="btn ghost" data-w="input">입력 노이즈</button>
            <button class="btn ghost" data-w="weight">가중치 노이즈</button>
          </div>
          <div class="slider">
            <label>노이즈 σ <b><span class="v-s">0.20</span></b></label>
            <input type="range" min="0" max="0.6" step="0.02" value="0.2" data-s>
          </div>
          <div class="ni-read"></div>
        </div>
      </div>`;
    const cv = root.querySelector('.ni-cv');
    const ctx = cv.getContext('2d');
    const read = root.querySelector('.ni-read');
    const W = 400, H = 400;
    let mode = 'none', sigma = 0.2;
    // 분류 문제: 클래스 0 = (x>0 AND y>0) OR (x<0 AND y<0), 클래스 1 = 나머지
    function trueLabel(x, y) {
      return ((x > 0) === (y > 0)) ? 0 : 1;
    }
    // 단순 MLP (고정 가중치): 노이즈 영향을 시각화
    function predict(x, y, mode, sig) {
      const samples = (mode === 'none') ? 1 : 40;
      let p1 = 0;
      for (let s = 0; s < samples; s++) {
        let xi = x, yi = y;
        if (mode === 'input') {
          xi += (Math.random() - 0.5) * 2 * sig;
          yi += (Math.random() - 0.5) * 2 * sig;
        }
        // 단순 MLP — h1 = relu(xi+yi), h2 = relu(-xi+yi), h3 = relu(xi-yi), h4 = relu(-xi-yi)
        let w = [1.5, -1.5, -1.5, 1.5];
        if (mode === 'weight') {
          w = w.map(v => v + (Math.random() - 0.5) * 2 * sig * 2);
        }
        const h1 = Math.max(0, xi + yi);
        const h2 = Math.max(0, -xi + yi);
        const h3 = Math.max(0, xi - yi);
        const h4 = Math.max(0, -xi - yi);
        const z = w[0] * h1 + w[1] * h2 + w[2] * h3 + w[3] * h4;
        p1 += 1 / (1 + Math.exp(-z));
      }
      return p1 / samples;
    }
    function draw() {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      // 결정 경계 히트맵
      const cell = 6;
      for (let py = 0; py < H; py += cell) {
        for (let px = 0; px < W; px += cell) {
          const x = (px - W / 2) / 60;
          const y = -(py - H / 2) / 60;
          const p = predict(x, y, mode, sigma);
          // 0 = 쿨, 1 = 웜
          const r = lerp(45, 192, p), g = lerp(91, 73, p), b = lerp(122, 46, p);
          ctx.fillStyle = `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${0.15 + Math.abs(p - 0.5) * 0.4})`;
          ctx.fillRect(px, py, cell, cell);
        }
      }
      // 경계선
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.beginPath();
      // 진짜 경계: x=0 또는 y=0
      ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
      ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
      ctx.stroke();
      // 4개 영역에 클래스 표시
      ctx.fillStyle = C.inkSoft; ctx.font = '14px "Fraunces", serif';
      ctx.fillText('0', W / 4, H / 4 + 5);
      ctx.fillText('1', 3 * W / 4, H / 4 + 5);
      ctx.fillText('1', W / 4, 3 * H / 4 + 5);
      ctx.fillText('0', 3 * W / 4, 3 * H / 4 + 5);

      let msg = '';
      if (mode === 'none') msg = '<b>기본.</b> 노이즈 없이 학습된 모형의 결정 경계. 진짜 경계인 두 축에 잘 정렬.';
      else if (mode === 'input') msg = `<b>입력 노이즈.</b> σ=${sigma.toFixed(2)} 만큼의 흔들림 안에서도 답이 같아야 한다 → 경계가 부드러워지고, 매끄러움이 강제된다. 효과상 L2와 유사.`;
      else msg = `<b>가중치 노이즈.</b> σ=${sigma.toFixed(2)} 의 가중치 흔들림에서도 안정하라 → 가중치 평탄점(flat minimum)을 선호하게 만든다. 베이지안 신경망의 근사.`;
      read.innerHTML = msg;
    }
    root.querySelectorAll('.toggle-row .btn').forEach(b => {
      b.addEventListener('click', () => {
        root.querySelectorAll('.toggle-row .btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); mode = b.dataset.w; draw();
      });
    });
    root.querySelector('[data-s]').addEventListener('input', (e) => {
      sigma = parseFloat(e.target.value); root.querySelector('.v-s').textContent = sigma.toFixed(2); draw();
    });
    draw();
  };

  /* ============================================================
     8. 적대적 예제 — FGSM ε 슬라이더
     ============================================================ */
  CH7.adv = function (root) {
    root.innerHTML = `
      <div class="adv-stage">
        <div class="adv-row">
          <div class="adv-img"><canvas class="adv-orig" width="160" height="160"></canvas><span>원본 (3)</span></div>
          <div class="adv-arrow">+ ε · sign(∇)</div>
          <div class="adv-img"><canvas class="adv-pert" width="160" height="160"></canvas><span>교란 (시각화 ×8)</span></div>
          <div class="adv-arrow">=</div>
          <div class="adv-img"><canvas class="adv-adv" width="160" height="160"></canvas><span class="v-out">적대 (?)</span></div>
        </div>
        <div class="adv-ctr">
          <div class="slider"><label>ε (교란 크기) <b><span class="v-eps">0.00</span></b></label><input type="range" min="0" max="0.4" step="0.005" value="0" data-eps></div>
        </div>
        <div class="adv-read"></div>
      </div>`;
    const cv1 = root.querySelector('.adv-orig');
    const cv2 = root.querySelector('.adv-pert');
    const cv3 = root.querySelector('.adv-adv');
    const read = root.querySelector('.adv-read');
    const outLabel = root.querySelector('.v-out');
    let eps = 0;
    // 적대 방향 (FGSM 가짜): 픽셀별 임의 ±1
    const W = 160, H = 160;
    const sign = new Float32Array(W * H);
    for (let i = 0; i < sign.length; i++) sign[i] = Math.random() < 0.5 ? -1 : 1;

    function drawDigit3(ctx, size) {
      ctx.fillStyle = '#0e0e0e';
      ctx.fillRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = size * 0.10;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const r = size * 0.30;
      ctx.beginPath();
      ctx.arc(0, -r * 0.55, r * 0.65, Math.PI * 0.9, Math.PI * 2.1, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, r * 0.55, r * 0.65, Math.PI * 0.9, Math.PI * 2.1, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.05, 0); ctx.lineTo(r * 0.2, 0);
      ctx.stroke();
      ctx.restore();
    }
    function draw() {
      const c1 = cv1.getContext('2d');
      drawDigit3(c1, W);
      // 원본 픽셀
      const orig = c1.getImageData(0, 0, W, H);
      // 교란 시각화 — sign·255·8 보이기 (이해용)
      const c2 = cv2.getContext('2d');
      const pertIm = c2.createImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        const v = sign[i] > 0 ? 200 : 55;
        pertIm.data[i * 4] = v; pertIm.data[i * 4 + 1] = v; pertIm.data[i * 4 + 2] = v; pertIm.data[i * 4 + 3] = 255;
      }
      c2.putImageData(pertIm, 0, 0);
      // 적대 예제 = 원본 + ε·sign
      const c3 = cv3.getContext('2d');
      const advIm = c3.createImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        const ov = orig.data[i * 4];
        const nv = clamp(ov + sign[i] * eps * 255, 0, 255);
        advIm.data[i * 4] = nv; advIm.data[i * 4 + 1] = nv; advIm.data[i * 4 + 2] = nv; advIm.data[i * 4 + 3] = 255;
      }
      c3.putImageData(advIm, 0, 0);

      // 가짜 예측: ε가 임계치를 넘으면 잘못 분류
      const pred = eps > 0.12 ? '8' : (eps > 0.06 ? '?' : '3');
      const confidence = eps > 0.12 ? 0.82 : (eps > 0.06 ? 0.55 : 0.95);
      outLabel.innerHTML = `적대 (<b style="color:${pred === '3' ? C.structure : C.style}">${pred}</b>, p=${confidence.toFixed(2)})`;
      read.innerHTML = `<b>현상.</b> ε=${eps.toFixed(3)}만큼의 작은 교란 — 사람 눈에는 같은 '3'으로 보이지만, 모형은 ε > 0.12에서 '8'로 잘못 분류. 적대적 훈련은 이런 ε-볼 안에서도 정답을 내도록 손실에 max 항을 더한다. 정칙화의 가장 강한 일반화: 입력 근방 전체에서 안정하라.`;
    }
    root.querySelector('[data-eps]').addEventListener('input', (e) => {
      eps = parseFloat(e.target.value); root.querySelector('.v-eps').textContent = eps.toFixed(3); draw();
    });
    draw();
  };

  /* ============================================================
     9. L1 sparsity 시각화 — 가중치 0인 비율
     ============================================================ */
  CH7.sparsity = function (root) {
    root.innerHTML = `
      <div class="sp-stage">
        <canvas class="sp-cv" width="600" height="240"></canvas>
        <div class="sp-ctr">
          <div class="slider"><label>α (L1 강도) <b><span class="v-a">0.05</span></b></label><input type="range" min="0" max="1.5" step="0.01" value="0.05" data-a></div>
        </div>
        <div class="sp-read"></div>
      </div>`;
    const cv = root.querySelector('.sp-cv');
    const ctx = cv.getContext('2d');
    const read = root.querySelector('.sp-read');
    const W = 600, H = 240;
    // 100개 가중치 (정규분포에서 추출)
    const N = 100;
    const w0 = new Float32Array(N);
    const wRaw = new Float32Array(N);
    function gauss() { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.6; }
    for (let i = 0; i < N; i++) { wRaw[i] = gauss(); w0[i] = wRaw[i]; }
    let alpha = 0.05;

    function softThreshold(w, a) {
      if (w > a) return w - a;
      if (w < -a) return w + a;
      return 0;
    }
    function draw() {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      const pad = { l: 40, r: 30, t: 30, b: 50 };
      const innerW = W - pad.l - pad.r;
      const innerH = H - pad.t - pad.b;
      const colW = innerW / N;
      // 0 기준선
      const y0 = pad.t + innerH / 2;
      ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(pad.l + innerW, y0); ctx.stroke();

      let zeroCount = 0;
      const maxAbs = 2.5;
      for (let i = 0; i < N; i++) {
        const w = softThreshold(w0[i], alpha);
        if (Math.abs(w) < 1e-6) zeroCount++;
        const x = pad.l + colW * i + colW * 0.1;
        const bw = colW * 0.8;
        const bh = (innerH / 2) * (Math.abs(w) / maxAbs);
        ctx.fillStyle = Math.abs(w) < 1e-6 ? C.inkFaint : (w > 0 ? C.structure : C.style);
        if (w >= 0) ctx.fillRect(x, y0 - bh, bw, bh);
        else ctx.fillRect(x, y0, bw, bh);
      }
      // 라벨
      ctx.fillStyle = C.inkSoft; ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText(`α = ${alpha.toFixed(2)} → 0이 된 가중치 ${zeroCount} / ${N} (${(100 * zeroCount / N).toFixed(0)}%)`, pad.l, 22);
      ctx.fillStyle = C.inkFaint; ctx.font = '10px "Spline Sans Mono", monospace';
      ctx.fillText('가중치 100개 (정규분포에서 추출, soft-threshold로 L1 해 시뮬레이션)', pad.l, pad.t + innerH + 24);

      read.innerHTML = `<b>희소성의 직접 관찰.</b> α를 키울수록 0이 된 가중치의 비율이 단조 증가. α=0이면 0%, α=0.5면 약 ${Math.round(100 * (1 - 2 * Math.exp(-0.5 * 0.5 / 0.72)))}%, α≥1.5면 거의 모두 0. 이게 L1이 자동 특징 선택기로 기능하는 이유.`;
    }
    root.querySelector('[data-a]').addEventListener('input', (e) => {
      alpha = parseFloat(e.target.value); root.querySelector('.v-a').textContent = alpha.toFixed(2); draw();
    });
    draw();
  };

})();
