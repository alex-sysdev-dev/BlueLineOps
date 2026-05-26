'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import s from './LandingHero.module.css'

// Globe uses WebGL — client only, no SSR
const GlobeScene = dynamic(() => import('./GlobeScene'), { ssr: false })

// ── Bar heights ────────────────────────────────────────────────────────────
const BAR_HEIGHTS = ['h-[38%]','h-[52%]','h-[46%]','h-[60%]','h-[68%]','h-[63%]','h-[80%]'] as const

// ── Count-up ──────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let n = 0
    const step = Math.ceil(target / (duration / 16))
    const t = setInterval(() => {
      n += step
      if (n >= target) { setCount(target); clearInterval(t) }
      else setCount(n)
    }, 16)
    return () => clearInterval(t)
  }, [target, duration])
  return count
}

// ── Panel ─────────────────────────────────────────────────────────────────
function Panel({
  children, accentClass, glowClass, fadeClass, isHovered, onEnter, onLeave,
}: {
  children: React.ReactNode
  accentClass: string
  glowClass: string
  fadeClass: string
  isHovered: boolean
  onEnter: () => void
  onLeave: () => void
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={[
        s.fadeUp, fadeClass,
        'w-52 shrink-0 rounded-xl border p-4 cursor-default',
        'transition-all duration-300 backdrop-blur-md bg-black/70',
        isHovered
          ? `${accentClass} ${glowClass}`
          : 'border-zinc-700/60 hover:border-zinc-600/60',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function LandingHero() {
  const activeShipments = useCountUp(24379)
  const [hovered, setHovered] = useState<string | null>(null)
  const h = (id: string) => hovered === id

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">

      {/* ── Globe — full screen background ───────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <GlobeScene />
      </div>

      {/* ── Overlay layout — pointer-events-none so globe stays interactive ─ */}
      <div className="relative z-10 min-h-screen flex flex-col pointer-events-none">

        {/* TOP ROW */}
        <div className="flex items-start justify-between px-7 pt-6 gap-4">

          {/* Global Visibility */}
          <div className="pointer-events-auto">
            <Panel
              accentClass="border-cyan-400/60"
              glowClass="shadow-[0_0_28px_rgba(34,211,238,0.15)]"
              fadeClass={s.d015}
              isHovered={h('global')}
              onEnter={() => setHovered('global')}
              onLeave={() => setHovered(null)}
            >
              <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 mb-3 uppercase">
                Global Visibility
              </p>
              {[
                { dot: 'bg-cyan-400',   label: 'Real Time Tracking' },
                { dot: 'bg-blue-400',   label: 'Shipment Intelligence' },
                { dot: 'bg-amber-400',  label: 'Exception Monitoring' },
                { dot: 'bg-violet-400', label: 'Predictive Analytics' },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-2.5 py-[5px]">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                  <span className="text-[11px] text-zinc-300">{label}</span>
                </div>
              ))}
            </Panel>
          </div>

          {/* Center: logo + brand title */}
          <div className={[s.fadeUp, s.d005, 'flex flex-col items-center pt-1 gap-1.5'].join(' ')}>
            <div className={[s.floatLogo, 'h-9 w-9 rounded-full border border-blue-400/50 bg-black/80 flex items-center justify-center'].join(' ')}>
              <Image src="/login.svg" alt="" width={20} height={20} className="opacity-90" />
            </div>
            <h1 className="text-[clamp(1.8rem,4vw,3.25rem)] font-bold tracking-tighter leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)]">
              <span className="text-blue-400">Blue</span>
              <span className="text-zinc-100">LineOps</span>
            </h1>
            <p className="text-[9px] tracking-[0.22em] text-zinc-400 uppercase drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              Operational Intelligence for Logistics
            </p>
          </div>

          {/* Operational Insights */}
          <div className="pointer-events-auto">
            <Panel
              accentClass="border-blue-400/60"
              glowClass="shadow-[0_0_28px_rgba(59,130,246,0.15)]"
              fadeClass={s.d015}
              isHovered={h('insights')}
              onEnter={() => setHovered('insights')}
              onLeave={() => setHovered(null)}
            >
              <p className="text-[10px] font-bold tracking-[0.2em] text-blue-400 mb-3 uppercase">
                Operational Insights
              </p>
              {[
                { label: 'On-Time Performance', value: '98.6%',  cls: 'text-emerald-400' },
                { label: 'Correction Rate',     value: '1.4%',   cls: 'text-amber-400'   },
                { label: 'Risk Alerts',         value: '3',      cls: 'text-rose-400'     },
                { label: 'Shipments Monitored', value: '24,175', cls: 'text-blue-300'     },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex items-center justify-between py-[5px]">
                  <span className="text-[11px] text-zinc-400">{label}</span>
                  <span className={`text-xs font-bold tabular-nums ${cls}`}>{value}</span>
                </div>
              ))}
            </Panel>
          </div>
        </div>

        {/* Spacer — globe shows through, pushes bottom row to bottom */}
        <div className="flex-1" />

        {/* Hint — anchored just above bottom row */}
        <div className={[s.fadeUp, s.d045, 'flex items-center justify-center pb-4'].join(' ')}>
          <p className="text-[10px] tracking-[0.3em] text-blue-400/60 uppercase animate-pulse drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
            ● Click any node on the globe to enter
          </p>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-end justify-between px-7 pb-7 gap-4">

          {/* Active Shipments */}
          <div className="pointer-events-auto">
            <Panel
              accentClass="border-emerald-400/60"
              glowClass="shadow-[0_0_28px_rgba(52,211,153,0.15)]"
              fadeClass={s.d045}
              isHovered={h('shipments')}
              onEnter={() => setHovered('shipments')}
              onLeave={() => setHovered(null)}
            >
              <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 mb-1 uppercase">
                Active Shipments
              </p>
              <p className="text-3xl font-bold text-zinc-100 tabular-nums tracking-tight">
                {activeShipments.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-400 font-medium">▲ 13.4% in last 7 days</p>
              <div className="mt-3 flex items-end gap-0.5 h-7">
                {BAR_HEIGHTS.map((bh, i) => (
                  <div key={i}
                    className={`flex-1 rounded-sm transition-all duration-300 ${bh} ${hovered === 'shipments' ? 'bg-emerald-400' : 'bg-emerald-400/40'}`}
                  />
                ))}
              </div>
            </Panel>
          </div>

          {/* Bottom metric cards */}
          <div className={[s.fadeUp, s.d050, 'flex gap-3 pointer-events-auto'].join(' ')}>
            {([
              { value: '100%',  top: 'Uptime',    sub: 'Reliability',    id: 'up',   valCls: 'text-sky-400',     activeCls: 'border-sky-400/55 shadow-[0_0_24px_rgba(56,189,248,0.2)]'   },
              { value: '99.7%', top: 'Precision', sub: 'Accuracy',       id: 'prec', valCls: 'text-emerald-400', activeCls: 'border-emerald-400/55 shadow-[0_0_24px_rgba(52,211,153,0.2)]' },
              { value: '25%',   top: 'AI',        sub: 'Efficiency Gain',id: 'ai',   valCls: 'text-violet-400',  activeCls: 'border-violet-400/55 shadow-[0_0_24px_rgba(167,139,250,0.2)]' },
            ] as const).map(({ value, top, sub, id, valCls, activeCls }) => (
              <div key={id}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                className={[
                  'w-28 rounded-xl border bg-black/70 backdrop-blur-md p-3.5 text-center cursor-default',
                  'transition-all duration-300 hover:-translate-y-1',
                  hovered === id ? activeCls : 'border-zinc-700/60',
                ].join(' ')}
              >
                <p className={`text-xl font-bold tabular-nums ${valCls}`}>{value}</p>
                <p className="text-[10px] font-bold text-zinc-300 tracking-widest uppercase mt-0.5">{top}</p>
                <p className="text-[9px] text-zinc-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Enterprise Login */}
          <div className={[s.fadeUp, s.d050, 'pointer-events-auto self-end'].join(' ')}>
            <Link href="/login?mode=enterprise">
              <button
                type="button"
                className="
                  group relative isolate overflow-hidden
                  rounded-xl border border-blue-500/50
                  bg-black/70 backdrop-blur-md
                  px-6 py-3.5
                  text-sm font-semibold tracking-[0.15em] uppercase text-blue-100
                  transition-all duration-300
                  hover:border-blue-400/80 hover:bg-blue-950/50
                  hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]
                  hover:-translate-y-1 active:scale-[0.98] cursor-pointer
                  flex flex-col items-center gap-1.5
                "
              >
                <span className={[
                  s.shimmerLayer,
                  'pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                ].join(' ')} />
                <svg className="relative z-10 h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span className="relative z-10">Enterprise Login</span>
              </button>
            </Link>
          </div>

          {/* Intelligence Layer */}
          <div className="pointer-events-auto">
            <Panel
              accentClass="border-violet-400/60"
              glowClass="shadow-[0_0_28px_rgba(167,139,250,0.15)]"
              fadeClass={s.d045}
              isHovered={h('intel')}
              onEnter={() => setHovered('intel')}
              onLeave={() => setHovered(null)}
            >
              <p className="text-[10px] font-bold tracking-[0.2em] text-violet-400 mb-3 uppercase">
                Intelligence Layer
              </p>
              {[
                { dot: 'bg-violet-400', label: 'AI-Powered Insights' },
                { dot: 'bg-rose-400',   label: 'Anomaly Detection' },
                { dot: 'bg-amber-400',  label: 'Route Optimization' },
                { dot: 'bg-cyan-400',   label: 'Performance Monitoring' },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-2.5 py-[5px]">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                  <span className="text-[11px] text-zinc-300">{label}</span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
