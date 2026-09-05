import { MathUtils } from 'three'
import { useLocalityStore } from '../store/localityStore'

/** Iconic Indian Auto-Rickshaw (Tuk-Tuk: Yellow Roof + Green Body + 3 Wheels) */
export function AutoRickshaw({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Dark Green Lower Chassis & Cabin */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[1.3, 0.7, 2.4]} />
        <meshStandardMaterial color="#065f46" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Yellow Iconic Curvature Canopy Roof */}
      <mesh position={[0, 1.35, -0.1]} castShadow>
        <boxGeometry args={[1.28, 0.75, 2.1]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Windshield & Front Apron */}
      <mesh position={[0, 0.95, 0.95]} rotation-x={MathUtils.degToRad(-15)}>
        <boxGeometry args={[1.15, 0.65, 0.08]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Headlight */}
      <mesh position={[0, 0.55, 1.22]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
      </mesh>

      {/* 3 Wheels (1 Front, 2 Rear) */}
      <mesh position={[0, 0.22, 0.9]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.2, 12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh position={[-0.6, 0.22, -0.7]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.2, 12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh position={[0.6, 0.22, -0.7]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.2, 12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Parked Indian Scooter (Activa / Chetak style) */
export function Scooter({
  position,
  rotationY = 0,
  color = '#dc2626',
}: {
  position: [number, number, number]
  rotationY?: number
  color?: string
}) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Body Chassis */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.4, 0.45, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Handlebar & Headlight */}
      <mesh position={[0, 0.85, 0.4]}>
        <boxGeometry args={[0.6, 0.12, 0.15]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      {/* Front & Rear Wheels */}
      <mesh position={[0, 0.16, 0.45]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.12, 10]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.16, -0.45]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.12, 10]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Street Vendor Fruit / Coconut Cart with Striped Canopy Umbrella */
export function VendorCart({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Wooden Handcart Table */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[1.2, 0.25, 2.0]} />
        <meshStandardMaterial color="#854d0e" roughness={0.85} />
      </mesh>
      {/* Cart Wheels */}
      <mesh position={[-0.65, 0.4, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh position={[0.65, 0.4, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      {/* Coconut / Fruit Stacks */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.9, 0.2, 1.6]} />
        <meshStandardMaterial color="#65a30d" roughness={0.7} />
      </mesh>
      {/* Umbrella Pole */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      {/* Striped Market Umbrella Canopy */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[1.6, 0.7, 10]} />
        <meshStandardMaterial color="#e11d48" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Rooftop Tata Play / Airtel Style Parabolic Satellite Dish Antenna */
export function SatelliteDish({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Base Mounting Pole */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Dish Parabolic Bowl */}
      <mesh position={[0, 0.75, 0]} rotation-x={MathUtils.degToRad(-35)} castShadow>
        <coneGeometry args={[0.45, 0.15, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* LNB Feedhorn Arm */}
      <mesh position={[0, 0.9, 0.28]} rotation-x={MathUtils.degToRad(-35)}>
        <cylinderGeometry args={[0.015, 0.015, 0.35, 6]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  )
}

/** Exterior Wall-Mounted Split AC Outdoor Compressor Unit */
export function AcCompressorUnit({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Metal Compressor Box */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.55, 0.35]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Black Fan Grille */}
      <mesh position={[0.15, 0, 0.18]}>
        <circleGeometry args={[0.18, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  )
}

/** Plot Perimeter Compound Wall with Pillars & Iron Gate */
export function CompoundWall({
  width,
  depth,
  position,
}: {
  width: number
  depth: number
  position: [number, number, number]
}) {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  const wallHeight = 1.4
  const wallThickness = 0.25
  const gateOpening = 3.6

  return (
    <group position={position}>
      {/* Back Wall (North) */}
      <mesh position={[0, wallHeight / 2, -depth / 2]} receiveShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Left Wall (West) */}
      <mesh position={[-width / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Right Wall (East) */}
      <mesh position={[width / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Front Wall with Gate Opening (South) */}
      {/* Left segment */}
      <mesh position={[-(width / 2 + gateOpening / 2) / 2, wallHeight / 2, depth / 2]} receiveShadow>
        <boxGeometry args={[(width - gateOpening) / 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      {/* Right segment */}
      <mesh position={[(width / 2 + gateOpening / 2) / 2, wallHeight / 2, depth / 2]} receiveShadow>
        <boxGeometry args={[(width - gateOpening) / 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Gate Entry Pillars */}
      <mesh position={[-gateOpening / 2, wallHeight * 0.55, depth / 2]} castShadow>
        <boxGeometry args={[0.5, wallHeight + 0.2, 0.5]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>
      <mesh position={[gateOpening / 2, wallHeight * 0.55, depth / 2]} castShadow>
        <boxGeometry args={[0.5, wallHeight + 0.2, 0.5]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* Wrought Iron Gate (Open Position) */}
      <mesh position={[-gateOpening / 2 + 0.8, wallHeight * 0.45, depth / 2 + 0.4]} rotation-y={MathUtils.degToRad(35)}>
        <boxGeometry args={[1.5, 1.1, 0.05]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Locality-Wide Props Manager: Placed across streets and junctions */
export function IndianStreetProps() {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  if (undergroundVisible) return null

  return (
    <group name="indian-street-props">
      {/* Auto-Rickshaws cruising on roads and parked at intersections */}
      <AutoRickshaw position={[-60, 0, -135]} rotationY={Math.PI / 2} />
      <AutoRickshaw position={[40, 0, -135]} rotationY={-Math.PI / 2} />
      <AutoRickshaw position={[-80, 0, 0]} rotationY={0} />
      <AutoRickshaw position={[-10, 0, -80]} rotationY={Math.PI} />
      <AutoRickshaw position={[15, 0, 32]} rotationY={Math.PI / 2} />
      <AutoRickshaw position={[-45, 0, 105]} rotationY={Math.PI / 2} />
      <AutoRickshaw position={[65, 0, 105]} rotationY={-Math.PI / 2} />

      {/* Parked Scooters in house & apartment verges */}
      <Scooter position={[-112, 0, 80]} rotationY={MathUtils.degToRad(25)} color="#dc2626" />
      <Scooter position={[-68, 0, 80]} rotationY={MathUtils.degToRad(-15)} color="#2563eb" />
      <Scooter position={[-22, 0, 80]} rotationY={MathUtils.degToRad(10)} color="#16a34a" />
      <Scooter position={[22, 0, 80]} rotationY={MathUtils.degToRad(-30)} color="#eab308" />

      {/* Street Vendor Fruit / Coconut Carts near Metro & School */}
      <VendorCart position={[-45, 0, 94]} rotationY={MathUtils.degToRad(15)} />
      <VendorCart position={[105, 0, 125]} rotationY={MathUtils.degToRad(-45)} />
      <VendorCart position={[-12, 0, -42]} rotationY={MathUtils.degToRad(80)} />
    </group>
  )
}
