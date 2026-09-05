import { Shape } from 'three'

import type { GeoJsonGeometry } from '../types/spatial'
import type { LocalPoint } from '../utils/coordinates'

export type XY = [number, number]

export function getPolygonRing(geometry: GeoJsonGeometry): XY[] {
  const coordinates = geometry.coordinates
  if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0])) return []
  return coordinates[0].filter(
    (point): point is XY => Array.isArray(point) && typeof point[0] === 'number' && typeof point[1] === 'number',
  )
}

export function getPolygonCenter(geometry: GeoJsonGeometry): LocalPoint {
  const ring = getPolygonRing(geometry)
  const points = ring.length > 1 ? ring.slice(0, -1) : ring
  if (points.length === 0) return { x: 0, y: 0 }
  return points.reduce(
    (center, [x, y]) => ({ x: center.x + x / points.length, y: center.y + y / points.length }),
    { x: 0, y: 0 },
  )
}

export function createFootprintShape(geometry: GeoJsonGeometry, anchor: LocalPoint): Shape | null {
  const ring = getPolygonRing(geometry)
  if (ring.length < 4) return null
  const shape = new Shape()
  ring.forEach(([x, y], index) => {
    // Shape lies in XY before rotating it by -Math.PI/2 into the Three.js XZ ground plane.
    // Three.js Z_world = -localY = -(y - anchor.y), precisely matching scene coordinates.
    const localX = x - anchor.x
    const localY = y - anchor.y
    if (index === 0) shape.moveTo(localX, localY)
    else shape.lineTo(localX, localY)
  })
  return shape
}
