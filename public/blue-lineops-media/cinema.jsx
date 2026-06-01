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

// ---- the film: ordered chapters --------------------------------------------
const SCENES = {
  intro: sceneIntro, globe: sceneGlobe, network: sceneNetwork,
  floor: sceneFloor, trend: sceneTrend, risk: sceneRisk, close: sceneClose,
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
  { id: 'open', label: '01', title: 'Cold Open', scene: 'intro', dur: 5 },
  { id: 'globe', label: '02', title: 'A Connected World', scene: 'globe', dur: 7 },
  { id: 'network', label: '03', title: 'One Operating Picture', scene: 'network', dur: 6 },
  { id: 'floor', label: '04', title: 'On the Floor', scene: 'floor', dur: 7 },
  { id: 'trend', label: '05', title: 'Signals, Live', scene: 'trend', dur: 6 },
  { id: 'close', label: '06', title: 'BlueLineOps', scene: 'close', dur: 5 },
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
  FEATURE_FILM, buildFilm, drawFilm, SCENES, hexToRgb, rgba, clamp, lerp, easeInOut, easeOut,
});
