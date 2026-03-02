type Props = {
  label: string
  value: number
}

export default function KpiTile({ label, value }: Props) {
  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
      <div className="text-zinc-400 text-sm">{label}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  )
}