'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getSupabaseAuthBrowserClient } from '@/lib/supabase-auth-browser'

type LoginMode = 'enterprise' | 'login' | 'contact' | 'reset' | 'update-password'

type LoginFormProps = {
  initialMode: LoginMode
  initialNextPath: string
  initialMessage: string | null
}

function normalizeNextPath(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard'
  }

  return value
}

function modeTitle(mode: LoginMode): string {
  if (mode === 'enterprise') return 'Enterprise Login'
  if (mode === 'contact') return 'Contact Sales'
  if (mode === 'reset') return 'Reset Password'
  if (mode === 'update-password') return 'Set New Password'
  return 'Log In'
}

function modeDescription(mode: LoginMode): string {
  if (mode === 'enterprise') return 'Owner-only operational access'
  if (mode === 'reset') return 'Send a password recovery link'
  if (mode === 'update-password') return 'Choose a new password for this account'
  return 'Use your account credentials'
}

function passwordMeetsMinimum(value: string): boolean {
  return value.length >= 8
}

export default function LoginForm({ initialMode, initialNextPath, initialMessage }: LoginFormProps) {
  const [mode, setMode] = useState<LoginMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [occupation, setOccupation] = useState('')
  const [useCase, setUseCase] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(true)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(initialMessage)
  const [error, setError] = useState<string | null>(null)

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode)
    setError(null)
    setMessage(null)
  }

  async function verifyEnterpriseAccess(normalizedEmail: string): Promise<boolean> {
    const accessResponse = await fetch('/api/auth/enterprise-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    })
    const access = (await accessResponse.json().catch(() => null)) as { message?: string } | null

    if (!accessResponse.ok) {
      setError(access?.message ?? 'This email is not authorized for Enterprise Login.')
      return false
    }

    return true
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const normalizedEmail = email.trim().toLowerCase()

    try {
      if (mode === 'contact') {
        const contactResponse = await fetch('/api/contact-sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email: normalizedEmail,
            company,
            phone,
            role: occupation,
            useCase,
            newsletterOptIn,
          }),
        })
        const contactPayload = (await contactResponse.json().catch(() => null)) as { message?: string } | null

        if (!contactResponse.ok) {
          setError(contactPayload?.message ?? 'Could not send contact request.')
          return
        }

        setName('')
        setEmail('')
        setCompany('')
        setPhone('')
        setOccupation('')
        setUseCase('')
        setNewsletterOptIn(true)
        setMessage(contactPayload?.message ?? 'Contact request sent.')
        return
      }

      const supabase = getSupabaseAuthBrowserClient()

      if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/login?mode=update-password&status=recovery')}`,
        })

        if (resetError) {
          setError(resetError.message)
          return
        }

        setMessage('Password reset link sent. Check your email.')
        return
      }

      if (mode === 'update-password') {
        if (!passwordMeetsMinimum(password)) {
          setError('Password must be at least 8 characters.')
          return
        }

        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
          setError(updateError.message)
          return
        }

        setPassword('')
        setMessage('Password updated. You can log in now.')
        setMode('login')
        return
      }

      if (!passwordMeetsMinimum(password)) {
        setError('Password must be at least 8 characters.')
        return
      }

      if (mode === 'enterprise') {
        const allowed = await verifyEnterpriseAccess(normalizedEmail)
        if (!allowed) return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      window.location.assign(mode === 'enterprise' ? normalizeNextPath(initialNextPath) : '/dashboard')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const isEnterprise = mode === 'enterprise'
  const isContact = mode === 'contact'
  const isReset = mode === 'reset'
  const isUpdatePassword = mode === 'update-password'
  const submitLabel = isContact
    ? 'Send Request'
    : isReset
      ? 'Send Reset Link'
      : isUpdatePassword
        ? 'Update Password'
        : isEnterprise
          ? 'Enter Enterprise'
          : 'Log In'

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs tracking-widest uppercase text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        Back
      </Link>

      <div className={`w-full ${isContact ? 'max-w-lg' : 'max-w-sm'}`}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-full border border-blue-500/40 bg-zinc-950 flex items-center justify-center">
            <Image src="/login.svg" alt="BlueLineOps" width={20} height={20} className="opacity-90" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-blue-500">Blue</span>
            <span className="text-zinc-100">LineOps</span>
          </span>
        </div>

        <div className={`rounded-2xl border border-zinc-800 bg-zinc-950/85 backdrop-blur-md ${isContact ? 'p-9 sm:p-10' : 'p-8'}`}>
          {!isContact ? (
            <div className="mb-6 grid grid-cols-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
              <button
                type="button"
                onClick={() => switchMode('enterprise')}
                className={`rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  isEnterprise ? 'bg-blue-600/30 text-blue-100' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                Enterprise
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  mode === 'login' ? 'bg-blue-600/25 text-blue-100' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('contact')}
                className="rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 transition-colors hover:text-zinc-200"
              >
                Contact
              </button>
            </div>
          ) : null}

          <h1 className={`${isContact ? 'text-2xl mb-6' : 'text-lg mb-1'} font-semibold text-zinc-50`}>
            {modeTitle(mode)}
          </h1>
          {!isContact ? <p className="text-sm text-zinc-300 mb-6 tracking-wide">{modeDescription(mode)}</p> : null}

          <form onSubmit={handleSubmit} className={`flex flex-col ${isContact ? 'gap-5' : 'gap-4'}`}>
            {isContact ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300">Name</label>
                <input
                  type="text"
                  required
                  suppressHydrationWarning
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            ) : null}

            {!isUpdatePassword ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300">Email</label>
                <input
                  type="email"
                  required
                  suppressHydrationWarning
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={isEnterprise ? 'owner email' : 'you@example.com'}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            ) : null}

            {isContact ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-zinc-300">Company</label>
                  <input
                    type="text"
                    required
                    suppressHydrationWarning
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Company or operation"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-zinc-300">Phone</label>
                  <input
                    type="tel"
                    required
                    suppressHydrationWarning
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-zinc-300">Role</label>
                  <input
                    type="text"
                    required
                    suppressHydrationWarning
                    value={occupation}
                    onChange={(event) => setOccupation(event.target.value)}
                    placeholder="Operations manager, founder, analyst"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-zinc-300">Use Case</label>
                  <textarea
                    suppressHydrationWarning
                    value={useCase}
                    onChange={(event) => setUseCase(event.target.value)}
                    placeholder="What problem do you want BlueLineOps to solve?"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    suppressHydrationWarning
                    checked={newsletterOptIn}
                    onChange={(event) => setNewsletterOptIn(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-950 text-blue-500 focus:ring-blue-500/40"
                  />
                  <span>Send me BlueLineOps updates and product notes.</span>
                </label>
              </>
            ) : null}

            {!isReset && !isContact ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300">
                  {isUpdatePassword ? 'New Password' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  suppressHydrationWarning
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-50 placeholder-zinc-400 transition-colors focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            ) : null}

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
              className="mt-2 w-full rounded-xl border border-blue-500/50 bg-blue-600/20 py-3 text-sm font-semibold tracking-[0.15em] uppercase text-blue-100 transition-all duration-200 hover:bg-blue-600/35 hover:border-blue-400/70 hover:shadow-[0_0_32px_rgba(37,99,235,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Working...' : submitLabel}
            </button>
          </form>

          {!isContact ? (
            <div className="mt-5 flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest">
              {mode !== 'login' ? (
                <button type="button" onClick={() => switchMode('login')} className="text-blue-300 hover:text-blue-100">
                  Log In
                </button>
              ) : null}
              {mode !== 'reset' && mode !== 'update-password' ? (
                <button type="button" onClick={() => switchMode('reset')} className="text-zinc-500 hover:text-zinc-300">
                  Reset Password
                </button>
              ) : null}
            </div>
          ) : null}

          <p className="mt-5 text-center text-[10px] tracking-widest text-zinc-700 uppercase">
            Secure Access
          </p>
        </div>
      </div>
    </div>
  )
}
