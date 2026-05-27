'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type PopulationCluster = {
  name: string
  lat: number
  lng: number
  population: number
  density: number
  hub: 'global' | 'regional' | 'local'
}

type GlobeNode = {
  lat: number
  lng: number
  radius: number
  color: string
}

type GlobeArc = {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string[]
}

type GlobeRing = {
  lat: number
  lng: number
  color: string
}

const POPULATION_CLUSTERS: PopulationCluster[] = [
  { name: 'New York', lat: 40.71, lng: -74.01, population: 19.6, density: 11.3, hub: 'global' },
  { name: 'Los Angeles', lat: 34.05, lng: -118.24, population: 13.2, density: 8.1, hub: 'global' },
  { name: 'Chicago', lat: 41.88, lng: -87.63, population: 9.4, density: 6.8, hub: 'regional' },
  { name: 'Dallas', lat: 32.78, lng: -96.8, population: 8.1, density: 4.2, hub: 'regional' },
  { name: 'Miami', lat: 25.77, lng: -80.19, population: 6.1, density: 5.9, hub: 'regional' },
  { name: 'Toronto', lat: 43.65, lng: -79.38, population: 6.7, density: 6.3, hub: 'regional' },
  { name: 'Mexico City', lat: 19.43, lng: -99.13, population: 22.5, density: 10.7, hub: 'global' },
  { name: 'Sao Paulo', lat: -23.55, lng: -46.63, population: 22.6, density: 10.9, hub: 'global' },
  { name: 'Rio de Janeiro', lat: -22.91, lng: -43.17, population: 13.7, density: 8.2, hub: 'regional' },
  { name: 'Buenos Aires', lat: -34.61, lng: -58.38, population: 16.7, density: 7.8, hub: 'regional' },
  { name: 'Bogota', lat: 4.71, lng: -74.07, population: 11.6, density: 8.5, hub: 'regional' },
  { name: 'Lima', lat: -12.05, lng: -77.04, population: 11.3, density: 7.9, hub: 'regional' },
  { name: 'London', lat: 51.51, lng: -0.13, population: 14.8, density: 9.1, hub: 'global' },
  { name: 'Paris', lat: 48.86, lng: 2.35, population: 11.3, density: 10.2, hub: 'global' },
  { name: 'Amsterdam', lat: 52.37, lng: 4.9, population: 2.7, density: 6.9, hub: 'regional' },
  { name: 'Brussels', lat: 50.85, lng: 4.35, population: 2.1, density: 7.1, hub: 'regional' },
  { name: 'Frankfurt', lat: 50.11, lng: 8.68, population: 2.7, density: 5.8, hub: 'regional' },
  { name: 'Madrid', lat: 40.42, lng: -3.7, population: 6.8, density: 5.6, hub: 'regional' },
  { name: 'Barcelona', lat: 41.39, lng: 2.15, population: 5.7, density: 6.9, hub: 'regional' },
  { name: 'Milan', lat: 45.47, lng: 9.19, population: 5.3, density: 6.4, hub: 'regional' },
  { name: 'Istanbul', lat: 41.01, lng: 28.95, population: 16.0, density: 9.7, hub: 'global' },
  { name: 'Moscow', lat: 55.76, lng: 37.62, population: 17.1, density: 8.8, hub: 'global' },
  { name: 'Cairo', lat: 30.05, lng: 31.25, population: 22.6, density: 11.0, hub: 'global' },
  { name: 'Lagos', lat: 6.46, lng: 3.38, population: 16.6, density: 10.5, hub: 'global' },
  { name: 'Johannesburg', lat: -26.2, lng: 28.04, population: 9.6, density: 5.7, hub: 'regional' },
  { name: 'Nairobi', lat: -1.29, lng: 36.82, population: 5.9, density: 6.0, hub: 'regional' },
  { name: 'Dubai', lat: 25.2, lng: 55.27, population: 3.7, density: 6.8, hub: 'global' },
  { name: 'Riyadh', lat: 24.69, lng: 46.72, population: 7.8, density: 4.8, hub: 'regional' },
  { name: 'Mumbai', lat: 19.08, lng: 72.88, population: 21.7, density: 12.0, hub: 'global' },
  { name: 'Delhi', lat: 28.66, lng: 77.23, population: 33.8, density: 12.8, hub: 'global' },
  { name: 'Bengaluru', lat: 12.97, lng: 77.59, population: 14.0, density: 9.0, hub: 'global' },
  { name: 'Dhaka', lat: 23.72, lng: 90.41, population: 23.9, density: 13.0, hub: 'global' },
  { name: 'Karachi', lat: 24.86, lng: 67.01, population: 17.6, density: 11.1, hub: 'global' },
  { name: 'Bangkok', lat: 13.75, lng: 100.52, population: 11.2, density: 8.0, hub: 'regional' },
  { name: 'Singapore', lat: 1.35, lng: 103.82, population: 6.0, density: 12.2, hub: 'global' },
  { name: 'Jakarta', lat: -6.21, lng: 106.85, population: 33.4, density: 12.6, hub: 'global' },
  { name: 'Manila', lat: 14.6, lng: 120.98, population: 24.9, density: 13.0, hub: 'global' },
  { name: 'Ho Chi Minh City', lat: 10.82, lng: 106.63, population: 9.7, density: 8.6, hub: 'regional' },
  { name: 'Tokyo', lat: 35.68, lng: 139.69, population: 37.2, density: 13.0, hub: 'global' },
  { name: 'Seoul', lat: 37.57, lng: 126.98, population: 25.2, density: 12.4, hub: 'global' },
  { name: 'Shanghai', lat: 31.23, lng: 121.47, population: 29.2, density: 12.0, hub: 'global' },
  { name: 'Beijing', lat: 39.91, lng: 116.4, population: 22.2, density: 9.4, hub: 'global' },
  { name: 'Guangzhou', lat: 23.13, lng: 113.26, population: 27.1, density: 11.2, hub: 'global' },
  { name: 'Shenzhen', lat: 22.54, lng: 114.06, population: 17.8, density: 12.5, hub: 'global' },
  { name: 'Hong Kong', lat: 22.4, lng: 114.11, population: 7.5, density: 12.7, hub: 'global' },
  { name: 'Taipei', lat: 25.05, lng: 121.56, population: 7.0, density: 9.2, hub: 'regional' },
  { name: 'Sydney', lat: -33.87, lng: 151.21, population: 5.4, density: 4.3, hub: 'regional' },
  { name: 'Melbourne', lat: -37.81, lng: 144.96, population: 5.3, density: 4.1, hub: 'regional' },
]

const ROUTES: Array<[string, string]> = [
  ['New York', 'London'],
  ['London', 'Paris'],
  ['Paris', 'Dubai'],
  ['Dubai', 'Mumbai'],
  ['Mumbai', 'Singapore'],
  ['Singapore', 'Tokyo'],
  ['Singapore', 'Sydney'],
  ['Shanghai', 'Los Angeles'],
  ['Tokyo', 'Los Angeles'],
  ['Mexico City', 'Sao Paulo'],
  ['London', 'Lagos'],
  ['Cairo', 'Dubai'],
]

const LIGHT_COLORS = ['#f8fbff', '#94e8ff', '#12b7ff', '#0078ff', '#ffb86c', '#ff7a3d'] as const

function hashValue(seed: string): number {
  let hash = 2166136261

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) / 4294967295
}

function nodeCountFor(cluster: PopulationCluster): number {
  const hubBoost = cluster.hub === 'global' ? 1.65 : cluster.hub === 'regional' ? 1.1 : 0.75
  return Math.round((cluster.population * 0.8 + cluster.density * 2.4) * hubBoost)
}

function nodeRadiusFor(cluster: PopulationCluster, index: number): number {
  if (index === 0) {
    return cluster.hub === 'global' ? 0.34 : 0.24
  }

  const scale = cluster.hub === 'global' ? 0.075 : 0.055
  return 0.025 + hashValue(`${cluster.name}-radius-${index}`) * scale
}

function nodeColorFor(cluster: PopulationCluster, index: number): string {
  if (index === 0) {
    return cluster.hub === 'global' ? '#00d9ff' : '#f8fbff'
  }

  const warmBias = cluster.density > 10 && index % 5 === 0
  if (warmBias) {
    return index % 2 === 0 ? '#ffb86c' : '#ff7a3d'
  }

  return LIGHT_COLORS[Math.floor(hashValue(`${cluster.name}-color-${index}`) * LIGHT_COLORS.length)]
}

function buildClusterNodes(cluster: PopulationCluster): GlobeNode[] {
  const count = nodeCountFor(cluster)
  const scatter = Math.max(0.06, 0.58 - Math.min(cluster.density, 13) * 0.026)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) {
      return {
        lat: cluster.lat,
        lng: cluster.lng,
        radius: nodeRadiusFor(cluster, index),
        color: nodeColorFor(cluster, index),
      }
    }

    const radial = Math.sqrt((index + 0.5) / count) * scatter
    const angle = index * goldenAngle + hashValue(`${cluster.name}-angle`) * Math.PI
    const latOffset = Math.sin(angle) * radial
    const lngOffset = Math.cos(angle) * radial * Math.max(0.6, Math.cos((cluster.lat * Math.PI) / 180))

    return {
      lat: cluster.lat + latOffset,
      lng: cluster.lng + lngOffset,
      radius: nodeRadiusFor(cluster, index),
      color: nodeColorFor(cluster, index),
    }
  })
}

const CLUSTER_BY_NAME = new Map(POPULATION_CLUSTERS.map((cluster) => [cluster.name, cluster]))

const NODES = POPULATION_CLUSTERS.flatMap(buildClusterNodes)

const ARCS: GlobeArc[] = ROUTES.flatMap(([startName, endName], index) => {
  const start = CLUSTER_BY_NAME.get(startName)
  const end = CLUSTER_BY_NAME.get(endName)
  if (!start || !end) {
    return []
  }

  return {
    startLat: start.lat,
    startLng: start.lng,
    endLat: end.lat,
    endLng: end.lng,
    color: index % 3 === 0 ? ['#0078ff44', '#00d9ffcc'] : ['#0078ff33', '#f8fbff99'],
  }
})

const RINGS: GlobeRing[] = POPULATION_CLUSTERS.filter((cluster) => cluster.hub === 'global').map((cluster, index) => ({
  lat: cluster.lat,
  lng: cluster.lng,
  color: index % 4 === 0 ? '#ff9f43' : '#00d9ff',
}))

export default function GlobeScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const globeContainer = container

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let world: any
    let ro: ResizeObserver | null = null

    function setAutoRotate(enabled: boolean) {
      if (!world) return
      world.controls().autoRotate = enabled
    }

    import('globe.gl').then(({ default: Globe }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      world = (Globe as any)()(globeContainer)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .backgroundColor('#000000')
        .pointsData(NODES)
        .pointAltitude(0.002)
        .pointColor('color')
        .pointResolution(5)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .pointRadius((node: any) => node.radius)
        .arcsData(ARCS)
        .arcColor('color')
        .arcAltitude(0.1)
        .arcStroke(0.22)
        .arcDashLength(0.52)
        .arcDashGap(1.7)
        .arcDashAnimateTime(9000)
        .ringsData(RINGS)
        .ringColor('color')
        .ringMaxRadius(0.7)
        .ringPropagationSpeed(0.55)
        .ringRepeatPeriod(3400)
        .showAtmosphere(true)
        .atmosphereColor('#0078ff')
        .atmosphereAltitude(0.18)
        .onPointHover((node: GlobeNode | null) => {
          setAutoRotate(!node)
        })
        .onPointClick(() => {
          setAutoRotate(false)
          router.push('/login?mode=enterprise')
        })

      world.controls().autoRotate = true
      world.controls().autoRotateSpeed = 0.65
      globeContainer.style.cursor = 'default'

      ro = new ResizeObserver(() => {
        if (!world) return
        world.width(globeContainer.clientWidth)
        world.height(globeContainer.clientHeight)
      })
      ro.observe(globeContainer)
    })

    return () => {
      ro?.disconnect()
      try {
        world?.renderer()?.dispose()
      } catch {
        // Ignore renderer cleanup failures during route transitions.
      }
    }
  }, [router])

  return <div ref={containerRef} className="w-full h-full" />
}
