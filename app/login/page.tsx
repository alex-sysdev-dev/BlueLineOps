'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // No real auth — demo routes straight to dashboard
    setTimeout(() => router.push('/dashboard'), 600)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">

      {/* Back to landing */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs tracking-widest uppercase text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        ← Back
      </Link>

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-full border border-blue-500/40 bg-zinc-950 flex items-center justify-center">
            <Image src="/login.svg" alt="BlueLineOps" width={20} height={20} className="opacity-90" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-blue-500">Blue</span>
            <span className="text-zinc-100">LineOps</span>
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-8">
          <h1 className="text-lg font-semibold text-zinc-100 mb-1">Enterprise Login</h1>
          <p className="text-xs text-zinc-500 mb-6 tracking-wide">
            Operational Intelligence Platform
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-zinc-500">
                Email
              </label>
              <input
                type="email"
                required
                defaultValue="ops@bluelineops.com"
                className="
                  w-full rounded-lg border border-zinc-800 bg-zinc-900
                  px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600
                  focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30
                  transition-colors
                "
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-zinc-500">
                Password
              </label>
              <input
                type="password"
                required
                defaultValue="••••••••••"
                className="
                  w-full rounded-lg border border-zinc-800 bg-zinc-900
                  px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600
                  focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30
                  transition-colors
                "
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                mt-2 w-full rounded-xl border border-blue-500/50 bg-blue-600/20
                py-3 text-sm font-semibold tracking-[0.15em] uppercase text-blue-100
                hover:bg-blue-600/35 hover:border-blue-400/70
                hover:shadow-[0_0_32px_rgba(37,99,235,0.35)]
                active:scale-[0.98] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer
              "
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-[10px] tracking-widest text-zinc-700 uppercase">
            SSO &nbsp;·&nbsp; Secure Access &nbsp;·&nbsp; SAML 2.0
          </p>
        </div>

      </div>
    </div>
  )
}
