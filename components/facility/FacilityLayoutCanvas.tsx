import type { ReactNode } from 'react'
import type { FacilityLayout, FacilityLayoutItem } from '@/types/layout'

type Props = {
  layout: FacilityLayout
  items: FacilityLayoutItem[]
  title: string
  description?: string
  renderItem: (item: FacilityLayoutItem) => ReactNode
}

export default function FacilityLayoutCanvas({ layout, items, title, description, renderItem }: Props) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(145deg,rgba(2,6,23,0.96),rgba(15,23,42,0.86))] p-6">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{description ?? 'No layout items found yet.'}</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(145deg,rgba(2,6,23,0.96),rgba(15,23,42,0.86))] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        </div>

        <div className="text-xs text-zinc-400">
          Layout: {layout.name} | Canvas {layout.width_units} x {layout.height_units}
        </div>
      </div>

      <div
        className="relative mt-5 overflow-hidden rounded-2xl border border-zinc-700/60 bg-[#d8d8d8]"
        style={{ aspectRatio: `${layout.width_units} / ${layout.height_units}` }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${(item.x / layout.width_units) * 100}%`,
              top: `${(item.y / layout.height_units) * 100}%`,
              width: `${(item.w / layout.width_units) * 100}%`,
              height: `${(item.h / layout.height_units) * 100}%`,
              transform: item.rotation_deg ? `rotate(${item.rotation_deg}deg)` : undefined,
              transformOrigin: 'center',
            }}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
    </section>
  )
}
