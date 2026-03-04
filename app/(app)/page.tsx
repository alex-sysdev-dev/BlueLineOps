import KpiTile from "@/components/kpi/KpiTile"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        <span className="text-blue-500">Operations</span>{' '}
        <span className="text-[var(--foreground)]">Dashboard</span>
      </h1>

      {/* KPI ROW */}
      <div className="grid grid-cols-4 gap-6">
        <KpiTile
          title="Orders Today"
          value={1248}
        />

        <KpiTile
          title="Units Picked"
          value={5972}
        />

        <KpiTile
          title="Active Stations"
          value={18}
        />

        <KpiTile
          title="Pick Accuracy"
          value={99.2}
          accent="text-green-400"
          suffix="of orders"
        />
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-3 gap-6">

        <div className="col-span-2">
          <div
            className="
              bg-white/5
              backdrop-blur-md
              border border-white/10
              rounded-xl
              p-6
              shadow-lg shadow-black/30
            "
          >
            <div className="text-lg font-semibold mb-4">
              Throughput (Hourly)
            </div>

            <div className="h-64 flex items-center justify-center text-zinc-500">
              Chart Placeholder
            </div>
          </div>
        </div>

        <div
          className="
            bg-white/5
            backdrop-blur-md
            border border-white/10
            rounded-xl
            p-6
            shadow-lg shadow-black/30
          "
        >
          <div className="text-lg font-semibold mb-4">
            Live Activity
          </div>

          <div className="space-y-3 text-sm text-zinc-400">
            <div>Station 04 completed Order #8821</div>
            <div>Station 12 paused</div>
            <div>Wave 19 released</div>
          </div>
        </div>

      </div>
    </div>
  )
}
