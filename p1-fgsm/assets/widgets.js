/* ============================================================
   FGSM 해설 — 공유 인터랙티브 위젯
   순수 Canvas 2D · 외부 라이브러리는 KaTeX·THREE(hero)만 사용
   ============================================================ */
(function () {
  'use strict';
  const NST = (window.NST = window.NST || {});

  const css = getComputedStyle(document.documentElement);
  const C = {
    paper:     css.getPropertyValue('--paper').trim() || '#FAF7F0',
    paper2:    css.getPropertyValue('--paper-2').trim() || '#F2EEE5',
    ink:       css.getPropertyValue('--ink').trim() || '#221F1A',
    inkSoft:   css.getPropertyValue('--ink-soft').trim() || '#524B40',
    inkFaint:  css.getPropertyValue('--ink-faint').trim() || '#8A8273',
    structure: css.getPropertyValue('--structure').trim() || '#1F6B6E',
    structLo:  css.getPropertyValue('--structure-lo').trim() || '#62A0A3',
    style:     css.getPropertyValue('--style').trim() || '#C0492E',
    styleLo:   css.getPropertyValue('--style-lo').trim() || '#D98E73',
    synth:     css.getPropertyValue('--synth').trim() || '#B07F2C',
    grad:      css.getPropertyValue('--grad').trim() || '#6A4B8C',
  };
  NST.colors = C;

  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ============================================================
     프레임워크: 수식 · 진행바 · 네비
     ============================================================ */
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

  NST.CHAPTERS = [
    { no: '01', t: '적대적 예제란 무엇인가', f: '01.html' },
    { no: '02', t: 'panda → gibbon — ε=0.007의 충격', f: '02.html' },
    { no: '03', t: '오해 — "비선형이라 멀리 떨어진 점에 민감해서"', f: '03.html' },
    { no: '04', t: '진짜 원인 — 모델이 너무 "선형"이라서', f: '04.html' },
    { no: '05', t: '선형 가설 1 — w·δ 그리고 sign(∇)의 의미', f: '05.html' },
    { no: '06', t: '선형 가설 2 — 고차원에서 누적되는 nε', f: '06.html' },
    { no: '07', t: 'FGSM — Fast Gradient Sign Method 정의', f: '07.html' },
    { no: '08', t: 'FGSM 손계산 — 로지스틱 회귀 한 걸음', f: '08.html' },
    { no: '09', t: '적대적 훈련 — 정칙화로서의 의미', f: '09.html' },
    { no: '10', t: 'RBF의 견고함과 정확도-견고성 거래', f: '10.html' },
    { no: '11', t: '후속 공격들 — PGD, C&W', f: '11.html' },
    { no: '12', t: '시험 대비 체크리스트', f: '12.html' },
  ];

  NST.buildNav = function (currentNo) {
    const cur = NST.CHAPTERS.find(c => c.no === currentNo);
    const tb = document.querySelector('.topbar');
    if (tb) tb.innerHTML =
      `<a class="home" href="index.html">← FGSM 해설</a>` +
      `<span class="ch-mini">CHAPTER ${currentNo} / ${String(NST.CHAPTERS.length).padStart(2,'0')}</span>`;
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

  NST.accordion = function (root) {
    root.querySelectorAll('.qa').forEach(qa => {
      const q = qa.querySelector('.qa-q');
      q.addEventListener('click', () => qa.classList.toggle('open'));
    });
  };

  /* ============================================================
     HERO — 표지 입자: 정상 입력 격자 ↔ FGSM 노이즈로 흩어지는 모습
     ============================================================ */
  NST.hero = function (canvas, opts) {
    opts = opts || {};
    if (!window.THREE) { canvas.height = opts.height || 280; return; }
    const THREE = window.THREE;
    const wrap = canvas.parentElement;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    cam.position.set(0, 0, 3.0);

    const COLS = 100, ROWS = 56;
    const N = COLS * ROWS;
    const clean = new Float32Array(N * 3);
    const adv = new Float32Array(N * 3);
    const rnd = new Float32Array(N);
    const W = 3.2, H = 1.9;

    let p = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++, p++) {
        const cx = (c / (COLS - 1) - 0.5) * W;
        const cy = (r / (ROWS - 1) - 0.5) * H;
        // 정상: 미세하게 흔들리는 격자
        clean[p * 3] = cx;
        clean[p * 3 + 1] = cy;
        clean[p * 3 + 2] = Math.sin(cx * 1.4 + cy * 0.9) * 0.04;
        // FGSM: sign 함수로 흩어진 점 (±ε 두 군집)
        const signX = Math.sin(cx * 3.1 + cy * 1.7) > 0 ? 1 : -1;
        const signY = Math.cos(cx * 1.3 - cy * 2.4) > 0 ? 1 : -1;
        adv[p * 3] = cx + signX * 0.08;
        adv[p * 3 + 1] = cy + signY * 0.08;
        adv[p * 3 + 2] = (signX * signY) * 0.18 + Math.sin(cx * 4 + cy * 4) * 0.06;
        rnd[p] = Math.random();
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('aClean', new THREE.BufferAttribute(clean, 3));
    geo.setAttribute('aAdv', new THREE.BufferAttribute(adv, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
    geo.setAttribute('position', new THREE.BufferAttribute(clean.slice(), 3));

    const uniforms = {
      uMix: { value: 0 },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uColA: { value: new THREE.Color(C.structure) },
      uColB: { value: new THREE.Color(C.style) },
      uSize: { value: 8.5 * Math.min(devicePixelRatio, 2) },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false,
      vertexShader: `
        attribute vec3 aClean; attribute vec3 aAdv; attribute float aRand;
        uniform float uMix, uTime, uSize; uniform vec2 uMouse;
        varying float vM; varying float vA;
        void main(){
          float m = clamp(uMix + (aRand-0.5)*0.3, 0.0, 1.0);
          m = m*m*(3.0-2.0*m);
          vM = m;
          vec3 pos = mix(aClean, aAdv, m);
          float a = uTime*0.4 + aRand*6.28;
          pos.xy += vec2(cos(a), sin(a)) * m * 0.012;
          vec2 d = pos.xy - uMouse;
          float dist = length(d);
          float push = smoothstep(0.5, 0.0, dist) * 0.35;
          pos.xy += normalize(d + 0.0001) * push;
          vA = 0.55 + 0.45*(1.0-m) + push*0.6;
          vec4 mv = modelViewMatrix * vec4(pos,1.0);
          gl_PointSize = uSize * (1.0 / -mv.z) * (0.85 + m*0.45);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        precision mediump float;
        uniform vec3 uColA, uColB; varying float vM; varying float vA;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float alpha = smoothstep(0.5, 0.12, d) * vA;
          vec3 col = mix(uColA, uColB, vM);
          gl_FragColor = vec4(col, alpha);
        }`,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mNDC = new THREE.Vector2(99, 99);
    let targetMouse = new THREE.Vector3(99, 99, 0);
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mNDC.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(mNDC, cam);
      ray.ray.intersectPlane(plane, targetMouse);
    });
    canvas.addEventListener('pointerleave', () => { targetMouse.set(99, 99, 0); });

    function resize() {
      const w = wrap.clientWidth, h = opts.height || Math.round(w * 0.46);
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize); resize();

    let raf, t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / 1000;
      uniforms.uTime.value = t;
      uniforms.uMix.value = 0.5 - 0.5 * Math.cos(t * 0.34);
      uniforms.uMouse.value.x = lerp(uniforms.uMouse.value.x, targetMouse.x, 0.12);
      uniforms.uMouse.value.y = lerp(uniforms.uMouse.value.y, targetMouse.y, 0.12);
      points.rotation.y = Math.sin(t * 0.16) * 0.1;
      points.rotation.x = Math.sin(t * 0.12) * 0.045;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { stop() { cancelAnimationFrame(raf); }, uniforms };
  };

  /* ============================================================
     WIDGET 1 — panda → gibbon (ε 슬라이더)
     세 이미지: clean / sign(∇) / clean+ε·sign(∇)
     ============================================================ */
  function genPanda(ctx, W, H, eps, signMap) {
    // 그라데이션 + 검은 눈코로 그려낸 "판다 비스무리한" 합성 이미지
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const cx = (x - W/2) / (W/2);
        const cy = (y - H/2) / (H/2);
        const r2 = cx*cx + cy*cy;
        // 얼굴 흰색
        let R = 240, G = 235, B = 225;
        // 머리 윤곽
        if (r2 < 0.85) { R = 245; G = 240; B = 230; }
        else if (r2 < 1.1) { R = 80; G = 70; B = 60; }
        else { R = 80; G = 78; B = 75; }
        // 검은 귀
        const ear1 = Math.hypot(cx + 0.55, cy + 0.6) < 0.22;
        const ear2 = Math.hypot(cx - 0.55, cy + 0.6) < 0.22;
        if (ear1 || ear2) { R = 30; G = 26; B = 22; }
        // 검은 눈
        const eye1 = Math.hypot(cx + 0.25, cy + 0.15) < 0.16;
        const eye2 = Math.hypot(cx - 0.25, cy + 0.15) < 0.16;
        if (eye1 || eye2) { R = 35; G = 30; B = 26; }
        // 흰 눈 하이라이트
        const hl1 = Math.hypot(cx + 0.20, cy + 0.10) < 0.04;
        const hl2 = Math.hypot(cx - 0.20, cy + 0.10) < 0.04;
        if (hl1 || hl2) { R = 240; G = 240; B = 240; }
        // 검은 코
        if (Math.hypot(cx, cy - 0.05) < 0.06) { R = 25; G = 22; B = 20; }
        // 미세 결
        const grain = (Math.sin(x * 0.7) + Math.cos(y * 0.5)) * 4;
        R += grain; G += grain; B += grain;

        // ε * sign(∇) 추가
        if (signMap && eps > 0) {
          const k = (y * W + x);
          const sR = signMap[k * 3];
          const sG = signMap[k * 3 + 1];
          const sB = signMap[k * 3 + 2];
          R += sR * eps * 255;
          G += sG * eps * 255;
          B += sB * eps * 255;
        }

        const i = (y * W + x) * 4;
        d[i]   = clamp(R, 0, 255);
        d[i+1] = clamp(G, 0, 255);
        d[i+2] = clamp(B, 0, 255);
        d[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // sign 맵 미리 생성 (재현 가능한 의사 노이즈)
  function makeSignMap(W, H) {
    const map = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = (y * W + x) * 3;
        const s1 = Math.sin(x * 0.31 + y * 0.27) + Math.cos(x * 0.13 - y * 0.41);
        const s2 = Math.sin(x * 0.19 - y * 0.43) + Math.cos(x * 0.37 + y * 0.11);
        const s3 = Math.sin(x * 0.23 + y * 0.17) - Math.cos(x * 0.29 - y * 0.31);
        map[k]   = s1 > 0 ? 1 : -1;
        map[k+1] = s2 > 0 ? 1 : -1;
        map[k+2] = s3 > 0 ? 1 : -1;
      }
    }
    return map;
  }

  function renderSignViz(ctx, W, H, signMap) {
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = (y * W + x);
        const sR = signMap[k * 3];
        const i = (y * W + x) * 4;
        // +1 = 코랄, -1 = 청록
        if (sR > 0) {
          d[i] = 192; d[i+1] = 73; d[i+2] = 46;
        } else {
          d[i] = 31; d[i+1] = 107; d[i+2] = 110;
        }
        d[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  NST.pandaFGSM = function (root) {
    const W = 200, H = 200;
    const signMap = makeSignMap(W, H);

    const stage = document.createElement('div');
    stage.className = 'panda-stage';
    stage.innerHTML = `
      <div class="panda-card clean">
        <canvas width="${W}" height="${H}"></canvas>
        <div class="lbl">x — 정상 입력<br><b>"panda" · 57.7%</b></div>
      </div>
      <div class="panda-op">+ ε ·</div>
      <div class="panda-card pert">
        <canvas width="${W}" height="${H}"></canvas>
        <div class="lbl">sign(∇<sub>x</sub> L)<br><b>"nematode" · 8.2%</b></div>
      </div>
      <div class="panda-op">=</div>
      <div class="panda-card adv">
        <canvas width="${W}" height="${H}"></canvas>
        <div class="lbl">x̃ — 적대적 입력<br><b class="advLabel">"panda" · 51.0%</b></div>
      </div>`;
    root.appendChild(stage);

    const cans = root.querySelectorAll('canvas');
    const cCtx = cans[0].getContext('2d');
    const pCtx = cans[1].getContext('2d');
    const aCtx = cans[2].getContext('2d');

    genPanda(cCtx, W, H, 0, null);
    renderSignViz(pCtx, W, H, signMap);

    const ctr = document.createElement('div');
    ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>섭동 크기 ε (epsilon) <b class="iv">0.000</b></label>
        <input type="range" min="0" max="200" value="7" class="s-style"></div>
      <span style="font-size:.8rem;color:var(--ink-faint)">슬라이더로 ε을 0부터 0.2까지 키운다. 0.007 부근에서 라벨이 panda → gibbon으로 뒤집힌다.</span>`;
    root.appendChild(ctr);

    const sl = ctr.querySelector('input');
    const iv = ctr.querySelector('.iv');
    const advLabel = root.querySelector('.advLabel');

    // ε에 따른 라벨 변화 (논문 panda → gibbon 99.3%를 단계적으로 보간)
    function labelFor(eps) {
      if (eps < 0.003) return { name: 'panda', pct: (57.7 - eps * 1500).toFixed(1) };
      if (eps < 0.007) return { name: 'panda', pct: (51.0 - (eps - 0.003) * 5000).toFixed(1) };
      if (eps < 0.012) return { name: 'gibbon', pct: (60 + (eps - 0.007) * 6000).toFixed(1) };
      if (eps < 0.05)  return { name: 'gibbon', pct: Math.min(99.3, 90 + (eps - 0.012) * 250).toFixed(1) };
      return { name: 'noise', pct: '–' };
    }
    function rerender() {
      const eps = +sl.value / 1000;
      iv.textContent = eps.toFixed(3);
      genPanda(aCtx, W, H, eps, signMap);
      const lab = labelFor(eps);
      advLabel.textContent = `"${lab.name}" · ${lab.pct}%`;
    }
    sl.addEventListener('input', rerender);
    rerender();
  };

  /* ============================================================
     WIDGET 2 — 1D / 2D 선형 가설 시각화
     선형 모델 wᵀx에서 ε · sign(w) 가 만드는 변화
     ============================================================ */
  NST.linearGrowth = function (root) {
    const can = document.createElement('canvas');
    can.width = 720; can.height = 320;
    const stage = document.createElement('div');
    stage.className = 'lin1d-stage';
    stage.appendChild(can);
    const read = document.createElement('div');
    read.className = 'lin-read';
    stage.appendChild(read);
    root.appendChild(stage);

    const ctr = document.createElement('div');
    ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>차원 수 n (dimensions) <b class="iv">10</b></label>
        <input type="range" min="1" max="200" value="10" class="dim"></div>
      <div class="slider"><label>섭동 크기 ε (epsilon) <b class="ie">0.05</b></label>
        <input type="range" min="0" max="100" value="50" class="eps s-style"></div>`;
    root.appendChild(ctr);

    const ctx = can.getContext('2d');
    const dimSl = ctr.querySelector('.dim');
    const epsSl = ctr.querySelector('.eps');
    const dimVal = ctr.querySelectorAll('.iv')[0];
    const epsVal = ctr.querySelectorAll('.ie')[0];

    function draw() {
      const n = +dimSl.value;
      const eps = +epsSl.value / 1000;
      dimVal.textContent = n;
      epsVal.textContent = eps.toFixed(3);

      const W = can.width, H = can.height;
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);

      // 격자
      ctx.strokeStyle = 'rgba(34,31,26,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = (W - 80) * i / 10 + 40;
        ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 40); ctx.stroke();
      }
      for (let i = 0; i <= 4; i++) {
        const y = (H - 60) * i / 4 + 20;
        ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke();
      }

      // 가로 축: w_i (i=1..n), 세로 축: 누적 wᵀδ
      // 가중치를 무작위로 생성 (재현 가능)
      const ws = [];
      for (let i = 0; i < n; i++) {
        ws.push(Math.sin(i * 0.91 + 1.7) * 0.5 + Math.cos(i * 0.31) * 0.5);
      }
      // 누적
      const cum = [];
      let s = 0;
      for (let i = 0; i < n; i++) {
        s += eps * Math.abs(ws[i]); // ε · |w_i| (sign과 곱하면 부호가 맞으므로 절대값)
        cum.push(s);
      }
      const maxV = cum[n - 1] || 1;
      const yScale = (H - 60) / (maxV * 1.15 + 0.001);

      // 누적 곡선
      ctx.strokeStyle = C.style;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = 40 + (W - 80) * (i / Math.max(n - 1, 1));
        const y = H - 40 - cum[i] * yScale;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();

      // 점
      for (let i = 0; i < n; i++) {
        const x = 40 + (W - 80) * (i / Math.max(n - 1, 1));
        const y = H - 40 - cum[i] * yScale;
        ctx.fillStyle = C.style;
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill();
      }

      // 축 라벨
      ctx.fillStyle = C.inkFaint;
      ctx.font = '12px "Spline Sans Mono", monospace';
      ctx.fillText('차원 인덱스 i →', W - 130, H - 14);
      ctx.save();
      ctx.translate(14, 20);
      ctx.rotate(Math.PI / 2);
      ctx.fillText('누적 변화 wᵀδ →', 0, 0);
      ctx.restore();

      ctx.fillStyle = C.style;
      ctx.font = 'bold 13px "Spline Sans Mono", monospace';
      ctx.fillText(`총 변화 = ε · ‖w‖₁ ≈ ${maxV.toFixed(3)}`, 50, 36);
      ctx.fillStyle = C.inkSoft;
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText(`n = ${n} · ε = ${eps.toFixed(3)} · 평균 |w_i| ≈ ${(maxV / (n * eps + 1e-9)).toFixed(2)}`, 50, 54);

      // 본문
      read.innerHTML =
        `<b class="style">각 픽셀은 ε만큼만 움직였다.</b> 그러나 ` +
        `<b class="struct">n = ${n}개의 차원이 함께</b> 같은 방향으로 더해지면, ` +
        `wᵀ에 누적된 변화는 <b class="synth">${maxV.toFixed(3)}</b>까지 커진다. ` +
        `ε이 그대로여도 <b>n이 커지면 효과는 비례해 자란다</b>. 이것이 고차원 입력 공간이 적대적 섭동에 취약한 핵심 이유다.`;
    }
    dimSl.addEventListener('input', draw);
    epsSl.addEventListener('input', draw);
    draw();
  };

  /* ============================================================
     WIDGET 3 — 고차원 누적 막대
     n개 차원이 모두 같은 방향으로 ε씩 움직이면 합이 nε
     ============================================================ */
  NST.dimAccum = function (root) {
    const stage = document.createElement('div');
    stage.className = 'dim-stage';
    const bars = document.createElement('div');
    bars.className = 'dim-bars';
    stage.appendChild(bars);
    const sum = document.createElement('div');
    sum.className = 'dim-sum';
    stage.appendChild(sum);
    root.appendChild(stage);

    const ctr = document.createElement('div');
    ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>차원 수 n <b class="iv">784</b></label>
        <input type="range" min="1" max="2000" value="784" class="dim s-structure"></div>
      <div class="slider"><label>섭동 크기 ε <b class="ie">0.01</b></label>
        <input type="range" min="1" max="200" value="10" class="eps s-style"></div>
      <span style="font-size:.78rem;color:var(--ink-faint)">MNIST = 28×28 = 784차원. ImageNet = 224×224×3 ≈ 150,000차원.</span>`;
    root.appendChild(ctr);

    const dimSl = ctr.querySelector('.dim');
    const epsSl = ctr.querySelector('.eps');

    function draw() {
      const n = +dimSl.value;
      const eps = +epsSl.value / 1000;
      ctr.querySelectorAll('.iv')[0].textContent = n;
      ctr.querySelectorAll('.ie')[0].textContent = eps.toFixed(3);

      const display = Math.min(n, 60);
      bars.innerHTML = '';
      for (let i = 0; i < display; i++) {
        const div = document.createElement('div');
        div.className = 'col';
        // 모든 픽셀이 동일하게 +ε씩 → 같은 색
        const h = 6 + Math.random() * 6; // 살짝 시각 변동
        div.style.height = h + '%';
        bars.appendChild(div);
      }
      // 모든 막대를 ε에 비례한 높이로
      bars.querySelectorAll('.col').forEach(c => {
        c.style.height = (eps * 100 * 8) + '%';
      });

      const total = n * eps;
      sum.innerHTML =
        `각 차원 변화 = <b style="color:var(--style)">±${eps.toFixed(3)}</b> &nbsp;·&nbsp; ` +
        `차원 수 = <b style="color:var(--structure)">${n}</b><br>` +
        `총 누적 변화 = n · ε = <span>${total.toFixed(2)}</span>`;
    }
    dimSl.addEventListener('input', draw);
    epsSl.addEventListener('input', draw);
    draw();
  };

  /* ============================================================
     WIDGET 4 — FGSM 손계산 (로지스틱 회귀)
     입력 x = (1, 2), 가중치 w = (-0.5, 0.8), 정답 y = 1
     단계별로 손실 → 기울기 → sign → x + ε·sign(∇) 표시
     ============================================================ */
  NST.fgsmCalc = function (root) {
    const stage = document.createElement('div');
    stage.className = 'calc-stage';

    // 손계산 그리드: x, w, 점수, 시그모이드, 손실, 기울기, 부호, ε·sign, x̃
    const grid = document.createElement('div');
    grid.className = 'calc-grid';
    grid.innerHTML = `
      <div class="calc-cell before"><div class="k">입력 x</div><div class="v">(1.0, 2.0)</div></div>
      <div class="calc-cell before"><div class="k">가중치 w</div><div class="v">(−0.5, 0.8)</div></div>
      <div class="calc-cell label"><div class="k">정답 y</div><div class="v">1</div></div>
      <div class="calc-cell before"><div class="k">점수 z = wᵀx</div><div class="v score">−0.5 · 1 + 0.8 · 2 = 1.1</div></div>
      <div class="calc-cell before"><div class="k">σ(z) (예측 확률)</div><div class="v sig">0.7503</div></div>
      <div class="calc-cell before"><div class="k">손실 L</div><div class="v loss">−log(0.7503) = 0.2873</div></div>
      <div class="calc-flow">↓ 입력 x에 대한 기울기 ∇<sub>x</sub> L = (σ(z) − y) · w</div>
      <div class="calc-cell after"><div class="k">∇ₓL</div><div class="v grad">(0.1249, −0.1998)</div></div>
      <div class="calc-cell after"><div class="k">sign(∇ₓL)</div><div class="v sig2">(+1, −1)</div></div>
      <div class="calc-cell after"><div class="k">ε · sign</div><div class="v escale">(+ε, −ε)</div></div>
      <div class="calc-flow">↓ x̃ = x + ε · sign(∇<sub>x</sub> L) — 손실을 키우는 방향으로 한 걸음</div>
      <div class="calc-cell after"><div class="k">x̃ (적대적 입력)</div><div class="v xtil">(1+ε, 2−ε)</div></div>
      <div class="calc-cell after"><div class="k">새 점수 z̃</div><div class="v ztil">1.1 − 1.3ε</div></div>
      <div class="calc-cell after"><div class="k">새 확률 σ(z̃)</div><div class="v sigt">0.7503 → 낮아짐</div></div>
      <div class="calc-cell after"><div class="k">새 손실 L̃</div><div class="v losst">0.2873 → 커짐</div></div>
    `;
    stage.appendChild(grid);
    root.appendChild(stage);

    const ctr = document.createElement('div');
    ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>섭동 크기 ε <b class="iv">0.2</b></label>
        <input type="range" min="0" max="500" value="200" class="s-style"></div>
      <span style="font-size:.78rem;color:var(--ink-faint)">로지스틱 회귀, 입력 2차원. 한 걸음 FGSM. 큰 ε에서는 1차 근사가 깨진다.</span>`;
    root.appendChild(ctr);

    const sl = ctr.querySelector('input');
    const iv = ctr.querySelector('.iv');

    function sigma(z) { return 1 / (1 + Math.exp(-z)); }

    function update() {
      const eps = +sl.value / 1000;
      iv.textContent = eps.toFixed(3);
      grid.querySelector('.escale').textContent = `(+${eps.toFixed(3)}, −${eps.toFixed(3)})`;
      const x1 = 1 + eps, x2 = 2 - eps;
      grid.querySelector('.xtil').textContent = `(${x1.toFixed(3)}, ${x2.toFixed(3)})`;
      const zT = -0.5 * x1 + 0.8 * x2;
      grid.querySelector('.ztil').textContent = `${zT.toFixed(3)}  (1.1 − 1.3 · ${eps.toFixed(3)})`;
      const sT = sigma(zT);
      grid.querySelector('.sigt').textContent = `${sT.toFixed(4)} (정답 1과 멀어짐)`;
      const lT = -Math.log(sT);
      grid.querySelector('.losst').textContent = `${lT.toFixed(4)} (커짐)`;
    }
    sl.addEventListener('input', update);
    update();
  };

  /* ============================================================
     WIDGET 5 — 결정경계: 일반 모델 vs 적대적 훈련 모델
     2D 점 분류 + ε-반경 표시. 토글로 두 결정경계 비교
     ============================================================ */
  NST.advBoundary = function (root) {
    const stage = document.createElement('div');
    stage.className = 'boundary-stage';
    const can = document.createElement('canvas');
    can.width = 520; can.height = 400;
    stage.appendChild(can);
    const meta = document.createElement('div');
    meta.className = 'boundary-meta';
    meta.innerHTML = `
      <div class="stat s1"><div class="k">정상 정확도</div><div class="v acc">—</div></div>
      <div class="stat s2"><div class="k">적대적 정확도 (ε=0.1)</div><div class="v adv">—</div></div>`;
    stage.appendChild(meta);
    root.appendChild(stage);

    const ctr = document.createElement('div');
    ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="toggle-row">
        <button class="btn ghost on" data-m="normal">일반 훈련</button>
        <button class="btn ghost" data-m="adv">적대적 훈련</button>
      </div>
      <div class="slider" style="flex:1"><label>적대적 반경 ε <b class="iv">0.10</b></label>
        <input type="range" min="0" max="300" value="100" class="s-style"></div>
      <span style="font-size:.78rem;color:var(--ink-faint)">각 점에 ε 반경 원을 그려, 경계와 부딪히면 그 점은 적대적 공격에 뒤집힌다.</span>`;
    root.appendChild(ctr);

    const ctx = can.getContext('2d');
    let mode = 'normal';
    const sl = ctr.querySelector('input');
    const iv = ctr.querySelector('.iv');

    // 의사 2D 데이터: 두 군집
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * Math.PI * 2;
      const r = 0.35 + (i % 4) * 0.04;
      pts.push({ x: -0.4 + Math.cos(a) * r * 0.5, y: 0.1 + Math.sin(a) * r * 0.5, c: 0 });
      pts.push({ x: 0.4 + Math.cos(a) * r * 0.5, y: -0.1 + Math.sin(a) * r * 0.5, c: 1 });
    }

    function decide(x, y, m) {
      // 일반 훈련: 좁은 결정경계 (꼬불꼬불, 데이터에 딱 붙음)
      if (m === 'normal') {
        return x + Math.sin(y * 5) * 0.07 > 0 ? 1 : 0;
      }
      // 적대적 훈련: 부드러운 결정경계 (margin 큼)
      return x > 0 ? 1 : 0;
    }

    function draw() {
      const eps = +sl.value / 1000;
      iv.textContent = eps.toFixed(3);
      const W = can.width, H = can.height;
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);

      // 결정 영역 음영
      const img = ctx.createImageData(W, H);
      const d = img.data;
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const x = (px / W - 0.5) * 2.4;
          const y = (py / H - 0.5) * 2.0;
          const cls = decide(x, y, mode);
          const i = (py * W + px) * 4;
          if (cls === 0) {
            d[i] = 31; d[i+1] = 107; d[i+2] = 110; d[i+3] = 28;
          } else {
            d[i] = 192; d[i+1] = 73; d[i+2] = 46; d[i+3] = 28;
          }
        }
      }
      ctx.putImageData(img, 0, 0);

      // ε 반경 원
      let totalAcc = 0, advAcc = 0;
      for (const p of pts) {
        const sx = (p.x / 2.4 + 0.5) * W;
        const sy = (p.y / 2.0 + 0.5) * H;
        // 정상 분류
        const cls = decide(p.x, p.y, mode);
        if (cls === p.c) totalAcc++;

        // 적대적: ε 반경 안에 다른 클래스가 있는가?
        let robust = true;
        for (let a = 0; a < 8; a++) {
          const ang = a * Math.PI / 4;
          const cx2 = p.x + Math.cos(ang) * eps;
          const cy2 = p.y + Math.sin(ang) * eps;
          if (decide(cx2, cy2, mode) !== p.c) { robust = false; break; }
        }
        if (robust) advAcc++;

        // ε 원
        ctx.strokeStyle = robust ? 'rgba(31,107,110,0.4)' : 'rgba(192,73,46,0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(sx, sy, eps / 2.4 * W, 0, 7);
        ctx.stroke();
        ctx.setLineDash([]);
        // 점
        ctx.fillStyle = p.c === 0 ? C.structure : C.style;
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      }

      meta.querySelector('.acc').textContent = `${(totalAcc / pts.length * 100).toFixed(0)}% (${totalAcc}/${pts.length})`;
      meta.querySelector('.adv').textContent = `${(advAcc / pts.length * 100).toFixed(0)}% (${advAcc}/${pts.length})`;
    }

    ctr.querySelectorAll('button[data-m]').forEach(b => {
      b.addEventListener('click', () => {
        ctr.querySelectorAll('button[data-m]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        mode = b.dataset.m;
        draw();
      });
    });
    sl.addEventListener('input', draw);
    draw();
  };

  /* ============================================================
     WIDGET 6 — FGSM vs PGD 비교
     같은 ε 예산을 1회(FGSM)와 K회 반복(PGD)으로 쓰는 차이
     ============================================================ */
  NST.attackCompare = function (root) {
    const stage = document.createElement('div');
    stage.className = 'attack-stage';
    const can = document.createElement('canvas');
    can.width = 520; can.height = 360;
    stage.appendChild(can);
    const info = document.createElement('div');
    info.className = 'attack-info';
    info.innerHTML = `
      <div class="row f">FGSM (1회) <b class="ff">손실 ↑ 0.000</b></div>
      <div class="row p">PGD (K회) <b class="pp">손실 ↑ 0.000</b></div>`;
    stage.appendChild(info);
    root.appendChild(stage);

    const ctr = document.createElement('div');
    ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>섭동 예산 ε <b class="iv">0.30</b></label>
        <input type="range" min="0" max="600" value="300" class="s-style"></div>
      <div class="slider"><label>PGD 반복 K <b class="ik">7</b></label>
        <input type="range" min="1" max="30" value="7" class="s-structure k"></div>`;
    root.appendChild(ctr);

    const ctx = can.getContext('2d');
    const epsSl = ctr.querySelector('input.s-style');
    const kSl = ctr.querySelector('input.k');
    const iv = ctr.querySelector('.iv');
    const ik = ctr.querySelector('.ik');

    // 손실 풍경: 비선형. L(δ) = (sin(3 δx) + 0.5 (δx - 0.4)² + 0.3 cos(5 δy))
    function L(dx, dy) {
      return Math.sin(3 * dx) * 0.4 + 0.5 * Math.pow(dx - 0.4, 2) + 0.3 * Math.cos(5 * dy) - 0.2 * dy * dy;
    }
    function grad(dx, dy) {
      const e = 0.001;
      return [
        (L(dx + e, dy) - L(dx - e, dy)) / (2 * e),
        (L(dx, dy + e) - L(dx, dy - e)) / (2 * e),
      ];
    }
    function sign(v) { return v > 0 ? 1 : (v < 0 ? -1 : 0); }

    function draw() {
      const eps = +epsSl.value / 1000;
      const K = +kSl.value;
      iv.textContent = eps.toFixed(3);
      ik.textContent = K;

      const W = can.width, H = can.height;
      // 손실 풍경 히트맵
      const img = ctx.createImageData(W, H);
      const d = img.data;
      let lmin = Infinity, lmax = -Infinity;
      const grid = new Float32Array(W * H);
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const dx = (px / W - 0.5) * 1.6;
          const dy = (py / H - 0.5) * 1.6;
          const v = L(dx, dy);
          grid[py * W + px] = v;
          if (v < lmin) lmin = v;
          if (v > lmax) lmax = v;
        }
      }
      for (let i = 0; i < W * H; i++) {
        const t = (grid[i] - lmin) / (lmax - lmin + 1e-9);
        const r = Math.round(lerp(250, 110, t));
        const g = Math.round(lerp(247, 60, t));
        const b = Math.round(lerp(240, 50, t));
        d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 230;
      }
      ctx.putImageData(img, 0, 0);

      // ε 박스
      const sx = (v) => (v / 1.6 + 0.5) * W;
      const sy = (v) => (v / 1.6 + 0.5) * H;
      ctx.strokeStyle = 'rgba(34,31,26,0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(sx(-eps), sy(-eps), sx(eps) - sx(-eps), sy(eps) - sy(-eps));
      ctx.setLineDash([]);

      // FGSM: 1회 sign step
      const g0 = grad(0, 0);
      const fdx = eps * sign(g0[0]);
      const fdy = eps * sign(g0[1]);
      const fLoss = L(fdx, fdy) - L(0, 0);

      // PGD: K회 sign step (보폭 = ε/K, 박스에 투영)
      let pdx = 0, pdy = 0;
      const step = eps / K;
      const traj = [[0, 0]];
      for (let i = 0; i < K; i++) {
        const g = grad(pdx, pdy);
        pdx += step * sign(g[0]);
        pdy += step * sign(g[1]);
        pdx = clamp(pdx, -eps, eps);
        pdy = clamp(pdy, -eps, eps);
        traj.push([pdx, pdy]);
      }
      const pLoss = L(pdx, pdy) - L(0, 0);

      // 그리기: 원점
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(sx(0), sy(0), 4, 0, 7); ctx.fill();
      ctx.fillStyle = C.inkFaint;
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('x (원본)', sx(0) + 6, sy(0) - 6);

      // FGSM 화살표
      ctx.strokeStyle = C.style;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(0));
      ctx.lineTo(sx(fdx), sy(fdy));
      ctx.stroke();
      ctx.fillStyle = C.style;
      ctx.beginPath(); ctx.arc(sx(fdx), sy(fdy), 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('FGSM', sx(fdx) + 6, sy(fdy) - 6);

      // PGD 경로
      ctx.strokeStyle = C.structure;
      ctx.lineWidth = 2;
      ctx.beginPath();
      traj.forEach((p, i) => {
        i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1]));
      });
      ctx.stroke();
      for (let i = 1; i < traj.length; i++) {
        ctx.fillStyle = C.structure;
        ctx.beginPath(); ctx.arc(sx(traj[i][0]), sy(traj[i][1]), 3, 0, 7); ctx.fill();
      }
      ctx.fillStyle = C.structure;
      ctx.font = 'bold 11px "Spline Sans Mono", monospace';
      ctx.fillText('PGD', sx(pdx) + 6, sy(pdy) - 6);

      // 라벨
      ctx.fillStyle = C.inkSoft;
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('ε 박스 (∞-노름 제한)', sx(-eps) + 4, sy(-eps) - 4);

      info.querySelector('.ff').textContent = `손실 ↑ ${fLoss.toFixed(3)}`;
      info.querySelector('.pp').textContent = `손실 ↑ ${pLoss.toFixed(3)}`;
    }
    epsSl.addEventListener('input', draw);
    kSl.addEventListener('input', draw);
    draw();
  };

  /* 자동 부팅 */
  document.addEventListener('DOMContentLoaded', function () {
    NST.initChrome();
    if (window.renderMathInElement) NST.renderMath();
    else window.addEventListener('load', NST.renderMath);
  });
})();
