'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Real city lat/lng — all on land.
// format: [lat, lng, tier] where tier 1 = major hub, 2 = regional, 3 = secondary
const CITIES: Array<[number, number, number]> = [
  // North America — [lat, lng, tier]
  [40.71,-74.01,1],[34.05,-118.24,1],[41.88,-87.63,1],[37.77,-122.42,1],[47.61,-122.33,2],
  [25.77,-80.19,2],[33.75,-84.39,2],[39.74,-104.98,2],[42.36,-71.06,2],[43.65,-79.38,2],
  [45.50,-73.57,2],[49.25,-123.12,2],[19.43,-99.13,1],[20.66,-103.35,2],[25.67,-100.31,2],
  [32.78,-96.80,2],[36.17,-115.14,2],[29.42,-98.49,3],[29.76,-95.37,2],[14.09,-87.21,3],
  // South America
  [-23.55,-46.63,1],[-22.91,-43.17,1],[-34.61,-58.38,1],[-12.05,-77.04,2],[4.71,-74.07,2],
  [-33.45,-70.67,2],[-3.72,-38.54,3],[-19.92,-43.94,2],[-30.03,-51.23,2],[-8.05,-34.88,3],
  [10.48,-66.88,2],[6.25,-75.56,3],[-0.22,-78.51,3],[-34.90,-56.19,3],[-3.10,-60.03,3],
  // Europe
  [51.51,-0.13,1],[48.86,2.35,1],[52.52,13.40,1],[40.42,-3.70,1],[41.39,2.15,1],
  [41.90,12.49,1],[45.47,9.19,2],[48.21,16.37,2],[52.23,21.01,2],[47.50,19.04,2],
  [50.08,14.44,2],[50.85,4.35,2],[52.37,4.90,2],[59.33,18.07,2],[55.68,12.57,2],
  [60.17,24.94,2],[38.72,-9.14,2],[37.98,23.73,2],[55.76,37.62,1],[59.93,30.32,2],
  [48.14,11.58,2],[53.55,9.99,2],[50.11,8.68,2],[47.38,8.54,2],[44.43,26.10,2],
  [50.45,30.52,2],[44.80,20.46,3],[45.75,4.85,3],[43.30,5.37,3],[53.48,-2.24,3],
  // Africa
  [30.05,31.25,1],[6.46,3.38,2],[-26.20,28.04,2],[-33.93,18.42,2],[-1.29,36.82,2],
  [9.02,38.74,2],[33.59,-7.62,2],[15.55,32.53,2],[-6.79,39.21,3],[9.07,7.40,2],
  [5.56,-0.20,3],[36.82,10.16,2],[36.74,3.06,2],[0.32,32.58,3],[-4.32,15.32,3],
  // Middle East
  [25.20,55.27,1],[24.69,46.72,2],[35.69,51.39,2],[41.01,28.95,1],[39.93,32.86,2],
  [32.08,34.78,2],[25.29,51.53,2],[29.37,47.98,2],[33.34,44.40,3],[21.49,39.18,3],
  // South Asia
  [19.08,72.88,1],[28.66,77.23,1],[12.97,77.59,1],[22.57,88.36,2],[13.08,80.27,2],
  [17.39,78.49,2],[23.03,72.59,2],[24.86,67.01,2],[31.55,74.34,2],[23.72,90.41,2],
  [6.93,79.86,3],[27.72,85.32,3],[33.72,73.04,2],
  // Southeast Asia
  [1.35,103.82,1],[3.14,101.69,2],[13.75,100.52,2],[-6.21,106.85,2],[14.60,120.98,2],
  [10.82,106.63,2],[21.03,105.83,2],[22.40,114.11,2],[11.57,104.92,3],[-7.25,112.75,3],
  [-8.67,115.21,3],[5.97,116.07,3],[16.87,96.19,3],
  // East Asia
  [35.68,139.69,1],[37.57,126.98,1],[39.91,116.40,1],[31.23,121.47,1],[34.69,135.50,2],
  [35.18,136.91,2],[35.18,129.07,2],[23.13,113.26,2],[22.54,114.06,2],[25.05,121.56,2],
  [29.56,106.55,2],[30.59,114.31,2],[30.66,104.07,2],[39.13,117.18,2],[34.27,108.95,3],
  // Central Asia & Russia
  [55.01,82.92,2],[56.84,60.61,2],[43.12,131.89,2],[41.30,69.24,2],[43.26,76.93,2],
  [54.99,73.37,3],[55.99,92.87,3],
  // Oceania
  [-33.87,151.21,1],[-37.81,144.96,2],[-27.47,153.03,2],[-31.95,115.86,2],
  [-36.87,174.76,2],[-34.93,138.60,3],[-35.28,149.13,3],
]

// Tier → visual properties
const TIER_CONFIG = {
  1: { count: 4, radius: 0.38, scatter: 0.20 },  // major hubs: bright cluster
  2: { count: 2, radius: 0.22, scatter: 0.15 },  // regional: small pair
  3: { count: 1, radius: 0.15, scatter: 0     },  // secondary: single clean dot
} as const

// Palette: bright blue + ice white — no random noise colors
const TIER_COLORS = {
  1: ['#0078ff', '#00e5ff', '#0078ff', '#38bdf8'],
  2: ['#0078ff', '#38bdf8'],
  3: ['#38bdf8'],
} as const

const NODES = CITIES.flatMap(([lat, lng, tier]) => {
  const { count, radius, scatter } = TIER_CONFIG[tier as 1 | 2 | 3]
  const colors = TIER_COLORS[tier as 1 | 2 | 3]
  return Array.from({ length: count }, (_, i) => ({
    lat: lat + (Math.random() - 0.5) * scatter,
    lng: lng + (Math.random() - 0.5) * scatter,
    color: colors[i % colors.length],
    radius,
  }))
})

export default function GlobeScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let world: any
    let ro: ResizeObserver | null = null

    import('globe.gl').then(({ default: Globe }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      world = (Globe as any)()(container)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .backgroundColor('#000000')
        .pointsData(NODES)
        .pointAltitude(0.01)
        .pointColor('color')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .pointRadius((d: any) => d.radius)
        .showAtmosphere(true)
        .atmosphereColor('#0078ff')
        .atmosphereAltitude(0.15)
        .onPointClick(() => router.push('/login'))

      world.controls().autoRotate = true
      world.controls().autoRotateSpeed = 0.8

      // Resize globe when container changes size (handles browser zoom)
      ro = new ResizeObserver(() => {
        if (!world) return
        world.width(container.clientWidth)
        world.height(container.clientHeight)
      })
      ro.observe(container)
    })

    return () => {
      ro?.disconnect()
      try { world?.renderer()?.dispose() } catch { /* ignore */ }
    }
  }, [router])

  return <div ref={containerRef} className="w-full h-full" />
}
