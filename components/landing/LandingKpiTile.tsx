import Link from "next/link"

type Props = {
  href: string
  title: string
  subtitle: string
  hoverBorderClassName?: string
  hoverShadowClassName?: string
}

export default function LandingKpiTile({
  href,
  title,
  subtitle,
  hoverBorderClassName = "hover:border-blue-400/70",
  hoverShadowClassName = "hover:shadow-[0_30px_65px_-24px_rgba(37,99,235,0.48)]",
}: Props) {
  return (
    <Link href={href} className="group">
      <div
        className={`
          relative isolate overflow-hidden
          h-full flex flex-col items-center justify-center
          p-8 rounded-2xl border border-zinc-700/70
          bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))]
          backdrop-blur-2xl
          transition-all duration-500 ease-out
          shadow-[0_20px_50px_-22px_rgba(2,6,23,0.9)]
          hover:-translate-y-1 hover:scale-[1.02]
          ${hoverBorderClassName} ${hoverShadowClassName}
          cursor-pointer
        `}
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_32%,rgba(59,130,246,0.14)_100%)] opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-44 w-56 -translate-x-1/2 rounded-full bg-white/25 blur-2xl transition-all duration-500 group-hover:bg-white/40 group-hover:blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-6 h-40 w-40 rounded-full bg-blue-400/30 blur-2xl transition-all duration-500 group-hover:bg-blue-300/45" />
        <span className="relative z-10 text-2xl font-medium mb-2 text-zinc-100 group-hover:text-blue-100 transition-colors duration-500">
          {title}
        </span>
        <span className="relative z-10 text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors duration-500">
          {subtitle}
        </span>
      </div>
    </Link>
  )
}
