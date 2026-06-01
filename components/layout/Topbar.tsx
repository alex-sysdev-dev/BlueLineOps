import Link from "next/link"
import Image from "next/image"

type TopbarProps = {
  accessRole?: "admin" | "viewer"
}

export default function Topbar({ accessRole = "admin" }: TopbarProps) {
  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      {/* Mobile Logo (Hidden on desktop since sidebar has it) */}
      <div className="md:hidden">
        <Link href="/">
          <Image src="/login.svg" alt="BlueLineOps icon" width={24} height={24} />
        </Link>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        {accessRole === "viewer" ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            View-only review
          </span>
        ) : null}
        <span>Operations Platform</span>
      </div>
    </header>
  )
}
