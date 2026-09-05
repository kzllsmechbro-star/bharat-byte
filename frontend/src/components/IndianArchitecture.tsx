import { useMemo } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  MathUtils,
  RepeatWrapping,
} from 'three'
import type { Building } from '../types/spatial'
import type { LocalPoint } from '../utils/coordinates'
import { getPolygonRing } from './footprint'
import { AcCompressorUnit, SatelliteDish } from './IndianStreetProps'

/**
 * Creates a mathematically exact Hipped Roof BufferGeometry for any rectangular footprint.
 * No 45-degree rotation glitch, no twisted corners, perfect rectangular fit.
 */
export function createHippedRoofGeometry(
  width: number,
  depth: number,
  height: number,
  overhang = 0.8,
): BufferGeometry {
  const w = width + overhang * 2
  const d = depth + overhang * 2
  const h = height

  const hw = w / 2
  const hd = d / 2

  // Base 4 vertices at Y = 0
  const v0 = [-hw, 0, -hd] // NW
  const v1 = [hw, 0, -hd]  // NE
  const v2 = [hw, 0, hd]   // SE
  const v3 = [-hw, 0, hd]  // SW

  // Ridge vertices at Y = h
  let r0: number[]
  let r1: number[]

  if (w >= d) {
    const ridgeHalfLength = Math.max(0.2, hw - hd)
    r0 = [-ridgeHalfLength, h, 0]
    r1 = [ridgeHalfLength, h, 0]
  } else {
    const ridgeHalfLength = Math.max(0.2, hd - hw)
    r0 = [0, h, -ridgeHalfLength]
    r1 = [0, h, ridgeHalfLength]
  }

  const positions: number[] = []

  if (w >= d) {
    // North Trapezoid
    positions.push(...v0, ...v1, ...r1)
    positions.push(...v0, ...r1, ...r0)

    // South Trapezoid
    positions.push(...v2, ...v3, ...r0)
    positions.push(...v2, ...r0, ...r1)

    // East Triangle
    positions.push(...v1, ...v2, ...r1)

    // West Triangle
    positions.push(...v3, ...v0, ...r0)
  } else {
    // West Trapezoid
    positions.push(...v3, ...v0, ...r0)
    positions.push(...v3, ...r0, ...r1)

    // East Trapezoid
    positions.push(...v1, ...v2, ...r1)
    positions.push(...v1, ...r1, ...r0)

    // North Triangle
    positions.push(...v0, ...v1, ...r0)

    // South Triangle
    positions.push(...v2, ...v3, ...r1)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Creates an exact Gabled / Pitched Roof BufferGeometry.
 */
export function createGabledRoofGeometry(
  width: number,
  depth: number,
  height: number,
  overhang = 0.8,
): BufferGeometry {
  const w = width + overhang * 2
  const d = depth + overhang * 2
  const hw = w / 2
  const hd = d / 2

  const v0 = [-hw, 0, -hd]
  const v1 = [hw, 0, -hd]
  const v2 = [hw, 0, hd]
  const v3 = [-hw, 0, hd]

  const r0 = [-hw, height, 0]
  const r1 = [hw, height, 0]

  const positions: number[] = [
    // North Sloped Pitch
    ...v0, ...v1, ...r1,
    ...v0, ...r1, ...r0,
    // South Sloped Pitch
    ...v2, ...v3, ...r0,
    ...v2, ...r0, ...r1,
    // West Gable Triangle
    ...v3, ...v0, ...r0,
    // East Gable Triangle
    ...v1, ...v2, ...r1,
  ]

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.computeVertexNormals()
  return geometry
}

function generateTerracottaTileTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return new CanvasTexture(canvas)

  ctx.fillStyle = '#b84a32'
  ctx.fillRect(0, 0, 256, 256)

  // Corrugated horizontal & vertical clay ridges
  for (let y = 0; y < 256; y += 16) {
    ctx.fillStyle = 'rgba(70, 25, 15, 0.45)'
    ctx.fillRect(0, y, 256, 2)
    ctx.fillStyle = 'rgba(230, 110, 80, 0.35)'
    ctx.fillRect(0, y + 2, 256, 3)
  }

  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = 'rgba(60, 20, 10, 0.4)'
    ctx.fillRect(x, 0, 2, 256)
    ctx.fillStyle = 'rgba(240, 120, 90, 0.25)'
    ctx.fillRect(x + 2, 0, 2, 256)
  }

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

// ----------------------------------------------------------------------------------
// 4 DISTINCT INDIAN HOUSE STYLES
// ----------------------------------------------------------------------------------

/** House 1: Kerala Traditional Mangalore Tiled Heritage Home */
function HouseStyle1_Kerala({
  width,
  depth,
  elevation,
  undergroundVisible,
}: {
  width: number
  depth: number
  elevation: number
  undergroundVisible: boolean
}) {
  const roofHeight = Math.min(width, depth) * 0.45
  const roofGeom = useMemo(() => createHippedRoofGeometry(width, depth, roofHeight, 1.2), [width, depth, roofHeight])
  const tileTexture = useMemo(() => generateTerracottaTileTexture(), [])

  if (undergroundVisible) return null

  return (
    <group>
      {/* Front Sit-out Veranda (Thinnai) with Carved Teak Wooden Pillars */}
      <group position={[0, 0, depth / 2 + 0.8]}>
        {/* Raised Veranda Plinth */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[width * 0.7, 0.4, 1.6]} />
          <meshStandardMaterial color="#d4a373" roughness={0.8} />
        </mesh>
        {/* Entrance Steps */}
        <mesh position={[0, 0.1, 1.0]} receiveShadow>
          <boxGeometry args={[width * 0.35, 0.2, 0.5]} />
          <meshStandardMaterial color="#9c6644" roughness={0.85} />
        </mesh>
        {/* Wooden Pillars */}
        <mesh position={[-width * 0.28, 1.5, 0.5]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 2.6, 8]} />
          <meshStandardMaterial color="#582f0e" roughness={0.7} />
        </mesh>
        <mesh position={[width * 0.28, 1.5, 0.5]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 2.6, 8]} />
          <meshStandardMaterial color="#582f0e" roughness={0.7} />
        </mesh>
        {/* Sloped Veranda Porch Tile Roof */}
        <mesh position={[0, 2.9, 0.4]} rotation-x={MathUtils.degToRad(-16)} castShadow>
          <boxGeometry args={[width * 0.75, 0.14, 1.8]} />
          <meshStandardMaterial map={tileTexture} color="#b84a32" roughness={0.75} />
        </mesh>
      </group>

      {/* Mangalore Clay Tiled Hipped Roof */}
      <group position={[0, elevation, 0]}>
        <mesh geometry={roofGeom} castShadow receiveShadow>
          <meshStandardMaterial map={tileTexture} color="#b84a32" roughness={0.76} />
        </mesh>
        {/* Ridge Cap */}
        <mesh position={[0, roofHeight + 0.08, 0]} castShadow>
          <boxGeometry args={[Math.max(width - depth, 1.2), 0.16, 0.32]} />
          <meshStandardMaterial color="#8e3521" roughness={0.8} />
        </mesh>
        {/* Rooftop Tata Play Satellite Dish */}
        <SatelliteDish position={[-width * 0.25, roofHeight * 0.4, depth * 0.2]} rotationY={MathUtils.degToRad(45)} />

        {/* Rooftop Overhead Sintex Water Tank */}
        <group position={[width * 0.22, roofHeight + 0.65, -depth * 0.15]}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[1.6, 0.2, 1.6]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.65, 0.65, 1.2, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/** House 2: Contemporary Indian Villa with Pergola & Glass Balcony */
function HouseStyle2_ModernVilla({
  width,
  depth,
  elevation,
  undergroundVisible,
}: {
  width: number
  depth: number
  elevation: number
  undergroundVisible: boolean
}) {
  if (undergroundVisible) return null

  return (
    <group>
      <group position={[0, elevation, 0]}>
        {/* Terrace Floor */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>

        {/* 4-Sided Perimeter Parapet Walls */}
        <mesh position={[0, 0.45, -depth / 2 + 0.15]} receiveShadow>
          <boxGeometry args={[width, 0.8, 0.3]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.45, depth / 2 - 0.15]} receiveShadow>
          <boxGeometry args={[width, 0.8, 0.3]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[-width / 2 + 0.15, 0.45, 0]} receiveShadow>
          <boxGeometry args={[0.3, 0.8, depth - 0.6]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[width / 2 - 0.15, 0.45, 0]} receiveShadow>
          <boxGeometry args={[0.3, 0.8, depth - 0.6]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>

        {/* Rooftop Wooden Pergola Gazebo Lounge */}
        <group position={[-width * 0.15, 0.1, depth * 0.1]}>
          {[[-1.8, -1.8], [1.8, -1.8], [1.8, 1.8], [-1.8, 1.8]].map(([px, pz], i) => (
            <mesh key={i} position={[px, 1.3, pz]} castShadow>
              <boxGeometry args={[0.18, 2.6, 0.18]} />
              <meshStandardMaterial color="#78350f" roughness={0.65} />
            </mesh>
          ))}
          {[-1.5, -0.9, -0.3, 0.3, 0.9, 1.5].map((sx, i) => (
            <mesh key={i} position={[sx, 2.65, 0]} castShadow>
              <boxGeometry args={[0.1, 0.12, 3.8]} />
              <meshStandardMaterial color="#78350f" roughness={0.65} />
            </mesh>
          ))}
        </group>

        {/* Satellite Dish */}
        <SatelliteDish position={[width * 0.3, 0.8, depth * 0.25]} rotationY={MathUtils.degToRad(-30)} />

        {/* Rooftop Solar Array */}
        <group position={[width * 0.22, 0.7, -depth * 0.2]} rotation-x={MathUtils.degToRad(-25)}>
          <mesh castShadow>
            <boxGeometry args={[width * 0.35, 1.8, 0.1]} />
            <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.15} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/** House 3: Heritage Haveli with Sandstone Arches & Jali Parapets */
function HouseStyle3_Haveli({
  width,
  depth,
  elevation,
  undergroundVisible,
}: {
  width: number
  depth: number
  elevation: number
  undergroundVisible: boolean
}) {
  if (undergroundVisible) return null

  return (
    <group>
      <group position={[0, elevation, 0]}>
        {/* Sandstone Terrace Floor */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color="#e2d9cc" roughness={0.8} />
        </mesh>

        {/* 4-Sided Decorative Jali Parapet Borders */}
        <mesh position={[0, 0.45, -depth / 2 + 0.15]} receiveShadow>
          <boxGeometry args={[width, 0.8, 0.3]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.45, depth / 2 - 0.15]} receiveShadow>
          <boxGeometry args={[width, 0.8, 0.3]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[-width / 2 + 0.15, 0.45, 0]} receiveShadow>
          <boxGeometry args={[0.3, 0.8, depth - 0.6]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[width / 2 - 0.15, 0.45, 0]} receiveShadow>
          <boxGeometry args={[0.3, 0.8, depth - 0.6]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>

        {/* Traditional Corner Chhatri Dome Pavilions */}
        <group position={[width * 0.28, 0.1, depth * 0.25]}>
          {[[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, 1.1, cz]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 2.2, 8]} />
              <meshStandardMaterial color="#fde68a" roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[1.5, 0.9, 8]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} />
          </mesh>
          <mesh position={[0, 3.1, 0]}>
            <cylinderGeometry args={[0.02, 0.06, 0.6, 6]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} />
          </mesh>
        </group>

        {/* Satellite Dish */}
        <SatelliteDish position={[-width * 0.28, 0.8, depth * 0.25]} rotationY={MathUtils.degToRad(60)} />

        {/* Overhead Traditional Water Tank Box */}
        <group position={[-width * 0.25, 0.8, -depth * 0.2]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 1.6, 2.2]} />
            <meshStandardMaterial color="#b45309" roughness={0.75} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/** House 4: Bengaluru Contemporary Courtyard Home with Angled Mono-Pitch Roof */
function HouseStyle4_Courtyard({
  width,
  depth,
  elevation,
  undergroundVisible,
}: {
  width: number
  depth: number
  elevation: number
  undergroundVisible: boolean
}) {
  const roofHeight = Math.min(width, depth) * 0.42
  const roofGeom = useMemo(() => createGabledRoofGeometry(width, depth, roofHeight, 1.0), [width, depth, roofHeight])
  const tileTexture = useMemo(() => generateTerracottaTileTexture(), [])

  if (undergroundVisible) return null

  return (
    <group>
      <group position={[0, elevation, 0]}>
        {/* Terracotta Gabled Clay Roof */}
        <mesh geometry={roofGeom} castShadow receiveShadow>
          <meshStandardMaterial map={tileTexture} color="#b84a32" roughness={0.75} />
        </mesh>
        {/* Teak Wood Louvered Screen along Gable */}
        <mesh position={[0, roofHeight / 2, depth / 2 + 0.9]} castShadow>
          <boxGeometry args={[width * 0.6, roofHeight * 0.8, 0.1]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>
        {/* Satellite Dish */}
        <SatelliteDish position={[-width * 0.25, roofHeight * 0.4, depth * 0.2]} rotationY={MathUtils.degToRad(30)} />

        {/* Overhead Blue PVC Water Tank */}
        <group position={[width * 0.2, roofHeight + 0.5, -depth * 0.15]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.6, 0.6, 1.1, 14]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/** Master House Decorator: Selects unique style based on building coordinates/id */
export function IndianHouseDecorations({
  building,
  anchor,
  elevation,
  undergroundVisible,
}: {
  building: Building
  anchor: LocalPoint
  elevation: number
  undergroundVisible: boolean
}) {
  const ring = getPolygonRing(building.footprint)
  const xs = ring.map(([x]) => x - anchor.x)
  const zs = ring.map(([, y]) => y - anchor.y)
  const width = Math.max(...xs) - Math.min(...xs)
  const depth = Math.max(...zs) - Math.min(...zs)

  if (!Number.isFinite(width) || !Number.isFinite(depth) || width <= 0 || depth <= 0) return null

  const centerX = anchor.x
  if (centerX < 60) {
    return <HouseStyle1_Kerala width={width} depth={depth} elevation={elevation} undergroundVisible={undergroundVisible} />
  }
  if (centerX < 100) {
    return <HouseStyle2_ModernVilla width={width} depth={depth} elevation={elevation} undergroundVisible={undergroundVisible} />
  }
  if (centerX < 150) {
    return <HouseStyle3_Haveli width={width} depth={depth} elevation={elevation} undergroundVisible={undergroundVisible} />
  }
  return <HouseStyle4_Courtyard width={width} depth={depth} elevation={elevation} undergroundVisible={undergroundVisible} />
}

// ----------------------------------------------------------------------------------
// DISTINCT APARTMENT BUILDING THEMES & FACADES
// ----------------------------------------------------------------------------------

export interface ApartmentTheme {
  wallColor: string
  accentColor: string
  balconyRailingColor: string
  balconyRailingOpacity: number
  balconyType: 'continuous' | 'corner' | 'staggered' | 'framed'
}

export const APARTMENT_THEMES: ApartmentTheme[] = [
  { wallColor: '#f5f5f0', accentColor: '#8d4024', balconyRailingColor: '#1e293b', balconyRailingOpacity: 0.85, balconyType: 'continuous' },
  { wallColor: '#e6e8ea', accentColor: '#334155', balconyRailingColor: '#0284c7', balconyRailingOpacity: 0.65, balconyType: 'corner' },
  { wallColor: '#f8f6f0', accentColor: '#78350f', balconyRailingColor: '#3f2c22', balconyRailingOpacity: 0.9, balconyType: 'framed' },
  { wallColor: '#eef2ea', accentColor: '#2d3e33', balconyRailingColor: '#0f172a', balconyRailingOpacity: 0.75, balconyType: 'staggered' },
  { wallColor: '#f7f4ec', accentColor: '#854d0e', balconyRailingColor: '#1e293b', balconyRailingOpacity: 0.85, balconyType: 'continuous' },
  { wallColor: '#f1f5f9', accentColor: '#1e3a8a', balconyRailingColor: '#38bdf8', balconyRailingOpacity: 0.65, balconyType: 'corner' },
  { wallColor: '#faf6eb', accentColor: '#7c2d12', balconyRailingColor: '#451a03', balconyRailingOpacity: 0.9, balconyType: 'framed' },
  { wallColor: '#e2e5e9', accentColor: '#475569', balconyRailingColor: '#1f2937', balconyRailingOpacity: 0.8, balconyType: 'staggered' },
]

export function getApartmentTheme(buildingId: string, index: number): ApartmentTheme {
  const hash = buildingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), index)
  return APARTMENT_THEMES[hash % APARTMENT_THEMES.length]
}

/** Recessed Balconies + Window Chajja Sunshades & AC units for Multi-Storey Apartments */
export function IndianApartmentFloorDecorations({
  elevation,
  height,
  width,
  depth,
  floorIndex,
  theme,
  undergroundVisible,
}: {
  elevation: number
  height: number
  width: number
  depth: number
  floorIndex: number
  theme: ApartmentTheme
  undergroundVisible: boolean
}) {
  if (undergroundVisible) return null

  const balconyWidth = Math.min(width * 0.52, 9)
  const balconyDepth = 1.4
  const isStaggeredOffset = theme.balconyType === 'staggered' && floorIndex % 2 === 1 ? -width * 0.15 : width * 0.05

  return (
    <group position={[0, elevation, 0]}>
      {/* Front Balcony Projection */}
      <group position={[isStaggeredOffset, 0, depth / 2 + balconyDepth / 2]}>
        <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
          <boxGeometry args={[balconyWidth, 0.24, balconyDepth]} />
          <meshStandardMaterial color={theme.accentColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.65, balconyDepth / 2 - 0.05]} castShadow>
          <boxGeometry args={[balconyWidth - 0.2, 0.9, 0.08]} />
          <meshStandardMaterial
            color={theme.balconyRailingColor}
            metalness={0.7}
            roughness={0.3}
            transparent={theme.balconyRailingOpacity < 1}
            opacity={theme.balconyRailingOpacity}
          />
        </mesh>
        <mesh position={[-balconyWidth / 2 + 0.05, 0.65, 0]} castShadow>
          <boxGeometry args={[0.08, 0.9, balconyDepth - 0.1]} />
          <meshStandardMaterial color={theme.balconyRailingColor} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[balconyWidth / 2 - 0.05, 0.65, 0]} castShadow>
          <boxGeometry args={[0.08, 0.9, balconyDepth - 0.1]} />
          <meshStandardMaterial color={theme.balconyRailingColor} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, height / 2, -balconyDepth / 2 + 0.04]}>
          <planeGeometry args={[balconyWidth * 0.7, height * 0.75]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} transparent opacity={0.65} />
        </mesh>
      </group>

      {/* Windows with Indian Concrete Chajja (Sunshades) & Wall-Mounted AC Outdoor Units */}
      <group position={[-width / 2, height * 0.55, 0]}>
        <mesh rotation-y={Math.PI / 2}>
          <planeGeometry args={[2.2, 1.4]} />
          <meshStandardMaterial color="#bae6fd" roughness={0.2} metalness={0.8} transparent opacity={0.75} />
        </mesh>
        <mesh position={[-0.45, 0.85, 0]} rotation-z={MathUtils.degToRad(-8)} castShadow>
          <boxGeometry args={[0.8, 0.1, 2.6]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
        <AcCompressorUnit position={[-0.3, -0.65, 0.6]} rotationY={Math.PI / 2} />
      </group>

      <group position={[width / 2, height * 0.55, 0]}>
        <mesh rotation-y={-Math.PI / 2}>
          <planeGeometry args={[2.2, 1.4]} />
          <meshStandardMaterial color="#bae6fd" roughness={0.2} metalness={0.8} transparent opacity={0.75} />
        </mesh>
        <mesh position={[0.45, 0.85, 0]} rotation-z={MathUtils.degToRad(8)} castShadow>
          <boxGeometry args={[0.8, 0.1, 2.6]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
        <AcCompressorUnit position={[0.3, -0.65, 0.6]} rotationY={-Math.PI / 2} />
      </group>
    </group>
  )
}

/** Rooftop Penthouse, Overhead Water Tanks & Lift Room for Multi-Storey Apartments */
export function IndianApartmentRoofDecorations({
  building,
  anchor,
  elevation,
  theme,
  undergroundVisible,
}: {
  building: Building
  anchor: LocalPoint
  elevation: number
  theme: ApartmentTheme
  undergroundVisible: boolean
}) {
  if (undergroundVisible) return null
  const ring = getPolygonRing(building.footprint)
  const xs = ring.map(([x]) => x - anchor.x)
  const zs = ring.map(([, y]) => y - anchor.y)
  const width = Math.max(...xs) - Math.min(...xs)
  const depth = Math.max(...zs) - Math.min(...zs)
  if (!Number.isFinite(width) || !Number.isFinite(depth)) return null

  return (
    <group position={[0, elevation, 0]}>
      {/* 1. Rooftop Terrace Floor Pavers */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>

      {/* 2. Perimeter Parapet Wall Borders (North, South, East, West) */}
      <mesh position={[0, 0.45, -depth / 2 + 0.15]} receiveShadow>
        <boxGeometry args={[width, 0.8, 0.3]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.45, depth / 2 - 0.15]} receiveShadow>
        <boxGeometry args={[width, 0.8, 0.3]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[-width / 2 + 0.15, 0.45, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.8, depth - 0.6]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[width / 2 - 0.15, 0.45, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.8, depth - 0.6]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>

      {/* 3. Lift Machine Room & Overhead Tank Penthouse Tower */}
      <group position={[width * 0.15, 1.3, -depth * 0.15]}>
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.32, 2.4, depth * 0.32]} />
          <meshStandardMaterial color={theme.accentColor} roughness={0.75} />
        </mesh>
        {/* Twin Overhead PVC Water Tanks on Top */}
        <mesh position={[-0.6, 2.4, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 1.3, 14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0.6, 2.4, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 1.3, 14]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Antenna Mast */}
        <mesh position={[0.8, 3.2, 0.8]}>
          <cylinderGeometry args={[0.04, 0.06, 2.8, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>

      {/* Rooftop Satellite Dish Antennas */}
      <SatelliteDish position={[width * 0.3, 0.5, depth * 0.2]} rotationY={MathUtils.degToRad(-45)} />
      <SatelliteDish position={[-width * 0.3, 0.5, -depth * 0.2]} rotationY={MathUtils.degToRad(30)} />

      {/* 4. Solar Water Heating Panels */}
      <group position={[-width * 0.2, 0.8, depth * 0.1]} rotation-x={MathUtils.degToRad(-30)}>
        <mesh castShadow>
          <boxGeometry args={[width * 0.35, 1.8, 0.12]} />
          <meshStandardMaterial color="#0369a1" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    </group>
  )
}

/** TMT Steel Rebar Rods + Scaffolding for Under-Construction / Half-Built Buildings */
export function IndianConstructionDetails({
  building,
  anchor,
  completedHeight,
  undergroundVisible,
}: {
  building: Building
  anchor: LocalPoint
  completedHeight: number
  undergroundVisible: boolean
}) {
  if (undergroundVisible) return null
  const ring = getPolygonRing(building.footprint)
  const xs = ring.map(([x]) => x - anchor.x)
  const zs = ring.map(([, y]) => y - anchor.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  const columns: [number, number][] = [
    [minX + 0.8, minZ + 0.8],
    [maxX - 0.8, minZ + 0.8],
    [maxX - 0.8, maxZ - 0.8],
    [minX + 0.8, maxZ - 0.8],
    [(minX + maxX) / 2, minZ + 0.8],
    [(minX + maxX) / 2, maxZ - 0.8],
  ]

  return (
    <group position={[0, completedHeight, 0]}>
      {columns.map(([cx, cz], i) => (
        <group key={i} position={[cx, 0, cz]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.7, 1.2, 0.7]} />
            <meshStandardMaterial color="#64748b" roughness={0.95} />
          </mesh>
          <mesh position={[-0.15, 1.8, -0.15]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.8, 6]} />
            <meshStandardMaterial color="#78350f" metalness={0.85} roughness={0.4} />
          </mesh>
          <mesh position={[0.15, 1.9, -0.15]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 2.0, 6]} />
            <meshStandardMaterial color="#78350f" metalness={0.85} roughness={0.4} />
          </mesh>
          <mesh position={[-0.15, 2.0, 0.15]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 2.2, 6]} />
            <meshStandardMaterial color="#78350f" metalness={0.85} roughness={0.4} />
          </mesh>
          <mesh position={[0.15, 1.7, 0.15]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.6, 6]} />
            <meshStandardMaterial color="#78350f" metalness={0.85} roughness={0.4} />
          </mesh>
        </group>
      ))}

      <mesh position={[minX + 3.0, 0.4, minZ + 1.2]} castShadow>
        <boxGeometry args={[3.6, 0.8, 0.4]} />
        <meshStandardMaterial color="#9a3412" roughness={0.9} />
      </mesh>
      <mesh position={[maxX - 3.0, 0.5, maxZ - 1.2]} castShadow>
        <boxGeometry args={[4.2, 1.0, 0.4]} />
        <meshStandardMaterial color="#9a3412" roughness={0.9} />
      </mesh>
    </group>
  )
}
