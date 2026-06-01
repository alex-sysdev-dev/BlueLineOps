/* ============================================================================
   BlueLineOps — Media page sections
   Hero film · stat marquee · filterable gallery (hover-preview + lightbox) ·
   press coverage · media kit. All "footage" is synthetic (see cinema.jsx).
   ============================================================================ */

const { useState, useRef, useEffect } = React;

// single-scene mini film for a tile / lightbox
function single(scene, title, dur) {
  return buildFilm([{ id: scene, label: '01', title, scene, dur }]);
}

const MEDIA = [
  { id: 'feature', cat: 'Product', title: 'The Operating Picture', runtime: '0:36', scene: 'globe', poster: 2.4,
    blurb: 'The full BlueLineOps feature film — one connected view, from globe to floor.', feature: true },
  { id: 'trend', cat: 'Product', title: 'Signals, Live', runtime: '0:31', scene: 'trend', poster: 1.6,
    blurb: 'How the live trend board turns raw throughput into a read you can act on.' },
  { id: 'floor', cat: 'Product', title: 'On the Floor', runtime: '0:35', scene: 'floor', poster: 1.2,
    blurb: 'Pick paths, zones, and the interactive floor map in motion.' },
  { id: 'network', cat: 'Product', title: 'One Network', runtime: '0:26', scene: 'network', poster: 1.0,
    blurb: 'Every facility, dock, and yard as a single live operating graph.' },
  { id: 'peak', cat: 'Customers', title: 'Inside a Peak Shift', runtime: '0:48', scene: 'floor', poster: 2.0,
    blurb: 'A fulfillment leader walks a peak-season shift run entirely on BlueLineOps.' },
  { id: 'briefed', cat: 'Customers', title: 'From Blind to Briefed', runtime: '0:39', scene: 'trend', poster: 0.9,
    blurb: 'Replacing fragmented reports with one calm command view.' },
  { id: 'keynote', cat: 'Events', title: 'Keynote 2026', runtime: '1:12', scene: 'close', poster: 0.85,
    blurb: 'The vision for operational intelligence — opening night, Ops Summit.' },
  { id: 'demo', cat: 'Events', title: 'Live Demo · Ops Summit', runtime: '0:54', scene: 'globe', poster: 1.4,
    blurb: 'A full product walkthrough recorded on the show floor.' },
  { id: 'design', cat: 'Inside the Build', title: 'Designing the Console', runtime: '0:33', scene: 'intro', poster: 0.5,
    blurb: 'The craft behind a dark-first operations console built for speed.' },
  { id: 'model', cat: 'Inside the Build', title: 'The Data Model', runtime: '0:29', scene: 'network', poster: 1.5,
    blurb: 'How live KPIs, risk, and labor connect under the hood.' },
];
const CATS = ['All', 'Product', 'Customers', 'Inside the Build', 'Events'];

// ---------------- HERO ----------------
function Hero({ opts, onPlay, motion }) {
  const clock = useRef(0);
  const baseT = 9; // start mid-globe for a strong ambient frame
  return (
    <section className="bl-hero" id="top">
      <div className="bl-hero-bg">
        <FilmCanvas film={FEATURE_FILM} opts={opts} running={motion}
          getTime={() => (motion ? (baseT + performance.now() / 1000 * 0.5) : baseT)} className="bl-hero-canvas" />
        <Grain opacity={0.05} />
        <div className="bl-hero-scrim" />
      </div>

      <header className="bl-topbar">
        <a className="bl-brand" href="#top">
          <img src="assets/logo-mark.svg" alt="" width="30" height="30" />
          <span><b>Blue</b>LineOps</span>
        </a>
        <nav className="bl-nav">
          <a href="#feature">Feature Film</a>
          <a href="#library">Library</a>
          <a href="#leadership">Leadership</a>
          <a href="#press">Press</a>
          <a href="#kit">Media Kit</a>
        </nav>
        <a className="bl-pressbtn" href="#contact">Press Inquiries</a>
      </header>

      <div className="bl-hero-inner">
        <div className="bl-hero-eyebrow">
          <span className="bl-live"><i />Now Streaming</span>
          <span>BlueLineOps Media</span>
        </div>
        <h1 className="bl-hero-title">
          The line that<br /><span className="grad">moves the world.</span>
        </h1>
        <p className="bl-hero-sub">
          Films, demos, and press from the operating system for fulfillment.
          Operational intelligence, shown — not told.
        </p>
        <div className="bl-hero-cta">
          <button className="bl-play-cta" onClick={onPlay}>
            <span className="bl-play-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
            Play the Feature Film
            <span className="bl-play-len">0:36</span>
          </button>
          <a className="bl-ghost-cta" href="#library">Browse the Library</a>
        </div>
      </div>

      <Marquee />
      <div className="bl-scrollcue"><span /></div>
    </section>
  );
}

function Marquee() {
  const items = [
    ['UPTIME', '100%'], ['ON-TIME', '98.6%'], ['SHIPMENTS MONITORED', '24,379'],
    ['CPT RISK ALERTS', '3'], ['PRECISION', '99.7%'], ['AI EFFICIENCY GAIN', '25%'],
    ['TRAILER DWELL', '5.4h'], ['UNITS / HR', '312'],
  ];
  const row = items.concat(items);
  return (
    <div className="bl-marquee" aria-hidden="true">
      <div className="bl-marquee-track">
        {row.map(([k, v], i) => (
          <span className="bl-marquee-item" key={i}>
            <em>{k}</em><b>{v}</b><span className="bl-marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------- FEATURE BLOCK ----------------
function Feature({ opts, playerKey }) {
  return (
    <section className="bl-section" id="feature">
      <div className="bl-sec-head">
        <span className="bl-eyebrow" style={{ color: 'var(--accent)' }}>Feature Film</span>
        <h2 className="bl-h">One connected view, in motion.</h2>
        <p className="bl-lede">Six chapters — from a connected world to the floor to the live signals you run on. Scrub it; every frame is live.</p>
      </div>
      <CinematicPlayer key={playerKey} film={FEATURE_FILM} opts={opts}
        label="FEATURE" title="The Operating Picture" meta="FILM · 00:36 · 6 CHAPTERS" posterTime={8} />
      <div className="bl-chaprail">
        {FEATURE_FILM.chapters.map((c) => (
          <div className="bl-chapcard" key={c.id}>
            <span className="bl-chapnum">{c.label}</span>
            <span className="bl-chaptitle">{c.title}</span>
            <span className="bl-chaplen">{fmt(c.start)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------- GALLERY ----------------
function Tile({ item, opts, onOpen }) {
  const [hover, setHover] = useState(false);
  const tRef = useRef(item.poster);
  const startRef = useRef(0);
  const film = useRef(single(item.scene, item.title, 6)).current;
  useEffect(() => {
    if (!hover) { tRef.current = item.poster; return; }
    startRef.current = performance.now();
  }, [hover, item.poster]);
  const getTime = () => hover ? item.poster + (performance.now() - startRef.current) / 1000 * 0.9 : item.poster;
  return (
    <button className={'bl-tile' + (item.feature ? ' feat' : '')} onClick={() => onOpen(item)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="bl-tile-media">
        <FilmCanvas film={film} opts={opts} running={hover} getTime={getTime} className="bl-tile-canvas" />
        <span className="bl-tile-grad" />
        <span className={'bl-tile-play' + (hover ? ' on' : '')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <span className="bl-tile-len">{item.runtime}</span>
        {item.feature && <span className="bl-tile-feat">FEATURE</span>}
      </div>
      <div className="bl-tile-body">
        <span className="bl-tile-cat">{item.cat}</span>
        <span className="bl-tile-title">{item.title}</span>
        <span className="bl-tile-blurb">{item.blurb}</span>
      </div>
    </button>
  );
}

function Gallery({ opts, onOpen }) {
  const [cat, setCat] = useState('All');
  const list = cat === 'All' ? MEDIA : MEDIA.filter((m) => m.cat === cat);
  return (
    <section className="bl-section" id="library">
      <div className="bl-sec-head row">
        <div>
          <span className="bl-eyebrow" style={{ color: 'var(--accent)' }}>The Library</span>
          <h2 className="bl-h">Watch the operation work.</h2>
        </div>
        <div className="bl-filters">
          {CATS.map((c) => (
            <button key={c} className={'bl-chip' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div className="bl-grid">
        {list.map((m) => <Tile key={m.id} item={m} opts={opts} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

// ---------------- LIGHTBOX ----------------
function Lightbox({ item, opts, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  if (!item) return null;
  const film = item.feature ? FEATURE_FILM : single(item.scene, item.title, 8);
  return (
    <div className="bl-lightbox" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bl-lightbox-inner">
        <div className="bl-lightbox-head">
          <div>
            <span className="bl-tile-cat">{item.cat} · {item.runtime}</span>
            <h3 className="bl-lb-title">{item.title}</h3>
          </div>
          <button className="bl-lb-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <CinematicPlayer film={film} opts={opts} autoStart={true}
          label={item.cat.toUpperCase()} title={item.title} meta={'FILM · ' + item.runtime} />
        <p className="bl-lb-blurb">{item.blurb}</p>
      </div>
    </div>
  );
}

// ---------------- LEADERSHIP ----------------
function Leadership() {
  return (
    <section className="bl-section bl-lead" id="leadership">
      <div className="bl-sec-head">
        <span className="bl-eyebrow" style={{ color: 'var(--accent)' }}>Leadership</span>
        <h2 className="bl-h">The operator behind the operating picture.</h2>
      </div>
      <div className="bl-lead-card">
        <div className="bl-lead-photo">
          <img src="assets/headshot.jpg" alt="Alex Aguilar" />
          <span className="bl-lead-photo-grad" />
          <span className="bl-lead-badge"><i />AxiomOps</span>
        </div>
        <div className="bl-lead-body">
          <span className="bl-lead-name">Alex Aguilar</span>
          <span className="bl-lead-role">Founder &amp; CEO, AxiomOps · Creator of BlueLineOps</span>
          <p className="bl-lead-bio">
            Alex spent 8+ years running high-volume fulfillment — area manager and supervisor
            roles across Amazon, Walmart, and Upfield, leading labor, yards, automation, and CPT
            windows at scale. He built BlueLineOps from the floor up: a full-stack operations
            platform (Next.js, React, PostgreSQL) that turns the noise of a distribution center
            into one live command view. Through AxiomOps, he's now extending that work into
            autonomous, AI-assisted fault management for distributed operations.
          </p>
          <blockquote className="bl-lead-quote">
            “I didn't study automation from the outside. I ran the systems, supervised the teams,
            and diagnosed the failures — then built the software to fix them.”
          </blockquote>
          <div className="bl-lead-meta">
            <span><em>FOR INTERVIEWS</em>press@axiomops.com</span>
            <span><em>BASED IN</em>Las Vegas, NV</span>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Leadership });

const QUOTES = [
  { q: 'The first console that makes a fulfillment center feel legible at a glance.', src: 'SUPPLY CHAIN DIVE', kind: 'Review' },
  { q: 'CPT risk used to be a 6 a.m. surprise. Now it is a number we watch all day.', src: 'VP OPERATIONS, NATIONAL 3PL', kind: 'Customer' },
  { q: 'Dark, fast, and unmistakably built by people who have run a dock.', src: 'MODERN MATERIALS HANDLING', kind: 'Feature' },
];
const OUTLETS = ['SUPPLY CHAIN DIVE', 'MH&L', 'LOGISTICS WEEKLY', 'THE LOADOUT', 'FREIGHTWAVES', 'OPS QUARTERLY'];

function Press() {
  return (
    <section className="bl-section bl-press" id="press">
      <div className="bl-sec-head">
        <span className="bl-eyebrow" style={{ color: 'var(--accent)' }}>Press &amp; Coverage</span>
        <h2 className="bl-h">What the floor is saying.</h2>
      </div>
      <div className="bl-quotes">
        {QUOTES.map((x, i) => (
          <figure className="bl-quote" key={i}>
            <span className="bl-quote-kind">{x.kind}</span>
            <blockquote>“{x.q}”</blockquote>
            <figcaption>{x.src}</figcaption>
          </figure>
        ))}
      </div>
      <div className="bl-outlets">
        {OUTLETS.map((o) => <span key={o} className="bl-outlet">{o}</span>)}
      </div>
    </section>
  );
}

// ---------------- MEDIA KIT ----------------
const KIT = [
  { t: 'Brand Mark & Logo Suite', d: 'SVG + PNG · light / dark / mono', s: 'ZIP · 2.4 MB', ico: 'logo' },
  { t: 'Product Stills', d: '12 high-res console captures', s: 'ZIP · 38 MB', ico: 'img' },
  { t: 'Fact Sheet', d: 'Company, product, key numbers', s: 'PDF · 320 KB', ico: 'doc' },
  { t: 'Executive Headshots', d: 'Leadership, print-ready', s: 'ZIP · 18 MB', ico: 'people' },
];
function KitIcon({ k }) {
  const p = {
    logo: <><circle cx="12" cy="12" r="8" /><path d="M8 14l3-3 2 1 3-4" /></>,
    img: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 17l-5-5L5 21" /></>,
    doc: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h6" /></>,
    people: <><circle cx="9" cy="9" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 7a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" /></>,
  };
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{p[k]}</svg>;
}
function MediaKit() {
  return (
    <section className="bl-section" id="kit">
      <div className="bl-sec-head row">
        <div>
          <span className="bl-eyebrow" style={{ color: 'var(--accent)' }}>Media Kit</span>
          <h2 className="bl-h">Everything you need to run the story.</h2>
        </div>
        <button className="bl-kit-all">Download full kit <span>ZIP · 61 MB</span></button>
      </div>
      <div className="bl-kit-grid">
        {KIT.map((k) => (
          <button className="bl-kit-card" key={k.t}>
            <span className="bl-kit-ico"><KitIcon k={k.ico} /></span>
            <span className="bl-kit-t">{k.t}</span>
            <span className="bl-kit-d">{k.d}</span>
            <span className="bl-kit-foot"><span className="bl-kit-size">{k.s}</span>
              <span className="bl-kit-dl"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M7 11l5 5 5-5M5 21h14" /></svg></span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ---------------- CONTACT / FOOTER ----------------
function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section className="bl-section bl-contact" id="contact">
      <div className="bl-contact-card">
        <div className="bl-contact-left">
          <span className="bl-eyebrow" style={{ color: 'var(--accent)' }}>Press Inquiries</span>
          <h2 className="bl-h">Working on a story?</h2>
          <p className="bl-lede">We respond to credentialed press within one business day. For embargoed briefings, note your outlet and deadline.</p>
          <div className="bl-contact-meta">
            <span><em>PRESS</em>press@bluelineops.com</span>
            <span><em>PARTNERSHIPS</em>partners@bluelineops.com</span>
          </div>
        </div>
        <form className="bl-contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          {sent ? (
            <div className="bl-sent">
              <span className="bl-sent-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg></span>
              <b>Request received.</b><span>We'll be in touch shortly.</span>
            </div>
          ) : (<>
            <div className="bl-field"><label>Name</label><input required placeholder="Jordan Vela" /></div>
            <div className="bl-field"><label>Outlet</label><input required placeholder="Supply Chain Dive" /></div>
            <div className="bl-field"><label>Email</label><input required type="email" placeholder="you@outlet.com" /></div>
            <div className="bl-field"><label>What are you working on?</label><textarea rows="3" placeholder="Topic, angle, deadline…" /></div>
            <button type="submit" className="bl-submit">Send Press Request</button>
          </>)}
        </form>
      </div>
      <footer className="bl-foot">
        <div className="bl-brand"><img src="assets/logo-mark.svg" alt="" width="24" height="24" /><span><b>Blue</b>LineOps</span></div>
        <span className="bl-foot-tag">Operational Intelligence for Logistics</span>
        <span className="bl-foot-copy">© 2026 AxiomOps · BlueLineOps Media Center</span>
      </footer>
    </section>
  );
}

Object.assign(window, { Hero, Feature, Gallery, Lightbox, Press, MediaKit, Contact, MEDIA, single });
