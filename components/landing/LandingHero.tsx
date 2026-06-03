'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { getSupabaseAuthBrowserClient } from '@/lib/supabase-auth-browser'
import s from './LandingHero.module.css'

// Globe uses WebGL — client only, no SSR
const GlobeScene = dynamic(() => import('./GlobeScene'), { ssr: false })

// ── Bar heights ────────────────────────────────────────────────────────────
const BAR_HEIGHTS = ['h-[38%]','h-[52%]','h-[46%]','h-[60%]','h-[68%]','h-[63%]','h-[80%]'] as const

const MODULES = [
  {
    title: 'Inbound',
    problem: 'Late dock visibility slows receiving and creates blind handoffs.',
    answer: 'BlueLineOps shows inbound status, QA blockers, and dock pressure in one operating view.',
  },
  {
    title: 'Inventory',
    problem: 'Risk is usually found after orders are already exposed.',
    answer: 'Inventory signals connect QA, replenishment, and outbound demand before the floor feels the miss.',
  },
  {
    title: 'Labor Planning',
    problem: 'Supervisors lose time balancing headcount against live volume.',
    answer: 'Labor and throughput views make the next move clear by shift, zone, and workload.',
  },
] as const

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

  useEffect(() => {
    const url = new URL(window.location.href)
    const nextPath = '/login?mode=update-password&status=recovery'
    const code = url.searchParams.get('code')
    const tokenHash = url.searchParams.get('token_hash')
    const queryType = url.searchParams.get('type')
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
    const hashType = hashParams.get('type')

    if (code) {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('code', code)
      callbackUrl.searchParams.set('next', nextPath)
      window.location.replace(callbackUrl.toString())
      return
    }

    if (tokenHash) {
      const confirmUrl = new URL('/auth/confirm', window.location.origin)
      confirmUrl.searchParams.set('token_hash', tokenHash)
      confirmUrl.searchParams.set('type', queryType ?? 'recovery')
      confirmUrl.searchParams.set('next', nextPath)
      window.location.replace(confirmUrl.toString())
      return
    }

    if (hashType === 'recovery') {
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (!accessToken || !refreshToken) {
        window.location.replace('/login?mode=reset&error=callback')
        return
      }

      getSupabaseAuthBrowserClient()
        .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          window.location.replace(error ? '/login?mode=reset&error=callback' : nextPath)
        })
    }
  }, [])

  return (
    <div className="bg-black text-zinc-100">
      <section className="relative min-h-[100svh] w-full overflow-hidden bg-black">

      {/* ── Globe — full screen background ───────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <GlobeScene />
      </div>

      {/* ── Overlay layout — pointer-events-none so globe stays interactive ─ */}
      <div className="relative z-10 flex min-h-[100svh] flex-col pointer-events-none">

        {/* TOP ROW */}
        <div className="grid grid-cols-1 items-start gap-4 px-4 pt-5 sm:px-6 lg:flex lg:justify-between lg:px-7 lg:pt-6">

          {/* Global Visibility */}
          <div className="pointer-events-auto hidden lg:block">
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
          <div className={[s.fadeUp, s.d005, 'mx-auto flex max-w-xl flex-col items-center gap-2 pt-1 text-center'].join(' ')}>
            <div className={[s.floatLogo, 'h-9 w-9 rounded-full border border-blue-400/50 bg-black/80 flex items-center justify-center'].join(' ')}>
              <Image src="/login.svg" alt="" width={20} height={20} className="opacity-90" />
            </div>
            <h1 className="text-[clamp(2.1rem,11vw,3.25rem)] font-bold tracking-tighter leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)]">
              <span className="text-blue-400">Blue</span>
              <span className="text-zinc-100">LineOps</span>
            </h1>
            <p className="text-[9px] tracking-[0.22em] text-zinc-400 uppercase drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              Operational Intelligence for Logistics
            </p>
          </div>

          {/* Operational Insights */}
          <div className="pointer-events-auto hidden lg:block">
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
        <div className="pointer-events-auto mx-4 mt-5 max-w-sm rounded-2xl border border-zinc-800/80 bg-black/68 p-4 text-left shadow-[0_0_34px_rgba(0,0,0,0.32)] backdrop-blur-md sm:mx-6 sm:p-5 lg:absolute lg:left-0 lg:top-44 lg:mx-0 lg:mt-0 lg:w-80 lg:max-w-none lg:rounded-l-none lg:border-l-0 xl:w-96">
          <div>
            <p className="text-[11px] font-semibold uppercase leading-5 tracking-[0.18em] text-blue-300 sm:text-xs">
              Execution Breakdowns Cost Time, Labor, and Revenue.
            </p>
            <p className="mt-2 text-[13px] leading-6 text-zinc-300 sm:text-sm">
              Most fulfillment operations run on fragmented systems, delayed reporting, and disconnected data. By the time a problem surfaces, it&apos;s already affecting service levels.
            </p>
            <p className="mt-4 text-[11px] font-semibold uppercase leading-5 tracking-[0.18em] text-emerald-300 sm:text-xs">
              BlueLineOps Command View
            </p>
            <p className="mt-2 text-[13px] leading-6 text-zinc-300 sm:text-sm">
              BlueLineOps brings every critical operational signal into one live command view, giving leaders instant visibility into warehouse performance, labor utilization, inventory accuracy, inbound execution, yard activity, and CPT risk.
            </p>
            <p className="mt-3 text-[13px] font-semibold text-zinc-100 sm:text-sm">Operate proactively. Not reactively.</p>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/request-access"
                className="rounded-xl border border-zinc-700 bg-black/70 px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-200 transition hover:border-zinc-400 hover:text-white"
              >
                Request Access
              </Link>
              <Link
                href="/login?mode=contact"
                className="rounded-xl border border-blue-500/60 bg-blue-600/25 px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100 transition hover:border-blue-300 hover:bg-blue-600/40"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Hint — anchored just above bottom row */}
        <div className={[s.fadeUp, s.d045, 'flex items-center justify-center pb-4'].join(' ')}>
          <p className="text-[10px] tracking-[0.3em] text-blue-400/60 uppercase animate-pulse drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
            Click any node on the globe to enter
          </p>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 items-end gap-4 px-4 pb-5 sm:px-6 lg:flex lg:justify-between lg:px-7 lg:pb-7">

          {/* Active Shipments */}
          <div className="pointer-events-auto hidden lg:block">
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
              <p className="mt-0.5 text-[11px] text-emerald-400 font-medium">13.4% in last 7 days</p>
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
          <div className={[s.fadeUp, s.d050, 'pointer-events-auto grid grid-cols-3 gap-2 sm:mx-auto sm:max-w-md sm:gap-3 lg:flex lg:max-w-none'].join(' ')}>
            {([
              { value: '100%',  top: 'Uptime',    sub: 'Reliability',    id: 'up',   valCls: 'text-sky-400',     activeCls: 'border-sky-400/55 shadow-[0_0_24px_rgba(56,189,248,0.2)]'   },
              { value: '99.7%', top: 'Precision', sub: 'Accuracy',       id: 'prec', valCls: 'text-emerald-400', activeCls: 'border-emerald-400/55 shadow-[0_0_24px_rgba(52,211,153,0.2)]' },
              { value: '25%',   top: 'AI',        sub: 'Efficiency Gain',id: 'ai',   valCls: 'text-violet-400',  activeCls: 'border-violet-400/55 shadow-[0_0_24px_rgba(167,139,250,0.2)]' },
            ] as const).map(({ value, top, sub, id, valCls, activeCls }) => (
              <div key={id}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                className={[
                  'min-w-0 rounded-xl border bg-black/70 p-3 text-center backdrop-blur-md cursor-default sm:p-3.5 lg:w-28',
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

          {/* Access banner */}
          <div className={[s.fadeUp, s.d050, 'pointer-events-auto self-end lg:order-none'].join(' ')}>
            <div className="flex w-full items-center gap-2 rounded-2xl border border-blue-500/35 bg-black/72 p-2 shadow-[0_0_32px_rgba(59,130,246,0.16)] backdrop-blur-md sm:w-auto">
              <Link
                href="/login?mode=enterprise"
                className="
                  group relative isolate flex flex-1 items-center justify-center gap-2 overflow-hidden
                  rounded-xl border border-blue-500/50 bg-blue-600/15 px-4 py-3
                  text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100
                  transition-all duration-300 hover:border-blue-300/80 hover:bg-blue-600/28
                  sm:flex-none sm:px-5
                "
              >
                <span className={[
                  s.shimmerLayer,
                  'pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                ].join(' ')} />
                <svg className="relative z-10 h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span className="relative z-10">Enterprise Login</span>
              </Link>
              <Link
                href="/blue-lineops-media/BlueLineOps%20Media.html"
                className="flex flex-1 items-center justify-center rounded-xl border border-zinc-700/80 bg-black/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-200 transition hover:border-blue-300/70 hover:bg-blue-500/15 hover:text-blue-100 sm:flex-none sm:px-5"
              >
                Media
              </Link>
            </div>
          </div>

          {/* Intelligence Layer */}
          <div className="pointer-events-auto hidden lg:block">
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
      </section>

      <section className="border-t border-zinc-900 bg-zinc-950 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Operational Modules</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Built for the parts of fulfillment that break first.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {MODULES.map((module) => (
              <article key={module.title} className="rounded-xl border border-zinc-800 bg-black/45 p-5">
                <h3 className="text-lg font-semibold text-zinc-100">{module.title}</h3>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Problem</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{module.problem}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">BlueLineOps</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{module.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
