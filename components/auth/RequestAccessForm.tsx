'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function RequestAccessForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [accessNeed, setAccessNeed] = useState('View-only demo access')
  const [teamSize, setTeamSize] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          company,
          role,
          accessNeed,
          teamSize,
          requestReason,
          newsletterOptIn,
        }),
      })
      const payload = (await response.json().catch(() => null)) as { message?: string } | null

      if (!response.ok) {
        setError(payload?.message ?? 'Could not send access request.')
        return
      }

      setName('')
      setEmail('')
      setCompany('')
      setRole('')
      setAccessNeed('View-only demo access')
      setTeamSize('')
      setRequestReason('')
      setNewsletterOptIn(true)
      setMessage(payload?.message ?? 'Access request sent.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not send access request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs tracking-widest uppercase text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        Back
      </Link>

      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-full border border-emerald-500/40 bg-zinc-950 flex items-center justify-center">
            <Image src="/login.svg" alt="BlueLineOps" width={20} height={20} className="opacity-90" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-blue-500">Blue</span>
            <span className="text-zinc-100">LineOps</span>
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/85 backdrop-blur-md p-9 sm:p-10">
          <h1 className="text-2xl mb-6 font-semibold text-zinc-50">Request Access</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-zinc-300">Name</label>
              <input
                type="text"
                required
                suppressHydrationWarning
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-zinc-300">Work Email</label>
              <input
                type="email"
                required
                suppressHydrationWarning
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300">Company</label>
                <input
                  type="text"
                  required
                  suppressHydrationWarning
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Company"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300">Role</label>
                <input
                  type="text"
                  required
                  suppressHydrationWarning
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="Operations leader"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300">Access Need</label>
                <select
                  required
                  suppressHydrationWarning
                  value={accessNeed}
                  onChange={(event) => setAccessNeed(event.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 transition-colors focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                >
                  <option>View-only demo access</option>
                  <option>View-only executive review</option>
                  <option>View-only operations review</option>
                  <option>View-only partner review</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300">Team Size</label>
                <input
                  type="text"
                  suppressHydrationWarning
                  value={teamSize}
                  onChange={(event) => setTeamSize(event.target.value)}
                  placeholder="Example: 25 users"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-zinc-300">Access Reason</label>
              <textarea
                suppressHydrationWarning
                value={requestReason}
                onChange={(event) => setRequestReason(event.target.value)}
                placeholder="What do you need access to evaluate or operate?"
                rows={4}
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                suppressHydrationWarning
                checked={newsletterOptIn}
                onChange={(event) => setNewsletterOptIn(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/40"
              />
              <span>Send me BlueLineOps updates and access notes.</span>
            </label>

            {error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-100">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-xs text-emerald-100">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="mt-2 w-full rounded-xl border border-emerald-500/50 bg-emerald-600/20 py-3 text-sm font-semibold tracking-[0.15em] uppercase text-emerald-100 transition-all duration-200 hover:bg-emerald-600/35 hover:border-emerald-400/70 hover:shadow-[0_0_32px_rgba(16,185,129,0.28)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Working...' : 'Request Access'}
            </button>
          </form>

          <p className="mt-5 text-center text-[10px] tracking-widest text-zinc-700 uppercase">
            Controlled Access
          </p>
        </div>
      </div>
    </div>
  )
}
