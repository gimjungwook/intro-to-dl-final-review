/* ============================================================
   Transformer 해설 (Paper 3) — 공유 인터랙티브 위젯
   ../assets/site.css 의 CSS 변수를 그대로 사용한다.
   ============================================================ */
(function () {
  'use strict';
  const TFR = (window.TFR = window.TFR || {});

  const css = getComputedStyle(document.documentElement);
  const C = {
    paper:     css.getPropertyValue('--paper').trim() || '#FAF7F0',
    paper2:    css.getPropertyValue('--paper-2').trim() || '#F3EEE3',
    ink:       css.getPropertyValue('--ink').trim() || '#26221C',
    inkSoft:   css.getPropertyValue('--ink-soft').trim() || '#5A5247',
    inkFaint:  css.getPropertyValue('--ink-faint').trim() || '#8E8576',
    key:       css.getPropertyValue('--structure').trim() || '#2D5B7A', // Key
    keyLo:     css.getPropertyValue('--structure-lo').trim() || '#6E97AF',
    value:     css.getPropertyValue('--style').trim() || '#C0492E',     // Value
    valueLo:   css.getPropertyValue('--style-lo').trim() || '#D98E73',
    query:     css.getPropertyValue('--synth').trim() || '#A47B2E',     // Query
    line:      'rgba(38,34,28,0.13)',
  };
  TFR.colors = C;

  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function fmt(x, n) { n = n == null ? 2 : n; return (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n); }

  /* ---------- 수식 렌더 + nav ---------- */
  TFR.renderMath = function () {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    }
  };

  TFR.CHAPTERS = [
    { no: '01', t: 'RNN의 한계', f: '01.html' },
    { no: '02', t: 'Attention의 직관 1', f: '02.html' },
    { no: '03', t: 'Attention의 직관 2', f: '03.html' },
    { no: '04', t: 'Q·K·V 비유로 먼저', f: '04.html' },
    { no: '05', t: 'Q·K·V 수식 정의', f: '05.html' },
    { no: '06', t: 'Scaled Dot-Product', f: '06.html' },
    { no: '07', t: '왜 √d_k로 나누나', f: '07.html' },
    { no: '08', t: 'Self-Attention', f: '08.html' },
    { no: '09', t: 'Multi-Head 1 — 왜 여럿', f: '09.html' },
    { no: '10', t: 'Multi-Head 2 — 분기·결합', f: '10.html' },
    { no: '11', t: 'Positional Encoding 1', f: '11.html' },
    { no: '12', t: 'Positional Encoding 2', f: '12.html' },
    { no: '13', t: 'Encoder 블록', f: '13.html' },
    { no: '14', t: 'Decoder 블록', f: '14.html' },
    { no: '15', t: '학습과 추론', f: '15.html' },
    { no: '16', t: '시험 대비 핵심', f: '16.html' },
  ];

  TFR.buildNav = function (currentNo) {
    const cur = TFR.CHAPTERS.find(c => c.no === currentNo);
    const tb = document.querySelector('.topbar');
    if (tb) tb.innerHTML =
      `<a class="home" href="index.html">← Transformer 해설</a>` +
      `<span class="ch-mini">CHAPTER ${currentNo} / ${String(TFR.CHAPTERS.length).padStart(2,'0')}</span>`;
    const ol = document.querySelector('.ch-nav ol');
    if (ol) ol.innerHTML = TFR.CHAPTERS.map(c =>
      `<li><a href="${c.f}" ${c.no === currentNo ? 'class="current"' : ''}>${c.no} · ${c.t}</a></li>`).join('');
    const foot = document.querySelector('.ch-foot');
    if (foot && cur) {
      const i = TFR.CHAPTERS.indexOf(cur);
      const prev = i > 0 ? TFR.CHAPTERS[i - 1] : { f: 'index.html', t: '표지로' };
      const next = i < TFR.CHAPTERS.length - 1 ? TFR.CHAPTERS[i + 1] : { f: 'index.html', t: '표지로' };
      foot.innerHTML =
        `<a href="${prev.f}"><div class="dir">← 이전</div><div class="ti">${prev.t}</div></a>` +
        `<a href="${next.f}" class="next"><div class="dir">다음 →</div><div class="ti">${next.t}</div></a>`;
    }
  };

  TFR.initChrome = function () {
    const bar = document.querySelector('.scroll-progress');
    if (bar) {
      const onScroll = () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      };
      document.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  };

  TFR.onVisible = function (el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { rootMargin: '120px' });
    io.observe(el);
  };

  /* ============================================================
     공통 SVG helper
     ============================================================ */
  function svg(w, h, extra) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', `0 0 ${w} ${h}`);
    s.setAttribute('width', '100%');
    s.style.display = 'block';
    s.style.background = C.paper;
    if (extra) Object.assign(s.style, extra);
    return s;
  }
  function el(name, attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function softmax(arr, temp) {
    temp = temp == null ? 1 : temp;
    const m = Math.max.apply(null, arr);
    const ex = arr.map(v => Math.exp((v - m) / temp));
    const s = ex.reduce((a, b) => a + b, 0);
    return ex.map(v => v / s);
  }
  function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  /* ============================================================
     위젯 1 — Attention 가중치 행렬 (hover로 어디를 보는지)
     ============================================================ */
  TFR.attnMatrix = function (root) {
    const tokens = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
    // 미리 정한 attention 가중치 (어휘적 plausibility)
    const W = [
      [0.50, 0.10, 0.05, 0.10, 0.20, 0.05],
      [0.05, 0.40, 0.10, 0.05, 0.05, 0.35],
      [0.10, 0.30, 0.40, 0.05, 0.05, 0.10],
      [0.05, 0.20, 0.10, 0.40, 0.10, 0.15],
      [0.40, 0.05, 0.05, 0.10, 0.30, 0.10],
      [0.05, 0.35, 0.10, 0.10, 0.10, 0.30],
    ];
    root.innerHTML = '';
    const N = tokens.length, cell = 56, pad = 90;
    const Wpx = pad + cell * N + 20, Hpx = pad + cell * N + 60;
    const s = svg(Wpx, Hpx);
    // 열 레이블 (Key)
    tokens.forEach((t, j) => {
      const x = pad + cell * j + cell / 2;
      const tx = el('text', { x, y: pad - 12, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 13, fill: C.key });
      tx.textContent = t; s.appendChild(tx);
    });
    const klab = el('text', { x: pad + cell * N / 2, y: 24, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint, 'letter-spacing': 2 });
    klab.textContent = 'KEY (어디를)'; s.appendChild(klab);
    // 행 레이블 (Query)
    tokens.forEach((t, i) => {
      const y = pad + cell * i + cell / 2 + 5;
      const tx = el('text', { x: pad - 12, y, 'text-anchor': 'end', 'font-family': 'monospace', 'font-size': 13, fill: C.query });
      tx.textContent = t; s.appendChild(tx);
    });
    const qlab = el('text', { x: 18, y: pad + cell * N / 2, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint, transform: `rotate(-90 18 ${pad + cell * N / 2})`, 'letter-spacing': 2 });
    qlab.textContent = 'QUERY (누가 본다)'; s.appendChild(qlab);
    // 셀
    const cells = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const w = W[i][j];
        const x = pad + cell * j, y = pad + cell * i;
        const r = el('rect', {
          x, y, width: cell - 2, height: cell - 2, rx: 4,
          fill: C.value, 'fill-opacity': w, stroke: C.line, 'stroke-width': 0.5,
        });
        const tx = el('text', {
          x: x + cell / 2, y: y + cell / 2 + 4,
          'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 11,
          fill: w > 0.35 ? '#fff' : C.inkSoft,
        });
        tx.textContent = w.toFixed(2);
        r.addEventListener('mouseenter', () => {
          info.textContent = `"${tokens[i]}" (query) → "${tokens[j]}" (key) : 가중치 ${w.toFixed(2)}  =  ${(w * 100).toFixed(0)}%만큼 그 토큰을 참고`;
          // 같은 행 강조
          cells.forEach(c => c.r.setAttribute('stroke', c.i === i ? C.query : C.line));
          cells.forEach(c => c.r.setAttribute('stroke-width', c.i === i ? 2 : 0.5));
        });
        s.appendChild(r); s.appendChild(tx);
        cells.push({ r, i, j });
      }
    }
    root.appendChild(s);
    const info = document.createElement('div');
    info.style.cssText = 'padding:.8rem 1.1rem;font-family:monospace;font-size:.85rem;color:#5A5247;background:rgba(38,34,28,.04);border-top:1px solid rgba(38,34,28,.07);';
    info.textContent = '행렬 칸에 마우스를 올려보세요. 각 행은 "Query 토큰", 각 열은 "Key 토큰"입니다.';
    root.appendChild(info);
  };

  /* ============================================================
     위젯 2 — softmax 분포 (점수 슬라이더 → 확률 분포)
     ============================================================ */
  TFR.softmaxDemo = function (root) {
    root.innerHTML = '';
    const labels = ['고양이', '개', '거북이', '햄스터'];
    const scores = [2.0, 1.0, 0.1, -0.5];
    let temp = 1.0;
    const Wpx = 720, Hpx = 360;
    const s = svg(Wpx, Hpx);
    const barsG = el('g'); s.appendChild(barsG);
    // y axis
    s.appendChild(el('line', { x1: 80, y1: 40, x2: 80, y2: 280, stroke: C.line }));
    s.appendChild(el('line', { x1: 80, y1: 280, x2: 680, y2: 280, stroke: C.line }));
    function redraw() {
      barsG.innerHTML = '';
      const p = softmax(scores, temp);
      labels.forEach((lab, i) => {
        const bw = 120, gap = 30;
        const x = 110 + i * (bw + gap);
        const h = p[i] * 220;
        const rect = el('rect', { x, y: 280 - h, width: bw, height: h, fill: C.value, 'fill-opacity': 0.7, rx: 4 });
        barsG.appendChild(rect);
        const labT = el('text', { x: x + bw / 2, y: 300, 'text-anchor': 'middle', 'font-family': 'system-ui', 'font-size': 13, fill: C.ink });
        labT.textContent = lab; barsG.appendChild(labT);
        const probT = el('text', { x: x + bw / 2, y: 275 - h, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.value });
        probT.textContent = (p[i] * 100).toFixed(1) + '%'; barsG.appendChild(probT);
        const scoreT = el('text', { x: x + bw / 2, y: 320, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 11, fill: C.inkFaint });
        scoreT.textContent = 'score ' + scores[i].toFixed(2); barsG.appendChild(scoreT);
      });
      const tT = el('text', { x: 80, y: 30, 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint });
      tT.textContent = `softmax(score / T = ${temp.toFixed(2)})  ·  합 = 1.00`;
      barsG.appendChild(tT);
    }
    root.appendChild(s);
    const ctrl = document.createElement('div');
    ctrl.className = 'widget-controls';
    ctrl.innerHTML = `
      <div class="slider"><label>점수 1: <span id="v0">${scores[0]}</span></label><input type="range" id="s0" min="-3" max="5" step="0.1" value="${scores[0]}"></div>
      <div class="slider"><label>점수 2: <span id="v1">${scores[1]}</span></label><input type="range" id="s1" min="-3" max="5" step="0.1" value="${scores[1]}"></div>
      <div class="slider"><label>점수 3: <span id="v2">${scores[2]}</span></label><input type="range" id="s2" min="-3" max="5" step="0.1" value="${scores[2]}"></div>
      <div class="slider"><label>점수 4: <span id="v3">${scores[3]}</span></label><input type="range" id="s3" min="-3" max="5" step="0.1" value="${scores[3]}"></div>
      <div class="slider"><label>온도 T: <span id="vt">${temp.toFixed(2)}</span></label><input type="range" id="st" min="0.1" max="3" step="0.05" value="${temp}"></div>`;
    root.appendChild(ctrl);
    for (let i = 0; i < 4; i++) {
      ctrl.querySelector('#s' + i).oninput = e => { scores[i] = parseFloat(e.target.value); ctrl.querySelector('#v' + i).textContent = scores[i].toFixed(2); redraw(); };
    }
    ctrl.querySelector('#st').oninput = e => { temp = parseFloat(e.target.value); ctrl.querySelector('#vt').textContent = temp.toFixed(2); redraw(); };
    redraw();
  };

  /* ============================================================
     위젯 3 — scaled dot-product step-by-step
     ============================================================ */
  TFR.scaledDotStep = function (root) {
    root.innerHTML = '';
    // 작은 예시: 토큰 3개, d_k = 4
    const tokens = ['고양이', '쥐', '치즈'];
    const Q = [[1, 0, 1, 0]]; // 한 query (고양이)
    const K = [
      [1.0, 0.1, 0.9, 0.0], // 고양이
      [0.9, 0.2, 0.8, 0.1], // 쥐
      [0.2, 1.0, 0.1, 0.9], // 치즈
    ];
    const V = [
      [0.8, 0.1, 0.1, 0.0],
      [0.7, 0.6, 0.2, 0.1],
      [0.1, 0.1, 0.9, 0.8],
    ];
    const dk = 4;
    const Wpx = 760, Hpx = 460;
    const s = svg(Wpx, Hpx);
    function fmtV(v) { return '[' + v.map(x => x.toFixed(1)).join(', ') + ']'; }
    // step 1: 점수 = Q · K_i
    const raw = K.map(k => dot(Q[0], k));
    // step 2: 나누기 √d_k
    const scaled = raw.map(x => x / Math.sqrt(dk));
    // step 3: softmax
    const w = softmax(scaled);
    // step 4: 가중합 = Σ w_i V_i
    const out = [0, 0, 0, 0];
    for (let i = 0; i < tokens.length; i++) for (let d = 0; d < 4; d++) out[d] += w[i] * V[i][d];

    function addStep(y, title, body, color) {
      const t = el('text', { x: 20, y, 'font-family': 'monospace', 'font-size': 12, fill: color || C.key, 'font-weight': 700, 'letter-spacing': 2 });
      t.textContent = title; s.appendChild(t);
      const b = el('text', { x: 20, y: y + 22, 'font-family': 'monospace', 'font-size': 13, fill: C.inkSoft });
      b.textContent = body; s.appendChild(b);
    }
    addStep(30, 'STEP 1 — Query · Key (점수 계산)', `Q = ${fmtV(Q[0])}   ·   d_k = 4`, C.query);
    tokens.forEach((tk, i) => {
      const t = el('text', { x: 60, y: 76 + i * 22, 'font-family': 'monospace', 'font-size': 13, fill: C.ink });
      t.textContent = `K_${tk} = ${fmtV(K[i])}  →  Q·K = ${raw[i].toFixed(2)}`; s.appendChild(t);
    });
    addStep(160, 'STEP 2 — √d_k = 2 로 나누기 (분산 안정화)', '', C.value);
    tokens.forEach((tk, i) => {
      const t = el('text', { x: 60, y: 200 + i * 22, 'font-family': 'monospace', 'font-size': 13, fill: C.ink });
      t.textContent = `${raw[i].toFixed(2)} / 2 = ${scaled[i].toFixed(3)}`; s.appendChild(t);
    });
    addStep(280, 'STEP 3 — softmax → 가중치 (합 = 1)', '', C.key);
    tokens.forEach((tk, i) => {
      const t = el('text', { x: 60, y: 320 + i * 22, 'font-family': 'monospace', 'font-size': 13, fill: C.value });
      t.textContent = `w(${tk}) = ${(w[i] * 100).toFixed(1)}%`; s.appendChild(t);
    });
    addStep(410, 'STEP 4 — Σ w_i V_i (가중합 = 최종 출력)', 'out = ' + fmtV(out), C.query);
    root.appendChild(s);
  };

  /* ============================================================
     위젯 4 — Multi-Head 분기 시각화 (heads h개)
     ============================================================ */
  TFR.multiHead = function (root) {
    root.innerHTML = '';
    const tokens = ['The', 'cat', 'sat', 'on', 'mat'];
    const heads = [
      { name: '헤드 1 — 인접 토큰', pattern: 'adj' },
      { name: '헤드 2 — 주어-동사', pattern: 'subjverb' },
      { name: '헤드 3 — 명사구', pattern: 'noun' },
      { name: '헤드 4 — 첫 토큰 참조', pattern: 'first' },
    ];
    function makeMatrix(N, pat) {
      const W = [];
      for (let i = 0; i < N; i++) {
        const r = new Array(N).fill(0);
        if (pat === 'adj') {
          for (let j = 0; j < N; j++) r[j] = Math.exp(-Math.abs(i - j) * 1.2);
        } else if (pat === 'subjverb') {
          // cat ↔ sat 강조
          r[i] = 0.3;
          if (i === 1) r[2] = 0.7; else if (i === 2) r[1] = 0.7; else r[Math.max(0, i - 1)] = 0.5;
        } else if (pat === 'noun') {
          // cat, mat 사이 연결
          r[1] = 0.4; r[4] = 0.4; r[i] = 0.2;
        } else if (pat === 'first') {
          r[0] = 0.7; r[i] = 0.3;
        }
        const sum = r.reduce((a, b) => a + b, 0);
        W.push(r.map(v => v / sum));
      }
      return W;
    }
    const Wpx = 760, Hpx = 380;
    const s = svg(Wpx, Hpx);
    const cell = 28, gap = 30;
    heads.forEach((h, hi) => {
      const W = makeMatrix(tokens.length, h.pattern);
      const x0 = 30 + hi * (cell * tokens.length + gap + 50);
      const y0 = 70;
      const tt = el('text', { x: x0, y: 30, 'font-family': 'monospace', 'font-size': 12, fill: hi % 2 ? C.value : C.key, 'font-weight': 700 });
      tt.textContent = h.name; s.appendChild(tt);
      const col = hi % 2 ? C.value : C.key;
      for (let i = 0; i < tokens.length; i++) {
        for (let j = 0; j < tokens.length; j++) {
          s.appendChild(el('rect', {
            x: x0 + j * cell, y: y0 + i * cell, width: cell - 1, height: cell - 1, rx: 2,
            fill: col, 'fill-opacity': W[i][j], stroke: C.line, 'stroke-width': 0.3,
          }));
        }
      }
      tokens.forEach((tk, i) => {
        const tx = el('text', { x: x0 - 4, y: y0 + i * cell + 14, 'text-anchor': 'end', 'font-family': 'monospace', 'font-size': 9, fill: C.inkFaint });
        tx.textContent = tk; s.appendChild(tx);
      });
    });
    const note = el('text', { x: 30, y: 350, 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint });
    note.textContent = '각 헤드는 같은 입력을 보지만, 서로 다른 종류의 관계를 학습한다 (실제 학습 결과 모사).'; s.appendChild(note);
    root.appendChild(s);
  };

  /* ============================================================
     위젯 5 — Positional Encoding 히트맵
     ============================================================ */
  TFR.positionalEnc = function (root) {
    root.innerHTML = '';
    const seqLen = 50, dModel = 64;
    const Wpx = 760, Hpx = 420;
    const s = svg(Wpx, Hpx);
    const cw = (Wpx - 100) / dModel;
    const ch = (Hpx - 80) / seqLen;
    for (let pos = 0; pos < seqLen; pos++) {
      for (let i = 0; i < dModel; i++) {
        const dim = Math.floor(i / 2);
        const denom = Math.pow(10000, (2 * dim) / dModel);
        const v = (i % 2 === 0) ? Math.sin(pos / denom) : Math.cos(pos / denom);
        // v ∈ [-1, 1] → 색 매핑
        const r = (v + 1) / 2;
        const col = v >= 0 ? `rgba(192,73,46,${r})` : `rgba(45,91,122,${1 - r})`;
        s.appendChild(el('rect', { x: 80 + i * cw, y: 40 + pos * ch, width: cw + 0.4, height: ch + 0.4, fill: col }));
      }
    }
    // 축
    s.appendChild(el('text', { x: Wpx / 2, y: 20, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint })).textContent = 'dimension (i=0..63) — 짝수=sin, 홀수=cos';
    const pl = el('text', { x: 20, y: Hpx / 2, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint, transform: `rotate(-90 20 ${Hpx / 2})` });
    pl.textContent = 'position (0..49)'; s.appendChild(pl);
    // legend
    s.appendChild(el('text', { x: 80, y: Hpx - 12, 'font-family': 'monospace', 'font-size': 11, fill: C.key })).textContent = '파랑 = 음수';
    s.appendChild(el('text', { x: 200, y: Hpx - 12, 'font-family': 'monospace', 'font-size': 11, fill: C.value })).textContent = '주홍 = 양수';
    root.appendChild(s);
  };

  /* ============================================================
     위젯 6 — Encoder 블록 구조도 (interactive)
     ============================================================ */
  TFR.encoderBlock = function (root) {
    root.innerHTML = '';
    const Wpx = 760, Hpx = 540;
    const s = svg(Wpx, Hpx);
    const blocks = [
      { id: 'in',  x: 320, y: 30,  w: 120, h: 40, label: 'Input x', col: C.inkSoft, desc: '이전 층(또는 임베딩+PE)의 출력. shape = (seq_len, d_model).' },
      { id: 'mha', x: 280, y: 100, w: 200, h: 60, label: 'Multi-Head\nSelf-Attention', col: C.query, desc: '같은 입력에서 Q·K·V 세 가지를 모두 뽑고, h개 헤드로 분기해 병렬 attention. 출력 형태는 (seq_len, d_model).' },
      { id: 'add1', x: 320, y: 190, w: 120, h: 40, label: 'Add & Norm', col: C.value, desc: '잔차 연결 — Add: x + MHA(x). LayerNorm — 한 토큰 안에서 평균 0·분산 1로 표준화.' },
      { id: 'ffn', x: 280, y: 260, w: 200, h: 60, label: 'Feed-Forward\nNetwork (FFN)', col: C.key, desc: '2층 MLP: Linear(d_model → d_ff=2048) → ReLU → Linear(d_ff → d_model). 각 토큰 위치마다 같은 가중치로 적용.' },
      { id: 'add2', x: 320, y: 350, w: 120, h: 40, label: 'Add & Norm', col: C.value, desc: '잔차 + LayerNorm 한 번 더.' },
      { id: 'out', x: 320, y: 420, w: 120, h: 40, label: 'Output', col: C.inkSoft, desc: '다음 인코더 블록(또는 디코더의 cross-attention)로 들어가는 (seq_len, d_model) 텐서.' },
    ];
    blocks.forEach((b, i) => {
      const r = el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 8, fill: b.col, 'fill-opacity': 0.15, stroke: b.col, 'stroke-width': 1.5, style: 'cursor:pointer;' });
      r.addEventListener('mouseenter', () => { info.innerHTML = `<b style="color:${b.col}">${b.label.replace('\n', ' ')}</b><br>${b.desc}`; r.setAttribute('fill-opacity', 0.3); });
      r.addEventListener('mouseleave', () => { r.setAttribute('fill-opacity', 0.15); });
      s.appendChild(r);
      const lines = b.label.split('\n');
      lines.forEach((ln, li) => {
        const t = el('text', { x: b.x + b.w / 2, y: b.y + b.h / 2 + (li - (lines.length - 1) / 2) * 16 + 5, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 13, fill: b.col, 'font-weight': 700 });
        t.textContent = ln; s.appendChild(t);
      });
    });
    // 화살표
    for (let i = 0; i < blocks.length - 1; i++) {
      const a = blocks[i], c = blocks[i + 1];
      s.appendChild(el('line', { x1: a.x + a.w / 2, y1: a.y + a.h, x2: c.x + c.w / 2, y2: c.y, stroke: C.inkSoft, 'stroke-width': 1.5, 'marker-end': 'url(#ar)' }));
    }
    // 잔차 화살표 (in → add1, add1 → add2)
    const arr = el('marker', { id: 'ar', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto' });
    arr.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: C.inkSoft })); s.appendChild(arr);
    function residual(fromB, toB) {
      const fx = fromB.x + fromB.w, fy = fromB.y + fromB.h / 2;
      const tx = toB.x + toB.w, ty = toB.y + toB.h / 2;
      const px = 600;
      const path = `M ${fx} ${fy} L ${px} ${fy} L ${px} ${ty} L ${tx} ${ty}`;
      s.appendChild(el('path', { d: path, stroke: C.value, 'stroke-width': 1.5, fill: 'none', 'stroke-dasharray': '6 4', 'marker-end': 'url(#ar)' }));
      const lt = el('text', { x: px + 8, y: (fy + ty) / 2, 'font-family': 'monospace', 'font-size': 11, fill: C.value });
      lt.textContent = '잔차 연결'; s.appendChild(lt);
    }
    residual(blocks[0], blocks[2]);
    residual(blocks[2], blocks[4]);
    root.appendChild(s);
    const info = document.createElement('div');
    info.style.cssText = 'padding:.9rem 1.1rem;font-family:system-ui;font-size:.88rem;color:#5A5247;background:rgba(38,34,28,.04);border-top:1px solid rgba(38,34,28,.07);min-height:3.2em;';
    info.textContent = '각 블록에 마우스를 올리면 역할이 표시됩니다.';
    root.appendChild(info);
  };

  /* ============================================================
     위젯 7 — Decoder masking 행렬
     ============================================================ */
  TFR.decoderMask = function (root) {
    root.innerHTML = '';
    const tokens = ['<s>', 'Je', 'suis', 'étudiant'];
    const N = tokens.length, cell = 64, pad = 100;
    const Wpx = pad + N * cell + 40, Hpx = pad + N * cell + 80;
    const s = svg(Wpx, Hpx);
    // 축 레이블
    tokens.forEach((t, j) => {
      const tx = el('text', { x: pad + cell * j + cell / 2, y: pad - 12, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 13, fill: C.key });
      tx.textContent = t; s.appendChild(tx);
    });
    tokens.forEach((t, i) => {
      const tx = el('text', { x: pad - 12, y: pad + cell * i + cell / 2 + 5, 'text-anchor': 'end', 'font-family': 'monospace', 'font-size': 13, fill: C.query });
      tx.textContent = t; s.appendChild(tx);
    });
    s.appendChild(el('text', { x: pad + cell * N / 2, y: 30, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint, 'letter-spacing': 2 })).textContent = 'KEY (참고할 위치)';
    s.appendChild(el('text', { x: 30, y: pad + cell * N / 2, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint, transform: `rotate(-90 30 ${pad + cell * N / 2})`, 'letter-spacing': 2 })).textContent = 'QUERY (현재 위치)';
    // 셀: i >= j 인 칸만 허용
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const allowed = j <= i;
        const x = pad + cell * j, y = pad + cell * i;
        s.appendChild(el('rect', {
          x, y, width: cell - 2, height: cell - 2, rx: 4,
          fill: allowed ? C.query : '#000',
          'fill-opacity': allowed ? 0.7 : 0.8,
          stroke: C.line,
        }));
        const tx = el('text', {
          x: x + cell / 2, y: y + cell / 2 + 5,
          'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 14,
          fill: '#fff',
        });
        tx.textContent = allowed ? '✓' : '−∞';
        s.appendChild(tx);
      }
    }
    s.appendChild(el('text', { x: pad, y: Hpx - 30, 'font-family': 'monospace', 'font-size': 12, fill: C.query })).textContent = '✓ 허용 — 자기 위치와 과거만';
    s.appendChild(el('text', { x: pad + 260, y: Hpx - 30, 'font-family': 'monospace', 'font-size': 12, fill: C.ink })).textContent = '−∞ 차단 — softmax 후 0';
    root.appendChild(s);
  };

  /* ============================================================
     위젯 8 — 번역 예시 attention (En→Fr)
     ============================================================ */
  TFR.translationAttn = function (root) {
    root.innerHTML = '';
    const en = ['I', 'am', 'a', 'student'];
    const fr = ['Je', 'suis', 'un', 'étudiant'];
    // (cross-attention) 행=fr, 열=en
    const W = [
      [0.80, 0.10, 0.05, 0.05], // Je → I
      [0.15, 0.70, 0.05, 0.10], // suis → am
      [0.05, 0.10, 0.70, 0.15], // un → a
      [0.05, 0.05, 0.15, 0.75], // étudiant → student
    ];
    const Wpx = 760, Hpx = 360;
    const s = svg(Wpx, Hpx);
    // 두 줄에 단어 배치
    const yEn = 80, yFr = 280;
    const x0 = 100, dx = 130;
    en.forEach((w, i) => {
      const x = x0 + i * dx;
      const r = el('rect', { x: x - 50, y: yEn - 22, width: 100, height: 40, rx: 6, fill: C.key, 'fill-opacity': 0.15, stroke: C.key });
      s.appendChild(r);
      const t = el('text', { x, y: yEn + 5, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 16, fill: C.key, 'font-weight': 700 });
      t.textContent = w; s.appendChild(t);
    });
    fr.forEach((w, j) => {
      const x = x0 + j * dx;
      const r = el('rect', { x: x - 55, y: yFr - 22, width: 110, height: 40, rx: 6, fill: C.value, 'fill-opacity': 0.15, stroke: C.value });
      s.appendChild(r);
      const t = el('text', { x, y: yFr + 5, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 16, fill: C.value, 'font-weight': 700 });
      t.textContent = w; s.appendChild(t);
    });
    // 연결선 (가중치만큼 두께·불투명)
    fr.forEach((_, frI) => {
      en.forEach((_, enJ) => {
        const w = W[frI][enJ];
        if (w < 0.05) return;
        const x1 = x0 + frI * dx, y1 = yFr - 22;
        const x2 = x0 + enJ * dx, y2 = yEn + 18;
        s.appendChild(el('line', {
          x1, y1, x2, y2,
          stroke: C.query, 'stroke-width': 1 + w * 8, 'stroke-opacity': 0.3 + w * 0.6,
        }));
      });
    });
    s.appendChild(el('text', { x: 60, y: yEn, 'font-family': 'monospace', 'font-size': 11, fill: C.key })).textContent = 'ENG (Key)';
    s.appendChild(el('text', { x: 60, y: yFr, 'font-family': 'monospace', 'font-size': 11, fill: C.value })).textContent = 'FRA (Query)';
    s.appendChild(el('text', { x: 30, y: 30, 'font-family': 'monospace', 'font-size': 13, fill: C.query, 'font-weight': 700 })).textContent = 'Cross-Attention 가중치 — 디코더 토큰이 인코더 출력의 어디를 보는가';
    s.appendChild(el('text', { x: 30, y: 340, 'font-family': 'monospace', 'font-size': 11, fill: C.inkFaint })).textContent = '선이 굵을수록 가중치가 크다. 어순이 바뀌어도 의미는 정확히 매칭된다.';
    root.appendChild(s);
  };

  /* ============================================================
     위젯 9 — Q·K·V 도서관 비유 그래픽
     ============================================================ */
  TFR.libraryQKV = function (root) {
    root.innerHTML = '';
    const Wpx = 760, Hpx = 420;
    const s = svg(Wpx, Hpx);
    // 사용자 (query)
    const u = el('g'); s.appendChild(u);
    u.appendChild(el('rect', { x: 40, y: 180, width: 140, height: 60, rx: 10, fill: C.query, 'fill-opacity': 0.15, stroke: C.query }));
    const ut = el('text', { x: 110, y: 215, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 14, fill: C.query, 'font-weight': 700 });
    ut.textContent = 'QUERY'; u.appendChild(ut);
    const ut2 = el('text', { x: 110, y: 250, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 11, fill: C.inkFaint });
    ut2.textContent = '"내가 찾는 주제"'; u.appendChild(ut2);
    const ut3 = el('text', { x: 110, y: 162, 'text-anchor': 'middle', 'font-family': 'system-ui', 'font-size': 13, fill: C.ink });
    ut3.textContent = '검색하는 사람'; u.appendChild(ut3);

    // 책장 (key, value 쌍 3개)
    const books = [
      { name: 'A', key: '고양이 키우기', val: '책 #A의 본문 내용', match: 0.9 },
      { name: 'B', key: '강아지 훈련법',   val: '책 #B의 본문 내용', match: 0.3 },
      { name: 'C', key: '고양이 식단',     val: '책 #C의 본문 내용', match: 0.7 },
    ];
    const bx = 320;
    books.forEach((b, i) => {
      const y = 70 + i * 110;
      // key (책 레이블)
      s.appendChild(el('rect', { x: bx, y, width: 180, height: 38, rx: 6, fill: C.key, 'fill-opacity': 0.15, stroke: C.key }));
      const kt = el('text', { x: bx + 10, y: y + 24, 'font-family': 'monospace', 'font-size': 12, fill: C.key, 'font-weight': 700 });
      kt.textContent = `KEY: ${b.key}`; s.appendChild(kt);
      // value (책 본문)
      s.appendChild(el('rect', { x: bx, y: y + 42, width: 180, height: 38, rx: 6, fill: C.value, 'fill-opacity': 0.15, stroke: C.value }));
      const vt = el('text', { x: bx + 10, y: y + 66, 'font-family': 'monospace', 'font-size': 12, fill: C.value, 'font-weight': 700 });
      vt.textContent = `VALUE: ${b.val}`; s.appendChild(vt);
      // 가중치
      const w = b.match;
      const line = el('line', { x1: 180, y1: 210, x2: bx, y2: y + 40, stroke: C.query, 'stroke-width': 1 + w * 5, 'stroke-opacity': 0.3 + w * 0.6 });
      s.appendChild(line);
      const wt = el('text', { x: (180 + bx) / 2, y: (210 + y + 40) / 2 - 6, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.query, 'font-weight': 700 });
      wt.textContent = `유사도 ${(w * 100).toFixed(0)}%`; s.appendChild(wt);
    });
    // 결과
    s.appendChild(el('rect', { x: 570, y: 160, width: 160, height: 100, rx: 8, fill: C.paper2, stroke: C.query, 'stroke-width': 2 }));
    s.appendChild(el('text', { x: 650, y: 190, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 13, fill: C.query, 'font-weight': 700 })).textContent = '결과 = 가중평균';
    s.appendChild(el('text', { x: 650, y: 218, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 11, fill: C.inkSoft })).textContent = '0.9·V_A + 0.3·V_B';
    s.appendChild(el('text', { x: 650, y: 234, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 11, fill: C.inkSoft })).textContent = '+ 0.7·V_C';
    s.appendChild(el('text', { x: 650, y: 252, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 10, fill: C.inkFaint })).textContent = '(softmax 정규화 전)';
    // 화살표
    books.forEach((_, i) => {
      const y = 70 + i * 110 + 60;
      s.appendChild(el('line', { x1: 500, y1: y, x2: 570, y2: 210, stroke: C.value, 'stroke-width': 1, 'stroke-opacity': 0.4 }));
    });
    s.appendChild(el('text', { x: Wpx / 2, y: 30, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 12, fill: C.inkFaint, 'letter-spacing': 2 })).textContent = '도서관 비유 — Query는 검색어, Key는 표지, Value는 본문';
    root.appendChild(s);
  };

  /* ============================================================
     위젯 10 — RNN vs Transformer 처리 방식 (병렬성)
     ============================================================ */
  TFR.rnnVsTransformer = function (root) {
    root.innerHTML = '';
    const Wpx = 760, Hpx = 360;
    const s = svg(Wpx, Hpx);
    const tokens = ['x1', 'x2', 'x3', 'x4', 'x5'];
    // 위쪽 RNN — 직렬
    s.appendChild(el('text', { x: 30, y: 30, 'font-family': 'monospace', 'font-size': 13, fill: C.key, 'font-weight': 700 })).textContent = 'RNN — 한 토큰씩 순차 처리';
    tokens.forEach((t, i) => {
      const x = 50 + i * 130, y = 80;
      s.appendChild(el('rect', { x, y, width: 80, height: 50, rx: 6, fill: C.key, 'fill-opacity': 0.15, stroke: C.key }));
      s.appendChild(el('text', { x: x + 40, y: y + 30, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 13, fill: C.key, 'font-weight': 700 })).textContent = `h_${i + 1}`;
      s.appendChild(el('text', { x: x + 40, y: y - 8, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 10, fill: C.inkFaint })).textContent = t;
      if (i > 0) {
        s.appendChild(el('line', { x1: x - 50, y1: y + 25, x2: x, y2: y + 25, stroke: C.key, 'stroke-width': 2, 'marker-end': 'url(#ar2)' }));
      }
      s.appendChild(el('text', { x: x + 40, y: y + 70, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 10, fill: C.inkFaint })).textContent = `step ${i + 1}`;
    });
    s.appendChild(el('text', { x: 50, y: 170, 'font-family': 'monospace', 'font-size': 11, fill: C.inkSoft })).textContent = '→ 길이 N이면 N step. h_5는 h_1..h_4를 모두 기다려야 함.';

    // 아래쪽 Transformer — 병렬
    s.appendChild(el('text', { x: 30, y: 210, 'font-family': 'monospace', 'font-size': 13, fill: C.value, 'font-weight': 700 })).textContent = 'Transformer — 전체를 한 번에 (병렬)';
    tokens.forEach((t, i) => {
      const x = 50 + i * 130, y = 250;
      s.appendChild(el('rect', { x, y, width: 80, height: 50, rx: 6, fill: C.value, 'fill-opacity': 0.15, stroke: C.value }));
      s.appendChild(el('text', { x: x + 40, y: y + 30, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 13, fill: C.value, 'font-weight': 700 })).textContent = `z_${i + 1}`;
      s.appendChild(el('text', { x: x + 40, y: y - 8, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 10, fill: C.inkFaint })).textContent = t;
      // 모두에서 모두로
      tokens.forEach((_, j) => {
        if (i === j) return;
        const x2 = 50 + j * 130 + 40;
        s.appendChild(el('path', { d: `M ${x + 40} ${y} Q ${(x + 40 + x2) / 2} ${y - 35} ${x2} ${y}`, stroke: C.value, 'stroke-width': 0.6, fill: 'none', 'stroke-opacity': 0.3 }));
      });
    });
    s.appendChild(el('text', { x: 50, y: 340, 'font-family': 'monospace', 'font-size': 11, fill: C.inkSoft })).textContent = '→ 길이와 무관하게 1 step. 모든 토큰이 동시에 모든 토큰을 본다.';
    // 화살표 마커
    const m = el('marker', { id: 'ar2', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' });
    m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: C.key })); s.appendChild(m);
    root.appendChild(s);
  };

  /* ============================================================
     boot
     ============================================================ */
  window.addEventListener('DOMContentLoaded', () => {
    TFR.initChrome();
    setTimeout(() => {
      if (window.renderMathInElement) TFR.renderMath();
      else window.addEventListener('load', TFR.renderMath);
    }, 50);
  });
})();
