/* ============================================================================
   BlueLineOps — Cinematic Film Engine
   Synthetic, playhead-driven canvas scenes. No video files: the "footage" is
   rendered live from the product's own visual DNA (night globe, facility
   network, floor map, live trend board, CPT clock). The player drives `time`;
   scenes read a normalized local progress and grade toward the active accent.
   ============================================================================ */

// ---- math / color helpers --------------------------------------------------
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;

// deterministic pseudo-random
function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// soft radial wash used as a base grade on every scene
function grade(ctx, w, h, c, glow) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.46, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
  g.addColorStop(0, rgba(c, 0.1 * glow));
  g.addColorStop(0.55, rgba(c, 0.03 * glow));
  g.addColorStop(1, 'rgba(2,4,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
function vignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
function bg(ctx, w, h) {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, w, h);
}

// ============================================================================
// SCENE 01 — COLD OPEN. The blue line draws itself across the void.
// ============================================================================
function sceneIntro(ctx, w, h, t, o) {
  bg(ctx, w, h);
  grade(ctx, w, h, o.accent, o.glow);
  const cy = h * 0.5;
  const draw = easeOut(clamp(t / 0.62, 0, 1));
  const x2 = w * 0.08 + (w * 0.84) * draw;
  const x1 = w * 0.08;

  // faint grid ticks revealed along the line
  ctx.save();
  const rng = mulberry(7);
  for (let i = 0; i < 60; i++) {
    const gx = w * 0.08 + (w * 0.84) * (i / 59);
    if (gx > x2) break;
    const tall = rng() > 0.82;
    const hh = tall ? 16 : 6;
    ctx.strokeStyle = rgba(o.accent, tall ? 0.5 : 0.18);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, cy + 22); ctx.lineTo(gx, cy + 22 + hh); ctx.stroke();
  }
  ctx.restore();

  // trailing gradient line
  const lg = ctx.createLinearGradient(x1, 0, x2, 0);
  lg.addColorStop(0, rgba(o.accent, 0));
  lg.addColorStop(0.7, rgba(o.accent, 0.5 * o.glow));
  lg.addColorStop(1, rgba(o.accentHi, 0.95));
  ctx.strokeStyle = lg;
  ctx.lineWidth = 2.4;
  ctx.shadowColor = rgba(o.accent, 0.9); ctx.shadowBlur = 26 * o.glow;
  ctx.beginPath(); ctx.moveTo(x1, cy); ctx.lineTo(x2, cy); ctx.stroke();
  ctx.shadowBlur = 0;

  // glowing head
  if (draw < 1) {
    const hg = ctx.createRadialGradient(x2, cy, 0, x2, cy, 26);
    hg.addColorStop(0, rgba(o.accentHi, 0.95));
    hg.addColorStop(1, rgba(o.accent, 0));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x2, cy, 26, 0, TAU); ctx.fill();
  } else {
    // line settles into a soft pulse
    const pulse = 0.5 + 0.5 * Math.sin((t - 0.62) * 7);
    ctx.fillStyle = rgba(o.accentHi, 0.3 + 0.25 * pulse);
    ctx.fillRect(x1, cy - 1, w * 0.84, 2);
  }
  vignette(ctx, w, h);
}

// ============================================================================
// SCENE 02 — A CONNECTED WORLD. Night globe of points with shipment arcs.
// ============================================================================
function sceneGlobe(ctx, w, h, t, o) {
  bg(ctx, w, h);
  grade(ctx, w, h, o.accent, o.glow);
  const cx = w * 0.5, cy = h * 0.52, R = Math.min(w, h) * 0.36;
  const yaw = t * TAU * 0.6 + 0.6;
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const tilt = -0.4, ct = Math.cos(tilt), st = Math.sin(tilt);

  const pts = [];
  for (let la = -80; la <= 80; la += 11) {
    const latR = (la * Math.PI) / 180;
    const ring = Math.cos(latR);
    const step = Math.max(8, Math.round(26 * ring));
    for (let k = 0; k < step; k++) {
      const lon = (k / step) * TAU;
      let x = Math.cos(latR) * Math.cos(lon);
      let y = Math.sin(latR);
      let z = Math.cos(latR) * Math.sin(lon);
      // yaw
      let x2 = x * cosY - z * sinY, z2 = x * sinY + z * cosY;
      // tilt
      let y2 = y * ct - z2 * st, z3 = y * st + z2 * ct;
      pts.push({ x: cx + x2 * R, y: cy + y2 * R, z: z3, la });
    }
  }
  // back hemisphere faint
  for (const p of pts) {
    if (p.z >= 0) continue;
    ctx.fillStyle = rgba(o.accent, 0.05);
    ctx.fillRect(p.x, p.y, 1.3, 1.3);
  }
  // front hemisphere bright
  for (const p of pts) {
    if (p.z < 0) continue;
    const a = 0.3 + 0.6 * p.z;
    const warm = Math.abs(p.la) < 30 && Math.random() > 0.5;
    ctx.fillStyle = rgba(warm ? o.accentHi : o.accent, a);
    const s = 1.6 + p.z * 1.8;
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }

  // arcs
  const rng = mulberry(21);
  const nArcs = 7;
  for (let i = 0; i < nArcs; i++) {
    const a0 = rng() * TAU, l0 = (rng() - 0.5) * 1.4;
    const a1 = a0 + 1 + rng() * 2, l1 = (rng() - 0.5) * 1.4;
    const proj = (lat, lon) => {
      let x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon);
      let x2 = x * cosY - z * sinY, z2 = x * sinY + z * cosY;
      let y2 = y * ct - z2 * st, z3 = y * st + z2 * ct;
      return { x: cx + x2 * R, y: cy + y2 * R, z: z3 };
    };
    const p0 = proj(l0, a0), p1 = proj(l1, a1);
    if (p0.z < -0.2 && p1.z < -0.2) continue;
    const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
    const lift = 60 + 90 * rng();
    const cxp = mx, cyp = my - lift;
    const prog = (t * 1.4 + i / nArcs) % 1;
    ctx.strokeStyle = rgba(o.accentHi, 0.34 * o.glow);
    ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(cxp, cyp, p1.x, p1.y); ctx.stroke();
    // travelling pulse
    const u = easeInOut(prog);
    const bx = (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * cxp + u * u * p1.x;
    const by = (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * cyp + u * u * p1.y;
    const pg = ctx.createRadialGradient(bx, by, 0, bx, by, 7);
    pg.addColorStop(0, rgba(o.accentHi, 0.95)); pg.addColorStop(1, rgba(o.accent, 0));
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(bx, by, 7, 0, TAU); ctx.fill();
  }
  // rim glow
  ctx.strokeStyle = rgba(o.accent, 0.32 * o.glow); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, TAU); ctx.stroke();
  vignette(ctx, w, h);
}

// ============================================================================
// SCENE 03 — ONE OPERATING PICTURE. Facility network graph, pulses on edges.
// ============================================================================
const NET_NODES = (() => {
  const rng = mulberry(99); const arr = [];
  for (let i = 0; i < 16; i++) arr.push({ x: 0.08 + rng() * 0.84, y: 0.16 + rng() * 0.68, r: 0.5 + rng(), hub: rng() > 0.78 });
  return arr;
})();
function sceneNetwork(ctx, w, h, t, o) {
  bg(ctx, w, h);
  grade(ctx, w, h, o.accent, o.glow);
  const N = NET_NODES.map((n) => ({ ...n, px: n.x * w, py: n.y * h }));
  const edges = [];
  for (let i = 0; i < N.length; i++)
    for (let j = i + 1; j < N.length; j++) {
      const d = Math.hypot(N[i].px - N[j].px, N[i].py - N[j].py);
      if (d < Math.min(w, h) * 0.34) edges.push([i, j, d]);
    }
  // edges
  edges.forEach(([i, j], k) => {
    ctx.strokeStyle = rgba(o.accent, 0.1 * o.glow); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(N[i].px, N[i].py); ctx.lineTo(N[j].px, N[j].py); ctx.stroke();
    // pulse on a subset
    if (k % 3 === 0) {
      const prog = (t * 0.9 + (k % 7) / 7) % 1;
      const bx = lerp(N[i].px, N[j].px, prog), by = lerp(N[i].py, N[j].py, prog);
      const pg = ctx.createRadialGradient(bx, by, 0, bx, by, 5);
      pg.addColorStop(0, rgba(o.accentHi, 0.9)); pg.addColorStop(1, rgba(o.accent, 0));
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(bx, by, 5, 0, TAU); ctx.fill();
    }
  });
  // nodes
  N.forEach((n, i) => {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + i);
    const rr = n.hub ? 4.5 : 2.6;
    if (n.hub) {
      const ring = (t * 0.8 + i * 0.2) % 1;
      ctx.strokeStyle = rgba(o.accentHi, (1 - ring) * 0.4);
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(n.px, n.py, rr + ring * 26, 0, TAU); ctx.stroke();
    }
    const g = ctx.createRadialGradient(n.px, n.py, 0, n.px, n.py, rr * 3);
    g.addColorStop(0, rgba(n.hub ? o.accentHi : o.accent, 0.6 + 0.4 * pulse));
    g.addColorStop(1, rgba(o.accent, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.px, n.py, rr * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(o.accentHi, 0.95); ctx.beginPath(); ctx.arc(n.px, n.py, rr, 0, TAU); ctx.fill();
  });
  vignette(ctx, w, h);
}

// ============================================================================
// SCENE 04 — ON THE FLOOR. Top-down warehouse with travelling pick paths.
// ============================================================================
function sceneFloor(ctx, w, h, t, o) {
  bg(ctx, w, h);
  grade(ctx, w, h, o.accent, o.glow * 0.8);
  const padX = w * 0.1, padY = h * 0.16;
  const gw = w - padX * 2, gh = h - padY * 2;
  const rows = 7, cols = 11;
  const cellW = gw / cols, cellH = gh / rows;
  // racks
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c % 2 === 1) continue; // aisles
      const x = padX + c * cellW + 3, y = padY + r * cellH + 3;
      const heat = (Math.sin(r * 1.3 + c * 0.7 + t * 3) + 1) / 2;
      ctx.fillStyle = rgba(o.accent, 0.05 + heat * 0.14 * o.glow);
      ctx.strokeStyle = rgba(o.accent, 0.16);
      ctx.lineWidth = 1;
      ctx.beginPath();
      const rr = 2; const ww = cellW - 6, hh2 = cellH - 6;
      ctx.roundRect(x, y, ww, hh2, rr); ctx.fill(); ctx.stroke();
    }
  }
  // travelling pickers (snake along aisles)
  const pickers = 3;
  for (let p = 0; p < pickers; p++) {
    const phase = (t * 0.6 + p / pickers) % 1;
    const aisleCount = Math.ceil(cols / 2);
    const total = aisleCount;
    const fpos = phase * total;
    const ai = Math.floor(fpos);
    const within = fpos - ai;
    const aisleX = padX + (ai * 2 + 1) * cellW + cellW / 2;
    const up = ai % 2 === 0;
    const yy = padY + (up ? within : 1 - within) * gh;
    const col = [o.accentHi, { r: 52, g: 211, b: 153 }, { r: 56, g: 189, b: 248 }][p];
    const g = ctx.createRadialGradient(aisleX, yy, 0, aisleX, yy, 12);
    g.addColorStop(0, rgba(col, 0.95)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(aisleX, yy, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(aisleX, yy, 2.4, 0, TAU); ctx.fill();
  }
  // scan sweep
  const sweepX = padX + ((t * 0.7) % 1) * gw;
  const sg = ctx.createLinearGradient(sweepX - 40, 0, sweepX + 10, 0);
  sg.addColorStop(0, rgba(o.accentHi, 0)); sg.addColorStop(1, rgba(o.accentHi, 0.16 * o.glow));
  ctx.fillStyle = sg; ctx.fillRect(sweepX - 40, padY, 50, gh);
  vignette(ctx, w, h);
}

// ============================================================================
// SCENE 05 — SIGNALS, LIVE. Animated trend board (line + area + bars).
// ============================================================================
function sceneTrend(ctx, w, h, t, o) {
  bg(ctx, w, h);
  grade(ctx, w, h, o.accent, o.glow * 0.7);
  const padX = w * 0.12, padY = h * 0.2;
  const cw = w - padX * 2, ch = h - padY * 2;
  // gridlines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padY + (ch * i) / 4;
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(padX + cw, y); ctx.stroke();
  }
  const series = [
    { col: { r: 56, g: 189, b: 248 }, off: 0, amp: 0.22, base: 0.55 },
    { col: { r: 52, g: 211, b: 153 }, off: 1.7, amp: 0.16, base: 0.42 },
  ];
  const n = 48;
  // bars (risk) behind
  for (let i = 0; i < n; i++) {
    const x = padX + (cw * i) / (n - 1);
    const v = (Math.sin(i * 0.5 + t * 2.4) + 1) / 2;
    const bh = (0.06 + v * 0.16) * ch;
    ctx.fillStyle = rgba({ r: 251, g: 113, b: 133 }, 0.12 + v * 0.1);
    ctx.fillRect(x - cw / n / 2 + 1, padY + ch - bh, cw / n - 2, bh);
  }
  series.forEach((s) => {
    const path = [];
    for (let i = 0; i < n; i++) {
      const x = padX + (cw * i) / (n - 1);
      const v = s.base + s.amp * Math.sin(i * 0.32 + t * 2.6 + s.off) + s.amp * 0.4 * Math.sin(i * 0.11 + t * 1.3);
      path.push({ x, y: padY + ch * (1 - clamp(v, 0.05, 0.95)) });
    }
    // area
    const ag = ctx.createLinearGradient(0, padY, 0, padY + ch);
    ag.addColorStop(0, rgba(s.col, 0.22 * o.glow)); ag.addColorStop(1, rgba(s.col, 0));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(path[0].x, padY + ch);
    path.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(path[n - 1].x, padY + ch); ctx.closePath(); ctx.fill();
    // line
    ctx.strokeStyle = rgba(s.col, 0.9); ctx.lineWidth = 2;
    ctx.shadowColor = rgba(s.col, 0.7); ctx.shadowBlur = 12 * o.glow;
    ctx.beginPath(); path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.shadowBlur = 0;
    // head dot
    const head = path[n - 1];
    ctx.fillStyle = rgba(s.col, 1); ctx.beginPath(); ctx.arc(head.x, head.y, 3, 0, TAU); ctx.fill();
  });
  // playhead
  const phx = padX + ((t * 0.5) % 1) * cw;
  ctx.strokeStyle = rgba(o.accentHi, 0.3); ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(phx, padY); ctx.lineTo(phx, padY + ch); ctx.stroke(); ctx.setLineDash([]);
  vignette(ctx, w, h);
}

// ============================================================================
// SCENE 06 — BEAT THE CLOCK. CPT risk gauge sweeping; markers flare.
// ============================================================================
function sceneRisk(ctx, w, h, t, o) {
  bg(ctx, w, h);
  grade(ctx, w, h, { r: 244, g: 63, b: 94 }, o.glow * 0.5);
  const cx = w * 0.5, cy = h * 0.54, R = Math.min(w, h) * 0.32;
  const start = -Math.PI * 1.25, end = Math.PI * 0.25; // 270deg
  // track
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, R, start, end); ctx.stroke();
  // ticks
  for (let i = 0; i <= 30; i++) {
    const a = lerp(start, end, i / 30);
    const inner = i % 5 === 0 ? R - 18 : R - 10;
    ctx.strokeStyle = rgba(o.accent, i % 5 === 0 ? 0.5 : 0.2); ctx.lineWidth = i % 5 === 0 ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22));
    ctx.lineTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner); ctx.stroke();
  }
  const sweep = easeInOut(t);
  const ang = lerp(start, end, sweep);
  // progress arc — emerald to amber to rose
  const grd = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
  grd.addColorStop(0, 'rgba(52,211,153,0.9)'); grd.addColorStop(0.6, 'rgba(245,158,11,0.9)'); grd.addColorStop(1, 'rgba(244,63,94,0.95)');
  ctx.strokeStyle = grd; ctx.lineWidth = 10; ctx.shadowColor = rgba(o.accent, 0.5); ctx.shadowBlur = 16 * o.glow;
  ctx.beginPath(); ctx.arc(cx, cy, R, start, ang); ctx.stroke(); ctx.shadowBlur = 0;
  // risk markers
  const markers = [0.46, 0.68, 0.85];
  markers.forEach((m, i) => {
    const a = lerp(start, end, m);
    const passed = sweep >= m;
    const flare = passed ? 0.6 + 0.4 * Math.sin(t * 9 + i) : 0.18;
    const mx = cx + Math.cos(a) * (R + 16), my = cy + Math.sin(a) * (R + 16);
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, 12);
    g.addColorStop(0, `rgba(244,63,94,${flare})`); g.addColorStop(1, 'rgba(244,63,94,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,228,230,${0.4 + flare * 0.5})`; ctx.beginPath(); ctx.arc(mx, my, 2.4, 0, TAU); ctx.fill();
  });
  // needle
  ctx.strokeStyle = rgba(o.accentHi, 0.95); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.shadowColor = rgba(o.accentHi, 0.8); ctx.shadowBlur = 14 * o.glow;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * (R - 6), cy + Math.sin(ang) * (R - 6)); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = rgba(o.accentHi, 1); ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill();
  vignette(ctx, w, h);
}

// ============================================================================
// SCENE 07 — CLOSE. Lines converge to a single point of light.
// ============================================================================
function sceneClose(ctx, w, h, t, o) {
  bg(ctx, w, h);
  grade(ctx, w, h, o.accent, o.glow * (0.4 + 0.6 * t));
  const cx = w * 0.5, cy = h * 0.5;
  const rng = mulberry(303);
  const conv = easeInOut(clamp(t / 0.8, 0, 1));
  for (let i = 0; i < 26; i++) {
    const a = rng() * TAU;
    const far = Math.max(w, h) * 0.7;
    const x0 = cx + Math.cos(a) * far, y0 = cy + Math.sin(a) * far;
    const x1 = lerp(x0, cx, conv), y1 = lerp(y0, cy, conv);
    const lg = ctx.createLinearGradient(x0, y0, x1, y1);
    lg.addColorStop(0, rgba(o.accent, 0)); lg.addColorStop(1, rgba(o.accentHi, 0.5 * o.glow));
    ctx.strokeStyle = lg; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  const core = 6 + conv * 60 * (0.6 + 0.4 * Math.sin(t * 6));
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, core);
  g.addColorStop(0, rgba(o.accentHi, 0.95)); g.addColorStop(0.4, rgba(o.accent, 0.5)); g.addColorStop(1, rgba(o.accent, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, core, 0, TAU); ctx.fill();
  vignette(ctx, w, h);
}

// ============================================================================
// AGENT PIPELINE — how Ops Intelligence fetches live KPIs and delivers to the UI.
// One shared architecture diagram; each chapter highlights a stage via `focus`.
// ============================================================================
function pGlow(ctx, x, y, r, c, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
function mono(ctx, x, y, txt, c, size, align) {
  ctx.font = `600 ${size}px "Geist Mono", ui-monospace, monospace`;
  ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = c; ctx.fillText(txt, x, y);
  ctx.textAlign = 'left';
}
// the KPI store (DB cylinder)
function drawDB(ctx, x, y, o, lit) {
  const w = 86, h = 64, rx = w / 2, ry = 9;
  ctx.save();
  ctx.strokeStyle = rgba(o.accent, 0.3 + lit * 0.5); ctx.lineWidth = 1.4;
  ctx.fillStyle = rgba(o.accent, 0.05 + lit * 0.1);
  // body
  ctx.beginPath();
  ctx.moveTo(x - rx, y - h / 2); ctx.lineTo(x - rx, y + h / 2);
  ctx.ellipse(x, y + h / 2, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(x + rx, y - h / 2); ctx.stroke();
  // discs
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.ellipse(x, y + i * (h / 2.4), rx, ry, 0, 0, TAU);
    ctx.strokeStyle = rgba(o.accent, (0.2 + lit * 0.5) * (i === -1 ? 1 : 0.5)); ctx.stroke();
  }
  // kpi rows inside
  for (let i = 0; i < 3; i++) {
    const ry2 = y - 10 + i * 12;
    ctx.strokeStyle = rgba(o.accentHi, lit * (0.5 + 0.5 * Math.sin(Date.now() / 300 + i)) * 0.6);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 26, ry2); ctx.lineTo(x + 26, ry2); ctx.stroke();
  }
  ctx.restore();
}
// the agent core
function drawAgent(ctx, x, y, o, focus, t) {
  const reason = focus === 'reason';
  const R = 30;
  // rings
  for (let i = 0; i < 3; i++) {
    const rr = R + i * 9;
    ctx.strokeStyle = rgba(o.accent, (reason ? 0.5 : 0.22) - i * 0.06);
    ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke();
  }
  // spinning arcs when reasoning
  if (reason) {
    for (let i = 0; i < 3; i++) {
      const a0 = t * TAU * (1 + i * 0.4) + i * 2;
      ctx.strokeStyle = rgba(o.accentHi, 0.7 - i * 0.18); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, R + 6 + i * 7, a0, a0 + 1.1); ctx.stroke();
    }
    // orbiting tokens
    for (let i = 0; i < 7; i++) {
      const a = t * 4 + (i / 7) * TAU; const rr = R + 20;
      pGlow(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 4, o.accentHi, 0.8);
    }
  }
  // core
  pGlow(ctx, x, y, R, o.accent, reason ? 0.6 : 0.4);
  const pulse = 0.5 + 0.5 * Math.sin(t * 5);
  ctx.fillStyle = rgba(o.accentHi, 0.85 + pulse * 0.15);
  // hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; const px = x + Math.cos(a) * 13, py = y + Math.sin(a) * 13; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#04060c';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; const px = x + Math.cos(a) * 6, py = y + Math.sin(a) * 6; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fill();
}
// UI render target — 3 KPI tiles that populate
function drawTiles(ctx, x, y, o, fill) {
  const tw = 132, th = 38, gap = 12;
  const kpis = [['THROUGHPUT', '312 u/h', { r: 56, g: 189, b: 248 }], ['ON-TIME', '98.6%', { r: 52, g: 211, b: 153 }], ['CPT RISK', '3', { r: 251, g: 113, b: 133 }]];
  for (let i = 0; i < 3; i++) {
    const ty = y - (th * 1.5 + gap) + i * (th + gap);
    const lit = clamp(fill * 3 - i, 0, 1);
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x - tw / 2, ty, tw, th, 8);
    ctx.fillStyle = rgba(o.accent, 0.04 + lit * 0.06);
    ctx.strokeStyle = rgba(o.accent, 0.18 + lit * 0.4); ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();
    mono(ctx, x - tw / 2 + 11, ty + 13, kpis[i][0], rgba(o.accent, 0.4 + lit * 0.5), 8, 'left');
    if (lit > 0.4) mono(ctx, x - tw / 2 + 11, ty + 26, kpis[i][1], rgba(kpis[i][2], lit), 12, 'left');
    // sparkline
    ctx.strokeStyle = rgba(kpis[i][2], lit * 0.9); ctx.lineWidth = 1.5; ctx.beginPath();
    for (let k = 0; k <= 14 * lit; k++) {
      const px = x + 20 + k * 3, py = ty + 22 + Math.sin(k * 0.7 + i) * 6;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function pipeline(ctx, w, h, t, o, focus) {
  bg(ctx, w, h);
  grade(ctx, w, h, o.accent, o.glow * 0.65);
  const railY = h * 0.42;
  const ax = w * 0.13, bx = w * 0.40, ex = w * 0.83;
  const dby = h * 0.80;

  // base connections
  ctx.strokeStyle = rgba(o.accent, 0.14); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(ax, railY); ctx.lineTo(ex, railY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx, railY); ctx.lineTo(bx, dby); ctx.stroke();
  const dim = (on) => on ? 1 : 0.26;

  // active-segment highlight + packets
  const drawSeg = (x1, y1, x2, y2, prog, n, c) => {
    const lg = ctx.createLinearGradient(x1, y1, x2, y2);
    lg.addColorStop(0, rgba(c, 0.15)); lg.addColorStop(1, rgba(c, 0.5 * o.glow));
    ctx.strokeStyle = lg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const u = (prog + i / n) % 1;
      pGlow(ctx, lerp(x1, x2, u), lerp(y1, y2, u), 6, o.accentHi, 0.9);
    }
  };

  // QUERY console node
  ctx.save();
  ctx.beginPath(); ctx.roundRect(ax - 26, railY - 18, 52, 36, 7);
  ctx.fillStyle = rgba(o.accent, 0.06 + dim(focus === 'query') * 0.08);
  ctx.strokeStyle = rgba(o.accent, 0.3 + dim(focus === 'query') * 0.5); ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
  // prompt lines / blinking cursor
  ctx.strokeStyle = rgba(o.accentHi, dim(focus === 'query') * 0.8); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ax - 16, railY - 6); ctx.lineTo(ax + (focus === 'query' ? -16 + 26 * easeOut(t) : 6), railY - 6); ctx.stroke();
  if (focus === 'query' && Math.sin(t * 10) > 0) { ctx.fillStyle = rgba(o.accentHi, 0.9); ctx.fillRect(ax + 10, railY + 2, 2, 9); }
  ctx.restore();

  drawDB(ctx, bx, dby, o, dim(focus === 'fetch'));
  drawTiles(ctx, ex, railY, o, focus === 'render' ? easeInOut(t) : 0.0);
  drawAgent(ctx, bx, railY, o, focus, t);

  // packets per stage
  if (focus === 'query') drawSeg(ax + 26, railY, bx - 34, railY, t, 3, o.accentHi);
  if (focus === 'fetch') {
    if (t < 0.5) drawSeg(bx, railY + 34, bx, dby - 34, t * 2, 2, o.accentHi);          // request down
    else drawSeg(bx, dby - 34, bx, railY + 34, (t - 0.5) * 2, 3, { r: 52, g: 211, b: 153 }); // KPI rows up
  }
  if (focus === 'render') drawSeg(bx + 34, railY, ex - 70, railY, t, 3, o.accentHi);

  // labels
  mono(ctx, ax, railY + 34, 'OPERATOR', rgba(focus === 'query' ? o.accentHi : o.accent, dim(focus === 'query')), 10);
  mono(ctx, bx, railY - 52, 'OPS AGENT', rgba(o.accentHi, 0.95), 10);
  mono(ctx, bx, dby + 38, 'KPI STORE', rgba(focus === 'fetch' ? o.accentHi : o.accent, dim(focus === 'fetch')), 10);
  mono(ctx, ex, railY - 78, 'COMMAND VIEW', rgba(focus === 'render' ? o.accentHi : o.accent, dim(focus === 'render')), 10);

  // HUD telemetry line (top-left), techy + live
  const hud = {
    query: 'POST /agent/ask    "kpis for my site?"',
    fetch: 'GET /rest/v1/kpis  →  200 OK · ' + (8 + Math.floor((Math.sin(t * 9) + 1) * 9)) + 'ms',
    reason: 'reason() · rag(SOP) · structured_output ✓',
    render: 'stream → COMMAND VIEW · ' + Math.floor(easeInOut(t) * 24) + ' tiles',
  }[focus];
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  mono(ctx, w * 0.06, h * 0.13, hud, rgba(o.accentHi, 0.55), 12, 'left');
  // status dot
  pGlow(ctx, w * 0.06 - 6, h * 0.13 - 4, 5, { r: 52, g: 211, b: 153 }, 0.9);

  // structured-output panel during reason
  if (focus === 'reason') {
    const px = bx + 70, py = railY - 30, pw = 150, ph = 78;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 8);
    ctx.fillStyle = 'rgba(4,6,12,0.7)'; ctx.strokeStyle = rgba(o.accent, 0.4); ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
    const rows = [['throughput', '312'], ['onTime', '0.986'], ['cptRisk', '3'], ['status', 'ok']];
    rows.forEach((r, i) => {
      const reveal = clamp(t * 5 - i, 0, 1);
      mono(ctx, px + 12, py + 18 + i * 16, r[0], rgba(o.accent, 0.5 * reveal), 10, 'left');
      mono(ctx, px + pw - 12, py + 18 + i * 16, r[1], rgba(o.accentHi, reveal), 10, 'right');
    });
    ctx.restore();
    ctx.textAlign = 'left';
  }
  vignette(ctx, w, h);
}
const agentQuery = (c, w, h, t, o) => pipeline(c, w, h, t, o, 'query');
const agentFetch = (c, w, h, t, o) => pipeline(c, w, h, t, o, 'fetch');
const agentReason = (c, w, h, t, o) => pipeline(c, w, h, t, o, 'reason');
const agentRender = (c, w, h, t, o) => pipeline(c, w, h, t, o, 'render');

// ============================================================================
// AGENT JOURNEY — one continuous camera flight through a single world:
// chat (extreme close-up) → Enter → text→code → if/else → verifier →
// CPT-risk KPI → dock-util KPI → labor-hours KPI → agent query (morning CPT)
// → pull back to the command view. Each chapter = one camera move between
// stations; chapter ends/starts share a station so cuts are seamless.
// ============================================================================
const FGL = { r: 228, g: 228, b: 231 };           // light UI text
const OKC = { r: 52, g: 211, b: 153 };            // emerald
const SKY = { r: 56, g: 189, b: 248 };
const ROSE = { r: 251, g: 113, b: 133 };
const JW = {
  chat: [220, 1150], ifelse: [680, 820], verifier: [1080, 900],
  cpt: [1520, 560], dock: [1880, 800], labor: [1560, 1140], agent: [1060, 1240], ui: [560, 380],
};
const JORDER = ['chat', 'ifelse', 'verifier', 'cpt', 'dock', 'labor', 'agent', 'ui'];
const JSTATIONS = [
  { c: JW.chat, z: 2.5 }, { c: JW.ifelse, z: 1.75 }, { c: JW.verifier, z: 1.75 }, { c: JW.cpt, z: 1.75 },
  { c: JW.dock, z: 1.75 }, { c: JW.labor, z: 1.75 }, { c: JW.agent, z: 1.6 }, { c: JW.ui, z: 1.15 },
];

function jpanel(ctx, x, y, w, h, o, active, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r || 12);
  ctx.fillStyle = 'rgba(6,9,16,0.94)'; ctx.fill();
  ctx.strokeStyle = rgba(o.accent, 0.22 + active * 0.5); ctx.lineWidth = 1.5; ctx.stroke();
}
function drawWires(ctx, o) {
  ctx.strokeStyle = rgba(o.accent, 0.12); ctx.lineWidth = 2;
  ctx.beginPath();
  JORDER.forEach((k, i) => { const p = JW[k]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
  ctx.stroke();
}
function drawPacket(ctx, o, fromKey, toKey, lt, isCode) {
  const A = JW[fromKey], B = JW[toKey];
  const lg = ctx.createLinearGradient(A[0], A[1], B[0], B[1]);
  lg.addColorStop(0, rgba(o.accentHi, 0.12)); lg.addColorStop(1, rgba(o.accentHi, 0.55));
  ctx.strokeStyle = lg; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  const head = easeInOut(lt);
  const n = isCode ? 7 : 4;
  for (let i = 0; i < n; i++) {
    const u = clamp(head - i * 0.05, 0, 1);
    const px = lerp(A[0], B[0], u), py = lerp(A[1], B[1], u);
    if (isCode) {
      ctx.fillStyle = rgba(o.accentHi, 0.9 - i * 0.1);
      ctx.font = '600 13px "Geist Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(['{', '}', '<', '>', '0', '1', ';'][i % 7], px, py);
    } else {
      pGlow(ctx, px, py, 6, o.accentHi, 0.9 - i * 0.12);
    }
  }
  ctx.textAlign = 'left';
}

function drawChat(ctx, o, active, typed) {
  const [cx, cy] = JW.chat, w = 300, h = 200, x = cx - w / 2, y = cy - h / 2;
  jpanel(ctx, x, y, w, h, o, active);
  mono(ctx, x + 16, y + 20, 'OPS INTELLIGENCE', rgba(o.accentHi, 0.5 + 0.4 * active), 10, 'left');
  pGlow(ctx, x + w - 18, y + 19, 5, OKC, 0.4 + 0.5 * active);
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.roundRect(x + 16, y + 38, 184, 32, 8); ctx.fill();
  mono(ctx, x + 28, y + 56, 'How can I help?', rgba(FGL, 0.45), 10, 'left');
  const iy = y + h - 46;
  ctx.beginPath(); ctx.roundRect(x + 16, iy, w - 32, 34, 9);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
  ctx.strokeStyle = rgba(o.accent, 0.3 + active * 0.5); ctx.lineWidth = 1.2; ctx.stroke();
  const full = 'kpis for the current CPT?';
  const shown = full.slice(0, Math.floor(full.length * clamp(typed, 0, 1)));
  mono(ctx, x + 28, iy + 17, shown, rgba(FGL, 0.92), 11, 'left');
  if (typed < 1 && Math.sin(performance.now() / 200) > 0) {
    const cw = ctx.measureText(shown).width; ctx.fillStyle = rgba(o.accentHi, 0.9); ctx.fillRect(x + 28 + cw + 2, iy + 9, 2, 16);
  }
  const sx = x + w - 44, press = active > 0.5 && typed >= 1;
  ctx.beginPath(); ctx.roundRect(sx, iy + 6, 28, 22, 6);
  ctx.fillStyle = press ? rgba(o.accent, 0.95) : rgba(o.accent, 0.3); ctx.fill();
  if (press) pGlow(ctx, sx + 14, iy + 17, 24, o.accentHi, 0.6);
  mono(ctx, sx + 14, iy + 16, '\u23ce', rgba(FGL, 0.95), 12, 'center');
  // Enter hint
  if (typed >= 0.98) mono(ctx, cx, y + h + 16, 'PRESS ENTER', rgba(o.accentHi, 0.4 + 0.4 * Math.abs(Math.sin(performance.now() / 300))), 9, 'center');
}
function drawIfElse(ctx, o, active, reveal) {
  const [cx, cy] = JW.ifelse, w = 250, h = 132, x = cx - w / 2, y = cy - h / 2;
  jpanel(ctx, x, y, w, h, o, active);
  mono(ctx, x + 16, y + 20, 'LOGIC NODE', rgba(o.accentHi, 0.4 + 0.4 * active), 9, 'left');
  mono(ctx, x + 16, y + 48, 'if ( cpt.risk > \u03b8 )', rgba(FGL, 0.5 + 0.45 * active), 13, 'left');
  mono(ctx, x + 34, y + 80, 'then \u2192 escalate', rgba(OKC, 0.4 + 0.5 * reveal), 11, 'left');
  mono(ctx, x + 34, y + 104, 'else \u2192 monitor', rgba(o.accent, 0.4 + 0.2 * active), 11, 'left');
  if (reveal > 0.1) pGlow(ctx, x + 22, y + 76, 7, OKC, reveal * 0.7);
}
function drawVerifier(ctx, o, active, reveal) {
  const [cx, cy] = JW.verifier, w = 210, h = 130, x = cx - w / 2, y = cy - h / 2;
  jpanel(ctx, x, y, w, h, o, active);
  // shield badge
  const sx = cx, sy = y + 52, R = 22;
  ctx.beginPath();
  ctx.moveTo(sx, sy - R); ctx.lineTo(sx + R * 0.85, sy - R * 0.5);
  ctx.lineTo(sx + R * 0.85, sy + R * 0.35); ctx.quadraticCurveTo(sx, sy + R * 1.3, sx - R * 0.85, sy + R * 0.35);
  ctx.lineTo(sx - R * 0.85, sy - R * 0.5); ctx.closePath();
  ctx.fillStyle = rgba(o.accent, 0.1 + reveal * 0.15); ctx.strokeStyle = rgba(o.accentHi, 0.4 + reveal * 0.5); ctx.lineWidth = 1.6;
  ctx.fill(); ctx.stroke();
  // check
  ctx.strokeStyle = rgba(OKC, 0.5 + reveal * 0.5); ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(sx - 8, sy); ctx.lineTo(sx - 2, sy + 7); ctx.lineTo(sx + 9, sy - 7); ctx.stroke();
  mono(ctx, cx, y + h - 30, 'VERIFIER', rgba(o.accentHi, 0.5 + 0.4 * active), 11, 'center');
  mono(ctx, cx, y + h - 14, 'schema \u2713  guardrails \u2713', rgba(OKC, 0.35 + 0.5 * reveal), 9, 'center');
}
function drawKpi(ctx, o, anchor, label, value, col, active, reveal) {
  const [cx, cy] = anchor, w = 196, h = 108, x = cx - w / 2, y = cy - h / 2;
  jpanel(ctx, x, y, w, h, o, active);
  mono(ctx, x + 16, y + 22, label, rgba(col, 0.45 + 0.4 * active), 10, 'left');
  ctx.font = '700 30px "Geist",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(col, 0.45 + 0.55 * Math.max(active, reveal)); ctx.fillText(value, x + 16, y + 58);
  ctx.strokeStyle = rgba(col, 0.35 + 0.5 * active); ctx.lineWidth = 2; ctx.beginPath();
  for (let k = 0; k <= 18; k++) { const px = x + 16 + k * ((w - 32) / 18), py = y + h - 16 + Math.sin(k * 0.6 + cx) * 7; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  if (reveal > 0.1) pGlow(ctx, x + w - 18, y + 20, 11, col, reveal * 0.6);
}
function drawAgentQ(ctx, o, active, reveal) {
  const [cx, cy] = JW.agent;
  drawAgent(ctx, cx, cy, o, active > 0.6 ? 'reason' : '', reveal * 3);
  if (active > 0.35) {
    const w = 290, h = 56, x = cx - w / 2, y = cy - 96;
    jpanel(ctx, x, y, w, h, o, active);
    const full = 'GET kpis?window=CPT_AM';
    const shown = full.slice(0, Math.floor(full.length * clamp(reveal * 1.4, 0, 1)));
    mono(ctx, x + 16, y + 22, shown, rgba(o.accentHi, 0.9), 12, 'left');
    mono(ctx, x + 16, y + 40, 'current CPT \u00b7 morning pull', rgba(FGL, 0.5), 9, 'left');
  }
  mono(ctx, cx, cy + 58, 'OPS AGENT', rgba(o.accentHi, 0.5 + 0.4 * active), 10, 'center');
}
function drawUIcmd(ctx, o, active, reveal) {
  const [cx, cy] = JW.ui, w = 372, h = 248, x = cx - w / 2, y = cy - h / 2;
  jpanel(ctx, x, y, w, h, o, active, 14);
  pGlow(ctx, x + 22, y + 22, 6, o.accentHi, 0.5 + 0.4 * active); mono(ctx, x + 36, y + 22, 'COMMAND VIEW', rgba(FGL, 0.8), 10, 'left');
  const tw = (w - 48) / 3, tk = [['CPT RISK', '3', ROSE], ['DOCK', '87%', SKY], ['LABOR', '312h', OKC]];
  tk.forEach((t, i) => {
    const tx = x + 16 + i * (tw + 8), ty = y + 42;
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, 52, 8);
    ctx.fillStyle = rgba(t[2], 0.05 + reveal * 0.07); ctx.strokeStyle = rgba(t[2], 0.3); ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
    mono(ctx, tx + 10, ty + 16, t[0], rgba(t[2], 0.6), 8, 'left');
    ctx.font = '700 18px "Geist",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(t[2], 0.4 + 0.6 * reveal); ctx.fillText(t[1], tx + 10, ty + 40);
  });
  const chy = y + 112, chh = 116;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let g = 0; g <= 3; g++) { const gy = chy + g * (chh / 3); ctx.beginPath(); ctx.moveTo(x + 16, gy); ctx.lineTo(x + w - 16, gy); ctx.stroke(); }
  [{ c: SKY, p: 0 }, { c: OKC, p: 1.6 }].forEach((se) => {
    ctx.strokeStyle = rgba(se.c, 0.5 + 0.4 * reveal); ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 0; k <= 40; k++) { const px = x + 16 + k * ((w - 32) / 40), py = chy + chh / 2 - Math.sin(k * 0.3 + se.p) * chh * 0.32 * reveal; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
  });
}
function drawJHud(ctx, w, h, o, idx) {
  const lines = ['> ask: "kpis for the current CPT?"', 'compile \u2192 if ( cpt.risk > \u03b8 ) { \u2026 }',
    'verifier \u2192 schema \u2713 guardrails \u2713', 'read CPT_RISK = 3 \u00b7 deadlined', 'read DOCK_UTIL = 87%',
    'read LABOR_HOURS = 312h', 'agent \u2192 GET kpis?window=CPT_AM', 'render \u2192 COMMAND VIEW \u2713'];
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  pGlow(ctx, w * 0.06 - 8, h * 0.12 - 4, 5, OKC, 0.9);
  ctx.font = '600 12px "Geist Mono",monospace'; ctx.fillStyle = rgba(o.accentHi, 0.6);
  ctx.fillText(lines[idx] || '', w * 0.06, h * 0.12);
  ctx.fillStyle = rgba(o.accent, 0.45); ctx.textAlign = 'right';
  ctx.fillText('STAGE ' + String(idx + 1).padStart(2, '0') + ' / 08', w * 0.94, h * 0.12);
  ctx.textAlign = 'left';
}
function drawJourney(ctx, w, h, o, fromIdx, toIdx, lt) {
  bg(ctx, w, h);
  grade(ctx, w, h, o.accent, o.glow * 0.6);
  const e = easeInOut(lt);
  const a = JSTATIONS[fromIdx], b = JSTATIONS[toIdx];
  const cam = { x: lerp(a.c[0], b.c[0], e), y: lerp(a.c[1], b.c[1], e), z: lerp(a.z, b.z, e) };
  ctx.save();
  const s = (w / 1280) * cam.z;
  ctx.translate(w / 2, h / 2); ctx.scale(s, s); ctx.translate(-cam.x, -cam.y);
  drawWires(ctx, o);
  if (fromIdx !== toIdx) drawPacket(ctx, o, JORDER[fromIdx], JORDER[toIdx], lt, fromIdx === 0);
  const focus = toIdx;
  const A = (i) => (i === focus ? 1 : 0.4);
  const R = (i) => (i === focus ? e : 0);
  drawChat(ctx, o, A(0), (fromIdx === 0 && toIdx === 0) ? lt : 1);
  drawIfElse(ctx, o, A(1), R(1));
  drawVerifier(ctx, o, A(2), R(2));
  drawKpi(ctx, o, JW.cpt, 'CPT RISK', '3', ROSE, A(3), R(3));
  drawKpi(ctx, o, JW.dock, 'DOCK UTIL', '87%', SKY, A(4), R(4));
  drawKpi(ctx, o, JW.labor, 'LABOR HOURS', '312h', OKC, A(5), R(5));
  drawAgentQ(ctx, o, A(6), R(6));
  drawUIcmd(ctx, o, A(7), R(7));
  ctx.restore();
  drawJHud(ctx, w, h, o, toIdx);
  vignette(ctx, w, h);
}
function aj0(c, w, h, t, o) { drawJourney(c, w, h, o, 0, 0, t); }
function aj1(c, w, h, t, o) { drawJourney(c, w, h, o, 0, 1, t); }
function aj2(c, w, h, t, o) { drawJourney(c, w, h, o, 1, 2, t); }
function aj3(c, w, h, t, o) { drawJourney(c, w, h, o, 2, 3, t); }
function aj4(c, w, h, t, o) { drawJourney(c, w, h, o, 3, 4, t); }
function aj5(c, w, h, t, o) { drawJourney(c, w, h, o, 4, 5, t); }
function aj6(c, w, h, t, o) { drawJourney(c, w, h, o, 5, 6, t); }
function aj7(c, w, h, t, o) { drawJourney(c, w, h, o, 6, 7, t); }

// ---- the film: ordered chapters --------------------------------------------
const SCENES = {
  intro: sceneIntro, globe: sceneGlobe, network: sceneNetwork,
  floor: sceneFloor, trend: sceneTrend, risk: sceneRisk, close: sceneClose,
  agentQuery, agentFetch, agentReason, agentRender,
  aj0, aj1, aj2, aj3, aj4, aj5, aj6, aj7,
};

function buildFilm(chapters) {
  let acc = 0;
  const out = chapters.map((c) => {
    const start = acc; acc += c.dur;
    return { ...c, start, end: acc };
  });
  return { chapters: out, duration: acc };
}

const FEATURE_FILM = buildFilm([
  { id: 'open', label: '01', title: 'The Operating System for Fulfillment', scene: 'intro', dur: 5,
    desc: 'One platform connecting every facility, signal, and decision.', tag: 'BLUELINEOPS · PLATFORM' },
  { id: 'globe', label: '02', title: 'Every Site, One Network', scene: 'globe', dur: 7,
    desc: 'Live telemetry streams in from every facility, dock, and yard.', tag: '47 SITES · LIVE TELEMETRY' },
  { id: 'network', label: '03', title: 'One Operating Picture', scene: 'network', dur: 6,
    desc: 'Sites, lanes, and flows resolve into a single live operating graph.', tag: 'DOCKS · YARDS · LANES' },
  { id: 'floor', label: '04', title: 'Down to the Floor', scene: 'floor', dur: 7,
    desc: 'Zones, pick paths, and labor — mapped and tracked in real time.', tag: 'ZONES · PICK PATHS · LABOR' },
  { id: 'trend', label: '05', title: 'Signals, Live', scene: 'trend', dur: 6,
    desc: 'Throughput, on-time rate, and risk update the moment they move.', tag: 'THROUGHPUT · ON-TIME · RISK' },
  { id: 'close', label: '06', title: 'One Command View', scene: 'close', dur: 5,
    desc: 'Every signal, every site — on one screen built for the floor.', tag: 'ONE COMMAND VIEW' },
]);

// the agent data-pipeline explainer — a continuous camera flight
const AGENT_FILM = buildFilm([
  { id: 'ask', label: '01', title: 'The Ask', scene: 'aj0', dur: 5 },
  { id: 'compile', label: '02', title: 'Compiled to Logic', scene: 'aj1', dur: 5 },
  { id: 'verify', label: '03', title: 'Verifier', scene: 'aj2', dur: 4 },
  { id: 'cpt', label: '04', title: 'CPT Risk', scene: 'aj3', dur: 4 },
  { id: 'dock', label: '05', title: 'Dock Utilization', scene: 'aj4', dur: 4 },
  { id: 'labor', label: '06', title: 'Labor Hours', scene: 'aj5', dur: 4 },
  { id: 'query', label: '07', title: 'Asking for the Morning CPT', scene: 'aj6', dur: 5 },
  { id: 'back', label: '08', title: 'Back to You', scene: 'aj7', dur: 5 },
]);

// draw whichever chapter `time` lands in, with a short crossfade
function drawFilm(ctx, w, h, time, film, opts) {
  const dur = film.duration;
  const tt = ((time % dur) + dur) % dur;
  let idx = film.chapters.findIndex((c) => tt >= c.start && tt < c.end);
  if (idx < 0) idx = film.chapters.length - 1;
  const ch = film.chapters[idx];
  const localT = clamp((tt - ch.start) / ch.dur, 0, 1);
  SCENES[ch.scene](ctx, w, h, localT, opts);
  // concrete data tag (platform film) — bottom-right mono chip
  if (ch.tag) {
    ctx.save();
    ctx.font = '600 13px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    const pad = Math.max(18, w * 0.035);
    const tw = ctx.measureText(ch.tag).width;
    const cx = w - pad, cy = h - pad;
    // dot + text
    const dotX = cx - tw - 14;
    const g = ctx.createRadialGradient(dotX, cy - 4, 0, dotX, cy - 4, 6);
    g.addColorStop(0, rgba(opts.accentHi, 0.95)); g.addColorStop(1, rgba(opts.accent, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(dotX, cy - 4, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(opts.accentHi, 0.7);
    ctx.fillText(ch.tag, cx, cy);
    ctx.restore();
  }
  // crossfade into next chapter in the last 0.6s
  const fade = 0.6;
  if (ch.end - tt < fade && idx < film.chapters.length - 1) {
    const next = film.chapters[idx + 1];
    const a = (fade - (ch.end - tt)) / fade;
    ctx.save(); ctx.globalAlpha = easeInOut(a);
    SCENES[next.scene](ctx, w, h, 0, opts);
    ctx.restore();
  }
  return ch;
}

// expose to other babel scripts
Object.assign(window, {
  FEATURE_FILM, AGENT_FILM, buildFilm, drawFilm, SCENES, hexToRgb, rgba, clamp, lerp, easeInOut, easeOut,
});
