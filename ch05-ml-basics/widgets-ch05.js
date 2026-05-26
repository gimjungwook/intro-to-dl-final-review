/* ============================================================
   Ch.5 Machine Learning Basics — 챕터 전용 위젯
   디자인 시스템은 ../assets/site.css 와 ../assets/widgets.js 의
   토큰/유틸리티를 그대로 따른다. 여기서는 Ch.5 고유 위젯과
   NST.CHAPTERS 재정의 (이 챕터 안의 sub-chapter 목차)만 추가한다.
   ============================================================ */
(function () {
  'use strict';
  if (!window.NST) window.NST = {};
  const NST = window.NST;

  // Ch.5 sub-chapter 목차로 NST.CHAPTERS 를 override
  NST.CHAPTERS = [
    { no: '01', t: '학습 알고리즘의 정의 (T·P·E)', f: '01.html' },
    { no: '02', t: '용량·과적합·과소적합', f: '02.html' },
    { no: '03', t: '편향-분산 분해', f: '03.html' },
    { no: '04', t: '최대우도 추정 (MLE)', f: '04.html' },
    { no: '05', t: '베이지안 추정과 MAP', f: '05.html' },
    { no: '06', t: '정칙화 — 가중치 감쇠', f: '06.html' },
    { no: '07', t: '시험 대비 — Q&A · 체크리스트', f: '07.html' },
  ];

  // buildNav 를 ch05 전용으로 재정의 (상위 home 링크가 ch05 표지)
  NST.buildNav = function (currentNo) {
    const cur = NST.CHAPTERS.find(c => c.no === currentNo);
    const tb = document.querySelector('.topbar');
    if (tb) tb.innerHTML =
      `<a class="home" href="index.html">← Ch.5 기계학습 기초</a>` +
      `<span class="ch-mini">SECTION ${currentNo} / 07</span>`;
    const ol = document.querySelector('.ch-nav ol');
    if (ol) ol.innerHTML = NST.CHAPTERS.map(c =>
      `<li><a href="${c.f}" ${c.no === currentNo ? 'class="current"' : ''}>${c.t}</a></li>`).join('');
    const foot = document.querySelector('.ch-foot');
    if (foot) {
      const i = NST.CHAPTERS.indexOf(cur);
      const prev = i > 0 ? NST.CHAPTERS[i - 1] : { f: 'index.html', t: '표지로', no: '' };
      const next = i < NST.CHAPTERS.length - 1 ? NST.CHAPTERS[i + 1] : { f: 'index.html', t: '표지로', no: '' };
      foot.innerHTML =
        `<a href="${prev.f}"><div class="dir">← 이전</div><div class="ti">${prev.t}</div></a>` +
        `<a href="${next.f}" class="next"><div class="dir">다음 →</div><div class="ti">${next.t}</div></a>`;
    }
  };

  // ---------------- 유틸 ----------------
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function gaussian(m, s) {
    // Box-Muller
    const u = 1 - Math.random(), v = Math.random();
    return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  // 결정적 시드 RNG (위젯 재현성)
  function seeded(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function seededGaussian(rng) {
    const u = 1 - rng(), v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // 색
  const css = getComputedStyle(document.documentElement);
  const C = {
    paper: css.getPropertyValue('--paper').trim() || '#FAF7F0',
    paper2: css.getPropertyValue('--paper-2').trim() || '#F3EEE3',
    ink: css.getPropertyValue('--ink').trim() || '#26221C',
    inkSoft: css.getPropertyValue('--ink-soft').trim() || '#5A5247',
    inkFaint: css.getPropertyValue('--ink-faint').trim() || '#8E8576',
    structure: css.getPropertyValue('--structure').trim() || '#2D5B7A',
    structureLo: css.getPropertyValue('--structure-lo').trim() || '#6E97AF',
    style: css.getPropertyValue('--style').trim() || '#C0492E',
    styleLo: css.getPropertyValue('--style-lo').trim() || '#D98E73',
    synth: css.getPropertyValue('--synth').trim() || '#A47B2E',
  };

  // 캔버스용 축 그리기 헬퍼
  function drawAxes(ctx, W, H, opts) {
    opts = opts || {};
    const padL = opts.padL || 38, padR = opts.padR || 14, padT = opts.padT || 14, padB = opts.padB || 28;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = 'rgba(38,34,28,.06)'; ctx.lineWidth = 1;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    for (let i = 0; i <= 4; i++) {
      const y = padT + innerH * i / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const x = padL + innerW * i / 5;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = 'rgba(38,34,28,.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
    // labels
    ctx.fillStyle = C.inkFaint; ctx.font = '11px "Spline Sans Mono", monospace';
    if (opts.xLabel) { ctx.textAlign = 'right'; ctx.fillText(opts.xLabel, W - padR, H - 8); }
    if (opts.yLabel) { ctx.save(); ctx.translate(10, padT + 6); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText(opts.yLabel, 0, 0); ctx.restore(); }
    return { padL, padR, padT, padB, innerW, innerH };
  }

  /* ============================================================
     CH05 위젯 01 — 편향-분산 트레이드오프
     슬라이더: 모델 복잡도 (다항식 차수 1..15)
     출력: 편향² · 분산 · 잡음(상수) · 총 오차 막대 + 곡선
     ============================================================ */
  NST.biasVariance = function (root) {
    let degree = 5;
    const MAX_DEG = 15;
    // 모형: 편향² = (1/d)^1.3 처럼 감소, 분산 = 0.04 * d 처럼 증가, 잡음 = 0.20
    function decompose(d) {
      const bias2 = 0.85 / Math.pow(d, 1.05);
      const variance = 0.02 + 0.015 * Math.pow(d, 1.25);
      const noise = 0.20;
      return { bias2, variance, noise, total: bias2 + variance + noise };
    }

    root.innerHTML = `
      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:0;align-items:stretch">
        <div style="padding:1.2rem 1.1rem 0.6rem"><canvas class="bv-curve" width="520" height="320"></canvas></div>
        <div style="padding:1.2rem 1.1rem 0.6rem;border-left:1px solid var(--line-soft)">
          <div class="bv-read" style="font-family:var(--mono);font-size:.78rem;color:var(--ink-soft);line-height:1.6"></div>
          <canvas class="bv-bars" width="380" height="240" style="margin-top:0.7rem;width:100%;max-width:380px"></canvas>
        </div>
      </div>`;

    const curveCv = root.querySelector('.bv-curve'); curveCv.style.maxWidth = '100%'; curveCv.style.height = 'auto';
    const barsCv = root.querySelector('.bv-bars');
    const readEl = root.querySelector('.bv-read');

    function drawCurve() {
      const W = curveCv.width, H = curveCv.height;
      const ctx = curveCv.getContext('2d');
      const ax = drawAxes(ctx, W, H, { xLabel: '모델 복잡도 d →', yLabel: '오차' });
      // 곡선들
      function plot(fn, col, dashed) {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dashed ? [5, 4] : []);
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const d = 1 + (MAX_DEG - 1) * i / 100;
          const y = fn(d);
          const px = ax.padL + ax.innerW * (i / 100);
          const py = ax.padT + ax.innerH * (1 - clamp(y / 1.4, 0, 1));
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
      plot(d => decompose(d).bias2, C.structure);
      plot(d => decompose(d).variance, C.style);
      plot(d => decompose(d).total, C.ink, false);
      plot(d => decompose(d).noise, C.inkFaint, true);

      // 현재 위치 수직선 + 표식
      const frac = (degree - 1) / (MAX_DEG - 1);
      const px = ax.padL + ax.innerW * frac;
      ctx.strokeStyle = 'rgba(38,34,28,.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px, ax.padT); ctx.lineTo(px, H - ax.padB); ctx.stroke();
      ctx.setLineDash([]);
      const d0 = decompose(degree);
      ctx.fillStyle = C.ink;
      const py = ax.padT + ax.innerH * (1 - clamp(d0.total / 1.4, 0, 1));
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill();

      // 범례
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.textAlign = 'left';
      const items = [
        ['편향²', C.structure], ['분산', C.style], ['총 오차', C.ink], ['잡음 (환원불가)', C.inkFaint],
      ];
      let lx = ax.padL + 8, ly = ax.padT + 14;
      items.forEach(([lab, col]) => {
        ctx.fillStyle = col; ctx.fillRect(lx, ly - 8, 12, 3); ctx.fillStyle = C.inkSoft;
        ctx.fillText(lab, lx + 18, ly);
        ly += 16;
      });

      // 최적 표시
      let best = 1, bestV = Infinity;
      for (let d = 1; d <= MAX_DEG; d += 0.1) { const v = decompose(d).total; if (v < bestV) { bestV = v; best = d; } }
      const bx = ax.padL + ax.innerW * ((best - 1) / (MAX_DEG - 1));
      const by = ax.padT + ax.innerH * (1 - clamp(bestV / 1.4, 0, 1));
      ctx.strokeStyle = C.synth; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(bx, by, 9, 0, 7); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = C.synth;
      ctx.fillText(`최적 d≈${best.toFixed(1)}`, bx + 12, by - 6);
    }

    function drawBars() {
      const W = barsCv.width, H = barsCv.height;
      const ctx = barsCv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const d0 = decompose(degree);
      const items = [
        ['편향²', d0.bias2, C.structure],
        ['분산', d0.variance, C.style],
        ['잡음', d0.noise, C.inkFaint],
        ['총합 = E', d0.total, C.ink],
      ];
      const maxV = 1.3;
      const padL = 70, padR = 20, padT = 22, padB = 18;
      const innerW = W - padL - padR, innerH = H - padT - padB;
      const bh = (innerH - 12) / items.length;
      ctx.font = '11px "Spline Sans Mono", monospace';
      items.forEach((it, i) => {
        const [lab, v, col] = it;
        const y = padT + i * (bh + 4);
        // 라벨
        ctx.fillStyle = C.inkSoft; ctx.textAlign = 'right'; ctx.fillText(lab, padL - 6, y + bh / 2 + 4);
        // 막대 배경
        ctx.fillStyle = C.paper2; ctx.fillRect(padL, y, innerW, bh);
        // 막대 값
        ctx.fillStyle = col; const w = innerW * (v / maxV); ctx.fillRect(padL, y, w, bh);
        // 수치
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(v.toFixed(3), padL + 6, y + bh / 2 + 4);
      });
      ctx.fillStyle = C.inkFaint; ctx.textAlign = 'left'; ctx.fillText('E[(y−ŷ)²] 분해', padL, 14);
    }

    function update() {
      drawCurve(); drawBars();
      const d0 = decompose(degree);
      const judg = degree <= 2 ? '과소적합 — 모델이 단순해 편향이 큼' :
                   degree >= 12 ? '과적합 — 분산이 폭증, 잡음을 외움' :
                   '균형대 — 편향과 분산이 비슷한 영역';
      readEl.innerHTML = `
        <div style="font-size:.92rem;color:var(--ink)">d = <b>${degree}</b> · 총 오차 <b>${d0.total.toFixed(3)}</b></div>
        <div style="margin-top:.35rem">${judg}</div>
        <div style="margin-top:.6rem;color:var(--ink-faint)">
          분해: <span style="color:${C.structure}">bias² ${d0.bias2.toFixed(3)}</span>
          + <span style="color:${C.style}">var ${d0.variance.toFixed(3)}</span>
          + <span>noise ${d0.noise.toFixed(2)}</span>
        </div>`;
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>모델 복잡도 d <b class="dv">${degree}</b> / ${MAX_DEG}</label>
        <input type="range" min="1" max="${MAX_DEG}" value="${degree}"></div>
      <span style="font-size:.78rem;color:var(--ink-faint)">← 단순 (과소적합) · 복잡 (과적합) →</span>`;
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), dv = ctr.querySelector('.dv');
    sl.addEventListener('input', () => { degree = +sl.value; dv.textContent = degree; update(); });
    update();
  };

  /* ============================================================
     CH05 위젯 02 — 학습 곡선
     슬라이더: 훈련 데이터 크기 m (5..500)
     출력: 훈련 오차 ↑, 검증 오차 ↓, 일반화 격차
     ============================================================ */
  NST.learningCurve = function (root) {
    let m = 30;
    const MIN = 5, MAX = 500, NOISE = 0.18;
    // 모형: 훈련 오차 = noise * (1 - exp(-m/40))  (작을 땐 외워서 0, 클수록 jitter 누적)
    //       검증 오차 = noise + 0.7 * exp(-m / 90)
    function err(m) {
      const tr = NOISE * (1 - Math.exp(-m / 60)) + 0.02;
      const va = NOISE + 0.85 * Math.exp(-m / 80);
      return { tr, va, gap: va - tr };
    }

    root.innerHTML = `
      <div style="padding:1.4rem 1.1rem 0.6rem">
        <canvas class="lc-cv" width="780" height="320" style="max-width:100%;height:auto"></canvas>
      </div>
      <div class="lc-read" style="padding:0 1.2rem 0.8rem;font-family:var(--mono);font-size:.82rem;color:var(--ink-soft)"></div>`;
    const cv = root.querySelector('.lc-cv');
    const readEl = root.querySelector('.lc-read');

    function draw() {
      const W = cv.width, H = cv.height;
      const ctx = cv.getContext('2d');
      const ax = drawAxes(ctx, W, H, { xLabel: '훈련 데이터 크기 m →', yLabel: '오차' });
      const xat = mm => ax.padL + ax.innerW * (mm - MIN) / (MAX - MIN);
      const yat = e => ax.padT + ax.innerH * (1 - clamp(e / 1.1, 0, 1));
      // 격차 영역 (훈련 ~ 검증 사이)
      ctx.fillStyle = 'rgba(192,73,46,.10)';
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const mm = MIN + (MAX - MIN) * i / 100; ctx.lineTo(xat(mm), yat(err(mm).va)); }
      for (let i = 100; i >= 0; i--) { const mm = MIN + (MAX - MIN) * i / 100; ctx.lineTo(xat(mm), yat(err(mm).tr)); }
      ctx.closePath(); ctx.fill();
      // 두 곡선
      function plot(fn, col, label) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const mm = MIN + (MAX - MIN) * i / 100;
          const px = xat(mm), py = yat(fn(mm));
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      plot(mm => err(mm).tr, C.structure);
      plot(mm => err(mm).va, C.style);
      // 베이즈 한계 (잡음)
      ctx.strokeStyle = C.inkFaint; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(ax.padL, yat(NOISE)); ctx.lineTo(W - ax.padR, yat(NOISE)); ctx.stroke();
      ctx.setLineDash([]);
      // 현재 위치
      const e0 = err(m);
      ctx.strokeStyle = 'rgba(38,34,28,.4)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(xat(m), ax.padT); ctx.lineTo(xat(m), H - ax.padB); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.structure; ctx.beginPath(); ctx.arc(xat(m), yat(e0.tr), 4, 0, 7); ctx.fill();
      ctx.fillStyle = C.style; ctx.beginPath(); ctx.arc(xat(m), yat(e0.va), 4, 0, 7); ctx.fill();
      // 범례
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.textAlign = 'left';
      const items = [['훈련 오차', C.structure], ['검증 오차', C.style], ['베이즈 한계 (잡음)', C.inkFaint]];
      let lx = W - ax.padR - 160, ly = ax.padT + 14;
      items.forEach(([lab, col]) => {
        ctx.fillStyle = col; ctx.fillRect(lx, ly - 7, 12, 3); ctx.fillStyle = C.inkSoft; ctx.fillText(lab, lx + 18, ly);
        ly += 16;
      });
      // m 값 라벨
      ctx.fillStyle = C.ink; ctx.font = '12px "Spline Sans Mono", monospace';
      ctx.textAlign = 'center'; ctx.fillText('m=' + m, xat(m), ax.padT + 10);
    }

    function update() {
      draw();
      const e0 = err(m);
      const phase = m < 20 ? '데이터 부족 — 격차 큼 (분산 지배)' :
                    m > 250 ? '포화 영역 — 두 곡선이 잡음 한계로 수렴' :
                    '진행 영역 — 격차가 빠르게 줄어듦';
      readEl.innerHTML = `
        m = <b style="color:var(--ink)">${m}</b> · 훈련 <b style="color:${C.structure}">${e0.tr.toFixed(3)}</b>
        · 검증 <b style="color:${C.style}">${e0.va.toFixed(3)}</b>
        · 격차 <b>${e0.gap.toFixed(3)}</b><br>
        <span style="color:var(--ink-faint)">${phase}</span>`;
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>훈련 데이터 크기 m <b class="mv">${m}</b></label>
        <input type="range" min="${MIN}" max="${MAX}" value="${m}"></div>
      <span style="font-size:.78rem;color:var(--ink-faint)">데이터가 늘수록 훈련↑, 검증↓ → 두 선이 가까워지며 잡음 한계로 수렴</span>`;
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), mv = ctr.querySelector('.mv');
    sl.addEventListener('input', () => { m = +sl.value; mv.textContent = m; update(); });
    update();
  };

  /* ============================================================
     CH05 위젯 03 — MLE = NLL 최소화 동치
     슬라이더: 정규분포 평균 μ (관측 데이터 고정)
     출력: 우도 L(μ), 로그우도 ln L(μ), 음의 로그우도 -ln L(μ)
     ============================================================ */
  NST.mleNll = function (root) {
    // 결정적 관측 데이터 (μ=2.0, σ=1.0 분포에서 뽑은 12개)
    const rng = seeded(20260604);
    const xs = [];
    for (let i = 0; i < 12; i++) xs.push(2.0 + seededGaussian(rng) * 1.0);
    const trueMu = xs.reduce((a, b) => a + b, 0) / xs.length; // 표본평균 = MLE
    const SIG = 1.0;
    let mu = 0.5;

    function logLik(mu) {
      // ln L = sum( -0.5 ln(2π σ²) - (x-μ)² / (2σ²) )
      const c = -0.5 * Math.log(2 * Math.PI * SIG * SIG);
      let s = 0;
      for (const x of xs) s += c - (x - mu) ** 2 / (2 * SIG * SIG);
      return s;
    }

    root.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
        <div style="padding:1.2rem 1.1rem 0.4rem;border-right:1px solid var(--line-soft)">
          <canvas class="mle-pdf" width="420" height="280" style="max-width:100%;height:auto"></canvas>
        </div>
        <div style="padding:1.2rem 1.1rem 0.4rem">
          <canvas class="mle-nll" width="420" height="280" style="max-width:100%;height:auto"></canvas>
        </div>
      </div>
      <div class="mle-read" style="padding:0 1.2rem 0.8rem;font-family:var(--mono);font-size:.82rem;color:var(--ink-soft);line-height:1.6"></div>`;

    const pdfCv = root.querySelector('.mle-pdf'), nllCv = root.querySelector('.mle-nll');
    const readEl = root.querySelector('.mle-read');
    const MU_MIN = -1.5, MU_MAX = 5.5;

    function drawPdf() {
      const W = pdfCv.width, H = pdfCv.height;
      const ctx = pdfCv.getContext('2d');
      const ax = drawAxes(ctx, W, H, { xLabel: 'x', yLabel: 'p(x|μ,σ²)' });
      const xat = x => ax.padL + ax.innerW * (x - MU_MIN) / (MU_MAX - MU_MIN);
      const yat = y => ax.padT + ax.innerH * (1 - clamp(y / 0.55, 0, 1));
      // 현재 μ 의 정규분포
      ctx.strokeStyle = C.structure; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = MU_MIN + (MU_MAX - MU_MIN) * i / 200;
        const y = Math.exp(-Math.pow(x - mu, 2) / 2) / Math.sqrt(2 * Math.PI);
        const px = xat(x), py = yat(y);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      // 관측 데이터: 각 점에서 확률 밀도값으로 stem
      xs.forEach(x => {
        const y = Math.exp(-Math.pow(x - mu, 2) / 2) / Math.sqrt(2 * Math.PI);
        const px = xat(x), py = yat(y);
        ctx.strokeStyle = 'rgba(192,73,46,.4)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, H - ax.padB); ctx.lineTo(px, py); ctx.stroke();
        ctx.fillStyle = C.style; ctx.beginPath(); ctx.arc(px, py, 3.2, 0, 7); ctx.fill();
      });
      // μ 표시
      ctx.strokeStyle = 'rgba(38,34,28,.5)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(xat(mu), ax.padT); ctx.lineTo(xat(mu), H - ax.padB); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.ink; ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.textAlign = 'center'; ctx.fillText('μ=' + mu.toFixed(2), xat(mu), ax.padT + 12);
      // 범례
      ctx.textAlign = 'left'; ctx.fillStyle = C.inkFaint;
      ctx.fillText('• 점 = 관측 데이터 위치의 밀도값', ax.padL + 6, H - 8);
    }

    function drawNll() {
      const W = nllCv.width, H = nllCv.height;
      const ctx = nllCv.getContext('2d');
      const ax = drawAxes(ctx, W, H, { xLabel: 'μ →', yLabel: '−ln L(μ)' });
      // -lnL 곡선
      let minL = Infinity, maxL = -Infinity;
      const samples = [];
      for (let i = 0; i <= 200; i++) {
        const mm = MU_MIN + (MU_MAX - MU_MIN) * i / 200;
        const v = -logLik(mm);
        samples.push([mm, v]);
        if (v < minL) minL = v; if (v > maxL) maxL = v;
      }
      const yat = v => ax.padT + ax.innerH * ((v - minL) / (maxL - minL + 1e-9));
      const xat = mm => ax.padL + ax.innerW * (mm - MU_MIN) / (MU_MAX - MU_MIN);
      ctx.strokeStyle = C.style; ctx.lineWidth = 2; ctx.beginPath();
      samples.forEach(([mm, v], i) => { const p = xat(mm), q = yat(v); i ? ctx.lineTo(p, q) : ctx.moveTo(p, q); });
      ctx.stroke();
      // 현재 μ
      ctx.strokeStyle = 'rgba(38,34,28,.4)'; ctx.setLineDash([3, 3]);
      const cx = xat(mu); ctx.beginPath(); ctx.moveTo(cx, ax.padT); ctx.lineTo(cx, H - ax.padB); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx, yat(-logLik(mu)), 5, 0, 7); ctx.fill();
      // 최소(=MLE) 표시
      ctx.fillStyle = C.synth; ctx.beginPath(); ctx.arc(xat(trueMu), yat(-logLik(trueMu)), 6, 0, 7); ctx.fill();
      ctx.fillStyle = C.synth; ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.textAlign = 'center'; ctx.fillText('μ_MLE = ' + trueMu.toFixed(2), xat(trueMu), yat(-logLik(trueMu)) - 10);
    }

    function update() {
      drawPdf(); drawNll();
      const L = Math.exp(logLik(mu));      // L 자체
      const lnL = logLik(mu);
      const nll = -lnL;
      const dirHint = mu < trueMu - 0.05 ? '오른쪽으로 가면 더 적합 (−lnL ↓)' :
                       mu > trueMu + 0.05 ? '왼쪽으로 가면 더 적합 (−lnL ↓)' :
                       '거의 MLE 위치 — 음의 로그우도가 최소';
      readEl.innerHTML = `
        μ = <b style="color:var(--ink)">${mu.toFixed(2)}</b>
        · L(μ) = <b style="color:${C.structure}">${L.toExponential(2)}</b>
        · −ln L(μ) = <b style="color:${C.style}">${nll.toFixed(2)}</b><br>
        <span style="color:var(--ink-faint)">${dirHint} · 표본평균(=MLE) ≈ ${trueMu.toFixed(3)}</span>`;
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>모형 평균 μ <b class="mv">${mu.toFixed(2)}</b></label>
        <input type="range" min="${MU_MIN * 100}" max="${MU_MAX * 100}" step="5" value="${mu * 100}"></div>
      <button class="btn ghost mle-jump">μ_MLE 로 점프</button>
      <span style="font-size:.78rem;color:var(--ink-faint)">L 최대 ↔ −ln L 최소 (단조 변환이라 같은 해)</span>`;
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), mv = ctr.querySelector('.mv');
    sl.addEventListener('input', () => { mu = +sl.value / 100; mv.textContent = mu.toFixed(2); update(); });
    ctr.querySelector('.mle-jump').addEventListener('click', () => {
      mu = trueMu; sl.value = Math.round(mu * 100); mv.textContent = mu.toFixed(2); update();
    });
    update();
  };

  /* ============================================================
     CH05 위젯 04 — 다항식 차수 vs 과적합
     슬라이더: 다항식 차수 d (1..15)
     데이터: y = sin(x) + noise, 10 점
     출력: 데이터 점 + 적합 곡선 + 훈련/검증 오차
     ============================================================ */
  NST.polyFit = function (root) {
    let degree = 3;
    const MAX_DEG = 15;
    const rng = seeded(20260605);
    // 진짜 함수: y = sin(1.2 x)
    function trueFn(x) { return Math.sin(1.2 * x); }
    // 훈련 데이터 12점 (x ∈ [-3, 3])
    const N_TR = 12, NOISE = 0.22;
    const xtr = [], ytr = [];
    for (let i = 0; i < N_TR; i++) {
      const x = -3 + 6 * (i + 0.5) / N_TR + (rng() - 0.5) * 0.25;
      xtr.push(x); ytr.push(trueFn(x) + seededGaussian(rng) * NOISE);
    }
    // 검증 데이터 60점 (촘촘히)
    const xva = [], yva = [];
    for (let i = 0; i < 60; i++) {
      const x = -3 + 6 * (i + 0.5) / 60;
      xva.push(x); yva.push(trueFn(x) + seededGaussian(rng) * NOISE);
    }

    // 정규방정식으로 다항식 회귀 (간단·소형)
    function solvePoly(xs, ys, d) {
      const N = xs.length, K = d + 1;
      // X^T X 와 X^T y
      const A = []; for (let i = 0; i < K; i++) { const r = new Float64Array(K); A.push(r); }
      const b = new Float64Array(K);
      const sumX = new Float64Array(2 * K - 1);
      for (let n = 0; n < N; n++) {
        let p = 1;
        for (let k = 0; k < 2 * K - 1; k++) { sumX[k] += p; p *= xs[n]; }
        let p2 = 1;
        for (let k = 0; k < K; k++) { b[k] += ys[n] * p2; p2 *= xs[n]; }
      }
      for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) A[i][j] = sumX[i + j];
      // 가우스 소거
      const aug = []; for (let i = 0; i < K; i++) { aug.push(new Float64Array(K + 1)); for (let j = 0; j < K; j++) aug[i][j] = A[i][j]; aug[i][K] = b[i]; }
      for (let p = 0; p < K; p++) {
        let pv = p;
        for (let r = p + 1; r < K; r++) if (Math.abs(aug[r][p]) > Math.abs(aug[pv][p])) pv = r;
        [aug[p], aug[pv]] = [aug[pv], aug[p]];
        const piv = aug[p][p]; if (Math.abs(piv) < 1e-12) continue;
        for (let j = p; j <= K; j++) aug[p][j] /= piv;
        for (let r = 0; r < K; r++) if (r !== p) {
          const f = aug[r][p]; if (!f) continue;
          for (let j = p; j <= K; j++) aug[r][j] -= f * aug[p][j];
        }
      }
      const w = new Float64Array(K);
      for (let i = 0; i < K; i++) w[i] = aug[i][K];
      return w;
    }
    function evalPoly(w, x) { let s = 0, p = 1; for (let k = 0; k < w.length; k++) { s += w[k] * p; p *= x; } return s; }

    root.innerHTML = `
      <div style="padding:1.4rem 1.1rem 0.6rem">
        <canvas class="pf-cv" width="800" height="340" style="max-width:100%;height:auto"></canvas>
      </div>
      <div class="pf-read" style="padding:0 1.2rem 0.8rem;font-family:var(--mono);font-size:.82rem;color:var(--ink-soft);line-height:1.6"></div>`;
    const cv = root.querySelector('.pf-cv');
    const readEl = root.querySelector('.pf-read');

    function draw() {
      const W = cv.width, H = cv.height;
      const ctx = cv.getContext('2d');
      const ax = drawAxes(ctx, W, H, { xLabel: 'x', yLabel: 'y' });
      const xat = x => ax.padL + ax.innerW * (x + 3) / 6;
      const yat = y => ax.padT + ax.innerH * (1 - (y + 2) / 4);

      // 진짜 함수
      ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = -3 + 6 * i / 200, y = trueFn(x);
        const px = xat(x), py = yat(y);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);

      // 다항식 적합
      const w = solvePoly(xtr, ytr, degree);
      ctx.strokeStyle = C.structure; ctx.lineWidth = 2.4; ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const x = -3 + 6 * i / 300, y = evalPoly(w, x);
        const px = xat(x), py = yat(clamp(y, -2.2, 2.2));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();

      // 훈련 점
      ctx.fillStyle = C.style;
      xtr.forEach((x, i) => { ctx.beginPath(); ctx.arc(xat(x), yat(ytr[i]), 4.5, 0, 7); ctx.fill(); });

      // 손실
      let trErr = 0, vaErr = 0;
      xtr.forEach((x, i) => { trErr += (evalPoly(w, x) - ytr[i]) ** 2; });
      xva.forEach((x, i) => { vaErr += (evalPoly(w, x) - yva[i]) ** 2; });
      trErr /= xtr.length; vaErr /= xva.length;

      // 범례
      ctx.font = '11px "Spline Sans Mono", monospace';
      const items = [['적합 곡선 (차수 ' + degree + ')', C.structure], ['훈련 데이터 점', C.style], ['진짜 함수 sin(1.2x)', C.inkFaint]];
      ctx.textAlign = 'left';
      let lx = ax.padL + 6, ly = ax.padT + 14;
      items.forEach(([lab, col]) => {
        ctx.fillStyle = col; ctx.fillRect(lx, ly - 7, 12, 3); ctx.fillStyle = C.inkSoft; ctx.fillText(lab, lx + 18, ly);
        ly += 16;
      });

      return { trErr, vaErr };
    }

    function update() {
      const { trErr, vaErr } = draw();
      const verdict = degree <= 2 ? '과소적합 — 곡선이 데이터를 따라가지 못함' :
                      degree >= 10 ? '과적합 — 곡선이 잡음까지 따라가며 진동' :
                      '적절 — 진짜 함수와 거의 일치';
      readEl.innerHTML = `
        차수 d = <b style="color:var(--ink)">${degree}</b>
        · 훈련 MSE <b style="color:${C.style}">${trErr.toFixed(3)}</b>
        · 검증 MSE <b style="color:${C.structure}">${vaErr.toFixed(3)}</b><br>
        <span style="color:var(--ink-faint)">${verdict}</span>`;
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>다항식 차수 d <b class="dv">${degree}</b> / ${MAX_DEG}</label>
        <input type="range" min="1" max="${MAX_DEG}" value="${degree}"></div>
      <span style="font-size:.78rem;color:var(--ink-faint)">차수↑ → 훈련 MSE는 계속 줄지만 검증 MSE는 U자 곡선</span>`;
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), dv = ctr.querySelector('.dv');
    sl.addEventListener('input', () => { degree = +sl.value; dv.textContent = degree; update(); });
    update();
  };

  /* ============================================================
     CH05 위젯 05 — 베이지안 vs 빈도주의 예측
     슬라이더: 관측 횟수 N (베르누이 동전 던지기, 앞면 비율 추정)
              사전 강도 α (Beta(α,α) prior)
     출력: 사전·우도·사후 분포 + 점추정 vs 분포 추정 비교
     ============================================================ */
  NST.bayesFreq = function (root) {
    let N = 8, alpha = 2.0;
    const TRUE_P = 0.65;
    const rng = seeded(20260603);
    // 결정적 동전 결과: TRUE_P 비율로 1
    const flips = [];
    for (let i = 0; i < 200; i++) flips.push(rng() < TRUE_P ? 1 : 0);

    function beta(x, a, b) {
      // 정규화 안 된 PDF 형태 (max 정규화는 그릴 때)
      return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
    }
    function lnGamma(z) {
      // Lanczos 근사
      const g = 7, p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
      if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
      z -= 1; let a = p[0];
      const t = z + g + 0.5;
      for (let i = 1; i < g + 2; i++) a += p[i] / (z + i);
      return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
    }
    function betaPdfNorm(x, a, b) {
      // log B(a,b)
      const lnB = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
      return Math.exp((a - 1) * Math.log(x + 1e-12) + (b - 1) * Math.log(1 - x + 1e-12) - lnB);
    }

    root.innerHTML = `
      <div style="padding:1.4rem 1.1rem 0.6rem">
        <canvas class="bf-cv" width="800" height="340" style="max-width:100%;height:auto"></canvas>
      </div>
      <div class="bf-read" style="padding:0 1.2rem 0.8rem;font-family:var(--mono);font-size:.82rem;color:var(--ink-soft);line-height:1.6"></div>`;
    const cv = root.querySelector('.bf-cv');
    const readEl = root.querySelector('.bf-read');

    function head() { let h = 0; for (let i = 0; i < N; i++) h += flips[i]; return h; }

    function draw() {
      const W = cv.width, H = cv.height;
      const ctx = cv.getContext('2d');
      const ax = drawAxes(ctx, W, H, { xLabel: 'θ (앞면 확률)', yLabel: '밀도' });
      const h = head(), t = N - h;
      // 분포들
      // 사전: Beta(α, α)
      // 우도(베르누이): θ^h (1-θ)^t  (정규화 안 함 — 비례)
      // 사후: Beta(α+h, α+t)
      const xat = x => ax.padL + ax.innerW * x;
      let maxY = 0;
      const samples = 200;
      const prior = [], lik = [], post = [];
      for (let i = 0; i <= samples; i++) {
        const x = i / samples;
        prior.push(betaPdfNorm(x, alpha, alpha));
        lik.push(Math.pow(x, h) * Math.pow(1 - x, t));
        post.push(betaPdfNorm(x, alpha + h, alpha + t));
      }
      const likMax = Math.max(...lik), likScale = Math.max(...post) / (likMax || 1) * 0.8;
      const likN = lik.map(v => v * likScale);
      maxY = Math.max(...prior, ...likN, ...post) * 1.05;
      const yat = y => ax.padT + ax.innerH * (1 - y / maxY);

      function plot(arr, col, dashed, fill) {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dashed ? [4, 4] : []);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.moveTo(ax.padL, H - ax.padB);
          arr.forEach((y, i) => { ctx.lineTo(xat(i / samples), yat(y)); });
          ctx.lineTo(W - ax.padR, H - ax.padB); ctx.closePath(); ctx.fill();
        }
        ctx.beginPath();
        arr.forEach((y, i) => { const p = xat(i / samples), q = yat(y); i ? ctx.lineTo(p, q) : ctx.moveTo(p, q); });
        ctx.stroke();
        ctx.setLineDash([]);
      }
      plot(prior, C.inkFaint, true);
      plot(likN, C.style, false, 'rgba(192,73,46,.10)');
      plot(post, C.structure, false, 'rgba(45,91,122,.13)');

      // 점추정들
      const mleP = N > 0 ? h / N : 0.5;
      const mapP = (alpha + h - 1) / (alpha * 2 + N - 2);
      const meanP = (alpha + h) / (alpha * 2 + N);
      // 수직선
      function vline(x, col, label) {
        ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(xat(x), ax.padT + 4); ctx.lineTo(xat(x), H - ax.padB); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.font = '10px "Spline Sans Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label + ' ' + x.toFixed(2), xat(x), ax.padT + 12);
      }
      vline(TRUE_P, C.inkFaint, '진실 θ');
      vline(mleP, C.style, 'MLE');
      vline(mapP, C.synth, 'MAP');
      vline(meanP, C.structure, '사후평균');
      // 범례
      ctx.font = '11px "Spline Sans Mono", monospace';
      const items = [['사전 Beta(α,α) (빈도주의 무지)', C.inkFaint], ['우도 (스케일됨)', C.style], ['사후 Beta(α+h, α+t)', C.structure]];
      ctx.textAlign = 'left';
      let lx = ax.padL + 6, ly = ax.padT + 14;
      items.forEach(([lab, col]) => {
        ctx.fillStyle = col; ctx.fillRect(lx, ly - 7, 12, 3); ctx.fillStyle = C.inkSoft; ctx.fillText(lab, lx + 18, ly);
        ly += 16;
      });
      return { h, t, mleP, mapP, meanP };
    }

    function update() {
      const r = draw();
      const ratio = r.h + '/' + N;
      const note = N <= 3 ? '데이터 부족 — 사후가 사전 형태를 거의 닮음' :
                   N >= 50 ? '데이터 풍부 — 사후가 우도에 흡수, MAP≈MLE 로 수렴' :
                   '중간 — 사전과 우도가 함께 사후를 만든다';
      readEl.innerHTML = `
        N = <b>${N}</b>, 앞면 = <b>${ratio}</b>, 사전 강도 α = <b>${alpha.toFixed(1)}</b><br>
        <b style="color:${C.style}">빈도주의 MLE</b> = ${r.mleP.toFixed(3)}
        · <b style="color:${C.synth}">MAP</b> = ${r.mapP.toFixed(3)}
        · <b style="color:${C.structure}">베이즈 사후평균</b> = ${r.meanP.toFixed(3)}
        · 진실 = ${TRUE_P}<br>
        <span style="color:var(--ink-faint)">${note}</span>`;
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>관측 횟수 N <b class="nv">${N}</b></label>
        <input type="range" class="s-style" min="0" max="200" value="${N}"></div>
      <div class="slider"><label>사전 강도 α <b class="av">${alpha.toFixed(1)}</b></label>
        <input type="range" class="s-structure" min="5" max="200" step="5" value="${alpha * 10}"></div>`;
    root.appendChild(ctr);
    const [sl1, sl2] = ctr.querySelectorAll('input');
    const nv = ctr.querySelector('.nv'), av = ctr.querySelector('.av');
    sl1.addEventListener('input', () => { N = +sl1.value; nv.textContent = N; update(); });
    sl2.addEventListener('input', () => { alpha = +sl2.value / 10; av.textContent = alpha.toFixed(1); update(); });
    update();
  };

  /* ============================================================
     CH05 위젯 06 (선택) — k-NN 분류 직관
     슬라이더: k (1..30), 데이터 점 개수 고정
     출력: 결정 경계 (배경 색칠) + 점들
     ============================================================ */
  NST.knn = function (root) {
    let k = 5;
    const rng = seeded(20260606);
    // 2D 두 클래스 (가우시안 두 묶음)
    const pts = [];
    for (let i = 0; i < 35; i++) pts.push({ x: -1 + seededGaussian(rng) * 0.6, y: -1 + seededGaussian(rng) * 0.6, c: 0 });
    for (let i = 0; i < 35; i++) pts.push({ x: 1 + seededGaussian(rng) * 0.6, y: 0.7 + seededGaussian(rng) * 0.6, c: 1 });
    // 약간 섞기 (잡음)
    for (let i = 0; i < 8; i++) pts.push({ x: (rng() - 0.5) * 4, y: (rng() - 0.5) * 4, c: rng() < 0.5 ? 0 : 1 });

    root.innerHTML = `
      <div style="padding:1.2rem 1.1rem 0.6rem">
        <canvas class="kn-cv" width="640" height="320" style="max-width:100%;height:auto;display:block;margin:0 auto"></canvas>
      </div>
      <div class="kn-read" style="padding:0 1.2rem 0.8rem;font-family:var(--mono);font-size:.82rem;color:var(--ink-soft);line-height:1.6"></div>`;
    const cv = root.querySelector('.kn-cv');
    const readEl = root.querySelector('.kn-read');

    function classify(x, y, kk) {
      // 모든 점 거리 계산
      const ds = pts.map(p => [(p.x - x) ** 2 + (p.y - y) ** 2, p.c]);
      ds.sort((a, b) => a[0] - b[0]);
      let s = 0; for (let i = 0; i < kk; i++) s += ds[i][1];
      return s / kk; // 0 = 클래스 0, 1 = 클래스 1, 사이 = 확률
    }

    function draw() {
      const W = cv.width, H = cv.height;
      const ctx = cv.getContext('2d');
      const X_MIN = -3, X_MAX = 3, Y_MIN = -2.2, Y_MAX = 2.2;
      const xat = x => (x - X_MIN) / (X_MAX - X_MIN) * W;
      const yat = y => (Y_MAX - y) / (Y_MAX - Y_MIN) * H;
      // 배경 결정 영역
      const STEP = 6;
      for (let py = 0; py < H; py += STEP) {
        for (let px = 0; px < W; px += STEP) {
          const x = X_MIN + (X_MAX - X_MIN) * (px / W);
          const y = Y_MAX - (Y_MAX - Y_MIN) * (py / H);
          const p = classify(x, y, k);
          // 0 → structure-bg, 1 → style-bg
          const r0 = 45 / 255, g0 = 91 / 255, b0 = 122 / 255;
          const r1 = 192 / 255, g1 = 73 / 255, b1 = 46 / 255;
          const rr = lerp(r0, r1, p), gg = lerp(g0, g1, p), bb = lerp(b0, b1, p);
          ctx.fillStyle = `rgba(${(rr * 255) | 0},${(gg * 255) | 0},${(bb * 255) | 0},0.16)`;
          ctx.fillRect(px, py, STEP + 0.5, STEP + 0.5);
        }
      }
      // 결정 경계 (0.5 등고선 근사)
      ctx.strokeStyle = 'rgba(38,34,28,.5)'; ctx.lineWidth = 1.6;
      for (let py = 0; py < H; py += STEP * 2) {
        let prev = null;
        for (let px = 0; px < W; px += STEP) {
          const x = X_MIN + (X_MAX - X_MIN) * (px / W);
          const y = Y_MAX - (Y_MAX - Y_MIN) * (py / H);
          const p = classify(x, y, k);
          if (prev !== null && (prev - 0.5) * (p - 0.5) < 0) {
            ctx.fillRect(px - STEP / 2, py - 1, 2, 2);
          }
          prev = p;
        }
      }
      // 점들
      pts.forEach(p => {
        const px = xat(p.x), py = yat(p.y);
        ctx.fillStyle = p.c === 0 ? C.structure : C.style;
        ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
      });
      // 라벨
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillStyle = C.inkSoft;
      ctx.fillText('• 클래스 0', 12, 18); ctx.fillStyle = C.structure; ctx.fillRect(78, 12, 8, 8);
      ctx.fillStyle = C.inkSoft;
      ctx.fillText('• 클래스 1', 100, 18); ctx.fillStyle = C.style; ctx.fillRect(166, 12, 8, 8);
    }

    function update() {
      draw();
      const note = k === 1 ? 'k=1 — 경계가 들쭉날쭉, 잡음에 민감 (분산↑ · 편향↓)' :
                   k >= 25 ? '큰 k — 경계가 거의 직선, 미세 구조 무시 (편향↑ · 분산↓)' :
                   '중간 k — 부드러운 경계, 균형';
      readEl.innerHTML = `k = <b>${k}</b><br><span style="color:var(--ink-faint)">${note}</span>`;
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>k (이웃 수) <b class="kv">${k}</b></label>
        <input type="range" min="1" max="30" value="${k}"></div>
      <span style="font-size:.78rem;color:var(--ink-faint)">k는 모델 용량을 거꾸로 조절한다: k↓ = 용량↑</span>`;
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), kv = ctr.querySelector('.kv');
    sl.addEventListener('input', () => { k = +sl.value; kv.textContent = k; update(); });
    update();
  };

  /* ---------- Q&A 아코디언 (공유: ../assets/widgets.js 의 NST.accordion 이용 가능) ---------- */
  if (!NST.accordion) {
    NST.accordion = function (root) {
      root.querySelectorAll('.qa').forEach(qa => {
        const q = qa.querySelector('.qa-q');
        q.addEventListener('click', () => qa.classList.toggle('open'));
      });
    };
  }
})();
