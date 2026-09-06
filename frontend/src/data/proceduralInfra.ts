import type { UndergroundInfra } from '../types/spatial'
import rawRoads from './cityRoadDrainage.json'

/**
 * City-Scale Road-Aligned Subterranean Drainage Network
 *
 * Traces every road centerline across the entire 3D city footprint
 * extracted directly from the modular_city_environment mesh geometry.
 *
 * Each road in the city (primary, secondary, residential, service, tertiary, etc.)
 * has a dedicated BBMP storm water drainage culvert running directly beneath it.
 */

interface RawRoadSegment {
  id: string
  type: string
  diam: number
  pts: [number, number][]
}

const DRAINAGE_DEPTH = -5.5

function buildDrainageNetwork(): UndergroundInfra[] {
  const roads = rawRoads as RawRoadSegment[]
  const out: UndergroundInfra[] = []

  for (let i = 0; i < roads.length; i++) {
    const seg = roads[i]
    const num = seg.id.replace('drn-', '')
    const ulpin = `29KADRN${num.padStart(8, '0')}`
    const waypoints: [number, number, number][] = seg.pts.map(([x, z]) => [x, DRAINAGE_DEPTH, z])

    out.push({
      id: seg.id,
      base_ulpin: ulpin,
      full_ulpin: `${ulpin} / ${seg.id.toUpperCase()}`,
      infra_type: 'drainage',
      depth_meters: DRAINAGE_DEPTH,
      diameter_m: seg.diam,
      material: 'corrugated_steel_csp',
      segment_name: `BBMP Storm Water Drain (${seg.type})`,
      path: {
        type: 'LineString',
        coordinates: seg.pts,
      },
      waypoints,
    })
  }

  return out
}

export const PROCEDURAL_UNDERGROUND_INFRA: UndergroundInfra[] = buildDrainageNetwork()
