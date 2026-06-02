/* ============================================================================
   BlueLineOps — Cinematic Player + canvas surfaces
   FilmCanvas: a DPR-aware <canvas> that renders a film at getTime() each frame.
   CinematicPlayer: full custom transport — scrubber w/ chapter ticks, hover-
   scrub thumbnail, timecode, letterbox, grain, vignette, fullscreen.
   ============================================================================ */
const { useRef, useEffect, useState, useCallback } = React;

// ---------- low-level animated canvas ----------
function FilmCanvas({ film, opts, getTime, running = true, className, style }) {
  const ref = useRef(null);
  const rafRef = useRef(0);
  const optsRef = useRef(opts); optsRef.current = opts;
  const getTimeRef = useRef(getTime); getTimeRef.current = getTime;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const frame = () => {
      drawFilm(ctx, w, h, getTimeRef.current(), film, optsRef.current);
      rafRef.current = requestAnimationFrame(frame);
    };
    // immediate first paint — never show a blank canvas even if rAF is throttled
    drawFilm(ctx, w, h, getTimeRef.current(), film, optsRef.current);
    if (running) rafRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [film, running]);

  // redraw once when paused & opts/time change
  useEffect(() => {
    if (running) return;
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const r = canvas.getBoundingClientRect();
    drawFilm(ctx, r.width, r.height, getTimeRef.current(), film, optsRef.current);
  });

  return <canvas ref={ref} className={className} style={{ display: 'block', width: '100%', height: '100%', ...style }} />;
}

// ---------- film grain + scanline overlay ----------
function Grain({ opacity = 0.06 }) {
  return <div className="bl-grain" style={{ opacity }} aria-hidden="true" />;
}

const fmt = (s) => {
  s = Math.max(0, s);
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
};

// ---------- the player ----------
function CinematicPlayer({ film, opts, autoStart = false, posterTime = 2, label = 'FEATURE', title = 'BlueLineOps — Operational Intelligence', meta = 'FILM · 00:36' }) {
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(autoStart);
  const [chapter, setChapter] = useState(film.chapters[0]);
  const [fs, setFs] = useState(false);
  const [hoverT, setHoverT] = useState(null); // seconds for hover thumb
  const [hoverX, setHoverX] = useState(0);
  const [showUI, setShowUI] = useState(true);

  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const lastTs = useRef(0);
  const fillRef = useRef(null);
  const headRef = useRef(null);
  const tcRef = useRef(null);
  const trackRef = useRef(null);
  const uiTimer = useRef(0);

  playingRef.current = playing;

  // master clock — imperative UI updates, low re-render
  useEffect(() => {
    let raf;
    const tick = (ts) => {
      if (!lastTs.current) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000; lastTs.current = ts;
      if (playingRef.current) {
        timeRef.current += dt;
        if (timeRef.current >= film.duration) { timeRef.current = 0; }
      }
      const t = timeRef.current;
      const frac = t / film.duration;
      if (fillRef.current) fillRef.current.style.width = (frac * 100) + '%';
      if (headRef.current) headRef.current.style.left = (frac * 100) + '%';
      if (tcRef.current) tcRef.current.textContent = fmt(t) + ' / ' + fmt(film.duration);
      const ch = film.chapters.find((c) => t >= c.start && t < c.end) || film.chapters[0];
      setChapter((prev) => (prev && prev.id === ch.id ? prev : ch));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [film]);

  const begin = () => { setStarted(true); setPlaying(true); nudgeUI(); };
  const toggle = () => { if (!started) return begin(); setPlaying((p) => !p); nudgeUI(); };
  const restart = () => { timeRef.current = 0; setPlaying(true); setStarted(true); nudgeUI(); };

  const nudgeUI = useCallback(() => {
    setShowUI(true); clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => { if (playingRef.current) setShowUI(false); }, 2600);
  }, []);

  const seekFromEvent = (e) => {
    const r = trackRef.current.getBoundingClientRect();
    const frac = clamp((e.clientX - r.left) / r.width, 0, 1);
    timeRef.current = frac * film.duration;
    if (fillRef.current) fillRef.current.style.width = frac * 100 + '%';
    if (headRef.current) headRef.current.style.left = frac * 100 + '%';
  };
  const onTrackDown = (e) => {
    seekFromEvent(e); nudgeUI();
    const move = (ev) => seekFromEvent(ev);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const onTrackHover = (e) => {
    const r = trackRef.current.getBoundingClientRect();
    const frac = clamp((e.clientX - r.left) / r.width, 0, 1);
    setHoverT(frac * film.duration); setHoverX(e.clientX - r.left);
  };

  return (
    <div className={'bl-player' + (fs ? ' is-fs' : '')}
      onMouseMove={nudgeUI}
      onMouseLeave={() => { if (playing) setShowUI(false); }}>
      <div className="bl-player-frame">
        <FilmCanvas film={film} opts={opts} running={true} getTime={() => started ? timeRef.current : posterTime} className="bl-player-canvas" />
        <Grain opacity={0.05} />
        <div className={'bl-letterbox' + (started ? ' open' : '')} aria-hidden="true">
          <span className="bl-lb top" /><span className="bl-lb bottom" />
        </div>

        {/* top metadata strip */}
        <div className={'bl-player-top' + (showUI || !playing ? ' show' : '')}>
          <span className="bl-rec"><i /></span>
          <span className="bl-eyebrow" style={{ color: 'var(--accent)' }}>{label}</span>
          <span className="bl-top-title">{title}</span>
          <span className="bl-top-meta">{meta}</span>
        </div>

        {/* center play / pause affordance */}
        {(!playing) && (
          <button className="bl-bigplay" onClick={toggle} aria-label="Play">
            <span className="bl-bigplay-ring" />
            <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            <span className="bl-bigplay-label">{started ? 'Resume' : 'Play Film'}</span>
          </button>
        )}

        {/* chapter caption bottom-left while playing */}
        <div className={'bl-cap' + (started ? ' show' : '')}>
          <span className="bl-cap-num">{chapter.label}</span>
          <span className="bl-cap-text">
            <span className="bl-cap-title">{chapter.title}</span>
            {chapter.desc && <span className="bl-cap-desc">{chapter.desc}</span>}
          </span>
        </div>

        {/* transport */}
        <div className={'bl-transport' + ((showUI || !playing) && started ? ' show' : '')} onMouseDown={(e) => e.stopPropagation()}>
          <div className="bl-scrub" ref={trackRef}
            onPointerDown={onTrackDown}
            onMouseMove={onTrackHover}
            onMouseLeave={() => setHoverT(null)}>
            <div className="bl-scrub-rail" />
            {/* chapter ticks */}
            {film.chapters.map((c) => (
              <span key={c.id} className="bl-tick" style={{ left: (c.start / film.duration) * 100 + '%' }} />
            ))}
            <div className="bl-scrub-fill" ref={fillRef} />
            <div className="bl-scrub-head" ref={headRef} />
            {hoverT != null && (
              <div className="bl-scrub-thumb" style={{ left: hoverX + 'px' }}>
                <FilmCanvas film={film} opts={opts} running={false} getTime={() => hoverT} className="bl-thumb-canvas" />
                <span className="bl-thumb-tc">{fmt(hoverT)}</span>
              </div>
            )}
          </div>
          <div className="bl-controls">
            <button className="bl-ctrl" onClick={toggle} aria-label="Play/Pause">
              {playing
                ? <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                : <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
            </button>
            <button className="bl-ctrl" onClick={restart} aria-label="Restart">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
            <span className="bl-tc" ref={tcRef}>0:00 / {fmt(film.duration)}</span>
            <span className="bl-ctrl-chap"><b>{chapter.label}</b> {chapter.title}</span>
            <span className="bl-flex" />
            <button className="bl-ctrl" onClick={() => setFs((v) => !v)} aria-label="Fullscreen">
              {fs
                ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3v6H3M15 21v-6h6M3 15h6v6M21 9h-6V3" /></svg>
                : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" /></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FilmCanvas, CinematicPlayer, Grain, fmt });
