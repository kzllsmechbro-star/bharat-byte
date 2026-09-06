import { OrbitControls, Sky } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { LocalityBuildings } from '../components/LocalityBuildings'
import { ModularCityModel } from '../components/ModularCityModel'
import { SatelliteTerrain } from '../components/SatelliteTerrain'
import { CameraController } from '../components/CameraController'
import { UndergroundLayer } from '../components/UndergroundLayer'
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

  const bgColor = undergroundVisible ? '#090d16' : '#b9d8e9'

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, undergroundVisible ? 400 : 2500, undergroundVisible ? 2000 : 9500]} />
      {!undergroundVisible && (
        <Sky distance={450000} sunPosition={[120, 180, 80]} inclination={0.55} azimuth={0.25} />
      )}
      <ambientLight intensity={undergroundVisible ? 0.9 : 0.85} />
      <hemisphereLight
        color={undergroundVisible ? '#38bdf8' : '#ffffff'}
        groundColor={undergroundVisible ? '#0284c7' : '#94a3b8'}
        intensity={undergroundVisible ? 0.6 : 0.7}
      />
      <directionalLight
        castShadow={!undergroundVisible}
        intensity={undergroundVisible ? 0.8 : 2.0}
        position={[450, 750, 400]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={2500}
        shadow-camera-left={-1200}
        shadow-camera-right={1200}
        shadow-camera-top={1200}
        shadow-camera-bottom={-1200}
      />
      <SatelliteTerrain />
      <ModularCityModel />
      <LocalityBuildings />
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
      />
      <CameraController controlsRef={controlsRef} />
      <FpsMonitor />
    </>
  )
}

export function LocalityScene() {
  const clearSelection = useLocalityStore((state) => state.clearSelection)
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [550, 420, 550], fov: 46, near: 1, far: 15000 }}
      gl={{ antialias: true }}
      onPointerMissed={clearSelection}
    >
      <SceneContent />
    </Canvas>
  )
}

