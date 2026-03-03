"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Inbound", href: "/inbound" },
  { name: "Outbound", href: "/outbound" },
  { name: "Forecasting", href: "/forecasting" },
  { name: "Associates", href: "/associates" },
  { name: "YMS", href: "/yms" },
  { name: "Yard", href: "/yms/yard" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(true)

  // Sync state with HTML class on mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

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
      <div>
        <Link href="/">
          <div className="flex items-center gap-3 p-6 text-xl font-semibold cursor-pointer">
            <Image src="/login.svg" alt="BlueLineOps icon" width={28} height={28} />
            <span>
              <span className="text-blue-500">Blue</span>
              <span className="text-zinc-100">LineOps</span>
            </span>
          </div>
        </Link>

        <nav className="space-y-2 px-4 mt-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                  pathname.startsWith(link.href)
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                {link.name}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Pill-Sized Theme Toggle */}
      <div className="p-4 border-t border-zinc-800 flex justify-center">
        <button
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
