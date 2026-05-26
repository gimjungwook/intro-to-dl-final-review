/* ============================================================
   BERT 해설 — 공유 인터랙티브 위젯 (P4)
   THREE.js r128(global) 와 KaTeX 사용, file:// 호환
   ============================================================ */
(function () {
  'use strict';
  const BERT = (window.BERT = window.BERT || {});

  const css = getComputedStyle(document.documentElement);
  const C = {
    paper:  (css.getPropertyValue('--paper').trim()  || '#FAF7F0'),
    paper2: (css.getPropertyValue('--paper-2').trim()|| '#F3EEE3'),
    ink:    (css.getPropertyValue('--ink').trim()    || '#26221C'),
    inkS:   (css.getPropertyValue('--ink-soft').trim()|| '#5A5247'),
    inkF:   (css.getPropertyValue('--ink-faint').trim()|| '#8E8576'),
    bidir:  (css.getPropertyValue('--bidir').trim()  || '#1F6F7A'),
    bidirL: (css.getPropertyValue('--bidir-lo').trim()|| '#67A3AC'),
    mask:   (css.getPropertyValue('--mask').trim()   || '#B23A6F'),
    maskL:  (css.getPropertyValue('--mask-lo').trim()|| '#D687A7'),
    synth:  (css.getPropertyValue('--synth').trim() || '#A47B2E'),
  };
  BERT.colors = C;

  function clamp(x, a, b){ return Math.min(b, Math.max(a, x)); }
  function lerp(a, b, t){ return a + (b - a) * t; }

  /* ---------- 수식 렌더 ---------- */
  BERT.renderMath = function () {
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

  /* ---------- 챕터 목록 ---------- */
  BERT.CHAPTERS = [
    { no:'01', t:'BERT 이전의 자연어 처리',           f:'01.html' },
    { no:'02', t:'양방향 사전훈련의 발상',             f:'02.html' },
    { no:'03', t:'BERT의 구조 — Encoder 스택',         f:'03.html' },
    { no:'04', t:'입력 표현 — 세 임베딩의 합',         f:'04.html' },
    { no:'05', t:'특수 토큰 [CLS] [SEP] [MASK]',       f:'05.html' },
    { no:'06', t:'마스크 언어 모델 (MLM)',             f:'06.html' },
    { no:'07', t:'다음 문장 예측 (NSP)',               f:'07.html' },
    { no:'08', t:'사전훈련 데이터',                    f:'08.html' },
    { no:'09', t:'미세조정 1 — 문장 분류',             f:'09.html' },
    { no:'10', t:'미세조정 2 — 토큰 분류 (NER)',       f:'10.html' },
    { no:'11', t:'미세조정 3 — 문장 쌍 작업',          f:'11.html' },
    { no:'12', t:'GLUE 벤치마크',                       f:'12.html' },
    { no:'13', t:'BERT vs GPT vs T5',                  f:'13.html' },
    { no:'14', t:'시험 대비 — 정의·수식·예상 질문',    f:'14.html' },
  ];

  BERT.buildNav = function (currentNo) {
    const cur = BERT.CHAPTERS.find(c => c.no === currentNo);
    const tb = document.querySelector('.topbar');
    if (tb) tb.innerHTML =
      `<a class="home" href="index.html">← BERT 해설</a>` +
      `<span class="ch-mini">CHAPTER ${currentNo} / 14</span>`;
    const ol = document.querySelector('.ch-nav ol');
    if (ol) ol.innerHTML = BERT.CHAPTERS.map(c =>
      `<li><a href="${c.f}" ${c.no === currentNo ? 'class="current"' : ''}>${c.t}</a></li>`).join('');
    const foot = document.querySelector('.ch-foot');
    if (foot && cur) {
      const i = BERT.CHAPTERS.indexOf(cur);
      const prev = i > 0 ? BERT.CHAPTERS[i - 1] : { f:'index.html', t:'표지로', no:'' };
      const next = i < BERT.CHAPTERS.length - 1 ? BERT.CHAPTERS[i + 1] : { f:'index.html', t:'표지로', no:'' };
      foot.innerHTML =
        `<a href="${prev.f}"><div class="dir">← 이전</div><div class="ti">${prev.t}</div></a>` +
        `<a href="${next.f}" class="next"><div class="dir">다음 →</div><div class="ti">${next.t}</div></a>`;
    }
  };

  BERT.initChrome = function () {
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

  BERT.onVisible = function (el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver(ents => {
      ents.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { rootMargin: '120px' });
    io.observe(el);
  };

  /* ============================================================
     HERO — 양방향 파장 시각화
     좌→우 파장 (단방향, 흐릿한 회색) 위로
     양방향 파장 (청록·자홍, 마우스 위치에서 양쪽으로 뻗어 나감) 겹친다
     ============================================================ */
  BERT.hero = function (canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H;
    function resize() {
      const cssW = canvas.parentNode.clientWidth;
      const cssH = opts.height || 320;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      W = canvas.width; H = canvas.height;
    }
    resize(); window.addEventListener('resize', resize);

    let mx = 0.5, my = 0.5;   // 0..1
    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      mx = clamp((e.clientX - r.left) / r.width, 0, 1);
      my = clamp((e.clientY - r.top) / r.height, 0, 1);
    });
    canvas.addEventListener('pointerleave', () => { mx = 0.5; my = 0.5; });

    let t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / 1000;
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);

      // 배경 단방향 파장 (회색, 왼쪽→오른쪽으로만 진행)
      ctx.strokeStyle = C.inkF; ctx.globalAlpha = 0.18; ctx.lineWidth = 1 * dpr;
      for (let row = 0; row < 18; row++) {
        ctx.beginPath();
        const baseY = H * (0.12 + row * 0.05);
        for (let x = 0; x < W; x += 4 * dpr) {
          const phase = x / W * 4 + t * 0.5 + row * 0.3;
          const y = baseY + Math.sin(phase) * 4 * dpr;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 양방향 파장 — 두 점에서 좌우로 동심파처럼 퍼짐
      const cx = mx * W, cy = my * H;
      for (let r = 20; r < Math.max(W, H); r += 22 * dpr) {
        const a = clamp(1 - r / Math.max(W, H), 0, 1) * 0.55;
        // 양방향 → 청록 + 자홍 인터리브
        ctx.beginPath();
        ctx.strokeStyle = (Math.floor(r / 22) % 2 === 0) ? C.bidir : C.mask;
        ctx.globalAlpha = a;
        ctx.lineWidth = 1.4 * dpr;
        const wob = 5 * dpr * Math.sin(t * 1.6 + r * 0.01);
        ctx.arc(cx, cy, r + wob, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 토큰 점선 — 가운데 라인을 따라 흩어진 단어 위치 점
      const tokens = 24;
      const baseY = H * 0.78;
      for (let i = 0; i < tokens; i++) {
        const x = (i + 0.5) / tokens * W;
        const distToMouse = Math.abs(x - cx) / W;
        const r = 3 * dpr + 5 * dpr * Math.exp(-distToMouse * 7);
        // 가까운 토큰일수록 양방향 컬러로 점화
        const col = distToMouse < 0.18 ? (i % 2 === 0 ? C.bidir : C.mask) : C.inkS;
        ctx.fillStyle = col;
        ctx.globalAlpha = distToMouse < 0.18 ? 0.95 : 0.55;
        ctx.beginPath(); ctx.arc(x, baseY, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 캡션은 HTML 으로 별도

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /* ============================================================
     위젯 1 — 어텐션 매트릭스 (단방향 vs 양방향)
     ============================================================ */
  BERT.attnMatrix = function (host) {
    const tokens = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
    const wrap = document.createElement('div'); wrap.className = 'attn-stage';
    [
      { title: '단방향 (GPT 식)', side: 'left',  bg: 'ink' },
      { title: '양방향 (BERT 식)', side: 'both', bg: 'bidir' },
    ].forEach(spec => {
      const col = document.createElement('div'); col.className = 'col';
      const h = document.createElement('h5'); h.textContent = spec.title;
      col.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'attn-grid';
      grid.style.gridTemplateColumns = `repeat(${tokens.length + 1}, 22px)`;
      // 헤더 행
      grid.appendChild(blank());
      tokens.forEach(t => grid.appendChild(label(t)));
      // 데이터 행
      tokens.forEach((rowTok, i) => {
        grid.appendChild(label(rowTok));
        tokens.forEach((colTok, j) => {
          const c = document.createElement('div'); c.className = 'cell';
          let allow = false;
          if (spec.side === 'left')  allow = (j <= i);  // 자기와 왼쪽
          if (spec.side === 'both')  allow = true;       // 모두
          if (allow) {
            c.classList.add('allow');
            if (spec.side === 'left') c.classList.add('mask-side');
          }
          grid.appendChild(c);
        });
      });
      col.appendChild(grid);
      wrap.appendChild(col);
    });
    host.appendChild(wrap);
    function label(t){ const e = document.createElement('div'); e.className='label'; e.textContent = t; return e; }
    function blank(){ const e = document.createElement('div'); e.className='label'; return e; }
  };

  /* ============================================================
     위젯 2 — MLM 마스킹 데모
     사용자가 마스크 비율 슬라이더로 토큰을 가리면, 후보 단어
     예측 확률(가짜 데이터) 막대가 갱신된다.
     ============================================================ */
  BERT.mlmDemo = function (host) {
    const sentence = ['the', 'cat', 'sat', 'on', 'the', 'soft', 'mat', 'near', 'the', 'window'];
    // 각 단어별 그럴듯한 후보 분포 (정답을 1순위)
    const candidates = {
      'cat':  [['cat',0.62],['dog',0.18],['fox',0.09],['bird',0.06],['boy',0.05]],
      'mat':  [['mat',0.41],['rug',0.27],['floor',0.18],['bed',0.09],['chair',0.05]],
      'soft': [['soft',0.46],['warm',0.22],['old',0.14],['wet',0.10],['red',0.08]],
      'sat':  [['sat',0.55],['lay',0.20],['slept',0.12],['jumped',0.08],['stood',0.05]],
      'window':[['window',0.48],['door',0.22],['fire',0.14],['stove',0.10],['table',0.06]],
      'near': [['near',0.51],['by',0.22],['under',0.12],['behind',0.09],['beside',0.06]],
      'the':  [['the',0.78],['a',0.12],['that',0.05],['this',0.03],['its',0.02]],
      'on':   [['on',0.66],['by',0.14],['at',0.10],['in',0.06],['near',0.04]],
    };
    const state = { masked: new Set([1, 6]) }; // 'cat', 'mat' 가린 상태

    const tokRow = document.createElement('div'); tokRow.className = 'tok-row';
    sentence.forEach((w, i) => {
      const chip = document.createElement('div');
      chip.dataset.i = i;
      const t = document.createElement('span'); t.className = 't'; t.textContent = w;
      const ti = document.createElement('span'); ti.className = 'ti'; ti.textContent = 'tok ' + (i+1);
      chip.appendChild(t); chip.appendChild(ti);
      chip.addEventListener('click', () => {
        if (state.masked.has(i)) state.masked.delete(i); else state.masked.add(i);
        update();
      });
      chip.style.cursor = 'pointer';
      tokRow.appendChild(chip);
    });

    const out = document.createElement('div'); out.className = 'mlm-out';
    const hint = document.createElement('p');
    hint.style.cssText = 'font-family:var(--mono); font-size:.72rem; color:var(--ink-faint); padding:.4rem 1.2rem 0; margin:0;';
    hint.textContent = '토큰을 클릭해 [MASK] 처리. 마스크된 자리만 예측 손실에 들어간다.';

    host.appendChild(tokRow);
    host.appendChild(hint);
    host.appendChild(out);
    update();

    function update() {
      // 토큰 시각화 갱신
      tokRow.querySelectorAll('[data-i]').forEach(el => {
        const i = +el.dataset.i;
        const w = sentence[i];
        const sp = el.querySelector('.t');
        if (state.masked.has(i)) {
          el.className = 'tok masked';
          sp.textContent = '[MASK]';
        } else {
          el.className = 'tok';
          sp.textContent = w;
        }
      });
      // 예측 결과 렌더
      out.innerHTML = '';
      if (state.masked.size === 0) {
        const p = document.createElement('p');
        p.style.cssText = 'font-family:var(--mono); font-size:.78rem; color:var(--ink-faint); margin:.5rem 0 0;';
        p.textContent = '가린 자리가 없으므로 예측할 것이 없다. (손실 = 0)';
        out.appendChild(p);
        return;
      }
      [...state.masked].sort((a,b)=>a-b).forEach(idx => {
        const w = sentence[idx];
        const cands = candidates[w] || [[w, 0.5], ['…', 0.1]];
        const lab = document.createElement('div'); lab.className = 'label';
        lab.textContent = `Position ${idx+1} · 정답 = "${w}"`;
        out.appendChild(lab);
        cands.forEach((pair, k) => {
          const row = document.createElement('div'); row.className = 'mlm-bar' + (k===0 ? ' gold' : '');
          const wEl = document.createElement('div'); wEl.className = 'w'; wEl.textContent = pair[0];
          const bar = document.createElement('div'); bar.className = 'bar';
          const fill = document.createElement('i'); fill.style.width = (pair[1]*100).toFixed(0)+'%'; bar.appendChild(fill);
          const pct = document.createElement('div'); pct.className = 'pct'; pct.textContent = (pair[1]*100).toFixed(0)+'%';
          row.appendChild(wEl); row.appendChild(bar); row.appendChild(pct);
          out.appendChild(row);
        });
      });
    }
  };

  /* ============================================================
     위젯 3 — NSP 데모 (다음 문장 예측)
     두 문장을 토글하면 BERT 의 [CLS] 분류기가 IsNext / NotNext 예측
     ============================================================ */
  BERT.nspDemo = function (host) {
    const pairs = [
      {
        a: 'The man went to the store.',
        b: 'He bought a gallon of milk.',
        label: 'IsNext',
      },
      {
        a: 'The man went to the store.',
        b: 'Penguins are flightless birds.',
        label: 'NotNext',
      },
      {
        a: 'BERT uses a Transformer encoder stack.',
        b: 'Each layer applies multi-head self-attention.',
        label: 'IsNext',
      },
      {
        a: 'She finished writing the report at midnight.',
        b: 'The recipe calls for two cups of flour.',
        label: 'NotNext',
      },
    ];
    let idx = 0;

    const card = document.createElement('div'); card.className = 'nsp-card';
    const aRow = document.createElement('div'); aRow.className = 'nsp-sent';
    aRow.innerHTML = '<div class="lab a">SENT A</div><div class="body"></div>';
    const bRow = document.createElement('div'); bRow.className = 'nsp-sent';
    bRow.innerHTML = '<div class="lab b">SENT B</div><div class="body"></div>';
    const verdict = document.createElement('div'); verdict.className = 'nsp-verdict';
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:.5rem; margin-top:.8rem;';
    const btnNext = document.createElement('button'); btnNext.className = 'btn ghost'; btnNext.textContent = '다음 예시 →';
    const btnSwap = document.createElement('button'); btnSwap.className = 'btn ghost'; btnSwap.textContent = '문장 B 바꿔치기 (NotNext 강제)';

    btnNext.addEventListener('click', () => { idx = (idx + 1) % pairs.length; swapped = false; render(); });
    let swapped = false;
    btnSwap.addEventListener('click', () => { swapped = !swapped; render(); });

    btnRow.appendChild(btnNext); btnRow.appendChild(btnSwap);
    card.appendChild(aRow); card.appendChild(bRow); card.appendChild(verdict); card.appendChild(btnRow);
    host.appendChild(card);
    render();

    function render() {
      const p = pairs[idx];
      aRow.querySelector('.body').textContent = p.a;
      let bText = p.b;
      let label = p.label;
      if (swapped) {
        const other = pairs[(idx + 2) % pairs.length];
        bText = other.b;
        // 새 짝이 진짜로 이어지지 않는다고 가정
        label = 'NotNext';
      }
      bRow.querySelector('.body').textContent = bText;
      verdict.className = 'nsp-verdict ' + (label === 'IsNext' ? 'isnext' : 'notnext');
      verdict.textContent =
        label === 'IsNext'
        ? '[CLS] 자리 분류기 → IsNext (확률 약 92%) · NSP 손실 낮음'
        : '[CLS] 자리 분류기 → NotNext (확률 약 88%) · NSP 손실 낮음';
    }
  };

  /* ============================================================
     위젯 4 — 3단 임베딩 합 시각화
     토큰 임베딩 + 세그먼트 임베딩 + 위치 임베딩 = 입력 벡터
     ============================================================ */
  BERT.embStack = function (host) {
    const tokens   = ['[CLS]', 'my',  'dog',  'is',   'cute', '[SEP]', 'he',   'likes', 'play', '[SEP]'];
    const segments = ['A',     'A',   'A',    'A',    'A',    'A',     'B',    'B',     'B',    'B'   ];
    const stack = document.createElement('div'); stack.className = 'emb-stack';

    // 행 1: 토큰
    addRow('토큰 임베딩', 'tk', tokens.map(t => t));
    addRow('+', 'plus', null, true);
    addRow('세그먼트 임베딩', 'sg', segments.map(s => 'E_' + s), false, segments);
    addRow('+', 'plus', null, true);
    addRow('위치 임베딩', 'ps', tokens.map((_,i) => 'E_' + i));
    addRow('=', 'plus', null, true);
    addRow('입력 벡터', 'sum', tokens.map((_,i) => 'x_' + i));

    host.appendChild(stack);

    function addRow(name, klass, values, isPlus, segArr) {
      const row = document.createElement('div'); row.className = 'emb-row';
      if (isPlus) {
        row.innerHTML = '';
        const blank = document.createElement('div'); blank.className = 'name'; blank.textContent = '';
        const plus = document.createElement('div'); plus.className = 'emb-plus'; plus.textContent = name;
        row.appendChild(blank); row.appendChild(plus);
      } else {
        const n = document.createElement('div'); n.className = 'name'; n.innerHTML = '<b>' + name + '</b>';
        const cells = document.createElement('div'); cells.className = 'emb-cells';
        values.forEach((v, i) => {
          const c = document.createElement('div');
          let cls = 'emb-cell ' + klass;
          if (klass === 'sg' && segArr) cls += ' ' + (segArr[i] === 'A' ? 'a' : 'b');
          c.className = cls;
          c.textContent = v;
          cells.appendChild(c);
        });
        row.appendChild(n); row.appendChild(cells);
      }
      stack.appendChild(row);
    }
  };

  /* ============================================================
     위젯 5 — [CLS]·[SEP] 흐름도 (텍스트 다이어그램)
     입력 → 인코더 12층 → [CLS] 자리만 추출 → 분류기
     ============================================================ */
  BERT.clsFlow = function (host) {
    const flow = document.createElement('div'); flow.className = 'flow';
    const steps = [
      { kind:'input',  sym:'[CLS] my dog is cute [SEP] he likes play [SEP]',
        txt:'문장 두 개를 [SEP] 로 잇고, 맨 앞에 [CLS] 토큰을 둔다. 학습 가능한 빈 자리다.' },
      { kind:'layer',  sym:'Embedding (token + segment + position)',
        txt:'세 임베딩을 더해 한 벡터로 만든다. 모든 토큰에 적용.' },
      { kind:'layer',  sym:'Transformer Encoder × 12 (BASE)',
        txt:'각 층마다 multi-head self-attention 과 feed-forward 가 양방향으로 문맥을 섞는다.' },
      { kind:'head',   sym:'[CLS] 의 최종 벡터 C ∈ R^H 만 떼어 낸다',
        txt:'[CLS] 위치는 입력 토큰이 아니므로 자기 자신 정보가 없다. 양방향 어텐션이 두 문장 모두에서 정보를 끌어와 모은다.' },
      { kind:'head',   sym:'Linear(W ∈ R^{K×H}) + softmax',
        txt:'K 개 클래스(예: 분류는 K=2, NLI는 K=3) 로 보내는 작은 선형층 하나만 새로 학습한다.' },
      { kind:'loss',   sym:'L = − log P(y_true | x)',
        txt:'분류 손실(cross entropy). 사전훈련된 인코더 가중치와 분류기 가중치가 함께 미세조정된다.' },
    ];
    steps.forEach((s, i) => {
      const card = document.createElement('div'); card.className = 'flow-card ' + s.kind;
      card.innerHTML = `<div class="flow-sym">${s.sym}</div><div class="flow-txt">${s.txt}</div>`;
      flow.appendChild(card);
      if (i < steps.length - 1) {
        const ar = document.createElement('div'); ar.className = 'flow-arrow'; ar.textContent = '▼';
        flow.appendChild(ar);
      }
    });
    host.appendChild(flow);
  };

  /* ============================================================
     위젯 6 — GLUE 막대 그래프 비교
     ============================================================ */
  BERT.glueChart = function (host) {
    // (논문 Table 1 의 BERT_BASE 와 종전 GLUE leader / OpenAI GPT 비교)
    const rows = [
      { task:'MNLI-m',  prev:80.6, bert:84.6 },
      { task:'QQP',     prev:66.1, bert:71.2 },
      { task:'QNLI',    prev:82.3, bert:90.5 },
      { task:'SST-2',   prev:93.2, bert:93.5 },
      { task:'CoLA',    prev:35.0, bert:52.1 },
      { task:'STS-B',   prev:81.0, bert:85.8 },
      { task:'MRPC',    prev:86.0, bert:88.9 },
      { task:'RTE',     prev:61.7, bert:66.4 },
      { task:'Average', prev:75.1, bert:79.6 },
    ];
    const grid = document.createElement('div'); grid.className = 'glue-grid';
    // 헤더
    const hd = document.createElement('div'); hd.className = 'glue-row';
    hd.style.cssText = 'font-family:var(--mono); font-size:.66rem; letter-spacing:.1em; color:var(--ink-faint); text-transform:uppercase; padding-bottom:.4rem; border-bottom:1px solid var(--line-soft); margin-bottom:.3rem;';
    hd.innerHTML = '<div>Task</div><div>이전 SOTA</div><div style="text-align:right">점수</div><div>BERT BASE</div><div style="text-align:right">점수</div>';
    grid.appendChild(hd);
    rows.forEach(r => {
      const row = document.createElement('div'); row.className = 'glue-row';
      const prevPct = clamp(r.prev / 100, 0, 1);
      const bertPct = clamp(r.bert / 100, 0, 1);
      row.innerHTML = `
        <div class="task">${r.task}</div>
        <div class="bar prev"><i style="width:${prevPct*100}%"></i></div>
        <div class="pct">${r.prev.toFixed(1)}</div>
        <div class="bar bert"><i style="width:${bertPct*100}%"></i></div>
        <div class="pct">${r.bert.toFixed(1)}</div>`;
      grid.appendChild(row);
    });
    host.appendChild(grid);
    const legend = document.createElement('div');
    legend.style.cssText = 'padding:.5rem 1.2rem 1rem; font-family:var(--mono); font-size:.7rem; color:var(--ink-faint); display:flex; gap:1.2rem;';
    legend.innerHTML =
      '<span><i style="display:inline-block;width:11px;height:11px;background:var(--ink-faint);border-radius:3px;vertical-align:-1px"></i> 이전 SOTA (GPT 포함)</span>' +
      '<span><i style="display:inline-block;width:11px;height:11px;background:var(--bidir);border-radius:3px;vertical-align:-1px"></i> BERT BASE (110M)</span>';
    host.appendChild(legend);
  };

  /* ============================================================
     위젯 7 — Freeze / Unfreeze 토글
     사전훈련된 인코더를 동결(linear probe)할지, 함께 미세조정할지
     토글하면 예상 정확도가 바뀐다 (가짜 SST-2 수치).
     ============================================================ */
  BERT.freezeToggle = function (host) {
    const layers = 12;
    let trainCnt = layers; // 전부 학습 (전체 미세조정)
    let acc = 0.935;
    const stage = document.createElement('div'); stage.className = 'ft-stage';
    const accBox = document.createElement('div');
    accBox.style.cssText = 'display:flex; gap:1.2rem; padding:.5rem 0 1rem; font-family:var(--mono); font-size:.85rem;';
    accBox.innerHTML = '<span>SST-2 예상 정확도 <b id="ft-acc">93.5%</b></span><span>학습 파라미터 <b id="ft-prm">110M</b></span>';
    stage.appendChild(accBox);

    const bars = [];
    for (let L = layers; L >= 1; L--) {
      const row = document.createElement('div'); row.className = 'ft-row';
      row.innerHTML = `<div class="l">Layer ${L}</div>`;
      const bar = document.createElement('div'); bar.className = 'ft-bar';
      for (let k = 0; k < 12; k++) {
        const blk = document.createElement('div'); blk.className = 'ft-block train';
        bar.appendChild(blk);
      }
      row.appendChild(bar);
      stage.appendChild(row);
      bars.push(bar);
    }
    const toggle = document.createElement('div'); toggle.className = 'ft-toggle';
    const presets = [
      { label:'전체 미세조정 (BERT 권장)', train:12, acc:0.935, prm:'110M' },
      { label:'상위 4층만 학습',            train:4,  acc:0.918, prm:'28M' },
      { label:'분류기만 학습 (Linear probe)', train:0, acc:0.842, prm:'0.6M' },
    ];
    presets.forEach((p, i) => {
      const b = document.createElement('button'); b.className = 'btn ghost' + (i===0?' on':''); b.textContent = p.label;
      b.addEventListener('click', () => {
        toggle.querySelectorAll('.btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        trainCnt = p.train; acc = p.acc;
        update(p);
      });
      toggle.appendChild(b);
    });
    stage.appendChild(toggle);
    host.appendChild(stage);
    update(presets[0]);

    function update(p) {
      bars.forEach((bar, i) => {
        // 위에서부터 trainCnt 개 만 학습 (BERT 식 미세조정)
        const layerIndex = layers - i;   // 12,11,...,1
        const isTrain = layerIndex > layers - p.train;
        bar.querySelectorAll('.ft-block').forEach(blk => {
          blk.className = 'ft-block ' + (isTrain ? 'train' : 'frozen');
        });
      });
      document.getElementById('ft-acc').textContent = (p.acc*100).toFixed(1) + '%';
      document.getElementById('ft-prm').textContent = p.prm;
    }
  };

  /* ============================================================
     자동 부팅
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    BERT.initChrome();
    if (window.renderMathInElement) BERT.renderMath();
    else window.addEventListener('load', BERT.renderMath);
  });
})();
