"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

// =============================================================================
// AgentWidget
// -----------------------------------------------------------------------------
// Floating chat panel mounted in the (app) layout. Sends the user's message
// plus the current pathname to /api/agent/chat, which calls OpenAI with tool
// access to the existing /api/agent/* KPI endpoints. Read-only, text-only.
// =============================================================================

type ChatTurn = {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_PROMPTS = [
  "What is my current KPI snapshot?",
  "Show me the top 10 CPT risk orders.",
  "How is throughput per hour trending today?",
  "How many deadlined orders do I have right now?",
]

export default function AgentWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<ChatTurn[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new turn
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history, loading])

  async function send(message: string) {
    const trimmed = message.trim()
    if (!trimmed || loading) return

    setError(null)
    const nextHistory: ChatTurn[] = [...history, { role: "user", content: trimmed }]
    setHistory(nextHistory)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory,
          pageContext: { pathname },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.message ?? `Request failed (${res.status})`)
        setLoading(false)
        return
      }

      setHistory([...nextHistory, { role: "assistant", content: data.text || "(empty response)" }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <>
      {/* Floating launcher button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open BlueLineOps assistant"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all flex items-center justify-center border border-blue-400/40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-40 flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden"
          role="dialog"
          aria-label="BlueLineOps assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-100">Ops Intelligence</span>
                <span className="text-[11px] text-zinc-500">read-only KPI assistant</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="text-zinc-500 hover:text-zinc-200 text-lg leading-none px-2"
            >
              ×
            </button>
          </div>

          {/* Transcript */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {history.length === 0 && !loading && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Ask about current KPIs, trends, CPT risk orders, or look up a specific order. I read live values from the operations
                  database.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="text-left text-sm px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.map((turn, i) => (
              <div
                key={i}
                className={
                  turn.role === "user"
                    ? "ml-6 self-end bg-blue-600 text-white text-sm rounded-2xl rounded-br-md px-3 py-2 whitespace-pre-wrap"
                    : "mr-6 self-start bg-zinc-800 text-zinc-100 text-sm rounded-2xl rounded-bl-md px-3 py-2 whitespace-pre-wrap"
                }
              >
                {turn.content}
              </div>
            ))}

            {loading && (
              <div className="mr-6 self-start bg-zinc-800 text-zinc-400 text-sm rounded-2xl rounded-bl-md px-3 py-2 italic">
                Querying KPIs…
              </div>
            )}

            {error && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={onSubmit} className="border-t border-zinc-800 bg-zinc-950 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder="Ask about a KPI or order…"
                disabled={loading}
                className="flex-1 resize-none bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 px-3 py-2 focus:outline-none focus:border-blue-500 max-h-32"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg px-3 py-2 transition"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">Read-only. Powered by OpenAI + live Supabase KPIs.</p>
          </form>
        </div>
      )}
    </>
  )
}
