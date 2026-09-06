import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useLocalityStore } from '../store/localityStore'

export function ModularCityModel() {
  const { scene } = useGLTF('/modular_city_environment.glb')
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  const selectBuildingAtPoint = useLocalityStore((state) => state.selectBuildingAtPoint)

  useEffect(() => {
    scene.visible = !undergroundVisible

    // Ensure all materials are fully opaque and use depth writing for maximum performance
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((mat) => {
            mat.transparent = false
            mat.opacity = 1.0
            mat.depthWrite = true
          })
        }
      }
    })
  }, [scene, undergroundVisible])

  if (undergroundVisible) return null

  return (
    <primitive
      object={scene}
      position={[0, 0, 0]}
      scale={[1, 1, 1]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        const pt = event.point
        void selectBuildingAtPoint(pt.x, pt.z)
      }}
      onPointerOver={() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas) canvas.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas && !useLocalityStore.getState().isPanning) canvas.style.cursor = ''
      }}
    />
  )
}

useGLTF.preload('/modular_city_environment.glb')
