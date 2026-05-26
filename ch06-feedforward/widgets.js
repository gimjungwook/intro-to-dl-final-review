/* ============================================================
   Chapter 06 — 깊은 순방향 신경망 전용 위젯
   네임스페이스: CH6
   상위 NST.colors / NST.onVisible 등 공용 헬퍼 재사용
   ============================================================ */
(function(){
  'use strict';
  const CH6 = (window.CH6 = window.CH6 || {});

  const css = getComputedStyle(document.documentElement);
  const C = {
    paper:        css.getPropertyValue('--paper').trim() || '#FAF7F0',
    paper2:       css.getPropertyValue('--paper-2').trim() || '#F3EEE3',
    ink:          css.getPropertyValue('--ink').trim() || '#26221C',
    inkSoft:      css.getPropertyValue('--ink-soft').trim() || '#5A5247',
    inkFaint:     css.getPropertyValue('--ink-faint').trim() || '#8E8576',
    structure:    css.getPropertyValue('--structure').trim() || '#2D5B7A',
    structureLo:  css.getPropertyValue('--structure-lo').trim() || '#6E97AF',
    style:        css.getPropertyValue('--style').trim() || '#C0492E',
    styleLo:      css.getPropertyValue('--style-lo').trim() || '#D98E73',
    synth:        css.getPropertyValue('--synth').trim() || '#A47B2E',
    line:         'rgba(38,34,28,0.13)',
  };
  CH6.colors = C;

  function clamp(x,a,b){ return Math.min(b, Math.max(a,x)); }
  function lerp(a,b,t){ return a + (b-a)*t; }

  function frame(title, no){
    const f = document.createElement('div');
    f.className = 'widget-frame';
    f.innerHTML = `<div class="widget-label"><span class="lab-no">위젯 ${no}</span><span>${title}</span></div>`;
    return f;
  }

  /* ============================================================
     1. XOR 결정경계 — 단일 퍼셉트론(직선) vs 2-2-1 MLP
     사용자가 단일 퍼셉트론의 (w1, w2, b)를 슬라이더로 움직여
     절대 네 점을 분리할 수 없음을 체감, 토글로 MLP로 전환하면
     비선형 곡선 결정경계가 등장.
     ============================================================ */
  CH6.xor = function(root){
    root.innerHTML = `
      <div class="xor-stage">
        <canvas class="xor-cv" width="380" height="380"></canvas>
        <div class="xor-side">
          <div class="xor-mode">
            <button class="btn ghost on" data-m="lin">단일 퍼셉트론</button>
            <button class="btn ghost" data-m="mlp">2-2-1 MLP</button>
          </div>
          <div class="xor-ctr"></div>
          <div class="xor-status"></div>
          <div class="xor-truth">
            <table>
              <tr><th>x1</th><th>x2</th><th>XOR</th></tr>
              <tr><td>0</td><td>0</td><td>0</td></tr>
              <tr><td>1</td><td>0</td><td>1</td></tr>
              <tr><td>0</td><td>1</td><td>1</td></tr>
              <tr><td>1</td><td>1</td><td>0</td></tr>
            </table>
          </div>
        </div>
      </div>`;
    const cv = root.querySelector('.xor-cv');
    const ctx = cv.getContext('2d');
    const ctrEl = root.querySelector('.xor-ctr');
    const stat = root.querySelector('.xor-status');
    const W = 380, H = 380;
    const pts = [
      { x:0, y:0, t:0 }, { x:1, y:0, t:1 }, { x:0, y:1, t:1 }, { x:1, y:1, t:0 }
    ];
    let mode = 'lin';
    // 단일 퍼셉트론: y = sigmoid(w1*x1 + w2*x2 + b)
    let w1 = 1.0, w2 = 1.0, b = -0.5;
    // MLP: 정답 가중치 (XOR을 정확히 푸는 클래식 해)
    // h1 = ReLU(x1 + x2 - 0.5)  (OR-like)
    // h2 = ReLU(x1 + x2 - 1.5)  (AND-like)
    // y = sigmoid(h1 - 2*h2 - 0.3)  (OR - 2*AND)
    let mlpStrength = 1.0;

    function sigmoid(z){ return 1/(1+Math.exp(-z)); }
    function relu(z){ return Math.max(0, z); }
    function predLin(x1, x2){ return sigmoid(w1*x1 + w2*x2 + b); }
    function predMlp(x1, x2){
      const s = mlpStrength;
      const h1 = relu(s*(x1 + x2) - 0.5*s);
      const h2 = relu(s*(x1 + x2) - 1.5*s);
      return sigmoid(s*(h1 - 2*h2) - 0.3);
    }

    function draw(){
      ctx.fillStyle = C.paper;
      ctx.fillRect(0,0,W,H);
      // 결정 영역 (저해상도 히트맵)
      const cell = 6;
      const pad = 30;
      const inner = W - pad*2;
      for (let py = 0; py < inner; py += cell){
        for (let px = 0; px < inner; px += cell){
          const x1 = px/inner * 1.4 - 0.2;
          const x2 = 1 - (py/inner * 1.4 - 0.2);
          const v = (mode==='lin' ? predLin(x1, x2) : predMlp(x1, x2));
          // v < 0.5 → 쿨(구조), v > 0.5 → 웜(스타일)
          const t = v;
          const r = Math.round(lerp(45, 192, t));
          const g = Math.round(lerp(91, 73, t));
          const bl = Math.round(lerp(122, 46, t));
          ctx.fillStyle = `rgba(${r},${g},${bl},${0.18 + Math.abs(t-0.5)*0.4})`;
          ctx.fillRect(pad + px, pad + py, cell, cell);
        }
      }
      // 결정경계 (v=0.5 등고선)
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      const step = 2;
      for (let py = 0; py < inner; py += step){
        for (let px = 0; px < inner; px += step){
          const x1 = px/inner * 1.4 - 0.2;
          const x2 = 1 - (py/inner * 1.4 - 0.2);
          const v = (mode==='lin' ? predLin(x1,x2) : predMlp(x1,x2));
          const x1n = (px+step)/inner * 1.4 - 0.2;
          const vn = (mode==='lin' ? predLin(x1n,x2) : predMlp(x1n,x2));
          if ((v-0.5) * (vn-0.5) < 0){
            const cx = pad + px + step/2, cy = pad + py;
            if (!started){ ctx.moveTo(cx,cy); started = true; }
            else ctx.lineTo(cx,cy);
          }
        }
        started = false;
      }
      ctx.stroke();
      // 축
      ctx.strokeStyle = 'rgba(38,34,28,.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pad, pad, inner, inner);
      ctx.fillStyle = C.inkFaint;
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillText('x1', pad + inner - 12, pad + inner + 16);
      ctx.fillText('x2', pad - 18, pad + 6);
      ctx.fillText('0', pad - 4, pad + inner + 14);
      ctx.fillText('1', pad + inner - 4, pad + inner + 14);
      ctx.fillText('1', pad - 14, pad + 4);
      // 네 점
      let okCount = 0;
      pts.forEach(p => {
        const px = pad + (p.x + 0.2) / 1.4 * inner;
        const py = pad + (1 - (p.y + 0.2) / 1.4) * inner;
        const v = (mode==='lin' ? predLin(p.x, p.y) : predMlp(p.x, p.y));
        const pred = v > 0.5 ? 1 : 0;
        const ok = (pred === p.t);
        if (ok) okCount++;
        // 정답 색 = 클래스
        ctx.fillStyle = p.t === 0 ? C.structure : C.style;
        ctx.strokeStyle = ok ? C.ink : '#c0392b';
        ctx.lineWidth = ok ? 2 : 3;
        ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Spline Sans Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.t, px, py);
        ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      });
      // 상태
      stat.innerHTML = `<b>정답률 ${okCount}/4</b> · ${mode==='lin' ? '단일 퍼셉트론은 직선 하나만 그을 수 있다.' : 'MLP는 두 개의 직선을 합쳐 비선형 영역을 만든다.'}`;
      stat.style.color = okCount === 4 ? C.structure : (mode==='lin' ? C.style : C.synth);
    }

    function buildCtr(){
      if (mode === 'lin'){
        ctrEl.innerHTML = `
          <div class="slider"><label>w<sub>1</sub> <b class="v1">${w1.toFixed(2)}</b></label><input type="range" min="-3" max="3" step="0.05" value="${w1}" data-p="w1"></div>
          <div class="slider"><label>w<sub>2</sub> <b class="v2">${w2.toFixed(2)}</b></label><input type="range" min="-3" max="3" step="0.05" value="${w2}" data-p="w2"></div>
          <div class="slider"><label>b (편향) <b class="v3">${b.toFixed(2)}</b></label><input type="range" min="-3" max="3" step="0.05" value="${b}" data-p="b"></div>`;
        ctrEl.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
          const p = inp.dataset.p, v = parseFloat(inp.value);
          if (p==='w1'){ w1 = v; ctrEl.querySelector('.v1').textContent = v.toFixed(2); }
          if (p==='w2'){ w2 = v; ctrEl.querySelector('.v2').textContent = v.toFixed(2); }
          if (p==='b'){ b = v; ctrEl.querySelector('.v3').textContent = v.toFixed(2); }
          draw();
        }));
      } else {
        ctrEl.innerHTML = `
          <div class="slider"><label>가중치 강도 <b class="vs">${mlpStrength.toFixed(2)}</b></label><input type="range" min="0.2" max="3" step="0.05" value="${mlpStrength}"></div>
          <p class="xor-note">2-2-1 구조: 은닉 2개 = ReLU(<em>OR 직선</em>) − ReLU(<em>AND 직선</em>). 출력은 두 직선의 차로 만들어진 띠. 직선 두 개의 합성이 곡선을 만든다.</p>`;
        ctrEl.querySelector('input').addEventListener('input', (e) => {
          mlpStrength = parseFloat(e.target.value);
          ctrEl.querySelector('.vs').textContent = mlpStrength.toFixed(2);
          draw();
        });
      }
    }

    const modeBtns = root.querySelectorAll('.xor-mode button');
    modeBtns.forEach(b => b.addEventListener('click', () => {
      modeBtns.forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      mode = b.dataset.m;
      buildCtr(); draw();
    }));

    buildCtr(); draw();
  };

  /* ============================================================
     2. 활성화 함수 비교 — sigmoid / tanh / ReLU / LeakyReLU / ELU / GELU
     선택된 함수의 그래프 + 같은 z에 대한 함수값·기울기를 마우스 hover로 표시
     ============================================================ */
  CH6.activations = function(root){
    const FNS = {
      'sigmoid': { f: z => 1/(1+Math.exp(-z)),
                   d: z => { const s = 1/(1+Math.exp(-z)); return s*(1-s); },
                   note: '양 끝에서 포화 → 기울기 거의 0. 깊은 망에서 학습 어려움.' },
      'tanh':    { f: z => Math.tanh(z),
                   d: z => 1 - Math.tanh(z)*Math.tanh(z),
                   note: '0을 중심으로 대칭 → sigmoid보다 학습 잘됨. 그래도 양 끝 포화.' },
      'ReLU':    { f: z => Math.max(0, z),
                   d: z => z > 0 ? 1 : 0,
                   note: '양수 구간 기울기 1로 유지 → 기울기 소실 해소. 음수에서 죽음(dead).' },
      'Leaky ReLU': { f: z => z > 0 ? z : 0.1*z,
                     d: z => z > 0 ? 1 : 0.1,
                     note: '음수에서도 작은 기울기(0.1). 죽은 ReLU 문제 완화.' },
      'ELU':     { f: z => z > 0 ? z : (Math.exp(z) - 1),
                   d: z => z > 0 ? 1 : Math.exp(z),
                   note: '음수에서 부드럽게 -1로 수렴. 평균이 0에 가까워져 학습 안정.' },
      'GELU':    { f: z => 0.5*z*(1 + Math.tanh(Math.sqrt(2/Math.PI)*(z + 0.044715*z*z*z))),
                   d: z => { // 수치 미분
                     const h = 1e-4;
                     const f = FNS.GELU.f;
                     return (f(z+h) - f(z-h)) / (2*h);
                   },
                   note: 'BERT, GPT의 표준. 음수 살짝 통과시키되 부드럽게 0으로.' },
    };

    root.innerHTML = `
      <div class="act-stage">
        <canvas class="act-cv" width="540" height="280"></canvas>
        <div class="act-read">
          <div class="act-row"><span class="lab">z</span><b class="vz">0.00</b></div>
          <div class="act-row"><span class="lab">f(z)</span><b class="vf">0.00</b></div>
          <div class="act-row"><span class="lab">f′(z)</span><b class="vd">0.00</b></div>
          <p class="act-note">호버로 값과 기울기를 본다.</p>
        </div>
      </div>`;
    const cv = root.querySelector('.act-cv');
    const ctx = cv.getContext('2d');
    const W = 540, H = 280;
    const vz = root.querySelector('.vz');
    const vf = root.querySelector('.vf');
    const vd = root.querySelector('.vd');
    const note = root.querySelector('.act-note');
    let cur = 'ReLU';
    let hover = null;

    function plot(){
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,W,H);
      const pad = 36;
      const innerW = W - pad*2, innerH = H - pad*2;
      const xMin = -4, xMax = 4, yMin = -1.5, yMax = 3;
      const xx = x => pad + (x - xMin)/(xMax - xMin) * innerW;
      const yy = y => pad + (1 - (y - yMin)/(yMax - yMin)) * innerH;
      // 축
      ctx.strokeStyle = 'rgba(38,34,28,.10)';
      ctx.lineWidth = 1;
      for (let g = -4; g <= 4; g++){
        ctx.beginPath(); ctx.moveTo(xx(g), pad); ctx.lineTo(xx(g), pad+innerH); ctx.stroke();
      }
      for (let g = -1; g <= 3; g++){
        ctx.beginPath(); ctx.moveTo(pad, yy(g)); ctx.lineTo(pad+innerW, yy(g)); ctx.stroke();
      }
      // 0축 강조
      ctx.strokeStyle = 'rgba(38,34,28,.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(pad, yy(0)); ctx.lineTo(pad+innerW, yy(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xx(0), pad); ctx.lineTo(xx(0), pad+innerH); ctx.stroke();
      // 모든 활성화 함수를 연하게
      Object.keys(FNS).forEach(k => {
        if (k === cur) return;
        ctx.strokeStyle = 'rgba(38,34,28,.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let px = 0; px <= innerW; px += 2){
          const z = xMin + px/innerW * (xMax - xMin);
          const y = FNS[k].f(z);
          if (px === 0) ctx.moveTo(xx(z), yy(y));
          else ctx.lineTo(xx(z), yy(y));
        }
        ctx.stroke();
      });
      // 선택된 함수 — 굵게
      ctx.strokeStyle = C.structure;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 0; px <= innerW; px += 1){
        const z = xMin + px/innerW * (xMax - xMin);
        const y = FNS[cur].f(z);
        if (px === 0) ctx.moveTo(xx(z), yy(y));
        else ctx.lineTo(xx(z), yy(y));
      }
      ctx.stroke();
      // 도함수 — 점선 웜
      ctx.strokeStyle = C.style;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]);
      ctx.beginPath();
      for (let px = 0; px <= innerW; px += 1){
        const z = xMin + px/innerW * (xMax - xMin);
        const y = FNS[cur].d(z);
        if (px === 0) ctx.moveTo(xx(z), yy(y));
        else ctx.lineTo(xx(z), yy(y));
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // hover
      if (hover !== null){
        const z = hover;
        const y = FNS[cur].f(z);
        const dz = FNS[cur].d(z);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xx(z), pad); ctx.lineTo(xx(z), pad+innerH); ctx.stroke();
        // 접선
        const tlen = 1.2;
        ctx.strokeStyle = C.synth;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xx(z - tlen), yy(y - dz*tlen));
        ctx.lineTo(xx(z + tlen), yy(y + dz*tlen));
        ctx.stroke();
        // 점
        ctx.fillStyle = C.structure;
        ctx.beginPath(); ctx.arc(xx(z), yy(y), 4.5, 0, Math.PI*2); ctx.fill();
        vz.textContent = z.toFixed(2);
        vf.textContent = y.toFixed(3);
        vd.textContent = dz.toFixed(3);
      }
      // 범례
      ctx.font = '11px "Spline Sans Mono", monospace';
      ctx.fillStyle = C.structure;
      ctx.fillText(`— ${cur} · f(z)`, pad + 6, pad + 14);
      ctx.fillStyle = C.style;
      ctx.fillText(`-- f′(z)`, pad + 6, pad + 30);
      note.textContent = FNS[cur].note;
    }

    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      const pad = 36;
      const innerW = W - pad*2;
      const px = ((e.clientX - r.left) / r.width * W - pad);
      hover = clamp(-4 + px/innerW * 8, -4, 4);
      plot();
    });
    cv.addEventListener('pointerleave', () => { hover = null; vz.textContent = '–'; vf.textContent = '–'; vd.textContent = '–'; plot(); });

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `<div class="toggle-row">` +
      Object.keys(FNS).map((k,i) => `<button class="btn ghost ${k===cur?'on':''}" data-k="${k}">${k}</button>`).join('') + `</div>`;
    root.appendChild(ctr);
    ctr.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      cur = b.dataset.k;
      ctr.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      plot();
    }));

    plot();
  };

  /* ============================================================
     3. 역전파 계산 그래프 — w → x → y → z 의 단계별 애니메이션
     순전파에서 중간값을 저장하고, 역전파에서 체인룰로 누적하는 모습.
     ============================================================ */
  CH6.backprop = function(root){
    root.innerHTML = `
      <div class="bp-stage">
        <svg class="bp-graph" viewBox="0 0 540 220" xmlns="http://www.w3.org/2000/svg"></svg>
        <div class="bp-side">
          <div class="bp-status"></div>
          <div class="bp-trace"></div>
        </div>
      </div>`;
    const svg = root.querySelector('.bp-graph');
    const stat = root.querySelector('.bp-status');
    const trace = root.querySelector('.bp-trace');
    // 노드: w(input) -- f1 --> x -- f2 --> y -- f3 --> L(loss)
    // 예시 함수: f1(w) = w^2,  f2(x) = sin(x),  f3(y) = y^2  → L = sin(w^2)^2
    // 입력값
    let w = 1.2;
    const fns = [
      { name:'x = w²',        sym:'w^2',     fwd: w => w*w,        bwdLocal: w => 2*w },
      { name:'y = sin(x)',    sym:'sin(x)',  fwd: x => Math.sin(x),bwdLocal: x => Math.cos(x) },
      { name:'L = y²',        sym:'y^2',     fwd: y => y*y,        bwdLocal: y => 2*y },
    ];
    let phase = 'idle'; // 'fwd', 'bwd', 'done'
    let stepIdx = -1;
    let cache = { w: w, x: null, y: null, L: null };
    let grads = { L: 1, y: null, x: null, w: null };

    function nodes(){
      // x좌표
      const xs = [60, 200, 340, 480];
      const labels = ['w', 'x', 'y', 'L'];
      const vals = [cache.w, cache.x, cache.y, cache.L];
      const gradsArr = [grads.w, grads.x, grads.y, grads.L];
      let s = '';
      // 엣지
      for (let i = 0; i < 3; i++){
        const x1 = xs[i] + 26, x2 = xs[i+1] - 26;
        const active = (phase==='fwd' && stepIdx === i) || (phase==='bwd' && stepIdx === 2-i);
        s += `<line x1="${x1}" y1="110" x2="${x2}" y2="110"
                    stroke="${active ? C.synth : C.line}" stroke-width="${active ? 2.6 : 1.4}"/>`;
        // edge label
        s += `<text x="${(x1+x2)/2}" y="92" text-anchor="middle" font-family="Spline Sans Mono" font-size="11"
                    fill="${active ? C.synth : C.inkFaint}">${fns[i].sym}</text>`;
        // 역전파 화살표
        if (phase === 'bwd' || phase === 'done'){
          const t = stepIdx === 2-i ? C.style : (phase === 'done' ? C.styleLo : 'transparent');
          s += `<path d="M ${x2-8} 124 L ${x1+8} 124" stroke="${t}" stroke-width="2.2" fill="none" marker-end="url(#arrL)"/>`;
        }
      }
      // 노드 박스
      for (let i = 0; i < 4; i++){
        const cx = xs[i], cy = 110;
        const isActive = (phase === 'fwd' && stepIdx === i-1) || (phase === 'bwd' && stepIdx === 3-i-1);
        const isOk = vals[i] !== null;
        s += `<circle cx="${cx}" cy="${cy}" r="26"
                fill="${isOk ? C.paper2 : C.paper}"
                stroke="${isActive ? C.synth : (isOk ? C.structure : C.line)}"
                stroke-width="${isActive ? 3 : (isOk ? 1.8 : 1.2)}"/>`;
        s += `<text x="${cx}" y="115" text-anchor="middle" font-family="Fraunces, serif" font-size="14" fill="${C.ink}">${labels[i]}</text>`;
        // 값 표시
        if (vals[i] !== null){
          s += `<text x="${cx}" y="160" text-anchor="middle" font-family="Spline Sans Mono" font-size="11" fill="${C.structure}">= ${vals[i].toFixed(3)}</text>`;
        }
        // grad 표시 (아래쪽)
        if (gradsArr[i] !== null){
          s += `<text x="${cx}" y="178" text-anchor="middle" font-family="Spline Sans Mono" font-size="11" fill="${C.style}">∂L/∂${labels[i]} = ${gradsArr[i].toFixed(3)}</text>`;
        }
      }
      // 화살표 정의
      s += `<defs><marker id="arrL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="${C.style}"/></marker></defs>`;
      svg.innerHTML = s;
    }

    function reset(){
      cache = { w: w, x: null, y: null, L: null };
      grads = { L: null, y: null, x: null, w: null };
      phase = 'idle';
      stepIdx = -1;
      stat.innerHTML = `<b>대기 중</b> · 입력 w = ${w.toFixed(2)}. 순전파부터 시작.`;
      trace.innerHTML = '';
      nodes();
    }

    function logTrace(html){
      trace.innerHTML += `<div class="tr-row">${html}</div>`;
      trace.scrollTop = trace.scrollHeight;
    }

    async function runForward(){
      phase = 'fwd';
      logTrace(`<b style="color:${C.structure}">순전파 ▸</b> w = ${w.toFixed(2)} 입력`);
      for (let i = 0; i < 3; i++){
        stepIdx = i;
        const inp = i === 0 ? cache.w : (i === 1 ? cache.x : cache.y);
        const out = fns[i].fwd(inp);
        if (i === 0) cache.x = out;
        if (i === 1) cache.y = out;
        if (i === 2) cache.L = out;
        stat.innerHTML = `<b>순전파 단계 ${i+1}</b> · ${fns[i].name} = ${out.toFixed(4)}`;
        logTrace(`<span style="color:${C.structure}">단계 ${i+1}</span> ${fns[i].name} → <b>${out.toFixed(4)}</b> <span class="tr-note">(중간값 저장)</span>`);
        nodes();
        await sleep(700);
      }
      logTrace(`<i style="color:${C.ink}">L = ${cache.L.toFixed(4)} — 최종 손실</i>`);
    }

    async function runBackward(){
      phase = 'bwd';
      grads.L = 1;
      logTrace(`<b style="color:${C.style}">역전파 ▸</b> ∂L/∂L = 1 (출발)`);
      for (let i = 2; i >= 0; i--){
        stepIdx = i;
        // 지역 도함수 × 뒤에서 온 grad
        let local;
        if (i === 2) local = fns[2].bwdLocal(cache.y);   // ∂L/∂y = 2y
        if (i === 1) local = fns[1].bwdLocal(cache.x);   // ∂y/∂x = cos(x)
        if (i === 0) local = fns[0].bwdLocal(cache.w);   // ∂x/∂w = 2w
        const upstream = i === 2 ? grads.L : (i === 1 ? grads.y : grads.x);
        const result = local * upstream;
        if (i === 2){ grads.y = result; }
        if (i === 1){ grads.x = result; }
        if (i === 0){ grads.w = result; }
        const target = i === 2 ? 'y' : (i === 1 ? 'x' : 'w');
        stat.innerHTML = `<b>역전파 단계 ${3-i}</b> · ∂L/∂${target} = (지역 ${local.toFixed(3)}) × (뒤 ${upstream.toFixed(3)}) = <b>${result.toFixed(4)}</b>`;
        logTrace(`<span style="color:${C.style}">단계 ${3-i}</span> ∂L/∂${target} = ${local.toFixed(3)} × ${upstream.toFixed(3)} = <b>${result.toFixed(4)}</b>`);
        nodes();
        await sleep(800);
      }
      phase = 'done';
      stepIdx = -1;
      stat.innerHTML = `<b style="color:${C.synth}">완료</b> · ∂L/∂w = ${grads.w.toFixed(4)}. 학습 1스텝: w ← w − η·${grads.w.toFixed(3)}.`;
      logTrace(`<i>완료 — ∂L/∂w = ${grads.w.toFixed(4)}</i>`);
      nodes();
    }

    function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>입력 w <b class="vw">${w.toFixed(2)}</b></label><input type="range" min="0.1" max="2.5" step="0.05" value="${w}"></div>
      <button class="btn fwd">순전파 ▶</button>
      <button class="btn ghost bwd" disabled>역전파 ◀</button>
      <button class="btn ghost rst">초기화 ↻</button>`;
    root.appendChild(ctr);
    const sl = ctr.querySelector('input');
    sl.addEventListener('input', () => { w = parseFloat(sl.value); ctr.querySelector('.vw').textContent = w.toFixed(2); reset(); });
    const bF = ctr.querySelector('.fwd'), bB = ctr.querySelector('.bwd'), bR = ctr.querySelector('.rst');
    bF.addEventListener('click', async () => {
      reset();
      await runForward();
      bB.disabled = false;
    });
    bB.addEventListener('click', async () => {
      if (cache.L === null) return;
      await runBackward();
      bB.disabled = true;
    });
    bR.addEventListener('click', () => { reset(); bB.disabled = true; });
    reset();
  };

  /* ============================================================
     4. 출력층과 비용 — 회귀/이진/다중. task 선택 시 곡선 모양 변화.
     ============================================================ */
  CH6.outputs = function(root){
    root.innerHTML = `
      <div class="out-stage">
        <div class="out-cards"></div>
        <div class="out-panel">
          <canvas class="out-cv" width="540" height="260"></canvas>
          <div class="out-explain"></div>
        </div>
      </div>`;
    const cardsEl = root.querySelector('.out-cards');
    const cv = root.querySelector('.out-cv');
    const ctx = cv.getContext('2d');
    const expl = root.querySelector('.out-explain');
    const W = 540, H = 260;

    const TASKS = {
      'regression': {
        title:'회귀 (Regression)',
        output:'선형 (Linear)',
        cost:'MSE — 평균제곱오차',
        latex:'L = \\tfrac{1}{2}(y - \\hat y)^2',
        mle:'정규분포 가정에서 MLE → MSE',
        desc:'연속값 예측. 출력층은 그냥 z를 그대로 내보낸다.',
        // 손실 곡선: y_target = 0.7 고정, y_hat 변화
        loss: (yhat) => 0.5 * (0.7 - yhat) * (0.7 - yhat),
        grad: (yhat) => (yhat - 0.7),
        x: [-1, 2], // y_hat 범위
        ylim: [0, 1.6],
        ytarget: 0.7,
      },
      'binary': {
        title:'이진 분류 (Binary)',
        output:'시그모이드 (Sigmoid)',
        cost:'BCE — 이진 교차 엔트로피',
        latex:'L = -[t \\log \\hat y + (1-t)\\log(1-\\hat y)]',
        mle:'베르누이 가정에서 MLE → BCE',
        desc:'예/아니오. 출력은 0과 1 사이의 확률.',
        // y_hat = sigmoid(z), t = 1로 가정
        loss: (z) => { const s = 1/(1+Math.exp(-z)); return -Math.log(s + 1e-12); },
        grad: (z) => { const s = 1/(1+Math.exp(-z)); return s - 1; },
        x: [-4, 4],
        ylim: [0, 4.5],
        ytarget: 1,
      },
      'multi': {
        title:'다중 분류 (Multiclass)',
        output:'소프트맥스 (Softmax)',
        cost:'CE — 교차 엔트로피',
        latex:'L = -\\sum_k t_k \\log \\hat y_k',
        mle:'카테고리 분포 가정 MLE → CE',
        desc:'여러 범주 중 하나. 출력은 합이 1인 확률 벡터.',
        // 두 클래스 logit z1, z2(=0 고정). t = [1, 0]
        loss: (z1) => { const e1 = Math.exp(z1), e0 = 1; const sm = e1/(e1+e0); return -Math.log(sm + 1e-12); },
        grad: (z1) => { const e1 = Math.exp(z1), e0 = 1; const sm = e1/(e1+e0); return sm - 1; },
        x: [-3, 5],
        ylim: [0, 4.5],
        ytarget: 'class 1',
      },
    };

    let cur = 'binary';

    function plot(){
      const T = TASKS[cur];
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,W,H);
      const pad = 36;
      const innerW = W - pad*2, innerH = H - pad*2;
      const xx = x => pad + (x - T.x[0])/(T.x[1] - T.x[0]) * innerW;
      const yy = y => pad + (1 - (y - T.ylim[0])/(T.ylim[1] - T.ylim[0])) * innerH;
      // 격자
      ctx.strokeStyle = 'rgba(38,34,28,.08)';
      for (let g = T.x[0]; g <= T.x[1]; g += (T.x[1]-T.x[0])/8){
        ctx.beginPath(); ctx.moveTo(xx(g), pad); ctx.lineTo(xx(g), pad+innerH); ctx.stroke();
      }
      for (let g = 0; g <= T.ylim[1]; g += T.ylim[1]/5){
        ctx.beginPath(); ctx.moveTo(pad, yy(g)); ctx.lineTo(pad+innerW, yy(g)); ctx.stroke();
      }
      // 정답 위치 강조
      if (cur === 'regression'){
        ctx.strokeStyle = C.synth; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(xx(T.ytarget), pad); ctx.lineTo(xx(T.ytarget), pad+innerH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.synth; ctx.font = '11px "Spline Sans Mono"';
        ctx.fillText('정답 t = 0.7', xx(T.ytarget)+6, pad+12);
      } else {
        ctx.strokeStyle = C.synth; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(xx(0), pad); ctx.lineTo(xx(0), pad+innerH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.synth; ctx.font = '11px "Spline Sans Mono"';
        ctx.fillText(cur === 'binary' ? '결정 경계 z = 0' : '동률 z = 0', xx(0)+6, pad+12);
      }
      // 손실 곡선
      ctx.strokeStyle = C.structure;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 0; px <= innerW; px += 1){
        const x = T.x[0] + px/innerW * (T.x[1] - T.x[0]);
        const y = T.loss(x);
        if (px === 0) ctx.moveTo(xx(x), yy(y));
        else ctx.lineTo(xx(x), yy(y));
      }
      ctx.stroke();
      // 도함수
      ctx.strokeStyle = C.style;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5,4]);
      ctx.beginPath();
      for (let px = 0; px <= innerW; px += 1){
        const x = T.x[0] + px/innerW * (T.x[1] - T.x[0]);
        const y = T.grad(x);
        // 정규화: 도함수도 같은 ylim에 맞춤
        if (px === 0) ctx.moveTo(xx(x), yy(Math.abs(y)));
        else ctx.lineTo(xx(x), yy(Math.abs(y)));
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // 라벨
      ctx.fillStyle = C.structure; ctx.font = '11px "Spline Sans Mono"';
      ctx.fillText('손실 L(' + (cur==='regression'?'ŷ':'z') + ')', pad+6, pad+14);
      ctx.fillStyle = C.style;
      ctx.fillText('|기울기 ∂L/∂' + (cur==='regression'?'ŷ':'z') + '|', pad+6, pad+30);
      ctx.fillStyle = C.inkFaint; ctx.font = '10px "Spline Sans Mono"';
      ctx.fillText(cur==='regression' ? 'ŷ (예측)' : 'z (logit)', pad+innerW-50, pad+innerH+14);
    }

    function buildCards(){
      cardsEl.innerHTML = Object.entries(TASKS).map(([k, t]) => `
        <button class="out-card ${k===cur?'on':''}" data-k="${k}">
          <div class="oc-t">${t.title}</div>
          <div class="oc-d"><b>${t.output}</b><br>${t.cost}</div>
        </button>`).join('');
      cardsEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        cur = b.dataset.k;
        cardsEl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.k === cur));
        renderExpl(); plot();
      }));
    }

    function renderExpl(){
      const T = TASKS[cur];
      expl.innerHTML = `
        <div class="oe-row"><span>출력층</span><b>${T.output}</b></div>
        <div class="oe-row"><span>비용</span><b>${T.cost}</b></div>
        <div class="oe-eq">$$${T.latex}$$</div>
        <div class="oe-mle">${T.mle}</div>
        <p class="oe-desc">${T.desc}</p>`;
      if (window.renderMathInElement) renderMathInElement(expl, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
      });
    }

    buildCards();
    renderExpl();
    plot();
  };

  /* ============================================================
     5. 만능 근사 정리 — 은닉 유닛 N을 늘리면서 임의 함수 근사
     사용자가 N을 늘리면 ReLU MLP가 목표 함수를 더 잘 흉내냄.
     ============================================================ */
  CH6.universal = function(root){
    root.innerHTML = `
      <div class="uni-stage">
        <canvas class="uni-cv" width="560" height="280"></canvas>
        <div class="uni-side">
          <div class="uni-stat"></div>
          <div class="uni-note">은닉 유닛 수 N이 커질수록 ReLU의 꺾임을 많이 모아 임의의 곡선을 흉내낼 수 있다. 이론은 가능성을 보장할 뿐, 효율은 깊이가 책임진다.</div>
        </div>
      </div>`;
    const cv = root.querySelector('.uni-cv'), ctx = cv.getContext('2d');
    const W = 560, H = 280;
    const stat = root.querySelector('.uni-stat');
    let N = 8;
    // 목표 함수들
    const TARGETS = {
      '사인파':   x => Math.sin(x*2.5),
      '계단':     x => x < 0 ? -0.6 : (x < 1.5 ? 0.8 : 0.2),
      '이중봉':   x => Math.exp(-(x-1)*(x-1)*2)*0.9 - Math.exp(-(x+1)*(x+1)*2)*0.7,
      '톱니파':   x => ((x*1.5) % 1) - 0.5,
    };
    let target = '사인파';

    // 학습 없이 균등하게 N개의 ReLU를 깔고 최소제곱으로 결합 (해석적 해)
    function approx(x, params){
      let s = params.bias;
      for (let i = 0; i < params.N; i++){
        s += params.w[i] * Math.max(0, x - params.b[i]);
      }
      return s;
    }

    function fit(N, fnTarget){
      // x 표본
      const M = 240;
      const xs = [];
      const ys = [];
      for (let m = 0; m < M; m++){
        const x = -3 + m/(M-1) * 6;
        xs.push(x);
        ys.push(fnTarget(x));
      }
      // 기저: phi_0 = 1, phi_{i+1}(x) = max(0, x - b_i),  b_i 균등
      const b = [];
      for (let i = 0; i < N; i++) b.push(-3 + i/(N-1+1e-9) * 6);
      // 정규방정식 W·a = b 형태로 풀려면 행렬 연산 필요 → 간단 평균법: 각 ReLU 기울기 차분
      // 더 강건: 다항형 정규방정식. 작은 N에선 충분.
      const D = N + 1;
      const A = [];
      for (let r = 0; r < D; r++){ A.push(new Float64Array(D)); }
      const rhs = new Float64Array(D);
      for (let m = 0; m < M; m++){
        const xm = xs[m];
        const phi = new Float64Array(D);
        phi[0] = 1;
        for (let i = 0; i < N; i++) phi[i+1] = Math.max(0, xm - b[i]);
        for (let r = 0; r < D; r++){
          rhs[r] += phi[r] * ys[m];
          for (let c = 0; c < D; c++){
            A[r][c] += phi[r] * phi[c];
          }
        }
      }
      // ridge 살짝
      for (let r = 0; r < D; r++) A[r][r] += 1e-3;
      // 가우스 소거
      const coeffs = gauss(A, rhs);
      return { N, bias: coeffs[0], w: coeffs.slice(1), b };
    }

    function gauss(A, b){
      const n = b.length;
      const M = A.map((r,i) => [...r, b[i]]);
      for (let i = 0; i < n; i++){
        // pivot
        let piv = i;
        for (let r = i+1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
        [M[i], M[piv]] = [M[piv], M[i]];
        const div = M[i][i];
        if (Math.abs(div) < 1e-12) continue;
        for (let c = i; c <= n; c++) M[i][c] /= div;
        for (let r = 0; r < n; r++){
          if (r === i) continue;
          const f = M[r][i];
          for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
        }
      }
      return M.map(r => r[n]);
    }

    function plot(){
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,W,H);
      const pad = 36;
      const innerW = W - pad*2, innerH = H - pad*2;
      const xMin = -3, xMax = 3, yMin = -1.2, yMax = 1.2;
      const xx = x => pad + (x - xMin)/(xMax-xMin) * innerW;
      const yy = y => pad + (1 - (y - yMin)/(yMax-yMin)) * innerH;
      // 격자
      ctx.strokeStyle = 'rgba(38,34,28,.08)';
      for (let g = xMin; g <= xMax; g += 1){
        ctx.beginPath(); ctx.moveTo(xx(g), pad); ctx.lineTo(xx(g), pad+innerH); ctx.stroke();
      }
      for (let g = yMin; g <= yMax; g += 0.4){
        ctx.beginPath(); ctx.moveTo(pad, yy(g)); ctx.lineTo(pad+innerW, yy(g)); ctx.stroke();
      }
      // 0 축
      ctx.strokeStyle = 'rgba(38,34,28,.25)';
      ctx.beginPath(); ctx.moveTo(pad, yy(0)); ctx.lineTo(pad+innerW, yy(0)); ctx.stroke();
      // 목표 함수
      const fn = TARGETS[target];
      ctx.strokeStyle = C.style;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let px = 0; px <= innerW; px += 1){
        const x = xMin + px/innerW * (xMax-xMin);
        const y = clamp(fn(x), yMin, yMax);
        if (px === 0) ctx.moveTo(xx(x), yy(y));
        else ctx.lineTo(xx(x), yy(y));
      }
      ctx.stroke();
      // 근사
      const params = fit(N, fn);
      ctx.strokeStyle = C.structure;
      ctx.lineWidth = 2;
      ctx.setLineDash([5,3]);
      ctx.beginPath();
      let err = 0, cnt = 0;
      for (let px = 0; px <= innerW; px += 1){
        const x = xMin + px/innerW * (xMax-xMin);
        const yh = approx(x, params);
        const yT = fn(x);
        err += (yh - yT)*(yh - yT); cnt++;
        const yy_ = yy(clamp(yh, yMin, yMax));
        if (px === 0) ctx.moveTo(xx(x), yy_);
        else ctx.lineTo(xx(x), yy_);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // ReLU 꺾임점 표시
      ctx.fillStyle = 'rgba(192,73,46,0.4)';
      params.b.forEach(bk => {
        ctx.beginPath(); ctx.arc(xx(bk), yy(0), 3, 0, Math.PI*2); ctx.fill();
      });
      const rmse = Math.sqrt(err/cnt);
      // 라벨
      ctx.fillStyle = C.style; ctx.font = '11px "Spline Sans Mono"';
      ctx.fillText(`목표 — ${target}`, pad+6, pad+14);
      ctx.fillStyle = C.structure;
      ctx.fillText(`근사 — ReLU MLP (N=${N})`, pad+6, pad+30);
      stat.innerHTML = `<b>은닉 유닛 N = ${N}</b><br>RMSE = ${rmse.toFixed(3)}<br>꺾임점 ${N}개로 곡선을 흉내내는 중.`;
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>은닉 유닛 수 N <b class="vn">${N}</b></label><input type="range" min="2" max="60" step="1" value="${N}"></div>
      <div class="toggle-row">` + Object.keys(TARGETS).map(k => `<button class="btn ghost ${k===target?'on':''}" data-t="${k}">${k}</button>`).join('') + `</div>`;
    root.appendChild(ctr);
    ctr.querySelector('input').addEventListener('input', e => {
      N = parseInt(e.target.value, 10);
      ctr.querySelector('.vn').textContent = N;
      plot();
    });
    ctr.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      target = b.dataset.t;
      ctr.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.t === target));
      plot();
    }));
    plot();
  };

  /* ============================================================
     6. Vanishing Gradient — sigmoid vs ReLU 깊이 별 기울기 크기
     L층까지 같은 z를 통과시키면서, 각 층에서 backprop으로 흘러가는
     기울기 |g_l|을 막대로 표시.
     ============================================================ */
  CH6.vanishing = function(root){
    root.innerHTML = `
      <div class="vg-stage">
        <canvas class="vg-cv" width="560" height="260"></canvas>
        <div class="vg-side">
          <div class="vg-stat"></div>
          <div class="vg-note">활성 입력 z에서 출발해, L번 같은 활성을 통과시키며 backprop. 각 층의 기울기 크기를 막대로 표시한다.</div>
        </div>
      </div>`;
    const cv = root.querySelector('.vg-cv'), ctx = cv.getContext('2d');
    const W = 560, H = 260;
    const stat = root.querySelector('.vg-stat');
    let L = 8, z = 1.0, fn = 'sigmoid';

    function dsig(z){ const s = 1/(1+Math.exp(-z)); return s*(1-s); }
    function dtanh(z){ const t = Math.tanh(z); return 1 - t*t; }
    function drelu(z){ return z > 0 ? 1 : 0; }

    function gradPerLayer(){
      const g = [1];
      let zz = z;
      for (let l = 0; l < L; l++){
        let local;
        if (fn === 'sigmoid') local = dsig(zz);
        else if (fn === 'tanh') local = dtanh(zz);
        else local = drelu(zz);
        // 깊이가 깊을수록 활성값이 줄어들거나 늘어남 — 같은 z를 그대로 다시 통과시킨다고 단순화
        g.push(g[g.length-1] * local);
      }
      return g;
    }

    function plot(){
      ctx.fillStyle = C.paper; ctx.fillRect(0,0,W,H);
      const g = gradPerLayer();
      const pad = 36;
      const innerW = W - pad*2, innerH = H - pad*2;
      // 막대: log scale
      const max = Math.max(...g);
      const min = Math.min(...g.filter(v => v > 0));
      const useLog = max / (min + 1e-12) > 10;
      const bw = innerW / (L+1) * 0.7;
      const gap = innerW / (L+1) * 0.3;
      ctx.fillStyle = C.structureLo;
      g.forEach((v, i) => {
        const norm = useLog ? (Math.log10(v + 1e-12) - Math.log10(1e-6)) / (Math.log10(max + 1e-12) - Math.log10(1e-6)) : v/max;
        const h = Math.max(2, norm * innerH);
        ctx.fillStyle = i === 0 ? C.synth : (v < 1e-3 ? C.style : C.structure);
        ctx.fillRect(pad + i*(bw+gap), pad+innerH-h, bw, h);
        // 값 라벨
        ctx.fillStyle = C.inkFaint; ctx.font = '9px "Spline Sans Mono"';
        ctx.fillText(v < 1e-3 ? v.toExponential(1) : v.toFixed(3), pad + i*(bw+gap) + 2, pad+innerH-h-3);
        // 층 번호
        ctx.fillStyle = C.inkSoft;
        ctx.fillText(`L${i}`, pad + i*(bw+gap) + bw/2 - 6, pad+innerH+12);
      });
      ctx.strokeStyle = 'rgba(38,34,28,.18)';
      ctx.strokeRect(pad, pad, innerW, innerH);
      ctx.fillStyle = C.inkFaint; ctx.font = '10px "Spline Sans Mono"';
      ctx.fillText(useLog ? 'log scale' : 'linear', pad+innerW-50, pad+10);
      stat.innerHTML = `<b>활성: ${fn}</b> · z = ${z.toFixed(2)} · 깊이 L = ${L}<br>
                        L=0 기울기 ${g[0].toFixed(3)} → L=${L} 기울기 <b style="color:${g[g.length-1] < 1e-3 ? C.style : C.structure}">${g[g.length-1] < 1e-3 ? g[g.length-1].toExponential(2) : g[g.length-1].toFixed(4)}</b>
                        ${g[g.length-1] < 1e-3 ? '<br><span style="color:'+C.style+'">기울기 소실(vanishing) — 학습이 멈춘다.</span>' : ''}`;
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <div class="slider"><label>입력 z <b class="vz">${z.toFixed(2)}</b></label><input type="range" min="-3" max="3" step="0.05" value="${z}" data-p="z"></div>
      <div class="slider"><label>층 수 L <b class="vL">${L}</b></label><input type="range" min="1" max="20" step="1" value="${L}" data-p="L"></div>
      <div class="toggle-row">
        <button class="btn ghost ${fn==='sigmoid'?'on':''}" data-f="sigmoid">sigmoid</button>
        <button class="btn ghost ${fn==='tanh'?'on':''}" data-f="tanh">tanh</button>
        <button class="btn ghost ${fn==='ReLU'?'on':''}" data-f="ReLU">ReLU</button>
      </div>`;
    root.appendChild(ctr);
    ctr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', e => {
      const p = inp.dataset.p, v = parseFloat(inp.value);
      if (p === 'z'){ z = v; ctr.querySelector('.vz').textContent = v.toFixed(2); }
      if (p === 'L'){ L = parseInt(v, 10); ctr.querySelector('.vL').textContent = L; }
      plot();
    }));
    ctr.querySelectorAll('button[data-f]').forEach(b => b.addEventListener('click', () => {
      fn = b.dataset.f;
      ctr.querySelectorAll('button[data-f]').forEach(x => x.classList.toggle('on', x.dataset.f === fn));
      plot();
    }));
    plot();
  };

  /* ============================================================
     7. 손계산 step-by-step — 2-2-1 MLP의 한 epoch
     아주 작은 망에서 순전파 한 번 + 역전파 한 번을 손으로 따라간다.
     각 단계의 수식과 수치를 함께 보여 준다.
     ============================================================ */
  CH6.handCalc = function(root){
    root.innerHTML = `
      <div class="hc-stage">
        <svg class="hc-graph" viewBox="0 0 540 280" xmlns="http://www.w3.org/2000/svg"></svg>
        <div class="hc-panel">
          <div class="hc-stat"></div>
          <div class="hc-eq"></div>
          <div class="hc-trace"></div>
        </div>
      </div>`;
    const svg = root.querySelector('.hc-graph');
    const stat = root.querySelector('.hc-stat');
    const eq = root.querySelector('.hc-eq');
    const trace = root.querySelector('.hc-trace');

    // 고정 입력 (XOR 한 점)
    const x1 = 1, x2 = 0, t = 1;
    // 가중치 (학습용 작은 임의값)
    const W1 = [[0.5, -0.4],[0.3, 0.8]]; // W1[j][k]: 은닉 j ← 입력 k
    const b1 = [0.1, -0.2];
    const W2 = [0.6, -0.7];               // W2[j]: 출력 ← 은닉 j
    const b2 = 0.05;
    const eta = 0.1;

    // 계산 결과 누적
    let step = 0;
    const vals = {};
    const grads = {};

    function relu(z){ return Math.max(0, z); }
    function dRelu(z){ return z > 0 ? 1 : 0; }
    function sigmoid(z){ return 1/(1+Math.exp(-z)); }

    function fmt(v, k){ return (typeof v === 'number') ? v.toFixed(k||3) : '–'; }

    function drawGraph(){
      // 노드: x1, x2 (왼쪽 두 개), h1, h2 (가운데), y (오른쪽), L (오른쪽 끝)
      const positions = {
        x1: [70, 80],  x2: [70, 200],
        h1: [220, 80], h2: [220, 200],
        y:  [380, 140],
        L:  [490, 140],
      };
      // 엣지: 입력→은닉 (4) + 은닉→출력 (2) + y→L (1)
      const edges = [
        ['x1','h1','w11'], ['x2','h1','w12'], ['x1','h2','w21'], ['x2','h2','w22'],
        ['h1','y','v1'], ['h2','y','v2'],
        ['y','L',''],
      ];
      let s = '';
      // 엣지
      edges.forEach(([a,b,lab]) => {
        const [ax,ay] = positions[a], [bx,by] = positions[b];
        s += `<line x1="${ax+22}" y1="${ay}" x2="${bx-22}" y2="${by}" stroke="${C.line}" stroke-width="1.4"/>`;
        if (lab){
          const mx = (ax+bx)/2, my = (ay+by)/2 - 5;
          s += `<text x="${mx}" y="${my}" text-anchor="middle" font-family="Spline Sans Mono" font-size="9" fill="${C.inkFaint}">${lab}</text>`;
        }
      });
      // 노드
      const nodeStyle = (id, label, v, g) => {
        const [cx, cy] = positions[id];
        const active = vals[id] !== undefined;
        return `
          <circle cx="${cx}" cy="${cy}" r="22" fill="${active ? C.paper2 : C.paper}" stroke="${active ? C.structure : C.line}" stroke-width="${active ? 1.8 : 1.2}"/>
          <text x="${cx}" y="${cy+4}" text-anchor="middle" font-family="Fraunces, serif" font-size="13" fill="${C.ink}">${label}</text>
          ${vals[id] !== undefined ? `<text x="${cx}" y="${cy+38}" text-anchor="middle" font-family="Spline Sans Mono" font-size="10" fill="${C.structure}">= ${fmt(vals[id])}</text>` : ''}
          ${grads[id] !== undefined ? `<text x="${cx}" y="${cy-32}" text-anchor="middle" font-family="Spline Sans Mono" font-size="10" fill="${C.style}">δ = ${fmt(grads[id])}</text>` : ''}`;
      };
      s += nodeStyle('x1', 'x₁', x1);
      s += nodeStyle('x2', 'x₂', x2);
      s += nodeStyle('h1', 'h₁', vals.h1);
      s += nodeStyle('h2', 'h₂', vals.h2);
      s += nodeStyle('y', 'ŷ', vals.y);
      s += nodeStyle('L', 'L', vals.L);
      svg.innerHTML = s;
    }

    function log(html){
      trace.innerHTML += `<div class="hc-row">${html}</div>`;
      trace.scrollTop = trace.scrollHeight;
    }

    function reset(){
      step = 0;
      for (const k in vals) delete vals[k];
      for (const k in grads) delete grads[k];
      stat.innerHTML = `<b>준비</b> · 입력 (x₁, x₂) = (${x1}, ${x2}), 정답 t = ${t}`;
      eq.innerHTML = '';
      trace.innerHTML = '';
      drawGraph();
    }

    function next(){
      step++;
      if (step === 1){
        // 1) z1 = W1·x + b1 → h = ReLU(z1)
        const z1 = W1[0][0]*x1 + W1[0][1]*x2 + b1[0];
        const z2 = W1[1][0]*x1 + W1[1][1]*x2 + b1[1];
        const h1 = relu(z1), h2 = relu(z2);
        vals.h1 = h1; vals.h2 = h2;
        stat.innerHTML = `<b>① 순전파 — 은닉층</b>`;
        eq.innerHTML = `\\[ z_1 = 0.5·1 + (-0.4)·0 + 0.1 = ${z1.toFixed(2)},\\ \\ h_1 = ReLU(z_1) = ${h1.toFixed(2)} \\]
                        \\[ z_2 = 0.3·1 + 0.8·0 + (-0.2) = ${z2.toFixed(2)},\\ \\ h_2 = ReLU(z_2) = ${h2.toFixed(2)} \\]`;
        log(`<b style="color:${C.structure}">①</b> z₁=${z1.toFixed(3)}, h₁=${h1.toFixed(3)} / z₂=${z2.toFixed(3)}, h₂=${h2.toFixed(3)}`);
      }
      else if (step === 2){
        // 2) 출력: u = W2·h + b2, ŷ = sigmoid(u)
        const u = W2[0]*vals.h1 + W2[1]*vals.h2 + b2;
        const yhat = sigmoid(u);
        vals.y = yhat;
        stat.innerHTML = `<b>② 순전파 — 출력층</b>`;
        eq.innerHTML = `\\[ u = 0.6·${vals.h1.toFixed(2)} + (-0.7)·${vals.h2.toFixed(2)} + 0.05 = ${u.toFixed(3)} \\]
                        \\[ \\hat y = \\sigma(u) = ${yhat.toFixed(3)} \\]`;
        log(`<b style="color:${C.structure}">②</b> u=${u.toFixed(3)} → ŷ=${yhat.toFixed(3)}`);
      }
      else if (step === 3){
        // 3) 손실 — BCE
        const yhat = vals.y;
        const L = -(t * Math.log(yhat + 1e-12) + (1-t)*Math.log(1 - yhat + 1e-12));
        vals.L = L;
        stat.innerHTML = `<b>③ 손실 — BCE</b>`;
        eq.innerHTML = `\\[ L = -[t\\log\\hat y + (1-t)\\log(1-\\hat y)] = -\\log(${yhat.toFixed(3)}) = ${L.toFixed(3)} \\]`;
        log(`<b style="color:${C.structure}">③</b> L = ${L.toFixed(3)}`);
      }
      else if (step === 4){
        // 4) 역전파 시작 — 출력층 δ
        // 표준: ∂L/∂u = ŷ - t (sigmoid+BCE의 깔끔한 형태)
        const dL_du = vals.y - t;
        grads.y = dL_du;
        stat.innerHTML = `<b>④ 역전파 — 출력 단위 δ</b>`;
        eq.innerHTML = `\\[ \\frac{\\partial L}{\\partial u} = \\hat y - t = ${vals.y.toFixed(3)} - ${t} = ${dL_du.toFixed(3)} \\]`;
        log(`<b style="color:${C.style}">④</b> δ_u = ŷ - t = ${dL_du.toFixed(3)} <span class="hc-note">(softmax/sigmoid + CE의 깔끔한 형태)</span>`);
      }
      else if (step === 5){
        // 5) 은닉층 δ
        const du = grads.y;
        // ∂L/∂h_j = du * W2[j]
        // h_j = ReLU(z_j) → ∂L/∂z_j = ∂L/∂h_j * dReLU(z_j)
        const dh1 = du * W2[0], dh2 = du * W2[1];
        const z1 = W1[0][0]*x1 + W1[0][1]*x2 + b1[0];
        const z2 = W1[1][0]*x1 + W1[1][1]*x2 + b1[1];
        const dz1 = dh1 * dRelu(z1), dz2 = dh2 * dRelu(z2);
        grads.h1 = dz1; grads.h2 = dz2;
        stat.innerHTML = `<b>⑤ 역전파 — 은닉층 δ</b>`;
        eq.innerHTML = `\\[ \\frac{\\partial L}{\\partial z_1} = \\frac{\\partial L}{\\partial u} · v_1 · ReLU'(z_1) = ${du.toFixed(3)}·0.6·${dRelu(z1)} = ${dz1.toFixed(3)} \\]
                        \\[ \\frac{\\partial L}{\\partial z_2} = ${du.toFixed(3)}·(-0.7)·${dRelu(z2)} = ${dz2.toFixed(3)} \\]`;
        log(`<b style="color:${C.style}">⑤</b> δ_z1=${dz1.toFixed(3)}, δ_z2=${dz2.toFixed(3)}`);
      }
      else if (step === 6){
        // 6) 가중치 업데이트
        const du = grads.y, dz1 = grads.h1, dz2 = grads.h2;
        const dW2_0 = du * vals.h1, dW2_1 = du * vals.h2, db2_ = du;
        const dW1_00 = dz1 * x1, dW1_01 = dz1 * x2, db1_0 = dz1;
        const dW1_10 = dz2 * x1, dW1_11 = dz2 * x2, db1_1 = dz2;
        const newW2_0 = W2[0] - eta*dW2_0, newW2_1 = W2[1] - eta*dW2_1;
        stat.innerHTML = `<b>⑥ 파라미터 갱신</b> · η = ${eta}`;
        eq.innerHTML = `\\[ \\Delta v_1 = -\\eta · \\delta_u · h_1 = ${(-eta*dW2_0).toFixed(4)} \\]
                        \\[ v_1' = ${W2[0]} ${dW2_0 >= 0 ? '-' : '+'} ${Math.abs(eta*dW2_0).toFixed(4)} = ${newW2_0.toFixed(4)} \\]`;
        log(`<b style="color:${C.synth}">⑥</b> v₁: ${W2[0]} → ${newW2_0.toFixed(4)}, v₂: ${W2[1]} → ${newW2_1.toFixed(4)}, 입력측 W₁도 모두 갱신`);
        log(`<i style="color:${C.ink}">완료 — 1 epoch (1 sample) 끝. 손실은 다음 순전파에서 감소함이 정상.</i>`);
      } else {
        return;
      }
      // KaTeX 렌더
      if (window.renderMathInElement) renderMathInElement(eq, {
        delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
      });
      drawGraph();
    }

    const ctr = document.createElement('div'); ctr.className = 'widget-controls';
    ctr.innerHTML = `
      <button class="btn nxt">다음 단계 ▸</button>
      <button class="btn ghost rst">초기화 ↻</button>
      <span style="font-family:var(--mono);font-size:.74rem;color:var(--ink-faint)">고정 입력 — (1, 0) → 정답 1 · 가중치는 시연용</span>`;
    root.appendChild(ctr);
    ctr.querySelector('.nxt').addEventListener('click', next);
    ctr.querySelector('.rst').addEventListener('click', reset);
    reset();
  };

  /* ============================================================
     8. 계산 그래프 — 노드 클릭으로 의존성과 미분 경로 강조
     z = (x + y) * sin(x)  같은 작은 식을 그래프로 그리고
     노드 클릭 시 그 노드의 부모/자식과 미분 경로를 보여 준다.
     ============================================================ */
  CH6.compGraph = function(root){
    root.innerHTML = `
      <div class="cg-stage">
        <svg class="cg-graph" viewBox="0 0 560 280" xmlns="http://www.w3.org/2000/svg"></svg>
        <div class="cg-panel">
          <div class="cg-stat">노드 클릭 — 부모/자식 강조</div>
          <div class="cg-eq"></div>
        </div>
      </div>`;
    const svg = root.querySelector('.cg-graph');
    const stat = root.querySelector('.cg-stat');
    const eqEl = root.querySelector('.cg-eq');

    // 식: z = (x + y) * sin(x)
    // 노드: x, y, a=x+y, b=sin(x), z=a*b
    const NODES = {
      x: { pos: [60, 80],  label: 'x',      val: 1.5,   op: 'input',  parents: [] },
      y: { pos: [60, 200], label: 'y',      val: 0.5,   op: 'input',  parents: [] },
      a: { pos: [220, 140], label: 'a',     op: '+',    parents: ['x','y'], formula:'x + y' },
      b: { pos: [220, 60],  label: 'b',     op: 'sin',  parents: ['x'],     formula:'sin(x)' },
      z: { pos: [420, 100], label: 'z',     op: '×',    parents: ['a','b'], formula:'a · b' },
    };
    // 값 계산
    NODES.a.val = NODES.x.val + NODES.y.val;
    NODES.b.val = Math.sin(NODES.x.val);
    NODES.z.val = NODES.a.val * NODES.b.val;
    // 자식 자동 추가
    Object.entries(NODES).forEach(([k, n]) => n.children = []);
    Object.entries(NODES).forEach(([k, n]) => n.parents.forEach(p => NODES[p].children.push(k)));

    let selected = 'z';

    function ancestors(k){
      const out = new Set();
      const dfs = (id) => {
        NODES[id].parents.forEach(p => { if (!out.has(p)){ out.add(p); dfs(p); }});
      };
      dfs(k); return out;
    }
    function descendants(k){
      const out = new Set();
      const dfs = (id) => {
        NODES[id].children.forEach(c => { if (!out.has(c)){ out.add(c); dfs(c); }});
      };
      dfs(k); return out;
    }

    function draw(){
      const anc = ancestors(selected);
      const desc = descendants(selected);
      let s = '';
      // 엣지
      Object.entries(NODES).forEach(([k, n]) => {
        n.parents.forEach(p => {
          const [px,py] = NODES[p].pos;
          const [cx,cy] = n.pos;
          const onPathBack = (k === selected) || desc.has(k);   // 역전파 경로 강조: 선택 노드 → 입력
          const onPathFwd = (p === selected) || anc.has(p);     // 순전파 영향: 선택 노드 → 출력
          const active = (selected === k && anc.has(p)) || (selected === p && desc.has(k)) || (anc.has(k) && anc.has(p)) || (desc.has(k) && desc.has(p));
          s += `<line x1="${px+24}" y1="${py}" x2="${cx-24}" y2="${cy}" stroke="${active ? C.structure : C.line}" stroke-width="${active ? 2.4 : 1.2}"/>`;
        });
      });
      // 노드
      Object.entries(NODES).forEach(([k, n]) => {
        const [cx, cy] = n.pos;
        const isSel = k === selected;
        const inAnc = anc.has(k), inDesc = desc.has(k);
        let fill = C.paper;
        if (isSel) fill = C.synth;
        else if (inAnc) fill = C.structureLo;
        else if (inDesc) fill = C.styleLo;
        const stroke = isSel ? C.synth : (inAnc ? C.structure : (inDesc ? C.style : C.line));
        s += `<circle cx="${cx}" cy="${cy}" r="24" fill="${fill}" stroke="${stroke}" stroke-width="${isSel ? 3 : 1.4}" data-k="${k}" class="cg-n" style="cursor:pointer"/>`;
        s += `<text x="${cx}" y="${cy+5}" text-anchor="middle" font-family="Fraunces, serif" font-size="14" fill="${isSel ? '#fff' : C.ink}" pointer-events="none">${n.label}</text>`;
        s += `<text x="${cx}" y="${cy-32}" text-anchor="middle" font-family="Spline Sans Mono" font-size="9" fill="${C.inkFaint}" pointer-events="none">${n.op}</text>`;
        s += `<text x="${cx}" y="${cy+38}" text-anchor="middle" font-family="Spline Sans Mono" font-size="10" fill="${C.structure}" pointer-events="none">= ${n.val.toFixed(3)}</text>`;
      });
      svg.innerHTML = s;
      svg.querySelectorAll('.cg-n').forEach(c => c.addEventListener('click', e => {
        selected = c.dataset.k;
        updateInfo();
        draw();
      }));
    }

    function updateInfo(){
      const n = NODES[selected];
      const anc = [...ancestors(selected)].map(k => NODES[k].label);
      const desc = [...descendants(selected)].map(k => NODES[k].label);
      stat.innerHTML = `<b>선택: ${n.label}</b> (${n.op})${n.formula ? ' — ' + n.formula : ''}<br>
                        <span style="color:${C.structure}">↑ 부모/조상</span>: ${anc.length ? anc.join(', ') : '(없음 — 입력 노드)'}<br>
                        <span style="color:${C.style}">↓ 자식/후손</span>: ${desc.length ? desc.join(', ') : '(없음 — 출력 노드)'}`;
      // 미분 경로
      if (selected === 'x'){
        eqEl.innerHTML = `\\[ \\frac{\\partial z}{\\partial x} = \\frac{\\partial z}{\\partial a}·\\frac{\\partial a}{\\partial x} + \\frac{\\partial z}{\\partial b}·\\frac{\\partial b}{\\partial x} \\]
                          <p style="font-size:.85rem;color:var(--ink-soft)">x는 두 경로로 z에 영향 → 합산.</p>`;
      } else if (selected === 'y'){
        eqEl.innerHTML = `\\[ \\frac{\\partial z}{\\partial y} = \\frac{\\partial z}{\\partial a}·\\frac{\\partial a}{\\partial y} = b · 1 = ${NODES.b.val.toFixed(3)} \\]`;
      } else if (selected === 'a'){
        eqEl.innerHTML = `\\[ \\frac{\\partial z}{\\partial a} = b = ${NODES.b.val.toFixed(3)} \\]`;
      } else if (selected === 'b'){
        eqEl.innerHTML = `\\[ \\frac{\\partial z}{\\partial b} = a = ${NODES.a.val.toFixed(3)} \\]`;
      } else {
        eqEl.innerHTML = `\\[ z = (x+y)·\\sin(x) = ${NODES.z.val.toFixed(3)} \\]`;
      }
      if (window.renderMathInElement) renderMathInElement(eqEl, {
        delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
      });
    }

    updateInfo();
    draw();
  };

  /* ============================================================
     IntersectionObserver 폴리필 — 첫 진입 시 init
     ============================================================ */
  CH6.onVisible = function(el, fn){
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { rootMargin: '120px' });
    io.observe(el);
  };

  /* ============================================================
     공용 — 챕터 nav, topbar, scroll progress, prev/next
     ============================================================ */
  CH6.SUBS = [
    { no:'01', t:'왜 다층이 필요한가 — XOR의 벽',                  f:'01.html' },
    { no:'02', t:'단일 뉴런 — 선형 변환 + 비선형 활성',             f:'02.html' },
    { no:'03', t:'MLP — 깊이가 표현 공간을 바꾸는 방법',            f:'03.html' },
    { no:'04', t:'만능 근사 정리 — 가능성과 효율',                  f:'04.html' },
    { no:'05', t:'활성화 1 — sigmoid·tanh, 옛 시절과 죽음',         f:'05.html' },
    { no:'06', t:'활성화 2 — ReLU 등장, sparsity, dying ReLU',     f:'06.html' },
    { no:'07', t:'활성화 3 — Leaky·ELU·GELU·Swish',                f:'07.html' },
    { no:'08', t:'출력층 1 — 회귀: 선형 + MSE = 가우시안 MLE',     f:'08.html' },
    { no:'09', t:'출력층 2 — 이진: sigmoid + BCE',                 f:'09.html' },
    { no:'10', t:'출력층 3 — 다중: softmax + CE',                  f:'10.html' },
    { no:'11', t:'계산 그래프 — 신경망을 흐름으로',                 f:'11.html' },
    { no:'12', t:'역전파 1 — 체인룰 직관',                          f:'12.html' },
    { no:'13', t:'역전파 2 — 식 6.44-6.57 한 줄씩',                f:'13.html' },
    { no:'14', t:'역전파 3 — 손계산 (2-2-1 MLP, 1 epoch)',         f:'14.html' },
    { no:'15', t:'기울기 소실 — 깊은 sigmoid의 한계',               f:'15.html' },
    { no:'16', t:'시험 대비 — 25개 자가점검 + 손계산 1문항',         f:'16.html' },
  ];

  CH6.buildNav = function(currentNo){
    const cur = CH6.SUBS.find(c => c.no === currentNo);
    const tb = document.querySelector('.topbar');
    if (tb) tb.innerHTML =
      `<a class="home" href="index.html">← Ch.06 표지</a>` +
      `<span class="ch-mini">SUB ${currentNo} / 16 · Chapter 06</span>`;
    const ol = document.querySelector('.ch-nav ol');
    if (ol) ol.innerHTML = CH6.SUBS.map(c =>
      `<li><a href="${c.f}" ${c.no === currentNo ? 'class="current"' : ''}>${c.t}</a></li>`).join('');
    const foot = document.querySelector('.ch-foot');
    if (foot) {
      const i = CH6.SUBS.indexOf(cur);
      const prev = i > 0 ? CH6.SUBS[i - 1] : { f: 'index.html', t: '챕터 표지로', no: '' };
      const next = i < CH6.SUBS.length - 1 ? CH6.SUBS[i + 1] : { f: '../ch07-regularization/index.html', t: 'Ch.07 정칙화로', no: '' };
      foot.innerHTML =
        `<a href="${prev.f}"><div class="dir">← 이전</div><div class="ti">${prev.t}</div></a>` +
        `<a href="${next.f}" class="next"><div class="dir">다음 →</div><div class="ti">${next.t}</div></a>`;
    }
    // scroll progress
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
    // 수식 렌더
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    } else {
      window.addEventListener('load', () => {
        if (window.renderMathInElement) renderMathInElement(document.body, {
          delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
          throwOnError: false,
        });
      });
    }
  };
})();
