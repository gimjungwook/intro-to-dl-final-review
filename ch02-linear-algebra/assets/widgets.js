/* ============================================================
   Ch.02 선형대수 — 공유 인터랙티브 위젯
   ============================================================ */
(function () {
  'use strict';
  const NST = (window.NST = window.NST || {});

  const css = getComputedStyle(document.documentElement);
  const C = {
    paper:     css.getPropertyValue('--paper').trim() || '#FAF7F0',
    paper2:    css.getPropertyValue('--paper-2').trim() || '#F3EEE3',
    ink:       css.getPropertyValue('--ink').trim() || '#26221C',
    inkSoft:   css.getPropertyValue('--ink-soft').trim() || '#5A5247',
    inkFaint:  css.getPropertyValue('--ink-faint').trim() || '#8E8576',
    structure: css.getPropertyValue('--structure').trim() || '#2D5B7A',
    structureLo: css.getPropertyValue('--structure-lo').trim() || '#6E97AF',
    style:     css.getPropertyValue('--style').trim() || '#C0492E',
    styleLo:   css.getPropertyValue('--style-lo').trim() || '#D98E73',
    synth:     css.getPropertyValue('--synth').trim() || '#A47B2E',
  };
  NST.colors = C;

  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

  /* ---------- 프레임워크 ---------- */
  NST.renderMath = function () {
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

  // Ch.02 13개 sub-chapter
  NST.SUBS = [
    { no: '01', t: '왜 선형대수가 필요한가', f: '01.html' },
    { no: '02', t: '스칼라·벡터·행렬·텐서', f: '02.html' },
    { no: '03', t: '점 곱 — 두 벡터의 닮음', f: '03.html' },
    { no: '04', t: '행렬 곱 — 선형 변환', f: '04.html' },
    { no: '05', t: '노름과 거리', f: '05.html' },
    { no: '06', t: '특수 행렬', f: '06.html' },
    { no: '07', t: '선형 의존·랭크·4가지 부분공간', f: '07.html' },
    { no: '08', t: '고유분해 1 — 보존 방향', f: '08.html' },
    { no: '09', t: '고유분해 2 — 대칭과 PCA', f: '09.html' },
    { no: '10', t: 'SVD 1 — 모든 행렬의 분해', f: '10.html' },
    { no: '11', t: 'SVD 2 — 저랭크와 의사역행렬', f: '11.html' },
    { no: '12', t: '행렬 미적분 — 역전파의 다리', f: '12.html' },
    { no: '13', t: '시험 대비 체크리스트', f: '13.html' },
  ];

  NST.buildNav = function (currentNo) {
    const cur = NST.SUBS.find(c => c.no === currentNo);
    const tb = document.querySelector('.topbar');
    if (tb) tb.innerHTML =
      `<a class="home" href="index.html">← Ch.02 표지</a>` +
      `<span class="ch-mini">SUB ${currentNo} / 13</span>`;
    const ol = document.querySelector('.ch-nav ol');
    if (ol) ol.innerHTML = NST.SUBS.map(c =>
      `<li><a href="${c.f}" ${c.no === currentNo ? 'class="current"' : ''}>${c.t}</a></li>`).join('');
    const foot = document.querySelector('.ch-foot');
    if (foot) {
      const i = NST.SUBS.indexOf(cur);
      const prev = i > 0 ? NST.SUBS[i - 1] : { f: 'index.html', t: '표지로', no: '' };
      const next = i < NST.SUBS.length - 1 ? NST.SUBS[i + 1] : { f: 'index.html', t: '표지로', no: '' };
      foot.innerHTML =
        `<a href="${prev.f}"><div class="dir">← 이전</div><div class="ti">${prev.t}</div></a>` +
        `<a href="${next.f}" class="next"><div class="dir">다음 →</div><div class="ti">${next.t}</div></a>`;
    }
  };

  NST.initChrome = function () {
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

  NST.onVisible = function (el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { rootMargin: '120px' });
    io.observe(el);
  };

  /* ============================================================
     공통 캔버스 도우미: 2D 좌표계, 그리드, 화살표
     ============================================================ */
  function setupCanvas(cv, h) {
    function resize() {
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(1, r.width) * devicePixelRatio;
      cv.height = h * devicePixelRatio;
      const ctx = cv.getContext('2d');
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return { resize };
  }
  function drawGrid(ctx, w, h, cx, cy, S) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(38,34,28,0.06)';
    ctx.lineWidth = 1;
    for (let i = -20; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * S, 0); ctx.lineTo(cx + i * S, h);
      ctx.moveTo(0, cy + i * S); ctx.lineTo(w, cy + i * S);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(38,34,28,0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();
  }
  function arrow(ctx, x1, y1, x2, y2, col, lw) {
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineWidth = lw || 2.2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(ang - 0.45), y2 - 10 * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - 10 * Math.cos(ang + 0.45), y2 - 10 * Math.sin(ang + 0.45));
    ctx.closePath(); ctx.fill();
  }

  /* ============================================================
     위젯 1 — 2D 행렬 변환 (회전·스케일·전단 슬라이더)
     ============================================================ */
  NST.matrixTransform = function (root) {
    root.innerHTML = `
      <div class="mt-stage"><canvas></canvas></div>
      <div class="mt-readout">
        <span>행렬 A = <span class="mt-matrix"><b id="mt-a11">1.00</b><b id="mt-a12">0.00</b><b id="mt-a21">0.00</b><b id="mt-a22">1.00</b></span></span>
        <span>det A = <b id="mt-det">1.00</b></span>
      </div>
      <div class="widget-controls">
        <div class="slider"><label>회전 θ <b id="mt-th-v">0°</b></label><input type="range" id="mt-th" min="-90" max="90" value="0" class="s-structure"></div>
        <div class="slider"><label>x 스케일 <b id="mt-sx-v">1.00</b></label><input type="range" id="mt-sx" min="0.2" max="2.5" step="0.05" value="1" class="s-style"></div>
        <div class="slider"><label>y 스케일 <b id="mt-sy-v">1.00</b></label><input type="range" id="mt-sy" min="0.2" max="2.5" step="0.05" value="1" class="s-style"></div>
        <div class="slider"><label>전단(shear) <b id="mt-sh-v">0.00</b></label><input type="range" id="mt-sh" min="-1" max="1" step="0.05" value="0" class="s-synth"></div>
        <button class="btn ghost" id="mt-reset">초기화</button>
      </div>`;
    const cv = root.querySelector('canvas');
    const ctx = cv.getContext('2d');
    setupCanvas(cv, 360);
    const $ = id => root.querySelector('#' + id);
    function draw() {
      const th = +$('mt-th').value * Math.PI / 180;
      const sx = +$('mt-sx').value, sy = +$('mt-sy').value, sh = +$('mt-sh').value;
      const a11 = sx * Math.cos(th) - sh * Math.sin(th);
      const a12 = sh * Math.cos(th) - sx * Math.sin(th);
      const a21 = sx * Math.sin(th);
      const a22 = sy * Math.cos(th);
      const det = a11 * a22 - a12 * a21;
      $('mt-a11').textContent = a11.toFixed(2); $('mt-a12').textContent = a12.toFixed(2);
      $('mt-a21').textContent = a21.toFixed(2); $('mt-a22').textContent = a22.toFixed(2);
      $('mt-det').textContent = det.toFixed(2);
      $('mt-th-v').textContent = $('mt-th').value + '°';
      $('mt-sx-v').textContent = sx.toFixed(2);
      $('mt-sy-v').textContent = sy.toFixed(2);
      $('mt-sh-v').textContent = sh.toFixed(2);

      const w = cv.width / devicePixelRatio, h = 360;
      const cx = w / 2, cy = h / 2, S = 60;
      drawGrid(ctx, w, h, cx, cy, S);

      // 원래 단위 사각형
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(45,91,122,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(cx, cy - S, S, S); ctx.stroke();
      ctx.setLineDash([]);

      // 변환된 사각형
      const v = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const tx = v.map(([x, y]) => [cx + (a11 * x + a12 * y) * S, cy - (a21 * x + a22 * y) * S]);
      ctx.fillStyle = det >= 0 ? 'rgba(192,73,46,0.12)' : 'rgba(164,123,46,0.16)';
      ctx.strokeStyle = det >= 0 ? C.style : C.synth;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(tx[0][0], tx[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(tx[i][0], tx[i][1]);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // 기저
      arrow(ctx, cx, cy, tx[1][0], tx[1][1], C.structure);
      arrow(ctx, cx, cy, tx[3][0], tx[3][1], C.style);

      ctx.font = '12px "Spline Sans Mono", monospace';
      ctx.fillStyle = C.structure; ctx.fillText('Ae₁', tx[1][0] + 6, tx[1][1] + 4);
      ctx.fillStyle = C.style; ctx.fillText('Ae₂', tx[3][0] + 6, tx[3][1] + 4);
      // det
      ctx.fillStyle = C.inkFaint;
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('점선 = 원래 단위 사각형 (넓이 1)', 12, h - 12);
    }
    ['mt-th', 'mt-sx', 'mt-sy', 'mt-sh'].forEach(id => $(id).addEventListener('input', draw));
    $('mt-reset').addEventListener('click', () => {
      $('mt-th').value = 0; $('mt-sx').value = 1; $('mt-sy').value = 1; $('mt-sh').value = 0;
      draw();
    });
    window.addEventListener('resize', draw);
    draw();
  };

  /* ============================================================
     위젯 2 — 점 곱 (두 벡터, 각도 슬라이더)
     ============================================================ */
  NST.dotProduct = function (root) {
    root.innerHTML = `
      <div class="dp-stage"><canvas></canvas></div>
      <div class="dp-readout">
        a = (<b id="dp-ax">1.00</b>, <b id="dp-ay">0.00</b>) · b = (<b id="dp-bx">0.71</b>, <b id="dp-by">0.71</b>)<br>
        a · b = |a| × |b| × cos θ = <span class="dp-num" id="dp-val">0.71</span> · θ = <b id="dp-th">45°</b>
        <div class="dp-bar"><i id="dp-bar" style="width:50%"></i></div>
      </div>
      <div class="widget-controls">
        <div class="slider"><label>벡터 a 각도 <b id="dp-ang1-v">0°</b></label><input type="range" id="dp-ang1" min="0" max="360" value="0" class="s-structure"></div>
        <div class="slider"><label>벡터 b 각도 <b id="dp-ang2-v">45°</b></label><input type="range" id="dp-ang2" min="0" max="360" value="45" class="s-style"></div>
      </div>`;
    const cv = root.querySelector('canvas');
    const ctx = cv.getContext('2d');
    setupCanvas(cv, 320);
    const $ = id => root.querySelector('#' + id);
    function draw() {
      const a1 = +$('dp-ang1').value * Math.PI / 180;
      const a2 = +$('dp-ang2').value * Math.PI / 180;
      const ax = Math.cos(a1), ay = Math.sin(a1);
      const bx = Math.cos(a2), by = Math.sin(a2);
      const dot = ax * bx + ay * by;
      const theta = Math.abs(a2 - a1);
      const thetaDeg = (Math.abs(+$('dp-ang2').value - +$('dp-ang1').value)) % 360;
      const thetaShort = thetaDeg > 180 ? 360 - thetaDeg : thetaDeg;

      $('dp-ax').textContent = ax.toFixed(2); $('dp-ay').textContent = ay.toFixed(2);
      $('dp-bx').textContent = bx.toFixed(2); $('dp-by').textContent = by.toFixed(2);
      $('dp-val').textContent = dot.toFixed(2);
      $('dp-th').textContent = thetaShort.toFixed(0) + '°';
      $('dp-ang1-v').textContent = $('dp-ang1').value + '°';
      $('dp-ang2-v').textContent = $('dp-ang2').value + '°';
      $('dp-bar').style.width = (50 + dot * 50) + '%';
      $('dp-bar').style.background = dot >= 0
        ? `linear-gradient(90deg, var(--structure), var(--style))`
        : `linear-gradient(90deg, var(--style), var(--ink-faint))`;

      const w = cv.width / devicePixelRatio, h = 320;
      const cx = w / 2, cy = h / 2, S = 100;
      drawGrid(ctx, w, h, cx, cy, S);

      // 점 곱이 양수면 색 채움
      if (dot > 0.05) {
        ctx.fillStyle = 'rgba(45,91,122,0.08)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const startAng = Math.min(-a1, -a2);
        const endAng = Math.max(-a1, -a2);
        ctx.arc(cx, cy, 32, startAng, endAng);
        ctx.closePath(); ctx.fill();
      }

      arrow(ctx, cx, cy, cx + ax * S, cy - ay * S, C.structure, 2.6);
      arrow(ctx, cx, cy, cx + bx * S, cy - by * S, C.style, 2.6);

      ctx.font = '13px "Spline Sans Mono", monospace';
      ctx.fillStyle = C.structure;
      ctx.fillText('a', cx + ax * S + 8, cy - ay * S + 4);
      ctx.fillStyle = C.style;
      ctx.fillText('b', cx + bx * S + 8, cy - by * S + 4);
      ctx.fillStyle = C.inkSoft;
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('|a|=|b|=1 단위벡터', 12, h - 12);
    }
    ['dp-ang1', 'dp-ang2'].forEach(id => $(id).addEventListener('input', draw));
    window.addEventListener('resize', draw);
    draw();
  };

  /* ============================================================
     위젯 3 — L1·L2·L∞ 단위구
     ============================================================ */
  NST.normBalls = function (root) {
    root.innerHTML = `
      <div class="norm-stage"><canvas></canvas></div>
      <div class="norm-pick">
        <button class="btn ghost on" data-n="2">L2 (유클리드)</button>
        <button class="btn ghost" data-n="1">L1 (맨해튼)</button>
        <button class="btn ghost" data-n="inf">L∞ (최댓값)</button>
        <button class="btn ghost" data-n="all">셋 다 겹쳐 보기</button>
      </div>
      <div class="norm-readout" id="norm-rd">단위구 = ‖x‖ = 1을 만족하는 모든 점의 집합. 노름이 다르면 “크기 1”이 다른 모양이 된다.</div>`;
    const cv = root.querySelector('canvas');
    const ctx = cv.getContext('2d');
    setupCanvas(cv, 360);
    let pick = '2';
    const buttons = root.querySelectorAll('.norm-pick .btn');
    buttons.forEach(b => b.addEventListener('click', () => {
      buttons.forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      pick = b.dataset.n;
      const rd = root.querySelector('#norm-rd');
      const txt = {
        '2': 'L2 노름 = √(x₁² + x₂²). 원이 단위구. 거리·길이의 가장 흔한 정의. 모든 방향을 평등하게 본다.',
        '1': 'L1 노름 = |x₁| + |x₂|. 마름모(다이아몬드)가 단위구. 축 위의 점이 가장 “자원이 적게 든다”. → Ch.7 라쏘(Lasso) 정칙화의 근거.',
        'inf': 'L∞ 노름 = max(|x₁|, |x₂|). 정사각형이 단위구. 가장 큰 성분 하나가 크기를 결정.',
        'all': '세 단위구를 겹쳐 보면 L1 ⊂ L2 ⊂ L∞ 관계가 한눈에 보인다. 같은 점이라도 노름이 다르면 측정된 크기가 다르다.'
      }[pick];
      rd.textContent = txt;
      draw();
    }));
    function draw() {
      const w = cv.width / devicePixelRatio, h = 360;
      const cx = w / 2, cy = h / 2, S = 100;
      drawGrid(ctx, w, h, cx, cy, S);
      function drawCircle() {
        ctx.strokeStyle = C.structure; ctx.lineWidth = 2.4;
        ctx.fillStyle = 'rgba(45,91,122,0.08)';
        ctx.beginPath(); ctx.arc(cx, cy, S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      }
      function drawDiamond() {
        ctx.strokeStyle = C.style; ctx.lineWidth = 2.4;
        ctx.fillStyle = 'rgba(192,73,46,0.08)';
        ctx.beginPath();
        ctx.moveTo(cx + S, cy);
        ctx.lineTo(cx, cy - S);
        ctx.lineTo(cx - S, cy);
        ctx.lineTo(cx, cy + S);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      function drawSquare() {
        ctx.strokeStyle = C.synth; ctx.lineWidth = 2.4;
        ctx.fillStyle = 'rgba(164,123,46,0.08)';
        ctx.beginPath();
        ctx.rect(cx - S, cy - S, 2 * S, 2 * S);
        ctx.fill(); ctx.stroke();
      }
      if (pick === '2') drawCircle();
      else if (pick === '1') drawDiamond();
      else if (pick === 'inf') drawSquare();
      else { drawSquare(); drawCircle(); drawDiamond(); }

      ctx.font = '12px "Spline Sans Mono", monospace';
      ctx.fillStyle = C.structure; ctx.fillText('L2', cx + S * 0.7, cy - S * 0.7);
      if (pick !== '2' && pick !== 'inf') { ctx.fillStyle = C.style; ctx.fillText('L1', cx + S * 0.5, cy - S * 0.4); }
      if (pick !== '2' && pick !== '1') { ctx.fillStyle = C.synth; ctx.fillText('L∞', cx + S * 0.9, cy - S * 0.9); }
      ctx.fillStyle = C.inkFaint;
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('단위구 = ‖x‖ = 1 을 만족하는 점들', 12, h - 12);
    }
    window.addEventListener('resize', draw);
    draw();
  };

  /* ============================================================
     위젯 4 — 고유벡터 찾기 (캔버스 클릭)
     ============================================================ */
  NST.eigenFinder = function (root) {
    root.innerHTML = `
      <div class="ev-stage"><canvas></canvas></div>
      <div class="ev-readout" id="ev-rd">캔버스의 점을 클릭(또는 드래그)해 보세요. 클릭한 방향의 벡터 v(파란 점선)와 A·v(빨강)을 그립니다. <b>두 화살표가 평행이면 v가 고유벡터입니다.</b></div>
      <div class="widget-controls">
        <button class="btn ghost" data-m="1">행렬 1 — 회전+스케일 (실수 고유 없음)</button>
        <button class="btn ghost on" data-m="2">행렬 2 — 대각 (축이 고유)</button>
        <button class="btn ghost" data-m="3">행렬 3 — 대칭 (직교 고유)</button>
      </div>`;
    const cv = root.querySelector('canvas');
    const ctx = cv.getContext('2d');
    setupCanvas(cv, 380);
    const matrices = {
      '1': [[Math.cos(0.6), -Math.sin(0.6) * 1.2], [Math.sin(0.6), Math.cos(0.6) * 1.2]],
      '2': [[2, 0], [0, 0.6]],
      '3': [[1.5, 0.7], [0.7, 1.5]],
    };
    let pick = '2';
    let v = [1, 0.3];
    const buttons = root.querySelectorAll('.widget-controls .btn');
    buttons.forEach(b => b.addEventListener('click', () => {
      buttons.forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      pick = b.dataset.m; draw();
    }));
    function draw() {
      const w = cv.width / devicePixelRatio, h = 380;
      const cx = w / 2, cy = h / 2, S = 80;
      drawGrid(ctx, w, h, cx, cy, S);
      const A = matrices[pick];
      const Av = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];

      const nv = Math.hypot(v[0], v[1]) || 1;
      const nAv = Math.hypot(Av[0], Av[1]) || 1;
      const cosA = (v[0] * Av[0] + v[1] * Av[1]) / (nv * nAv);
      const isParallel = Math.abs(Math.abs(cosA) - 1) < 0.02;

      // v (점선)
      ctx.setLineDash([5, 4]);
      arrow(ctx, cx, cy, cx + v[0] * S, cy - v[1] * S, C.structure, 2.2);
      ctx.setLineDash([]);
      // Av
      arrow(ctx, cx, cy, cx + Av[0] * S, cy - Av[1] * S, isParallel ? C.synth : C.style, 2.8);

      ctx.font = '13px "Spline Sans Mono", monospace';
      ctx.fillStyle = C.structure; ctx.fillText('v', cx + v[0] * S + 6, cy - v[1] * S + 4);
      ctx.fillStyle = isParallel ? C.synth : C.style;
      ctx.fillText('A·v', cx + Av[0] * S + 6, cy - Av[1] * S + 4);

      // 고유 여부 안내
      const rd = root.querySelector('#ev-rd');
      const lambda = (v[0] * Av[0] + v[1] * Av[1]) / (v[0] * v[0] + v[1] * v[1]);
      if (isParallel) {
        rd.innerHTML = `<span class="ev-hit">✓ 고유벡터 발견!</span> v 방향이 변환 후에도 그대로. 고유값 λ ≈ <b>${lambda.toFixed(2)}</b> (벡터가 ${lambda > 0 ? '늘어남' : '뒤집힘'}).`;
      } else {
        rd.innerHTML = `<span class="ev-miss">아직 평행 아님.</span> 두 화살표 사이 각도 cos θ ≈ ${cosA.toFixed(2)}. 다른 방향을 클릭해 보세요.`;
      }

      // 표시: 정답 고유벡터 (옅게)
      const eigs = computeEigen(A);
      eigs.forEach(([λ, ex, ey]) => {
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(164,123,46,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - ex * 200, cy + ey * 200);
        ctx.lineTo(cx + ex * 200, cy - ey * 200);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.fillStyle = C.inkFaint;
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('황토색 점선 = 정답 고유 방향(있다면)', 12, h - 12);
    }
    function computeEigen(A) {
      const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
      const tr = a + d, det = a * d - b * c;
      const disc = tr * tr / 4 - det;
      if (disc < 0) return [];
      const sq = Math.sqrt(disc);
      const λ1 = tr / 2 + sq, λ2 = tr / 2 - sq;
      function eigvec(λ) {
        // (A - λI) v = 0
        const m1 = a - λ, m2 = b;
        let ex, ey;
        if (Math.abs(m2) > 1e-6) { ex = m2; ey = -m1; }
        else { ex = 1; ey = 0; }
        const n = Math.hypot(ex, ey);
        return [λ, ex / n, ey / n];
      }
      return [eigvec(λ1), eigvec(λ2)];
    }
    function setFromEvent(e) {
      const r = cv.getBoundingClientRect();
      const cx = r.width / 2, cy = 380 / 2, S = 80;
      const xp = (e.clientX - r.left) - cx;
      const yp = (e.clientY - r.top) - cy;
      v = [xp / S, -yp / S];
      draw();
    }
    cv.addEventListener('mousedown', setFromEvent);
    cv.addEventListener('mousemove', e => { if (e.buttons & 1) setFromEvent(e); });
    cv.addEventListener('touchstart', e => { e.preventDefault(); setFromEvent(e.touches[0]); });
    cv.addEventListener('touchmove', e => { e.preventDefault(); setFromEvent(e.touches[0]); });
    window.addEventListener('resize', draw);
    draw();
  };

  /* ============================================================
     위젯 5 — SVD 저랭크 근사 (이미지 σ 슬라이더)
     ============================================================ */
  NST.svdLowRank = function (root) {
    const N = 48; // 이미지 크기
    root.innerHTML = `
      <div class="svd-stage">
        <div class="svd-col"><canvas id="svd-orig" width="${N}" height="${N}"></canvas><span>원본 (랭크 ${N})</span></div>
        <div class="svd-col"><canvas id="svd-rec" width="${N}" height="${N}"></canvas><span>랭크 <b id="svd-k">5</b> 근사</span></div>
      </div>
      <div class="svd-bar" id="svd-bar"></div>
      <div class="svd-readout">
        보존된 특이값 비율 = <b id="svd-energy">—</b> · 압축률 = <b id="svd-comp">—</b><br>
        σ가 큰 순서로 k개만 남기면 “주요 구조”만 살아남고 디테일은 사라진다. 이것이 PCA·이미지 압축·노이즈 제거의 뿌리.
      </div>
      <div class="widget-controls">
        <div class="slider"><label>유지할 랭크 k <b id="svd-k-v">5</b></label><input type="range" id="svd-k-in" min="1" max="${N}" value="5" class="s-style"></div>
      </div>`;
    const orig = root.querySelector('#svd-orig'), rec = root.querySelector('#svd-rec');
    const cOrig = orig.getContext('2d'), cRec = rec.getContext('2d');
    // 합성 이미지: 격자 + 큰 원 + 가는 선 (저주파+고주파 섞임)
    let M = [];
    for (let i = 0; i < N; i++) {
      M[i] = [];
      for (let j = 0; j < N; j++) {
        const di = i - N / 2, dj = j - N / 2;
        const r = Math.hypot(di, dj);
        let v = 0;
        v += r < N * 0.32 ? 0.7 : 0.2;   // 큰 원
        v += 0.15 * Math.sin(i * 0.7);   // 가로 줄
        v += 0.08 * Math.sin(j * 1.3);   // 세로 줄
        v += (Math.abs(di - dj) < 1) ? 0.3 : 0;  // 대각선
        M[i][j] = clamp(v, 0, 1);
      }
    }
    // 이미지 그리기
    function paint(canvas, ctx, A) {
      const img = ctx.createImageData(N, N);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const g = Math.round(clamp(A[i][j], 0, 1) * 255);
        const p = (i * N + j) * 4;
        img.data[p] = g; img.data[p + 1] = g; img.data[p + 2] = g; img.data[p + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    // 간단 SVD (Jacobi-power): NxN 작은 행렬용
    function transpose(A) {
      const n = A.length, m = A[0].length;
      const T = Array(m).fill(0).map(() => Array(n).fill(0));
      for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) T[j][i] = A[i][j];
      return T;
    }
    function matmul(A, B) {
      const n = A.length, m = B[0].length, k = B.length;
      const R = Array(n).fill(0).map(() => Array(m).fill(0));
      for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
        let s = 0; for (let l = 0; l < k; l++) s += A[i][l] * B[l][j];
        R[i][j] = s;
      }
      return R;
    }
    // power iteration으로 상위 K singular triplets
    function topSVD(A, K) {
      const n = A.length, m = A[0].length;
      let Aw = A.map(r => r.slice());
      const us = [], ss = [], vs = [];
      for (let k = 0; k < K; k++) {
        // random init
        let v = Array(m).fill(0).map(() => Math.random() - 0.5);
        for (let iter = 0; iter < 50; iter++) {
          // u = A v / |A v|
          const Av = Array(n).fill(0);
          for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < m; j++) s += Aw[i][j] * v[j]; Av[i] = s; }
          let nu = Math.hypot(...Av); if (nu < 1e-12) break;
          const u = Av.map(x => x / nu);
          // v = Aᵀ u / |Aᵀ u|
          const ATu = Array(m).fill(0);
          for (let j = 0; j < m; j++) { let s = 0; for (let i = 0; i < n; i++) s += Aw[i][j] * u[i]; ATu[j] = s; }
          let nv = Math.hypot(...ATu); if (nv < 1e-12) break;
          v = ATu.map(x => x / nv);
        }
        // σ
        const Av2 = Array(n).fill(0);
        for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < m; j++) s += Aw[i][j] * v[j]; Av2[i] = s; }
        const sigma = Math.hypot(...Av2);
        if (sigma < 1e-9) break;
        const u = Av2.map(x => x / sigma);
        us.push(u); ss.push(sigma); vs.push(v);
        // deflate
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) Aw[i][j] -= sigma * u[i] * v[j];
      }
      return { us, ss, vs };
    }
    paint(orig, cOrig, M);
    const KMAX = Math.min(N, 30);
    const { us, ss, vs } = topSVD(M, KMAX);
    const totalEnergy = ss.reduce((a, b) => a + b * b, 0);
    // bar
    const barEl = root.querySelector('#svd-bar');
    for (let i = 0; i < KMAX; i++) {
      const b = document.createElement('i'); b.style.flex = (Math.max(ss[i], 0.01)) + '';
      barEl.appendChild(b);
    }
    function update() {
      const k = +root.querySelector('#svd-k-in').value;
      const eff = Math.min(k, KMAX);
      // 재구성
      const A = Array(N).fill(0).map(() => Array(N).fill(0));
      for (let t = 0; t < eff; t++) {
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          A[i][j] += ss[t] * us[t][i] * vs[t][j];
        }
      }
      paint(rec, cRec, A);
      const energy = ss.slice(0, eff).reduce((a, b) => a + b * b, 0) / totalEnergy;
      root.querySelector('#svd-k').textContent = k;
      root.querySelector('#svd-k-v').textContent = k;
      root.querySelector('#svd-energy').textContent = (energy * 100).toFixed(1) + '%';
      const orig_bytes = N * N;
      const k_bytes = k * (N + N + 1);
      root.querySelector('#svd-comp').textContent = ((1 - k_bytes / orig_bytes) * 100).toFixed(0) + '% 절감';
      // bar 색
      barEl.querySelectorAll('i').forEach((b, i) => {
        b.className = i < eff ? 'on' : 'off';
      });
    }
    root.querySelector('#svd-k-in').max = KMAX;
    root.querySelector('#svd-k-in').addEventListener('input', update);
    update();
  };

  /* ============================================================
     위젯 6 — 4가지 부분공간 시각화
     ============================================================ */
  NST.fourSubspaces = function (root) {
    root.innerHTML = `
      <div class="fs-stage"><canvas></canvas></div>
      <div class="fs-pick">
        <button class="btn ghost on" data-s="col">열공간 (Col A)</button>
        <button class="btn ghost" data-s="row">행공간 (Row A)</button>
        <button class="btn ghost" data-s="null">영공간 (Null A)</button>
        <button class="btn ghost" data-s="lnull">좌영공간 (Null Aᵀ)</button>
      </div>
      <div class="fs-readout" id="fs-rd">
        예시 행렬 A = [[1, 2], [2, 4]]. 두 행/열이 비례 → 랭크 1.<br>
        열공간 = (1,2) 방향 직선. 영공간 = (2,-1) 방향 직선. 둘은 서로 수직.
      </div>`;
    const cv = root.querySelector('canvas');
    const ctx = cv.getContext('2d');
    setupCanvas(cv, 380);
    let pick = 'col';
    const buttons = root.querySelectorAll('.fs-pick .btn');
    buttons.forEach(b => b.addEventListener('click', () => {
      buttons.forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      pick = b.dataset.s;
      const rd = root.querySelector('#fs-rd');
      const txt = {
        'col': '열공간 Col A — A의 열벡터가 만드는 공간. Ax가 만들 수 있는 모든 출력. 여기서는 (1,2) 방향 직선(주황). 차원 = 랭크 = 1.',
        'row': '행공간 Row A — A의 행벡터가 만드는 공간. (1,2) 방향 직선(파랑). 열공간과 차원은 같지만 입력 측 공간.',
        'null': '영공간 Null A — Ax = 0이 되는 x의 집합. (2,-1) 방향 직선(보라). 행공간과 수직. 입력 측 “버려지는 방향”.',
        'lnull': '좌영공간 Null Aᵀ — Aᵀy = 0인 y. (2,-1) 방향 직선(녹색). 열공간과 수직. 출력 측 “도달 불가 방향”.',
      }[pick];
      rd.textContent = txt;
      draw();
    }));
    function draw() {
      const w = cv.width / devicePixelRatio, h = 380;
      const cx = w / 2, cy = h / 2, S = 60;
      drawGrid(ctx, w, h, cx, cy, S);

      // A = [[1,2],[2,4]] 가정
      // 열공간: (1,2) 직선
      // 행공간: (1,2) 직선 (이 예시에선 동일 방향)
      // 영공간: (2,-1) 직선
      // 좌영공간: (2,-1) 직선

      function drawLine(dx, dy, col, label, dash) {
        ctx.setLineDash(dash || []);
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        const n = Math.hypot(dx, dy);
        const ux = dx / n, uy = dy / n;
        ctx.beginPath();
        ctx.moveTo(cx - ux * 300, cy + uy * 300);
        ctx.lineTo(cx + ux * 300, cy - uy * 300);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = col;
        ctx.font = '13px "Spline Sans Mono", monospace';
        ctx.fillText(label, cx + ux * S * 2 + 6, cy - uy * S * 2 + 4);
      }
      // 옅게 모두 표시
      ctx.globalAlpha = 0.2;
      drawLine(1, 2, C.structure, '', []);
      drawLine(2, -1, C.style, '', []);
      ctx.globalAlpha = 1.0;

      // 선택된 것만 강조
      if (pick === 'col') drawLine(1, 2, C.style, 'Col A: (1,2)t', []);
      else if (pick === 'row') drawLine(1, 2, C.structure, 'Row A: (1,2)t', []);
      else if (pick === 'null') drawLine(2, -1, '#8E5BA5', 'Null A: (2,-1)t', []);
      else if (pick === 'lnull') drawLine(2, -1, '#4F8A4F', 'Null Aᵀ: (2,-1)t', []);

      // 행렬 표기
      ctx.fillStyle = C.inkFaint;
      ctx.font = '12px "Spline Sans Mono", monospace';
      ctx.fillText('A = [[1, 2], [2, 4]] · rank(A) = 1', 12, 22);
      ctx.fillText('Col A ⊥ Null Aᵀ · Row A ⊥ Null A', 12, h - 12);
    }
    window.addEventListener('resize', draw);
    draw();
  };

  /* ============================================================
     위젯 7 — 단위 사각형 변환 (a,b,c,d 직접 입력)
     ============================================================ */
  NST.unitSquare = function (root) {
    root.innerHTML = `
      <div class="us-stage"><canvas></canvas></div>
      <div class="us-grid">
        <div class="slider"><label>a (좌상) <b id="us-a-v">1.0</b></label><input type="range" id="us-a" min="-2" max="2" step="0.1" value="1" class="s-structure"></div>
        <div class="slider"><label>b (우상) <b id="us-b-v">0.0</b></label><input type="range" id="us-b" min="-2" max="2" step="0.1" value="0" class="s-style"></div>
        <div class="slider"><label>c (좌하) <b id="us-c-v">0.0</b></label><input type="range" id="us-c" min="-2" max="2" step="0.1" value="0" class="s-structure"></div>
        <div class="slider"><label>d (우하) <b id="us-d-v">1.0</b></label><input type="range" id="us-d" min="-2" max="2" step="0.1" value="1" class="s-style"></div>
      </div>
      <div class="us-readout">
        A = [[<b id="us-aa">1.0</b>, <b id="us-bb">0.0</b>], [<b id="us-cc">0.0</b>, <b id="us-dd">1.0</b>]] · 넓이 |det A| = <b id="us-det">1.00</b>
        <br><span id="us-comment" style="color:var(--style)"></span>
      </div>
      <div class="widget-controls">
        <button class="btn ghost" data-p="I">단위행렬 I</button>
        <button class="btn ghost" data-p="rot">회전 60°</button>
        <button class="btn ghost" data-p="sca">스케일 2x</button>
        <button class="btn ghost" data-p="shr">전단</button>
        <button class="btn ghost" data-p="ref">반사</button>
        <button class="btn ghost" data-p="sin">특이(랭크 1)</button>
      </div>`;
    const cv = root.querySelector('canvas');
    const ctx = cv.getContext('2d');
    setupCanvas(cv, 360);
    const $ = id => root.querySelector('#' + id);
    function setM(a, b, c, d) {
      $('us-a').value = a; $('us-b').value = b; $('us-c').value = c; $('us-d').value = d;
      draw();
    }
    const presets = {
      'I': () => setM(1, 0, 0, 1),
      'rot': () => setM(0.5, -0.866, 0.866, 0.5),
      'sca': () => setM(2, 0, 0, 2),
      'shr': () => setM(1, 1, 0, 1),
      'ref': () => setM(1, 0, 0, -1),
      'sin': () => setM(1, 2, 2, 4),
    };
    root.querySelectorAll('.widget-controls .btn').forEach(b =>
      b.addEventListener('click', () => presets[b.dataset.p]()));
    function draw() {
      const a = +$('us-a').value, b = +$('us-b').value, c = +$('us-c').value, d = +$('us-d').value;
      const det = a * d - b * c;
      $('us-a-v').textContent = a.toFixed(1); $('us-b-v').textContent = b.toFixed(1);
      $('us-c-v').textContent = c.toFixed(1); $('us-d-v').textContent = d.toFixed(1);
      $('us-aa').textContent = a.toFixed(1); $('us-bb').textContent = b.toFixed(1);
      $('us-cc').textContent = c.toFixed(1); $('us-dd').textContent = d.toFixed(1);
      $('us-det').textContent = Math.abs(det).toFixed(2);

      let comment = '';
      if (Math.abs(det) < 0.01) comment = '⚠ det ≈ 0: 행렬이 “찌부러져” 평행사변형이 선분이 됨. 역행렬 없음.';
      else if (det < 0) comment = 'det < 0: 방향이 뒤집힘(반사 포함).';
      else if (Math.abs(det - 1) < 0.01) comment = 'det ≈ 1: 넓이 보존. 회전·전단 같은 변환.';
      else comment = `det = ${det.toFixed(2)}: 넓이가 ${Math.abs(det).toFixed(2)}배가 됨.`;
      $('us-comment').textContent = comment;

      const w = cv.width / devicePixelRatio, h = 360;
      const cx = w / 2, cy = h / 2, S = 65;
      drawGrid(ctx, w, h, cx, cy, S);

      // 원래
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(38,34,28,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(cx, cy - S, S, S); ctx.stroke();
      ctx.setLineDash([]);

      // 변환된
      const v = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const tx = v.map(([x, y]) => [cx + (a * x + b * y) * S, cy - (c * x + d * y) * S]);
      ctx.fillStyle = det >= 0 ? 'rgba(192,73,46,0.14)' : 'rgba(164,123,46,0.18)';
      ctx.strokeStyle = det >= 0 ? C.style : C.synth;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(tx[0][0], tx[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(tx[i][0], tx[i][1]);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      arrow(ctx, cx, cy, tx[1][0], tx[1][1], C.structure);
      arrow(ctx, cx, cy, tx[3][0], tx[3][1], C.style);

      ctx.font = '12px "Spline Sans Mono", monospace';
      ctx.fillStyle = C.structure; ctx.fillText('Ae₁=(a,c)', tx[1][0] + 6, tx[1][1] + 4);
      ctx.fillStyle = C.style; ctx.fillText('Ae₂=(b,d)', tx[3][0] + 6, tx[3][1] + 4);
    }
    ['us-a', 'us-b', 'us-c', 'us-d'].forEach(id => $(id).addEventListener('input', draw));
    window.addEventListener('resize', draw);
    draw();
  };

  /* ============================================================
     Q&A 아코디언
     ============================================================ */
  NST.accordion = function (root) {
    root = root || document;
    root.querySelectorAll('.qa').forEach(q => {
      const head = q.querySelector('.qa-q');
      head.addEventListener('click', () => q.classList.toggle('open'));
    });
  };

  /* ============================================================
     초기화
     ============================================================ */
  function init() {
    NST.initChrome();
    NST.accordion();
    if (window.renderMathInElement) NST.renderMath();
    else window.addEventListener('load', NST.renderMath);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // KaTeX auto-render
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (window.renderMathInElement) NST.renderMath(); }, 0);
  });
  window.addEventListener('load', () => {
    setTimeout(() => { if (window.renderMathInElement) NST.renderMath(); }, 0);
  });
})();
