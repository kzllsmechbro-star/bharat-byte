import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { useLocalityStore } from '../store/localityStore'

export function CameraController({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const cameraTarget = useLocalityStore((state) => state.cameraTarget)
  const cameraPosition = useLocalityStore((state) => state.cameraPosition)
  const cameraKey = useLocalityStore((state) => state.cameraKey)

  const targetVec = useRef(new Vector3(0, 0, 0))
  const posVec = useRef(new Vector3(245, 220, 245))
  const isAnimating = useRef(false)

  useEffect(() => {
    if (cameraTarget) {
      targetVec.current.set(...cameraTarget)
      if (cameraPosition) {
        posVec.current.set(...cameraPosition)
      }
      isAnimating.current = true
    }
  }, [cameraTarget, cameraPosition, cameraKey])

  useFrame((_, delta) => {
    if (!isAnimating.current || !controlsRef.current) return

    const damping = Math.min(1, delta * 4.5)
    camera.position.lerp(posVec.current, damping)
    controlsRef.current.target.lerp(targetVec.current, damping)
    controlsRef.current.update()

    const distPos = camera.position.distanceTo(posVec.current)
    const distTarget = controlsRef.current.target.distanceTo(targetVec.current)

    if (distPos < 0.25 && distTarget < 0.1) {
      camera.position.copy(posVec.current)
      controlsRef.current.target.copy(targetVec.current)
      controlsRef.current.update()
      isAnimating.current = false
    }
  })

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const handleUserInteraction = () => {
      isAnimating.current = false
    }

    controls.addEventListener('start', handleUserInteraction)
    return () => {
      controls.removeEventListener('start', handleUserInteraction)
    }
  }, [controlsRef])

  return null
}
