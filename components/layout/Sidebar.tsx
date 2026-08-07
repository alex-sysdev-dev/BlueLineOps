"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"

type AssociateLink = {
  employeeId: string
  fullName: string
}

type Props = {
  associateLinks?: AssociateLink[]
  accessRole?: "admin" | "viewer"
}

const links = [
  { name: "BlueLineOps Dashboard", href: "/dashboard" },
  { name: "Agent Control Center", href: "/agents" },
  { name: "Associates Dashboard", href: "/associates", hasDropdown: true },
  { name: "QA Dashboard", href: "/qa" },
  { name: "Inbound Dashboard", href: "/inbound" },
  { name: "Inbound Shipments", href: "/inbound/shipments" },
  { name: "Suppliers", href: "/suppliers" },
  { name: "Outbound Dashboard", href: "/outbound" },
  { name: "Pick/Pack Floor", href: "/outbound/floor" },
  { name: "YMS Overview", href: "/yms" },
  { name: "Yard", href: "/yms/yard" },
  { name: "Forecasting", href: "/forecasting" },
]

export default function Sidebar({ associateLinks = [], accessRole = "admin" }: Props) {
  const pathname = usePathname()
  const onAssociatesSection = pathname.startsWith("/associates")
  const [associatesOpen, setAssociatesOpen] = useState(onAssociatesSection)
  const [isDark, setIsDark] = useState(() =>
    typeof document === "undefined" ? true : document.documentElement.classList.contains("dark")
  )

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      setIsDark(true)
    }
  }

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between">
      <div className="flex flex-col min-h-0">
        <Link href="/">
          <div className="flex items-center gap-3 p-6 text-xl font-semibold cursor-pointer">
            <Image src="/login.svg" alt="BlueLineOps icon" width={28} height={28} />
            <span>
              <span className="text-blue-500">Blue</span>
              <span className="text-zinc-100">LineOps</span>
            </span>
          </div>
        </Link>

        {accessRole === "viewer" ? (
          <div className="mx-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
            View-only
          </div>
        ) : null}

        <nav className="space-y-1 px-4 mt-2 flex-1 overflow-y-auto pb-4">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href)

            if (!link.hasDropdown) {
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                      isActive
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    {link.name}
                  </div>
                </Link>
              )
            }

            return (
              <div key={link.href}>
                <div className="flex items-center gap-1">
                  <Link href={link.href} className="flex-1">
                    <div
                      className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                        isActive
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                      }`}
                    >
                      {link.name}
                    </div>
                  </Link>
                  {associateLinks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssociatesOpen((prev) => !prev)}
                      className="px-2 py-2 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
                      aria-label="Toggle associate list"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${associatesOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {associatesOpen && associateLinks.length > 0 && (
                  <div className="ml-3 mt-1 max-h-52 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/60">
                    {associateLinks.map((associate) => {
                      const detailPath = `/associates/${encodeURIComponent(associate.employeeId)}`
                      const isDetailActive = pathname === detailPath
                      return (
                        <Link key={associate.employeeId} href={detailPath}>
                          <div
                            className={`px-3 py-1.5 text-xs cursor-pointer transition border-b border-zinc-800/60 last:border-0 ${
                              isDetailActive
                                ? "bg-blue-500/15 text-blue-100"
                                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                            }`}
                          >
                            <div className="font-medium truncate">{associate.fullName}</div>
                            <div className="text-zinc-600 text-[10px]">{associate.employeeId}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Pill-Sized Theme Toggle */}
      <div className="p-4 border-t border-zinc-800 flex justify-center flex-shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-14 h-7 rounded-full bg-zinc-950 border border-zinc-700 flex items-center px-1 transition-colors cursor-pointer"
          aria-label="Toggle Dark Mode"
        >
          <div
            className={`w-5 h-5 rounded-full bg-blue-500 transition-transform duration-300 ${
              isDark ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </aside>
  )
}
