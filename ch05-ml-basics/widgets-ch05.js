/* ============================================================
   Ch.5 Machine Learning Basics — 챕터 전용 위젯 (DEEP REWRITE)
   디자인 시스템은 ../assets/site.css 와 ../assets/widgets.js 의
   토큰/유틸리티를 그대로 따른다. Ch.5 sub-chapter 14개에 맞춰
   NST.CHAPTERS 재정의 + 챕터별 위젯을 모아 둔다.
   ============================================================ */
(function () {
  'use strict';
  if (!window.NST) window.NST = {};
  const NST = window.NST;

  // ---------- Sub-chapter 목차 (15개) ----------
  NST.CHAPTERS = [
    { no: '01', t: '학습 알고리즘이란 — T·P·E 삼각형', f: '01.html' },
    { no: '02', t: '학습의 세 갈래 — 지도·비지도·강화', f: '02.html' },
    { no: '03', t: '용량과 가설 공간', f: '03.html' },
    { no: '04', t: '과적합과 과소적합', f: '04.html' },
    { no: '05', t: '편향-분산 분해', f: '05.html' },
    { no: '06', t: '학습 곡선', f: '06.html' },
    { no: '07', t: '검증·테스트 분할과 교차검증', f: '07.html' },
    { no: '08', t: '손실 함수와 경험적 위험 (ERM)', f: '08.html' },
    { no: '09', t: '최대우도 추정 (MLE)', f: '09.html' },
    { no: '10', t: 'MLE = 교차 엔트로피', f: '10.html' },
    { no: '11', t: '베이지안 추정 — 분포로 답하기', f: '11.html' },
    { no: '12', t: 'MAP 추정 — 정칙화로 가는 다리', f: '12.html' },
    { no: '13', t: '정칙화 도입 — 가우시안 사전 = L2', f: '13.html' },
    { no: '14', t: '그라디언트 학습의 한계 — Ch.8 예고', f: '14.html' },
    { no: '15', t: '시험 대비 — Q&A 20선', f: '15.html' },
  ];

  // buildNav 를 ch05 전용으로 재정의 (상위 home 링크가 ch05 표지)
  NST.buildNav = function (currentNo) {
    const cur = NST.CHAPTERS.find(c => c.no === currentNo);
    const tb = document.querySelector('.topbar');
    if (tb) tb.innerHTML =
      `<a class="home" href="index.html">← Ch.5 기계학습 기초</a>` +
      `<span class="ch-mini">SECTION ${currentNo} / 15</span>`;
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
  function seeded(seed) { let s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function seededGaussian(rng) { const u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  const css = getComputedStyle(document.documentElement);
  const C = {
    paper: css.getPropertyValue('--paper').trim() || '#FAF7F0',
    paper2: css.getPropertyValue('--paper-2').trim() || '#F3EEE3',
    paperSink: css.getPropertyValue('--paper-sink').trim() || '#EDE6D7',
    ink: css.getPropertyValue('--ink').trim() || '#26221C',
    inkSoft: css.getPropertyValue('--ink-soft').trim() || '#5A5247',
    inkFaint: css.getPropertyValue('--ink-faint').trim() || '#8E8576',
    structure: css.getPropertyValue('--structure').trim() || '#2D5B7A',
    structureLo: css.getPropertyValue('--structure-lo').trim() || '#6E97AF',
    style: css.getPropertyValue('--style').trim() || '#C0492E',
    styleLo: css.getPropertyValue('--style-lo').trim() || '#D98E73',
    synth: css.getPropertyValue('--synth').trim() || '#A47B2E',
  };

  // 캔버스 축 그리기 헬퍼
  function drawAxes(ctx, W, H, opts) {
    opts = opts || {};
    const padL = opts.padL || 42, padR = opts.padR || 14, padT = opts.padT || 16, padB = opts.padB || 30;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(38,34,28,.06)'; ctx.lineWidth = 1;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    for (let i = 0; i <= 4; i++) { const y = padT + innerH * i / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke(); }
    for (let i = 0; i <= 5; i++) { const x = padL + innerW * i / 5; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(38,34,28,.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
    ctx.fillStyle = C.inkFaint; ctx.font = '11px "Spline Sans Mono", monospace';
    if (opts.xLabel) { ctx.textAlign = 'right'; ctx.fillText(opts.xLabel, W - padR, H - 8); }
    if (opts.yLabel) { ctx.save(); ctx.translate(12, padT + 6); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText(opts.yLabel, 0, 0); ctx.restore(); }
    return { padL, padR, padT, padB, innerW, innerH };
  }

  function mkCanvas(w, h) {
    const cv = document.createElement('canvas');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    return { cv, ctx };
  }

  function makeControls(html) {
    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = html; return ctr;
  }

  /* ============================================================
     WIDGET 01 — T·P·E 삼각형 (sub-chapter 01)
     세 꼭짓점을 호버하면 그 요소가 빠졌을 때 무엇이 모호해지는지.
     ============================================================ */
  NST.tpeTriangle = function (root) {
    const W = 720, H = 360;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    const verts = [
      { x: 360, y: 60, label: 'T — 과업', desc: '무엇을 맞혀야 하는가. 분류·회귀·생성·번역·군집화 등.', miss: 'T가 없으면: 무엇을 잘하려는지 정의 불가. P·E를 정해도 방향이 없다.' },
      { x: 130, y: 290, label: 'P — 성능척도', desc: '얼마나 잘했는지 재는 기준. 정확도·MSE·로그우도·BLEU 등.', miss: 'P가 없으면: 더 좋아졌는지 판단 불가. 학습=점수 최적화인데 점수가 없다.' },
      { x: 590, y: 290, label: 'E — 경험', desc: '알고리즘이 접하는 데이터. 지도·비지도·강화의 형태.', miss: 'E가 없으면: 어디서 패턴을 추출할지 불명. T·P만으로는 학습 불가능.' },
    ];

    let hov = -1;

    function render() {
      ctx.fillStyle = C.paper2; ctx.fillRect(0, 0, W, H);
      // 삼각형 변
      ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      ctx.lineTo(verts[1].x, verts[1].y);
      ctx.lineTo(verts[2].x, verts[2].y);
      ctx.closePath(); ctx.stroke();

      // 변 라벨
      ctx.fillStyle = C.inkSoft; ctx.font = '12px "Spline Sans Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('— 채점 기준이 학습 방향을 정한다 —', 360, 180);

      // 꼭짓점
      const cols = [C.structure, C.style, C.synth];
      verts.forEach((v, i) => {
        ctx.fillStyle = hov === i ? cols[i] : '#fff';
        ctx.strokeStyle = cols[i]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(v.x, v.y, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = hov === i ? '#fff' : cols[i];
        ctx.font = '600 14px "Fraunces", serif'; ctx.textAlign = 'center';
        ctx.fillText(v.label.split(' — ')[0], v.x, v.y + 5);
      });

      // 설명창
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1;
      ctx.fillRect(40, H - 80, W - 80, 64); ctx.strokeRect(40, H - 80, W - 80, 64);
      ctx.fillStyle = C.ink; ctx.font = '600 13px "Fraunces", serif'; ctx.textAlign = 'left';
      if (hov >= 0) {
        ctx.fillText(verts[hov].label, 56, H - 60);
        ctx.fillStyle = C.inkSoft; ctx.font = '12.5px "Pretendard", sans-serif';
        ctx.fillText(verts[hov].desc, 56, H - 42);
        ctx.fillStyle = cols[hov];
        ctx.fillText(verts[hov].miss, 56, H - 24);
      } else {
        ctx.fillText('T·P·E 꼭짓점에 마우스를 올리면 그 요소가 빠졌을 때의 결과가 나타난다.', 56, H - 48);
      }
    }

    cv.addEventListener('mousemove', (e) => {
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let h = -1;
      verts.forEach((v, i) => { if ((mx - v.x) ** 2 + (my - v.y) ** 2 < 36 * 36) h = i; });
      if (h !== hov) { hov = h; render(); }
    });
    cv.addEventListener('mouseleave', () => { hov = -1; render(); });

    render();
  };

  /* ============================================================
     WIDGET 02 — 지도·비지도·강화 분류 슬라이드쇼 (sub-chapter 02)
     ============================================================ */
  NST.learningTypes = function (root) {
    const W = 720, H = 320;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    const slides = [
      {
        name: '지도학습 (Supervised)', col: C.structure,
        draw: (ctx) => {
          ctx.font = '600 14px "Fraunces", serif'; ctx.fillStyle = C.structure; ctx.textAlign = 'left';
          ctx.fillText('입력 + 정답 라벨', 40, 36);
          ctx.font = '12.5px "Pretendard"'; ctx.fillStyle = C.inkSoft;
          ctx.fillText('데이터: {(x, y)}. 예: (메일 본문, 스팸/정상)', 40, 56);
          // 점들 + 라벨
          const rng = seeded(7); const pts = [];
          for (let i = 0; i < 26; i++) { pts.push({ x: rng() * 600 + 60, y: rng() * 160 + 90, c: rng() < 0.5 }); }
          pts.forEach(p => {
            ctx.fillStyle = p.c ? C.structure : C.style;
            ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 7); ctx.fill();
          });
          // 결정 경계
          ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(60, 230); ctx.lineTo(680, 100); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = C.inkFaint; ctx.font = '11px "Spline Sans Mono"';
          ctx.fillText('파랑=class1 / 주황=class2 · 점선=학습된 결정 경계', 40, 280);
        }
      },
      {
        name: '비지도학습 (Unsupervised)', col: C.synth,
        draw: (ctx) => {
          ctx.font = '600 14px "Fraunces", serif'; ctx.fillStyle = C.synth; ctx.textAlign = 'left';
          ctx.fillText('입력만, 라벨 없음', 40, 36);
          ctx.font = '12.5px "Pretendard"'; ctx.fillStyle = C.inkSoft;
          ctx.fillText('데이터: {x}. 예: 고객 행동 로그, 사진들만. 군집·차원축소·밀도추정.', 40, 56);
          // 3 개 군집
          const rng = seeded(11);
          const centers = [{ x: 180, y: 150 }, { x: 380, y: 200 }, { x: 560, y: 130 }];
          const cols = [C.structure, C.style, C.synth];
          centers.forEach((c, k) => {
            for (let i = 0; i < 16; i++) {
              const a = rng() * Math.PI * 2, r = rng() * 50;
              ctx.fillStyle = cols[k] + '55';
              ctx.beginPath(); ctx.arc(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 6, 0, 7); ctx.fill();
            }
            ctx.fillStyle = cols[k];
            ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, 7); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = '11px "Spline Sans Mono"'; ctx.textAlign = 'center';
            ctx.fillText('μ' + (k + 1), c.x, c.y + 4);
          });
          ctx.textAlign = 'left'; ctx.fillStyle = C.inkFaint; ctx.font = '11px "Spline Sans Mono"';
          ctx.fillText('알고리즘이 라벨 없이 군집 중심 μ를 찾아낸다 (예: k-means)', 40, 280);
        }
      },
      {
        name: '강화학습 (Reinforcement)', col: C.style,
        draw: (ctx) => {
          ctx.font = '600 14px "Fraunces", serif'; ctx.fillStyle = C.style; ctx.textAlign = 'left';
          ctx.fillText('환경 · 보상 · 행동 루프', 40, 36);
          ctx.font = '12.5px "Pretendard"'; ctx.fillStyle = C.inkSoft;
          ctx.fillText('데이터: 상호작용. 정답 라벨 대신 보상(reward) 신호.', 40, 56);
          // 박스 다이어그램
          const boxes = [
            { x: 80, y: 110, w: 140, h: 80, t: '에이전트', c: C.structure },
            { x: 500, y: 110, w: 140, h: 80, t: '환경', c: C.synth },
          ];
          boxes.forEach(b => {
            ctx.fillStyle = b.c + '22'; ctx.strokeStyle = b.c; ctx.lineWidth = 1.5;
            ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = b.c; ctx.font = '600 14px "Fraunces"'; ctx.textAlign = 'center';
            ctx.fillText(b.t, b.x + b.w / 2, b.y + b.h / 2 + 5);
          });
          // 화살표
          ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(220, 130); ctx.lineTo(500, 130); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(500, 130); ctx.lineTo(490, 125); ctx.lineTo(490, 135); ctx.fill();
          ctx.font = '11px "Spline Sans Mono"'; ctx.textAlign = 'center';
          ctx.fillText('행동 a_t', 360, 122);

          ctx.beginPath(); ctx.moveTo(500, 170); ctx.lineTo(220, 170); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(220, 170); ctx.lineTo(230, 165); ctx.lineTo(230, 175); ctx.fill();
          ctx.fillText('상태 s_{t+1}, 보상 r_{t+1}', 360, 188);
          ctx.textAlign = 'left'; ctx.fillStyle = C.inkFaint;
          ctx.fillText('정답은 없고, 누적 보상을 최대화하는 정책 π(a|s)를 찾는다.', 40, 260);
        }
      },
    ];

    let idx = 0;
    function render() {
      ctx.fillStyle = C.paper2; ctx.fillRect(0, 0, W, H);
      slides[idx].draw(ctx);
    }

    const ctr = makeControls(`
      <div class="toggle-row">
        ${slides.map((s, i) => `<button class="btn lt-btn" data-i="${i}">${s.name}</button>`).join('')}
      </div>
      <span style="font-size:.8rem;color:var(--ink-faint)">세 학습 패러다임을 같은 캔버스에서 비교한다. 클릭으로 전환.</span>`);
    root.appendChild(ctr);
    ctr.querySelectorAll('.lt-btn').forEach(b => {
      b.addEventListener('click', () => { idx = +b.dataset.i; render(); });
    });
    render();
  };

  /* ============================================================
     WIDGET 03 — 다항식 차수 vs 과적합 (sub-chapter 03·04 공용)
     차수 슬라이더로 가설 공간 크기와 과적합 시각화.
     ============================================================ */
  NST.polyCapacity = function (root) {
    const W = 720, H = 380;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    // 진짜 함수 f(x) = sin(2π x) + 작은 노이즈
    const rng = seeded(42);
    const N = 14;
    const xs = [], ys = [];
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      xs.push(x);
      ys.push(Math.sin(2 * Math.PI * x) + seededGaussian(rng) * 0.18);
    }

    // 최소제곱 다항식 회귀
    function fit(deg) {
      const M = deg + 1;
      const X = []; for (let i = 0; i < N; i++) { const row = []; for (let j = 0; j < M; j++) row.push(Math.pow(xs[i], j)); X.push(row); }
      // 정규방정식 (X^T X) w = X^T y
      const XtX = []; for (let i = 0; i < M; i++) { const r = []; for (let j = 0; j < M; j++) { let s = 0; for (let k = 0; k < N; k++) s += X[k][i] * X[k][j]; r.push(s); } XtX.push(r); }
      const Xty = []; for (let i = 0; i < M; i++) { let s = 0; for (let k = 0; k < N; k++) s += X[k][i] * ys[k]; Xty.push(s); }
      // 정칙화로 수치 안정
      for (let i = 0; i < M; i++) XtX[i][i] += 1e-8;
      // 가우스 소거
      const A = XtX.map((r, i) => r.concat([Xty[i]]));
      for (let i = 0; i < M; i++) {
        let mx = i; for (let k = i + 1; k < M; k++) if (Math.abs(A[k][i]) > Math.abs(A[mx][i])) mx = k;
        [A[i], A[mx]] = [A[mx], A[i]];
        for (let k = i + 1; k < M; k++) {
          const f = A[k][i] / A[i][i];
          for (let j = i; j <= M; j++) A[k][j] -= f * A[i][j];
        }
      }
      const w = new Array(M).fill(0);
      for (let i = M - 1; i >= 0; i--) {
        let s = A[i][M]; for (let j = i + 1; j < M; j++) s -= A[i][j] * w[j]; w[i] = s / A[i][i];
      }
      return w;
    }

    function predict(w, x) { let s = 0; for (let j = 0; j < w.length; j++) s += w[j] * Math.pow(x, j); return s; }

    function render(deg) {
      const ax = drawAxes(ctx, W, H, { xLabel: 'x', yLabel: 'y', padL: 50 });
      const xToPix = (x) => ax.padL + x * ax.innerW;
      const yToPix = (y) => ax.padT + (1 - (y + 1.5) / 3) * ax.innerH;

      // 진짜 함수
      ctx.strokeStyle = C.structureLo; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = i / 200, y = Math.sin(2 * Math.PI * x);
        const px = xToPix(x), py = yToPix(y);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);

      // 적합 곡선
      const w = fit(deg);
      ctx.strokeStyle = C.style; ctx.lineWidth = 2.4; ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = i / 200, y = predict(w, x);
        const px = xToPix(x), py = yToPix(clamp(y, -2, 2));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();

      // 데이터 점
      ctx.fillStyle = C.ink;
      xs.forEach((x, i) => { ctx.beginPath(); ctx.arc(xToPix(x), yToPix(ys[i]), 4.5, 0, 7); ctx.fill(); });

      // 훈련 오차
      let mse = 0; for (let i = 0; i < N; i++) { const e = ys[i] - predict(w, xs[i]); mse += e * e; } mse /= N;
      // 일반화 오차 (진짜 함수로 추정)
      let mseGen = 0; const M = 200;
      for (let i = 0; i < M; i++) { const x = i / M; const e = Math.sin(2 * Math.PI * x) - predict(w, x); mseGen += e * e; } mseGen /= M;

      ctx.fillStyle = C.ink; ctx.font = '12px "Spline Sans Mono"'; ctx.textAlign = 'left';
      ctx.fillText(`차수 d = ${deg}`, W - 200, 30);
      ctx.fillStyle = C.style;
      ctx.fillText(`훈련 MSE = ${mse.toFixed(3)}`, W - 200, 48);
      ctx.fillStyle = C.structure;
      ctx.fillText(`일반화 MSE ≈ ${mseGen.toFixed(3)}`, W - 200, 66);

      // 진단
      ctx.fillStyle = C.inkSoft; ctx.font = '11px "Pretendard"';
      let diag = '';
      if (deg <= 1) diag = '용량 부족 — 과소적합';
      else if (deg <= 4) diag = '적정 — 일반화 양호';
      else if (deg <= 8) diag = '과잉 — 잡음을 외우기 시작';
      else diag = '심한 과적합 — 곡선이 데이터를 통과';
      ctx.fillText(diag, W - 200, 84);
    }

    const ctr = makeControls(`
      <div class="slider"><label>다항식 차수 d (capacity) <b class="iv">3</b></label>
        <input type="range" min="0" max="12" value="3"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">d가 작으면 직선만 그릴 수 있어 과소적합, d가 너무 크면 모든 점을 통과하지만 잡음까지 외운다.</span>`);
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), iv = ctr.querySelector('.iv');
    sl.addEventListener('input', () => { iv.textContent = sl.value; render(+sl.value); });
    render(3);
  };

  /* ============================================================
     WIDGET 04 — 편향-분산 트레이드오프 (sub-chapter 05)
     모델 복잡도 슬라이더 → bias², variance, total error 곡선.
     ============================================================ */
  NST.biasVariance = function (root) {
    const W = 720, H = 380;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    // 분석적 모델: bias² = (a/(c+ε))², variance = b·c, total = bias² + var + noise
    function render(focus) {
      const ax = drawAxes(ctx, W, H, { xLabel: '모델 복잡도 (capacity)', yLabel: '오차', padL: 48 });
      const xToPix = (x) => ax.padL + x * ax.innerW;
      const yToPix = (y) => ax.padT + (1 - y / 1.6) * ax.innerH;

      const noise = 0.18;
      const fBias = (c) => Math.pow(1.1 / (c + 0.2), 2);
      const fVar = (c) => 0.05 + 0.15 * Math.pow(c, 1.5);
      const fTot = (c) => fBias(c) + fVar(c) + noise;

      function draw(fn, col, label, lw) {
        ctx.strokeStyle = col; ctx.lineWidth = lw || 2; ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const c = i / 200 * 1.0, y = fn(c);
          const px = xToPix(i / 200), py = yToPix(clamp(y, 0, 1.6));
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      draw(fBias, C.structure, 'bias²');
      draw(fVar, C.style, 'variance');
      draw(fTot, C.synth, 'total', 3);
      // noise floor
      ctx.strokeStyle = C.inkFaint; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax.padL, yToPix(noise)); ctx.lineTo(W - ax.padR, yToPix(noise)); ctx.stroke(); ctx.setLineDash([]);

      // 현재 지점
      const c = focus, b2 = fBias(c), va = fVar(c), to = fTot(c);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(xToPix(c), ax.padT); ctx.lineTo(xToPix(c), H - ax.padB); ctx.stroke(); ctx.setLineDash([]);

      [{ y: b2, col: C.structure }, { y: va, col: C.style }, { y: to, col: C.synth }].forEach(p => {
        ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(xToPix(c), yToPix(p.y), 5, 0, 7); ctx.fill();
      });

      // 범례
      ctx.font = '12px "Spline Sans Mono"'; ctx.textAlign = 'left';
      ctx.fillStyle = C.structure; ctx.fillText('— bias²  ' + b2.toFixed(3), W - 200, 28);
      ctx.fillStyle = C.style; ctx.fillText('— variance  ' + va.toFixed(3), W - 200, 46);
      ctx.fillStyle = C.synth; ctx.fillText('— total  ' + to.toFixed(3), W - 200, 64);
      ctx.fillStyle = C.inkFaint; ctx.fillText('--- 잡음 하한 ' + noise.toFixed(2), W - 200, 82);

      // sweet spot
      let bestC = 0, bestY = Infinity;
      for (let i = 0; i <= 200; i++) { const cc = i / 200; const y = fTot(cc); if (y < bestY) { bestY = y; bestC = cc; } }
      ctx.fillStyle = C.ink; ctx.font = '11px "Pretendard"';
      ctx.fillText(`최적 복잡도 ≈ ${bestC.toFixed(2)} · 최저 total ≈ ${bestY.toFixed(3)}`, 56, H - 8);
    }

    const ctr = makeControls(`
      <div class="slider"><label>모델 복잡도 c <b class="iv">0.40</b></label>
        <input type="range" min="0.02" max="1.0" step="0.02" value="0.40"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">왼쪽으로 갈수록 단순 모델(bias 큼), 오른쪽으로 갈수록 복잡 모델(variance 큼). 총 오차의 최저점이 sweet spot.</span>`);
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), iv = ctr.querySelector('.iv');
    sl.addEventListener('input', () => { iv.textContent = (+sl.value).toFixed(2); render(+sl.value); });
    render(0.40);
  };

  /* ============================================================
     WIDGET 05 — 학습 곡선 (sub-chapter 06)
     데이터 크기 N 슬라이더 → 훈련 오차 ↑ 검증 오차 ↓ 수렴.
     ============================================================ */
  NST.learningCurve = function (root) {
    const W = 720, H = 360;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    function render(maxN) {
      const ax = drawAxes(ctx, W, H, { xLabel: '훈련 데이터 크기 N', yLabel: '오차', padL: 48 });
      const xToPix = (x) => ax.padL + x * ax.innerW;
      const yToPix = (y) => ax.padT + (1 - y / 1.2) * ax.innerH;

      // 곡선: train ↑, val ↓ , 차이 = 일반화 갭
      const fTrain = (n) => 0.05 + 0.5 / (1 + Math.exp(-0.06 * (n - 10))) * 0.85; // 점점 어려워짐
      const fVal = (n) => 0.95 - 0.55 / (1 + Math.exp(-0.05 * (n - 20)));

      function draw(fn, col, label) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath();
        for (let i = 0; i <= maxN; i += 2) {
          const px = xToPix(i / 200), py = yToPix(clamp(fn(i), 0, 1.2));
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      draw(fTrain, C.structure);
      draw(fVal, C.style);

      // 일반화 갭 음영
      ctx.fillStyle = C.synth + '28'; ctx.beginPath();
      for (let i = 0; i <= maxN; i += 2) { const px = xToPix(i / 200), py = yToPix(fTrain(i)); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      for (let i = maxN; i >= 0; i -= 2) { const px = xToPix(i / 200), py = yToPix(fVal(i)); ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill();

      // 범례
      ctx.font = '12px "Spline Sans Mono"'; ctx.textAlign = 'left';
      ctx.fillStyle = C.structure; ctx.fillText('— 훈련 오차', W - 180, 28);
      ctx.fillStyle = C.style; ctx.fillText('— 검증 오차', W - 180, 46);
      ctx.fillStyle = C.synth; ctx.fillText('■ 일반화 갭', W - 180, 64);

      ctx.fillStyle = C.ink; ctx.font = '12px "Spline Sans Mono"';
      ctx.fillText(`N = ${maxN}  ·  train ${fTrain(maxN).toFixed(3)}  ·  val ${fVal(maxN).toFixed(3)}  ·  gap ${(fVal(maxN) - fTrain(maxN)).toFixed(3)}`, 50, H - 8);
    }

    const ctr = makeControls(`
      <div class="slider"><label>훈련 데이터 크기 N <b class="iv">100</b></label>
        <input type="range" min="2" max="200" value="100"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">N이 작을 때 훈련은 쉽고 검증은 어렵다(큰 갭). N이 커질수록 둘이 가까워지고, 갭이 일반화 한계를 시사한다.</span>`);
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), iv = ctr.querySelector('.iv');
    sl.addEventListener('input', () => { iv.textContent = sl.value; render(+sl.value); });
    render(100);
  };

  /* ============================================================
     WIDGET 06 — 교차검증 k 슬라이더 (sub-chapter 07)
     데이터 100개를 k폴드로 시각화.
     ============================================================ */
  NST.crossVal = function (root) {
    const W = 720, H = 320;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    function render(k) {
      ctx.fillStyle = C.paper2; ctx.fillRect(0, 0, W, H);
      const padL = 60, padT = 36, padR = 16;
      const innerW = W - padL - padR;
      const cells = 40;
      const cellW = innerW / cells;
      const rowH = (H - padT - 36) / k;

      ctx.fillStyle = C.ink; ctx.font = '600 13px "Fraunces"'; ctx.textAlign = 'left';
      ctx.fillText(`k = ${k} (k-Fold Cross Validation)`, padL, 22);

      for (let r = 0; r < k; r++) {
        ctx.fillStyle = C.inkFaint; ctx.font = '11px "Spline Sans Mono"'; ctx.textAlign = 'right';
        ctx.fillText(`fold ${r + 1}`, padL - 8, padT + rowH * r + rowH / 2 + 4);
        const foldSize = cells / k;
        const valStart = Math.floor(foldSize * r);
        const valEnd = Math.floor(foldSize * (r + 1));
        for (let c = 0; c < cells; c++) {
          const isVal = c >= valStart && c < valEnd;
          ctx.fillStyle = isVal ? C.style : C.structure + '88';
          ctx.fillRect(padL + cellW * c + 1, padT + rowH * r + 1, cellW - 2, rowH - 4);
        }
      }
      ctx.fillStyle = C.structure; ctx.font = '11px "Spline Sans Mono"'; ctx.textAlign = 'left';
      ctx.fillText('■ 훈련', padL, H - 18);
      ctx.fillStyle = C.style; ctx.fillText('■ 검증', padL + 80, H - 18);
      ctx.fillStyle = C.inkFaint;
      ctx.fillText(`각 fold마다 다른 1/k 구간을 검증, 나머지로 훈련 → k개 점수의 평균을 보고함. k=N이면 LOOCV.`, padL + 160, H - 18);
    }

    const ctr = makeControls(`
      <div class="slider"><label>분할 수 k <b class="iv">5</b></label>
        <input type="range" min="2" max="10" value="5"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">k가 클수록 평균이 안정적이지만 계산 k배. k=5나 k=10이 표준. k=N이면 leave-one-out.</span>`);
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), iv = ctr.querySelector('.iv');
    sl.addEventListener('input', () => { iv.textContent = sl.value; render(+sl.value); });
    render(5);
  };

  /* ============================================================
     WIDGET 07 — MLE = NLL 동치 시연 (sub-chapter 09·10)
     데이터 점에 가우시안을 맞출 때 우도 ↑ 와 NLL ↓ 가 동일.
     ============================================================ */
  NST.mleNll = function (root) {
    const W = 720, H = 380;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    // 데이터: 평균 1.2, 표준편차 0.6의 작은 표본
    const data = [0.4, 0.7, 0.9, 1.1, 1.2, 1.3, 1.4, 1.6, 1.8, 2.1];

    function logLik(mu, sigma) {
      let s = 0;
      for (const x of data) {
        const z = (x - mu) / sigma;
        s += -0.5 * Math.log(2 * Math.PI) - Math.log(sigma) - 0.5 * z * z;
      }
      return s;
    }

    function render(mu) {
      const ax = drawAxes(ctx, W, H, { xLabel: 'x  /  μ', yLabel: 'p(x|μ,σ)', padL: 50 });
      const xToPix = (x) => ax.padL + (x / 3.5) * ax.innerW;
      const yToPix = (y) => ax.padT + (1 - y / 0.9) * ax.innerH;

      const sigma = 0.55;
      // 가우시안 곡선
      ctx.strokeStyle = C.style; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = i / 200 * 3.5;
        const y = Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2)) / (sigma * Math.sqrt(2 * Math.PI));
        const px = xToPix(x), py = yToPix(clamp(y, 0, 0.9));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();

      // 데이터 점 + 우도 막대
      data.forEach(x => {
        const px = xToPix(x);
        ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(px, H - ax.padB, 4, 0, 7); ctx.fill();
        const y = Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2)) / (sigma * Math.sqrt(2 * Math.PI));
        ctx.strokeStyle = C.synth; ctx.lineWidth = 1.4; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(px, H - ax.padB); ctx.lineTo(px, yToPix(y)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.synth; ctx.beginPath(); ctx.arc(px, yToPix(y), 3, 0, 7); ctx.fill();
      });

      const ll = logLik(mu, sigma);
      ctx.fillStyle = C.ink; ctx.font = '12px "Spline Sans Mono"'; ctx.textAlign = 'left';
      ctx.fillText(`μ = ${mu.toFixed(2)}, σ = ${sigma.toFixed(2)}`, W - 220, 28);
      ctx.fillStyle = C.style;
      ctx.fillText(`log L(μ) = ${ll.toFixed(2)}`, W - 220, 48);
      ctx.fillStyle = C.structure;
      ctx.fillText(`NLL = ${(-ll).toFixed(2)}`, W - 220, 66);

      // 막대 표시
      const llBar = clamp((ll + 20) / 20, 0, 1);
      ctx.fillStyle = C.style + '55'; ctx.fillRect(W - 220, 78, 160 * llBar, 8);
      ctx.strokeStyle = C.style; ctx.strokeRect(W - 220, 78, 160, 8);

      // 데이터 평균
      const mean = data.reduce((a, b) => a + b) / data.length;
      ctx.fillStyle = C.inkFaint; ctx.font = '11px "Pretendard"';
      ctx.fillText(`데이터 평균 = ${mean.toFixed(3)} (= MLE 정답 μ̂)`, W - 220, 102);

      // 정답 표시
      const px = xToPix(mean);
      ctx.strokeStyle = C.synth; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(px, ax.padT); ctx.lineTo(px, H - ax.padB); ctx.stroke(); ctx.setLineDash([]);
    }

    const ctr = makeControls(`
      <div class="slider"><label>가우시안 중심 μ <b class="iv">1.20</b></label>
        <input type="range" min="0.2" max="2.6" step="0.02" value="1.20"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">데이터 점들이 가장 잘 설명되는 μ가 MLE 정답. 우도 ↑ = NLL ↓ . 두 곡선의 정점은 정확히 데이터 평균에서 만난다.</span>`);
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), iv = ctr.querySelector('.iv');
    sl.addEventListener('input', () => { iv.textContent = (+sl.value).toFixed(2); render(+sl.value); });
    render(1.20);
  };

  /* ============================================================
     WIDGET 08 — 베이지안 사전 → 사후 (sub-chapter 11·12)
     동전 던지기 예. 사전(Beta) + 데이터 → 사후(Beta).
     ============================================================ */
  NST.bayesPosterior = function (root) {
    const W = 720, H = 360;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    // Beta(α, β) PDF (정규화 무시한 형태로 시각화)
    function betaPdf(x, a, b) {
      if (x <= 0 || x >= 1) return 0;
      return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
    }

    function logBeta(a, b) {
      // 간단 근사: log B(a,b) = lgamma(a) + lgamma(b) - lgamma(a+b)
      function lgamma(z) {
        // Stirling 근사
        return (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * z);
      }
      return lgamma(a) + lgamma(b) - lgamma(a + b);
    }

    function normalize(fn, a, b) {
      let mx = 0;
      for (let i = 1; i < 100; i++) { mx = Math.max(mx, fn(i / 100, a, b)); }
      return mx;
    }

    function render(alpha, beta, H_obs, T_obs) {
      const ax = drawAxes(ctx, W, H, { xLabel: 'θ (앞면 확률)', yLabel: 'p(θ)', padL: 50 });
      const xToPix = (x) => ax.padL + x * ax.innerW;
      const yToPix = (y) => ax.padT + (1 - y) * ax.innerH;

      // 사전 Beta(alpha, beta)
      const mxPrior = normalize(betaPdf, alpha, beta);
      ctx.strokeStyle = C.structureLo; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 1; i < 200; i++) {
        const x = i / 200, y = betaPdf(x, alpha, beta) / mxPrior;
        const px = xToPix(x), py = yToPix(y * 0.9);
        i === 1 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);

      // 사후 Beta(alpha + H, beta + T)
      const a2 = alpha + H_obs, b2 = beta + T_obs;
      const mxPost = normalize(betaPdf, a2, b2);
      ctx.strokeStyle = C.style; ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 1; i < 200; i++) {
        const x = i / 200, y = betaPdf(x, a2, b2) / mxPost;
        const px = xToPix(x), py = yToPix(y * 0.9);
        i === 1 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 데이터 표시
      const mle = H_obs / (H_obs + T_obs || 1);
      const mapTheta = (a2 - 1) / (a2 + b2 - 2);
      ctx.strokeStyle = C.synth; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xToPix(mle), ax.padT); ctx.lineTo(xToPix(mle), H - ax.padB); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = C.ink; ctx.font = '12px "Spline Sans Mono"'; ctx.textAlign = 'left';
      ctx.fillText(`사전 Beta(${alpha}, ${beta})  →  사후 Beta(${a2}, ${b2})`, 56, 28);
      ctx.fillStyle = C.style;
      ctx.fillText(`MAP θ ≈ ${mapTheta.toFixed(3)}`, 56, 48);
      ctx.fillStyle = C.synth;
      ctx.fillText(`MLE θ̂ = H/(H+T) = ${mle.toFixed(3)}  (H=${H_obs}, T=${T_obs})`, 56, 66);

      // 범례
      ctx.fillStyle = C.structureLo; ctx.fillText('--- 사전 p(θ)', W - 180, 28);
      ctx.fillStyle = C.style; ctx.fillText('— 사후 p(θ|D)', W - 180, 46);
      ctx.fillStyle = C.synth; ctx.fillText('--- MLE', W - 180, 64);
    }

    const ctr = makeControls(`
      <div class="slider"><label>사전 α <b class="iv1">2</b></label>
        <input type="range" min="1" max="20" value="2" class="ia"></div>
      <div class="slider"><label>사전 β <b class="iv2">2</b></label>
        <input type="range" min="1" max="20" value="2" class="ib"></div>
      <div class="slider"><label>관측 앞면 H <b class="iv3">6</b></label>
        <input type="range" min="0" max="40" value="6" class="ih"></div>
      <div class="slider"><label>관측 뒷면 T <b class="iv4">4</b></label>
        <input type="range" min="0" max="40" value="4" class="it"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">사전이 평평할수록(α=β=1) 사후가 데이터를 그대로 따른다. 사전이 좁을수록 사후가 사전 쪽으로 끌려간다(정칙화 효과).</span>`);
    root.appendChild(ctr);

    function read() {
      const a = +ctr.querySelector('.ia').value;
      const b = +ctr.querySelector('.ib').value;
      const h = +ctr.querySelector('.ih').value;
      const t = +ctr.querySelector('.it').value;
      ctr.querySelector('.iv1').textContent = a;
      ctr.querySelector('.iv2').textContent = b;
      ctr.querySelector('.iv3').textContent = h;
      ctr.querySelector('.iv4').textContent = t;
      render(a, b, h, t);
    }
    ctr.querySelectorAll('input').forEach(i => i.addEventListener('input', read));
    read();
  };

  /* ============================================================
     WIDGET 09 — 가우시안 사전 = L2 정칙화 (sub-chapter 13)
     사전 분산 σ₀² 슬라이더 → 가중치 분포 + 적합 곡선 변화.
     ============================================================ */
  NST.l2AsGaussianPrior = function (root) {
    const W = 720, H = 380;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    const rng = seeded(11);
    const N = 12;
    const xs = [], ys = [];
    for (let i = 0; i < N; i++) { const x = i / (N - 1); xs.push(x); ys.push(Math.sin(2 * Math.PI * x) + seededGaussian(rng) * 0.25); }

    function fitRidge(deg, lambda) {
      const M = deg + 1;
      const X = []; for (let i = 0; i < N; i++) { const r = []; for (let j = 0; j < M; j++) r.push(Math.pow(xs[i], j)); X.push(r); }
      const XtX = []; for (let i = 0; i < M; i++) { const r = []; for (let j = 0; j < M; j++) { let s = 0; for (let k = 0; k < N; k++) s += X[k][i] * X[k][j]; r.push(s); } XtX.push(r); }
      const Xty = []; for (let i = 0; i < M; i++) { let s = 0; for (let k = 0; k < N; k++) s += X[k][i] * ys[k]; Xty.push(s); }
      for (let i = 0; i < M; i++) XtX[i][i] += lambda;
      const A = XtX.map((r, i) => r.concat([Xty[i]]));
      for (let i = 0; i < M; i++) {
        let mx = i; for (let k = i + 1; k < M; k++) if (Math.abs(A[k][i]) > Math.abs(A[mx][i])) mx = k;
        [A[i], A[mx]] = [A[mx], A[i]];
        for (let k = i + 1; k < M; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j <= M; j++) A[k][j] -= f * A[i][j]; }
      }
      const w = new Array(M).fill(0);
      for (let i = M - 1; i >= 0; i--) { let s = A[i][M]; for (let j = i + 1; j < M; j++) s -= A[i][j] * w[j]; w[i] = s / A[i][i]; }
      return w;
    }
    function pred(w, x) { let s = 0; for (let j = 0; j < w.length; j++) s += w[j] * Math.pow(x, j); return s; }

    function render(logSigma2) {
      // λ = σ²_noise / σ²_prior. σ_noise=0.25 가정.
      const sigmaPrior2 = Math.pow(10, logSigma2);
      const lambda = 0.0625 / sigmaPrior2;
      const deg = 10;
      const w = fitRidge(deg, lambda);

      ctx.fillStyle = C.paper2; ctx.fillRect(0, 0, W, H);
      // 좌측: 적합 곡선
      const ax = drawAxes(ctx, W / 2, H, { xLabel: 'x', yLabel: 'y', padL: 50 });
      const xP = (x) => ax.padL + x * ax.innerW;
      const yP = (y) => ax.padT + (1 - (y + 1.5) / 3) * ax.innerH;

      // 진짜 함수
      ctx.strokeStyle = C.structureLo; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = i / 200, y = Math.sin(2 * Math.PI * x); i ? ctx.lineTo(xP(x), yP(y)) : ctx.moveTo(xP(x), yP(y)); }
      ctx.stroke(); ctx.setLineDash([]);
      // 적합
      ctx.strokeStyle = C.style; ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = i / 200, y = pred(w, x); i ? ctx.lineTo(xP(x), yP(clamp(y, -2, 2))) : ctx.moveTo(xP(x), yP(clamp(y, -2, 2))); }
      ctx.stroke();
      // 데이터
      ctx.fillStyle = C.ink; xs.forEach((x, i) => { ctx.beginPath(); ctx.arc(xP(x), yP(ys[i]), 4, 0, 7); ctx.fill(); });

      // 우측: 가중치 막대
      const rx = W / 2 + 30, ry = 30, rw = W / 2 - 60, rh = H - 80;
      ctx.fillStyle = '#fff'; ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = C.inkFaint; ctx.strokeRect(rx, ry, rw, rh);
      const M = w.length;
      const bw = (rw - 20) / M;
      const maxW = Math.max(0.1, ...w.map(Math.abs));
      const mid = ry + rh / 2;
      ctx.strokeStyle = C.inkFaint; ctx.beginPath(); ctx.moveTo(rx, mid); ctx.lineTo(rx + rw, mid); ctx.stroke();
      for (let i = 0; i < M; i++) {
        const h = (w[i] / maxW) * (rh / 2 - 12);
        ctx.fillStyle = w[i] >= 0 ? C.structure : C.style;
        ctx.fillRect(rx + 10 + bw * i, mid - h, bw - 4, h);
      }
      ctx.fillStyle = C.ink; ctx.font = '12px "Spline Sans Mono"'; ctx.textAlign = 'left';
      ctx.fillText('가중치 w_j (j=0..10)', rx + 10, 24);

      // 정보
      const norm2 = w.reduce((s, x) => s + x * x, 0);
      ctx.fillStyle = C.ink; ctx.font = '12px "Spline Sans Mono"'; ctx.textAlign = 'left';
      ctx.fillText(`σ²_prior = ${sigmaPrior2.toFixed(3)}  →  λ = ${lambda.toFixed(3)}`, 56, H - 24);
      ctx.fillStyle = C.style;
      ctx.fillText(`‖w‖² = ${norm2.toFixed(2)}`, 56, H - 8);
    }

    const ctr = makeControls(`
      <div class="slider"><label>가우시안 사전 분산 log₁₀(σ²_prior) <b class="iv">0.0</b></label>
        <input type="range" min="-2" max="2" step="0.1" value="0.0"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">σ²이 작으면 사전이 0 근처로 좁아 λ가 커지고 → 강한 L2 정칙화. σ²이 크면 사전이 평평해져 λ가 작아지고 → MLE에 가까워진다.</span>`);
    root.appendChild(ctr);
    const sl = ctr.querySelector('input'), iv = ctr.querySelector('.iv');
    sl.addEventListener('input', () => { iv.textContent = (+sl.value).toFixed(1); render(+sl.value); });
    render(0.0);
  };

  /* ============================================================
     WIDGET 10 — 손실 함수 가족 (sub-chapter 08)
     같은 데이터, 다른 손실 (MSE, MAE, Huber, log-loss).
     ============================================================ */
  NST.lossFamily = function (root) {
    const W = 720, H = 320;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    const losses = {
      mse: { name: 'MSE  L = (y−ŷ)²', col: C.structure, fn: (e) => e * e },
      mae: { name: 'MAE  L = |y−ŷ|', col: C.style, fn: (e) => Math.abs(e) },
      huber: { name: 'Huber δ=1', col: C.synth, fn: (e) => Math.abs(e) <= 1 ? 0.5 * e * e : Math.abs(e) - 0.5 },
      ce: { name: '교차엔트로피 (이진)', col: C.styleLo, fn: (e) => { const p = 1 / (1 + Math.exp(-e * 3)); return -Math.log(clamp(p, 1e-6, 1 - 1e-6)); } },
    };

    let active = { mse: true, mae: true, huber: true, ce: false };

    function render() {
      const ax = drawAxes(ctx, W, H, { xLabel: '오차 e = y − ŷ', yLabel: '손실 L', padL: 48 });
      const xToPix = (e) => ax.padL + ((e + 3) / 6) * ax.innerW;
      const yToPix = (y) => ax.padT + (1 - y / 6) * ax.innerH;

      Object.entries(losses).forEach(([k, L]) => {
        if (!active[k]) return;
        ctx.strokeStyle = L.col; ctx.lineWidth = 2.2; ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const e = -3 + (i / 200) * 6;
          const y = clamp(L.fn(e), 0, 6);
          const px = xToPix(e), py = yToPix(y);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      });
      ctx.font = '12px "Spline Sans Mono"'; ctx.textAlign = 'left';
      let yo = 28;
      Object.entries(losses).forEach(([k, L]) => {
        ctx.fillStyle = active[k] ? L.col : C.inkFaint;
        ctx.fillText((active[k] ? '— ' : '· ') + L.name, W - 240, yo); yo += 18;
      });
    }

    const ctr = makeControls(`
      <div class="toggle-row">
        ${Object.entries(losses).map(([k, L]) => `<button class="btn lo-btn" data-k="${k}">${L.name.split(' ')[0]}</button>`).join('')}
      </div>
      <span style="font-size:.8rem;color:var(--ink-faint)">버튼으로 각 손실 곡선을 켜고 끈다. MSE는 큰 오차를 강하게 벌하고, MAE는 모든 오차를 같은 기울기로 벌한다. Huber는 둘의 절충, 교차엔트로피는 확률 예측에 쓴다.</span>`);
    root.appendChild(ctr);
    ctr.querySelectorAll('.lo-btn').forEach(b => {
      b.addEventListener('click', () => { active[b.dataset.k] = !active[b.dataset.k]; render(); });
    });
    render();
  };

  /* ============================================================
     WIDGET 11 — 용량과 표현 가능한 함수 (sub-chapter 03)
     선형 / 다항 / 신경망 — 가설 공간 크기 비교.
     ============================================================ */
  NST.hypothesisSpace = function (root) {
    const W = 720, H = 320;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    const families = {
      linear: { name: '선형 f(x)=ax+b', col: C.structure, samples: (rng) => () => { const a = (rng() - 0.5) * 3, b = (rng() - 0.5) * 2; return (x) => a * x + b; } },
      poly: { name: '3차 다항', col: C.style, samples: (rng) => () => { const a = (rng() - 0.5) * 6, b = (rng() - 0.5) * 4, c = (rng() - 0.5) * 2, d = (rng() - 0.5) * 1; return (x) => a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d; } },
      mlp: {
        name: '1-층 신경망 (h=6)', col: C.synth, samples: (rng) => () => {
          const w1 = []; const b1 = []; const w2 = []; const b2 = (rng() - 0.5) * 2;
          for (let i = 0; i < 6; i++) { w1.push((rng() - 0.5) * 6); b1.push((rng() - 0.5) * 3); w2.push((rng() - 0.5) * 3); }
          return (x) => { let s = b2; for (let i = 0; i < 6; i++) s += w2[i] * Math.max(0, w1[i] * x + b1[i]); return s; };
        }
      },
    };

    let family = 'linear';

    function render() {
      const ax = drawAxes(ctx, W, H, { xLabel: 'x', yLabel: 'f(x)', padL: 48 });
      const xP = (x) => ax.padL + ((x + 1) / 2) * ax.innerW;
      const yP = (y) => ax.padT + (1 - (y + 4) / 8) * ax.innerH;
      const fam = families[family];
      const rng = seeded(3);
      const mk = fam.samples(rng);
      for (let s = 0; s < 12; s++) {
        const f = mk();
        ctx.strokeStyle = fam.col + Math.floor(60 + Math.random() * 100).toString(16); ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) { const x = -1 + (i / 100) * 2; const y = clamp(f(x), -5, 5); i ? ctx.lineTo(xP(x), yP(y)) : ctx.moveTo(xP(x), yP(y)); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.ink; ctx.font = '13px "Fraunces"'; ctx.textAlign = 'left';
      ctx.fillText(`가설 공간: ${fam.name}`, 56, 24);
      ctx.fillStyle = C.inkFaint; ctx.font = '11px "Pretendard"';
      const hint = { linear: '두 개의 자유도(기울기·절편). 표현력이 가장 작다.', poly: '네 개의 자유도. 곡선을 그릴 수 있다.', mlp: '여섯 개 ReLU 유닛 + 출력층. 자유도 25개.' };
      ctx.fillText(hint[family], 56, H - 8);
    }

    const ctr = makeControls(`
      <div class="toggle-row">
        ${Object.entries(families).map(([k, f]) => `<button class="btn hs-btn" data-k="${k}">${f.name}</button>`).join('')}
      </div>
      <span style="font-size:.8rem;color:var(--ink-faint)">같은 입력 구간에서 각 가설 공간이 그려낼 수 있는 함수 12개를 무작위 표본으로 본다. 표현력의 차이가 눈으로 드러난다.</span>`);
    root.appendChild(ctr);
    ctr.querySelectorAll('.hs-btn').forEach(b => { b.addEventListener('click', () => { family = b.dataset.k; render(); }); });
    render();
  };

  /* ============================================================
     WIDGET 12 — 그라디언트 학습의 한계 풍경 (sub-chapter 14)
     비볼록 손실 곡선 위에서 출발점을 바꿔가며 경사하강을 돌려
     국소 최소·안장점·전역 최소가 어떻게 갈리는지 시연.
     ============================================================ */
  NST.gradLandscape = function (root) {
    const W = 720, H = 380;
    const { cv, ctx } = mkCanvas(W, H);
    root.appendChild(cv);

    // 비볼록 1차원 손실 J(θ) = sin(3θ)·0.4 + (θ-1.0)²·0.18 + 0.25
    // 국소 최소 두 개와 안장점 같은 평탄 구간을 동시에 가진다.
    function J(t) { return 0.4 * Math.sin(3 * t) + 0.18 * (t - 1.0) * (t - 1.0) + 0.25; }
    function dJ(t) { return 0.4 * 3 * Math.cos(3 * t) + 0.36 * (t - 1.0); }

    // 손실 풍경의 정의역
    const TMIN = -2.6, TMAX = 3.6;
    function tToPx(ax, t) { return ax.padL + ((t - TMIN) / (TMAX - TMIN)) * ax.innerW; }
    function jToPx(ax, j) { return ax.padT + (1 - (j - 0.0) / 1.6) * ax.innerH; }

    // 경사하강 궤적 계산 (학습률 lr, 최대 60 스텝)
    function trajectory(t0, lr, steps) {
      const path = [{ t: t0, j: J(t0) }];
      let t = t0;
      for (let i = 0; i < steps; i++) {
        const g = dJ(t);
        t = t - lr * g;
        if (t < TMIN) t = TMIN; if (t > TMAX) t = TMAX;
        path.push({ t, j: J(t) });
        if (Math.abs(g) < 1e-4) break;
      }
      return path;
    }

    function render(t0, lr) {
      const ax = drawAxes(ctx, W, H, { xLabel: '매개변수 θ', yLabel: '손실 J(θ)', padL: 50 });

      // 풍경 음영 (먼저 채우고 그 위에 윤곽선)
      ctx.fillStyle = C.structureLo + '18'; ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const t = TMIN + (i / 240) * (TMAX - TMIN);
        const px = tToPx(ax, t), py = jToPx(ax, clamp(J(t), 0, 1.6));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.lineTo(tToPx(ax, TMAX), jToPx(ax, 0));
      ctx.lineTo(tToPx(ax, TMIN), jToPx(ax, 0));
      ctx.closePath(); ctx.fill();

      // 손실 풍경 곡선
      ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const t = TMIN + (i / 240) * (TMAX - TMIN);
        const px = tToPx(ax, t), py = jToPx(ax, clamp(J(t), 0, 1.6));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();

      // 주요 임계점 표시
      // 수치적으로 dJ=0 을 찾아 마커
      const critical = [];
      let prev = dJ(TMIN);
      for (let i = 1; i <= 600; i++) {
        const t = TMIN + (i / 600) * (TMAX - TMIN);
        const cur = dJ(t);
        if (prev * cur < 0) critical.push(t - (TMAX - TMIN) / 1200);
        prev = cur;
      }
      let globalT = critical[0] || 0, globalJ = J(globalT);
      critical.forEach(t => { if (J(t) < globalJ) { globalT = t; globalJ = J(t); } });
      critical.forEach(t => {
        const j = J(t);
        const isGlobal = Math.abs(t - globalT) < 0.05;
        ctx.fillStyle = isGlobal ? C.style : C.synth;
        ctx.beginPath(); ctx.arc(tToPx(ax, t), jToPx(ax, j), isGlobal ? 6 : 4.5, 0, 7); ctx.fill();
        ctx.font = '10px "Spline Sans Mono", monospace'; ctx.fillStyle = isGlobal ? C.style : C.inkFaint;
        ctx.textAlign = 'center';
        ctx.fillText(isGlobal ? '전역' : '국소', tToPx(ax, t), jToPx(ax, j) + 18);
      });

      // 경사하강 궤적
      const path = trajectory(t0, lr, 60);
      ctx.strokeStyle = C.structure; ctx.lineWidth = 1.6; ctx.beginPath();
      path.forEach((p, i) => {
        const px = tToPx(ax, p.t), py = jToPx(ax, clamp(p.j, 0, 1.6));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.stroke();

      // 시작점 + 끝점
      const s = path[0], e = path[path.length - 1];
      ctx.fillStyle = C.inkSoft;
      ctx.beginPath(); ctx.arc(tToPx(ax, s.t), jToPx(ax, s.j), 5, 0, 7); ctx.fill();
      ctx.fillStyle = C.structure;
      ctx.beginPath(); ctx.arc(tToPx(ax, e.t), jToPx(ax, e.j), 6, 0, 7); ctx.fill();

      // 라벨 + 진단
      ctx.font = '12px "Spline Sans Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillStyle = C.ink;
      ctx.fillText(`출발 θ₀ = ${t0.toFixed(2)} ,  학습률 lr = ${lr.toFixed(2)}`, 56, 24);
      ctx.fillStyle = C.structure;
      ctx.fillText(`수렴 θ ≈ ${e.t.toFixed(2)}  ,  J ≈ ${e.j.toFixed(3)}`, 56, 42);

      // 전역 정답과 거리
      const dist = Math.abs(e.t - globalT);
      ctx.fillStyle = dist < 0.15 ? C.style : C.synth;
      const note = dist < 0.15 ? '전역 최소에 도달했다.'
        : Math.abs(dJ(e.t)) < 1e-3 ? '국소 최소에 갇혔다 (혹은 안장점에 머물렀다).'
        : '아직 수렴 중이다 — 스텝을 더 돌리거나 학습률을 키워야 한다.';
      ctx.fillText(note, 56, 60);
    }

    const ctr = makeControls(`
      <div class="slider"><label>출발점 θ₀ <b class="iv1">-2.0</b></label>
        <input type="range" min="-2.6" max="3.6" step="0.05" value="-2.0" class="it"></div>
      <div class="slider"><label>학습률 lr <b class="iv2">0.10</b></label>
        <input type="range" min="0.01" max="0.40" step="0.01" value="0.10" class="ir"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">θ₀를 좌·우로 옮기면 같은 학습률으로 시작해도 다른 최소로 흘러간다. 한 풍경 안에 국소 최소 여러 개가 있으면 경사하강이 어느 골짜기에 빠질지 미리 알 수 없다.</span>`);
    root.appendChild(ctr);
    function read() {
      const t = +ctr.querySelector('.it').value;
      const r = +ctr.querySelector('.ir').value;
      ctr.querySelector('.iv1').textContent = t.toFixed(2);
      ctr.querySelector('.iv2').textContent = r.toFixed(2);
      render(t, r);
    }
    ctr.querySelectorAll('input').forEach(i => i.addEventListener('input', read));
    read();
  };

  /* ============================================================
     WIDGET 13 — 시험 대비 Q&A 아코디언 (sub-chapter 15)
     ============================================================ */
  NST.accordion = function (root) {
    root.querySelectorAll('.qa').forEach(qa => {
      const q = qa.querySelector('.qa-q');
      q.addEventListener('click', () => qa.classList.toggle('open'));
    });
  };

  /* 자동 부팅 */
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof NST.initChrome === 'function') NST.initChrome();
    if (window.renderMathInElement && typeof NST.renderMath === 'function') NST.renderMath();
    else window.addEventListener('load', function () { if (typeof NST.renderMath === 'function') NST.renderMath(); });
  });
})();
