import { useMemo } from 'react'
import { MathUtils } from 'three'
import { useLocalityStore } from '../store/localityStore'

interface RoadSegment {
  x: number
  z: number
  width: number
  length: number
  isVertical?: boolean
  isMetroCorridor?: boolean
}

const ROAD_SEGMENTS: RoadSegment[] = [
  // 4 East-West Arterial Avenues
  { x: 0, z: -135, width: 14, length: 296 }, // South Drainage Avenue (Y = 15m in seed)
  { x: 0, z: -50, width: 12, length: 296 },  // Central Boulevard (between Row 1 & 2)
  { x: 0, z: 32, width: 10, length: 296 },   // Residential Street (between Row 2 & 3)
  { x: 0, z: 105, width: 16, length: 296, isMetroCorridor: true }, // Northern Metro Avenue (Z = 105, Y = 250m)

  // 4 North-South Cross Streets Connecting All Avenues
  { x: -80, z: -15, width: 10, length: 270, isVertical: true },
  { x: -10, z: -15, width: 10, length: 270, isVertical: true },
  { x: 60, z: -15, width: 10, length: 270, isVertical: true },
  { x: 135, z: -15, width: 10, length: 270, isVertical: true },
]

// Stylized Indian Urban Trees along footpaths
const TREE_LOCATIONS: [number, number, 'gulmohar' | 'neem' | 'palm'][] = [
  [-130, -126, 'gulmohar'],
  [-95, -126, 'neem'],
  [-25, -126, 'palm'],
  [45, -126, 'gulmohar'],
  [110, -126, 'neem'],
  [-130, -42, 'neem'],
  [-60, -42, 'gulmohar'],
  [15, -42, 'palm'],
  [85, -42, 'neem'],
  [-120, 115, 'palm'],
  [-70, 115, 'gulmohar'],
  [0, 115, 'neem'],
  [70, 115, 'palm'],
  [120, 115, 'gulmohar'],
  [-88, -90, 'neem'],
  [-88, 30, 'palm'],
  [-18, -90, 'gulmohar'],
  [-18, 50, 'neem'],
  [52, -90, 'palm'],
  [52, 50, 'gulmohar'],
]

// Street light poles
const STREET_LAMPS: [number, number][] = [
  [-110, -128], [-40, -128], [30, -128], [100, -128],
  [-110, -44], [-40, -44], [30, -44], [100, -44],
  [-110, 114], [-40, 114], [30, 114], [100, 114],
]

function Tree({ x, z, type }: { x: number; z: number; type: 'gulmohar' | 'neem' | 'palm' }) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  if (type === 'palm') {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[1.8, 0.5, 1.8]} />
          <meshStandardMaterial color="#8c5836" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.8, 0]} rotation-z={0.06} castShadow>
          <cylinderGeometry args={[0.2, 0.32, 5.2, 8]} />
          <meshStandardMaterial color="#544136" roughness={0.9} />
        </mesh>
        <mesh position={[0.25, 5.3, 0]} castShadow>
          <coneGeometry args={[2.6, 1.2, 7]} />
          <meshStandardMaterial color="#2d6a4f" roughness={0.7} />
        </mesh>
        <mesh position={[0.25, 5.7, 0]} castShadow>
          <coneGeometry args={[1.8, 1.0, 7]} />
          <meshStandardMaterial color="#40916c" roughness={0.7} />
        </mesh>
      </group>
    )
  }

  const canopyColor = type === 'gulmohar' ? '#e76f51' : '#2d6a4f'
  const leafColor2 = type === 'gulmohar' ? '#f4a261' : '#52b788'

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.2, 0.4, 10]} />
        <meshStandardMaterial color="#6c584c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 3.2, 8]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <dodecahedronGeometry args={[1.7, 1]} />
        <meshStandardMaterial color={canopyColor} roughness={0.65} />
      </mesh>
      <mesh position={[0.6, 4.4, 0.4]} castShadow>
        <dodecahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color={leafColor2} roughness={0.65} />
      </mesh>
      <mesh position={[-0.5, 4.2, -0.4]} castShadow>
        <dodecahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color={canopyColor} roughness={0.65} />
      </mesh>
    </group>
  )
}

function StreetLamp({ x, z }: { x: number; z: number }) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.6, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 5.8, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 5.9, 0]} rotation-z={MathUtils.degToRad(-35)}>
        <cylinderGeometry args={[0.07, 0.07, 1.2, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.0, 5.6, 0]}>
        <boxGeometry args={[0.5, 0.15, 0.3]} />
        <meshStandardMaterial color="#f8fafc" emissive="#fef08a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

function ZebraCrossing({ x, z, isVertical }: { x: number; z: number; isVertical?: boolean }) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  const stripeCount = 6
  const stripeWidth = 0.6
  const stripeGap = 0.5

  return (
    <group position={[x, 0.03, z]} rotation-y={isVertical ? Math.PI / 2 : 0}>
      {Array.from({ length: stripeCount }).map((_, i) => (
        <mesh key={i} position={[(i - (stripeCount - 1) / 2) * (stripeWidth + stripeGap), 0, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[stripeWidth, 3.6]} />
          <meshBasicMaterial
            color="#f8fafc"
            transparent={undergroundVisible}
            opacity={undergroundVisible ? 0.15 : 0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

function ManholeCover({ x, z, label }: { x: number; z: number; label?: string }) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  return (
    <group position={[x, 0.04, z]} name={label}>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.65, 16]} />
        <meshStandardMaterial
          color={undergroundVisible ? '#06b6d4' : '#334155'}
          metalness={0.8}
          roughness={0.4}
          emissive={undergroundVisible ? '#0891b2' : '#000000'}
          emissiveIntensity={undergroundVisible ? 0.7 : 0}
        />
      </mesh>
    </group>
  )
}

function StormDrainGrate({ x, z }: { x: number; z: number }) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  return (
    <group position={[x, 0.04, z]}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.8, 0.7]} />
        <meshStandardMaterial
          color={undergroundVisible ? '#22d3ee' : '#1e293b'}
          metalness={0.85}
          roughness={0.35}
          emissive={undergroundVisible ? '#06b6d4' : '#000000'}
          emissiveIntensity={undergroundVisible ? 0.8 : 0}
        />
      </mesh>
    </group>
  )
}

export function RoadNetwork() {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)

  const asphaltMaterial = useMemo(
    () => (
      <meshStandardMaterial
        color={undergroundVisible ? '#1e293b' : '#1f242d'}
        roughness={0.88}
        metalness={0.08}
        transparent={undergroundVisible}
        opacity={undergroundVisible ? 0.12 : 1}
        depthWrite={!undergroundVisible}
      />
    ),
    [undergroundVisible],
  )

  const sidewalkMaterial = useMemo(
    () => (
      <meshStandardMaterial
        color={undergroundVisible ? '#334155' : '#94a3b8'}
        roughness={0.92}
        transparent={undergroundVisible}
        opacity={undergroundVisible ? 0.1 : 1}
        depthWrite={!undergroundVisible}
      />
    ),
    [undergroundVisible],
  )

  return (
    <group name="road-network">
      {ROAD_SEGMENTS.map((seg, idx) => {
        const roadWidth = seg.isVertical ? seg.length : seg.width
        const roadLength = seg.isVertical ? seg.width : seg.length
        return (
          <group key={idx} position={[seg.x, 0.015, seg.z]}>
            {/* Main Road Bed */}
            <mesh rotation-x={-Math.PI / 2} receiveShadow={!undergroundVisible}>
              <planeGeometry args={[roadLength, roadWidth]} />
              {asphaltMaterial}
            </mesh>

            {/* Sidewalk Borders */}
            {!seg.isVertical ? (
              <>
                <mesh position={[0, 0.06, seg.width / 2 + 1.2]} receiveShadow={!undergroundVisible}>
                  <boxGeometry args={[roadLength, 0.12, 2.4]} />
                  {sidewalkMaterial}
                </mesh>
                <mesh position={[0, 0.06, -seg.width / 2 - 1.2]} receiveShadow={!undergroundVisible}>
                  <boxGeometry args={[roadLength, 0.12, 2.4]} />
                  {sidewalkMaterial}
                </mesh>
              </>
            ) : null}

            {/* Road Lane Markings */}
            {!seg.isVertical ? (
              <mesh position={[0, 0.025, 0]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[roadLength - 10, seg.isMetroCorridor ? 0.28 : 0.2]} />
                <meshBasicMaterial
                  color={seg.isMetroCorridor ? '#f59e0b' : '#f8fafc'}
                  transparent={undergroundVisible}
                  opacity={undergroundVisible ? 0.15 : 0.8}
                />
              </mesh>
            ) : (
              <mesh position={[0, 0.025, 0]} rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2}>
                <planeGeometry args={[roadLength - 8, 0.2]} />
                <meshBasicMaterial
                  color="#f8fafc"
                  transparent={undergroundVisible}
                  opacity={undergroundVisible ? 0.15 : 0.8}
                />
              </mesh>
            )}
          </group>
        )
      })}

      {/* Zebra Crossings */}
      <ZebraCrossing x={-80} z={-135} />
      <ZebraCrossing x={-10} z={-135} />
      <ZebraCrossing x={60} z={-135} />

      <ZebraCrossing x={-80} z={-50} />
      <ZebraCrossing x={-10} z={-50} />
      <ZebraCrossing x={60} z={-50} />

      <ZebraCrossing x={-80} z={32} />
      <ZebraCrossing x={-10} z={32} />
      <ZebraCrossing x={60} z={32} />

      <ZebraCrossing x={-80} z={105} />
      <ZebraCrossing x={-10} z={105} />
      <ZebraCrossing x={60} z={105} />

      {/* Surface Drainage Grates along Drainage Corridor */}
      <StormDrainGrate x={-120} z={-141} />
      <StormDrainGrate x={-60} z={-141} />
      <StormDrainGrate x={0} z={-141} />
      <StormDrainGrate x={60} z={-141} />
      <StormDrainGrate x={120} z={-141} />

      {/* Manhole Covers along Cross-Roads & Metro Line */}
      <ManholeCover x={-50} z={-135} label="Drainage Junction MH-01" />
      <ManholeCover x={-50} z={-50} label="Sanitary Sewer MH-02" />
      <ManholeCover x={-50} z={32} label="Residential Sewer MH-03" />
      <ManholeCover x={-50} z={105} label="Metro Access Shaft MH-04" />
      <ManholeCover x={55} z={105} label="Metro Ventilation MH-05" />

      {/* Street Trees & Planters */}
      {TREE_LOCATIONS.map(([x, z, type], i) => (
        <Tree key={i} x={x} z={z} type={type} />
      ))}

      {/* Street Lights */}
      {STREET_LAMPS.map(([x, z], i) => (
        <StreetLamp key={i} x={x} z={z} />
      ))}
    </group>
  )
}
