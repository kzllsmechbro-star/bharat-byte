import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { LocalityBuildings } from '../components/LocalityBuildings'
import { ModularCityModel } from '../components/ModularCityModel'
import { SatelliteTerrain } from '../components/SatelliteTerrain'
import { CameraController } from '../components/CameraController'
import { UndergroundLayer } from '../components/UndergroundLayer'
import { CelestialSky } from '../components/CelestialSky'
import { useLocalityStore } from '../store/localityStore'

function FpsMonitor() {
  const elapsed = useRef(0)
  const frames = useRef(0)

  useFrame((_, delta) => {
    if (!import.meta.env.DEV) return
    elapsed.current += delta
    frames.current += 1
    if (elapsed.current >= 2) {
      console.info(`[ULPIN 3D] ${Math.round(frames.current / elapsed.current)} FPS`)
      elapsed.current = 0
      frames.current = 0
    }
  })

  return null
}

function SceneContent() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  const timeOfDay = useLocalityStore((state) => state.timeOfDay)

  // Dynamic atmospheric background and horizon fog color
  const bgColor = undergroundVisible
    ? '#090d16'
    : timeOfDay < 5.4 || timeOfDay > 18.8
    ? '#060a17' // Night sky deep navy
    : (timeOfDay >= 5.4 && timeOfDay < 6.5) || (timeOfDay >= 17.8 && timeOfDay <= 18.8)
    ? '#2b1d3a' // Twilight / Sunset rich purple
    : '#b9d8e9' // Clear daytime sky blue

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog
        attach="fog"
        args={[
          bgColor,
          undergroundVisible ? 400 : 2500,
          undergroundVisible ? 2000 : 9500,
        ]}
      />

      {/* Dynamic Celestial System: Real-Time Day/Night, Sun, Moon, Stars, Moving Clouds & Weather */}
      <CelestialSky />

      {/* Static Fallback Lights when Underground Layer is active */}
      {undergroundVisible && (
        <>
          <ambientLight intensity={0.9} color="#38bdf8" />
          <directionalLight intensity={0.9} position={[450, 750, 400]} color="#ffffff" />
        </>
      )}

      {!undergroundVisible && <SatelliteTerrain />}
      {!undergroundVisible && <ModularCityModel />}
      {!undergroundVisible && <LocalityBuildings />}
      <UndergroundLayer />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 0, 0]}
        minDistance={5}
        maxDistance={6000}
        minPolarAngle={MathUtils.degToRad(5)}
        maxPolarAngle={MathUtils.degToRad(88)}
        enableDamping
        dampingFactor={0.08}
        screenSpacePanning={true}
      />
      <CameraController controlsRef={controlsRef} />
      <FpsMonitor />
    </>
  )
}

export function LocalityScene() {
  const clearSelection = useLocalityStore((state) => state.clearSelection)
  const pointerDownPos = useRef({ x: 0, y: 0 })

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [550, 420, 550], fov: 46, near: 1, far: 15000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerDown={(e) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMissed={(e) => {
        const dx = e.clientX - pointerDownPos.current.x
        const dy = e.clientY - pointerDownPos.current.y
        if (Math.hypot(dx, dy) > 10) return // User was orbiting/dragging, keep selection intact!
        if (useLocalityStore.getState().isPanning) return
        if (useLocalityStore.getState().activeDocumentBuilding) return
        if (Date.now() - (useLocalityStore.getState().lastSelectTime || 0) < 400) return
        clearSelection()
      }}
    >
      <SceneContent />
    </Canvas>
  )
}

