/* ============================================================================
   BlueLineOps — Media page app shell + Tweaks
   ============================================================================ */
const { useState: useS, useEffect: useE } = React;

const ACCENTS = {
  blue:    ['#3b82f6', '#60a5fa'],
  cyan:    ['#22d3ee', '#38bdf8'],
  emerald: ['#10b981', '#34d399'],
  violet:  ['#8b5cf6', '#a78bfa'],
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#3b82f6", "#60a5fa"],
  "glow": 1,
  "motion": true,
  "density": "regular",
  "deepBlack": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lightbox, setLightbox] = useS(null);

  const accent = Array.isArray(t.accent) ? t.accent : ACCENTS.blue;
  const opts = {
    accent: hexToRgb(accent[0]),
    accentHi: hexToRgb(accent[1]),
    glow: t.glow,
  };

  // push accent + bg to CSS custom props
  useE(() => {
    const r = document.documentElement.style;
    r.setProperty('--accent', accent[0]);
    r.setProperty('--accent-hi', accent[1]);
    r.setProperty('--accent-r', `${opts.accent.r},${opts.accent.g},${opts.accent.b}`);
    r.setProperty('--accent-hi-r', `${opts.accentHi.r},${opts.accentHi.g},${opts.accentHi.b}`);
    r.setProperty('--bg-base', t.deepBlack ? '#04060c' : '#0a0f1a');
    r.setProperty('--bg-base-2', t.deepBlack ? '#070b14' : '#0d1424');
  }, [accent[0], accent[1], opts.accent, opts.accentHi, t.deepBlack]);

  const feature = MEDIA.find((m) => m.feature);

  return (
    <div className={'bl-app dens-' + t.density}>
      <Hero opts={opts} motion={t.motion} onPlay={() => setLightbox(feature)} />
      <main className="bl-main">
        <Feature opts={opts} />
        <Gallery opts={opts} onOpen={setLightbox} />
        <Leadership />
        <Press />
        <MediaKit />
        <Contact />
      </main>

      {lightbox && <Lightbox item={lightbox} opts={opts} onClose={() => setLightbox(null)} />}

      <TweaksPanel>
        <TweakSection label="Lighting" />
        <TweakColor label="Accent" value={t.accent}
          options={[ACCENTS.blue, ACCENTS.cyan, ACCENTS.emerald, ACCENTS.violet]}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSlider label="Glow" value={t.glow} min={0.4} max={1.7} step={0.1}
          onChange={(v) => setTweak('glow', v)} />
        <TweakToggle label="Deep black" value={t.deepBlack}
          onChange={(v) => setTweak('deepBlack', v)} />
        <TweakSection label="Motion & Layout" />
        <TweakToggle label="Ambient motion" value={t.motion}
          onChange={(v) => setTweak('motion', v)} />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
