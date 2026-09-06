import { MathUtils } from 'three'
import { useLocalityStore } from '../store/localityStore'

export function SatelliteTerrain() {
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  const clearSelection = useLocalityStore((state) => state.clearSelection)

  return (
    <mesh
      position={[0, -0.2, 0]}
      rotation-x={-MathUtils.degToRad(90)}
      receiveShadow={!undergroundVisible}
      visible={!undergroundVisible}
      onClick={(event) => {
        event.stopPropagation()
        clearSelection()
      }}
    >
      <planeGeometry args={[12000, 12000]} />
      <meshStandardMaterial
        color="#1e293b"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  )

}
