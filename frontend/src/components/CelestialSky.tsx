import { useEffect, useMemo, useRef } from 'react'
import { Sky, Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useLocalityStore } from '../store/localityStore'

/* ── Monsoon Rain Particle System ─────────────────────────────────────────── */
function MonsoonRain({ active }: { active: boolean }) {
  const count = 3000
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2000
      pos[i * 3 + 1] = Math.random() * 450
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2000
      vel[i] = 220 + Math.random() * 140
    }
    return [pos, vel]
  }, [count])

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const array = posAttr.array as Float32Array
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= velocities[i] * delta
      // Reset drop to clouds altitude when it hits ground
      if (array[i * 3 + 1] < 0) {
        array[i * 3 + 1] = 400 + Math.random() * 80
      }
    }
    posAttr.needsUpdate = true
  })

  if (!active) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#7dd3fc"
        size={1.6}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ── Drifting Procedural Clouds Layer ─────────────────────────────────────── */
function DriftingClouds({
  weatherMode,
  sunFactor,
  nightFactor,
}: {
  weatherMode: 'clear' | 'clouds' | 'monsoon'
  sunFactor: number
  nightFactor: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  // Cloud tint transitions: white during day, coral at sunset, dark indigo-silver at night
  const cloudColor = useMemo(() => {
    if (nightFactor > 0.5) {
      return new THREE.Color('#334155').lerp(new THREE.Color('#1e293b'), nightFactor)
    }
    if (sunFactor < 0.35) {
      return new THREE.Color('#fdba74') // sunset golden peach
    }
    return new THREE.Color('#ffffff')
  }, [sunFactor, nightFactor])

  // Generate 18 soft cloud puffs across a 3km span
  const cloudPuffs = useMemo(() => {
    const puffs = []
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2
      const radius = 300 + (i % 5) * 160
      puffs.push({
        id: i,
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: 420 + (i % 4) * 35,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
        scaleX: 180 + Math.random() * 140,
        scaleY: 35 + Math.random() * 25,
        scaleZ: 140 + Math.random() * 110,
      })
    }
    return puffs
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // Slow, realistic cloud drift along wind direction (X axis)
    const driftSpeed = weatherMode === 'monsoon' ? 24 : 10
    groupRef.current.position.x += delta * driftSpeed
    if (groupRef.current.position.x > 1800) {
      groupRef.current.position.x = -1800
    }
  })

  if (weatherMode === 'clear') return null

  return (
    <group ref={groupRef}>
      {cloudPuffs.map((puff) => (
        <mesh key={puff.id} position={[puff.x, puff.y, puff.z]}>
          <boxGeometry args={[puff.scaleX, puff.scaleY, puff.scaleZ]} />
          <meshStandardMaterial
            color={cloudColor}
            transparent
            opacity={weatherMode === 'monsoon' ? 0.65 : 0.38}
            roughness={0.9}
            metalness={0.05}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ── 3D Glowing Moon Sphere ───────────────────────────────────────────────── */
function MoonMesh({ position, visible }: { position: [number, number, number]; visible: boolean }) {
  if (!visible) return null

  return (
    <group position={position}>
      {/* Moon solid core */}
      <mesh>
        <sphereGeometry args={[42, 32, 32]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
      {/* Soft atmospheric lunar corona glow */}
      <mesh>
        <sphereGeometry args={[65, 24, 24]} />
        <meshBasicMaterial
          color="#93c5fd"
          transparent
          opacity={0.22}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Wide moonlight halo */}
      <mesh>
        <sphereGeometry args={[110, 16, 16]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ── Main Celestial Sky & Lighting System ─────────────────────────────────── */
export function CelestialSky() {
  const timeOfDay = useLocalityStore((s) => s.timeOfDay)
  const isRealTime = useLocalityStore((s) => s.isRealTime)
  const setTimeOfDay = useLocalityStore((s) => s.setTimeOfDay)
  const weatherMode = useLocalityStore((s) => s.weatherMode)
  const undergroundVisible = useLocalityStore((s) => s.undergroundVisible)

  // Real-time synchronization loop: updates clock every 5 seconds if real-time is locked
  useEffect(() => {
    if (!isRealTime) return
    const syncTime = () => {
      const d = new Date()
      const t = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
      useLocalityStore.setState({ timeOfDay: t })
    }
    syncTime()
    const interval = window.setInterval(syncTime, 5000)
    return () => clearInterval(interval)
  }, [isRealTime, setTimeOfDay])

  // Celestial Calculations (Orbital Trajectories)
  const {
    sunPosition,
    moonPosition,
    isNight,
    isTwilight,
    sunFactor,
    nightFactor,
    ambientIntensity,
    ambientColor,
    sunIntensity,
    sunColor,
    moonIntensity,
    hemiSkyColor,
    hemiGroundColor,
  } = useMemo(() => {
    // Solar trajectory: Sunrise ~06:00, Noon 12:00, Sunset ~18:30
    const sunAngle = ((timeOfDay - 6) / 12) * Math.PI
    const isSunUp = timeOfDay >= 5.5 && timeOfDay <= 18.5

    // Sun coords in scene
    const sunDist = 1800
    const sunHeight = Math.sin(sunAngle) * 950
    const sunX = Math.cos(sunAngle) * sunDist
    const sunZ = Math.sin(sunAngle * 0.4) * 500

    // Moon trajectory: Opposite sun (peaks around 00:00 midnight)
    const moonTime = timeOfDay >= 18 ? timeOfDay - 18 : timeOfDay + 6
    const moonAngle = (moonTime / 12) * Math.PI
    const moonDist = 1600
    const moonHeight = Math.sin(moonAngle) * 850 + 80
    const moonX = -Math.cos(moonAngle) * moonDist
    const moonZ = -Math.sin(moonAngle * 0.4) * 450

    // Night & twilight status
    const night = timeOfDay < 5.4 || timeOfDay > 18.8
    const twilight = (timeOfDay >= 5.4 && timeOfDay < 6.5) || (timeOfDay >= 17.8 && timeOfDay <= 18.8)

    // Continuous factors [0..1]
    const sFactor = isSunUp ? Math.max(0, Math.sin(sunAngle)) : 0
    const nFactor = night ? 1.0 : twilight ? 0.5 : 0.0

    // Dynamic light intensities and colors
    let ambIntensity = 0.85
    let ambColor = '#ffffff'
    let sIntensity = 0
    let sColor = '#ffffff'
    let mIntensity = 0
    let hSky = '#ffffff'
    let hGround = '#94a3b8'

    if (night) {
      ambIntensity = 0.38
      ambColor = '#1e293b'
      mIntensity = 0.75
      hSky = '#1e1b4b'
      hGround = '#090d16'
    } else if (twilight) {
      // Golden hour / sunset
      ambIntensity = 0.65
      ambColor = '#fed7aa'
      sIntensity = 1.1
      sColor = '#fb923c'
      mIntensity = 0.3
      hSky = '#c084fc'
      hGround = '#334155'
    } else {
      // Bright daylight
      ambIntensity = 0.85
      ambColor = '#ffffff'
      sIntensity = 2.0 * Math.max(0.4, sFactor)
      sColor = sFactor > 0.5 ? '#fffbeb' : '#fed7aa'
      mIntensity = 0
      hSky = '#38bdf8'
      hGround = '#94a3b8'
    }

    return {
      sunPosition: [sunX, isSunUp ? Math.max(20, sunHeight) : -400, sunZ] as [number, number, number],
      moonPosition: [moonX, Math.max(80, moonHeight), moonZ] as [number, number, number],
      isNight: night,
      isTwilight: twilight,
      sunFactor: sFactor,
      nightFactor: nFactor,
      ambientIntensity: ambIntensity,
      ambientColor: ambColor,
      sunIntensity: sIntensity,
      sunColor: sColor,
      moonIntensity: mIntensity,
      hemiSkyColor: hSky,
      hemiGroundColor: hGround,
    }
  }, [timeOfDay])

  if (undergroundVisible) return null

  return (
    <>
      {/* Atmospheric Sky Shader */}
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        inclination={0.52}
        azimuth={0.25}
        turbidity={isTwilight ? 8 : 2}
        rayleigh={isTwilight ? 3.5 : isNight ? 0.5 : 1.2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Realistic Starfield in night sky */}
      {(isNight || isTwilight) && (
        <Stars
          radius={1900}
          depth={250}
          count={5500}
          factor={6}
          saturation={0.3}
          fade
          speed={1.2}
        />
      )}

      {/* Glowing 3D Moon Mesh */}
      <MoonMesh position={moonPosition} visible={isNight || isTwilight} />

      {/* Drifting Procedural Clouds */}
      <DriftingClouds
        weatherMode={weatherMode}
        sunFactor={sunFactor}
        nightFactor={nightFactor}
      />

      {/* Monsoon Rain Weather simulation */}
      <MonsoonRain active={weatherMode === 'monsoon'} />

      {/* ── Dynamic Synchronized Lighting ─────────────────────────────────── */}
      <ambientLight intensity={ambientIntensity} color={ambientColor} />

      <hemisphereLight
        color={hemiSkyColor}
        groundColor={hemiGroundColor}
        intensity={0.65}
      />

      {/* Daytime Sun Light */}
      {sunIntensity > 0 && (
        <directionalLight
          position={sunPosition}
          intensity={sunIntensity}
          color={sunColor}
        />
      )}

      {/* Night-time Moonlight */}
      {moonIntensity > 0 && (
        <directionalLight
          position={moonPosition}
          intensity={moonIntensity}
          color="#bae6fd"
        />
      )}
    </>
  )
}
