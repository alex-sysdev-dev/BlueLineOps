type Props = {
  title: string
  value: number | string
  accent?: string
  suffix?: string
}

export default function KpiTile({ title, value, accent, suffix }: Props) {
  const displayValue =
    typeof value === 'number'
      ? value.toLocaleString(undefined, {
          minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
          maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
        })
      : value

  return (
    <div
      className="
        group relative isolate overflow-hidden
        border border-zinc-700/70
        rounded-2xl
        p-6
        bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))]
        backdrop-blur-2xl
        shadow-[0_20px_50px_-22px_rgba(2,6,23,0.9)]
        transition-all duration-500 ease-out
        hover:-translate-y-1 hover:scale-[1.02]
        hover:border-blue-400/70
        hover:shadow-[0_30px_65px_-24px_rgba(37,99,235,0.48)]
        cursor-default
      "
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_32%,rgba(59,130,246,0.14)_100%)] opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-44 w-56 -translate-x-1/2 rounded-full bg-white/25 blur-2xl transition-all duration-500 group-hover:bg-white/40 group-hover:blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-6 h-40 w-40 rounded-full bg-blue-400/30 blur-2xl transition-all duration-500 group-hover:bg-blue-300/45" />

      <div className="relative z-10 text-sm text-zinc-100 group-hover:text-white mb-2 transition-colors duration-500">
        {title}
      </div>

      <div
        className={`relative z-10 text-3xl font-bold transition-colors duration-500 ${
          accent ?? "text-white group-hover:text-blue-50"
        }`}
      >
        {displayValue}
        {suffix}
      </div>
    </div>
  )
}
