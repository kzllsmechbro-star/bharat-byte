/**
 * Pan trigger scheme — why MMB?
 * ─────────────────────────────
 * Blender's default keymap binds camera pan to Shift + Middle-Mouse-Button (MMB).
 * 3D viewport users muscle-memorise this gesture, so mirroring it here removes
 * the learning curve for the GIS/planning team who switch between Blender and
 * this viewer. Space + Left-Mouse-Button is provided as a trackpad fallback for
 * laptops that lack a physical scroll wheel / middle button.
 *
 * Cursor states mirror Blender exactly:
 *   • Space held (before drag) or MMB down → open hand  (grab)
 *   • Active drag                           → closed hand (grabbing)
 *   • Released                              → restored to default
 *
 * Cursor is set on the WebGL canvas element (gl.domElement) — never on document.body —
 * so the grab icon stays confined to the 3D viewport and doesn't bleed onto the HUD panels.
 */

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { useLocalityStore } from '../store/localityStore'

/**
 * How far past the outermost building extents the user can pan, in Three.js world units.
 * At this city scale 1 Three.js unit ≈ 1 metre (matching the Blender export convention
 * used by city_buildings_catalog.json).  30 units = ~30 m of comfortable margin so
 * edge buildings stay fully visible without letting the camera drift into empty void.
 * Update this constant if the locality mesh scale changes (e.g. when the real RR Nagar
 * KML replaces the synthetic catalog).
 */
const PAN_BOUNDS_MARGIN_SCENE_UNITS = 30

/** Inertia decay rate — intentionally identical to OrbitControls.dampingFactor (0.08)
 *  so released-pan glide feels consistent with orbit / zoom release behaviour. */
const PAN_DAMPING = 0.08

/**
 * Reads the current building list from the store and returns axis-aligned scene-space
 * bounds with a padding margin applied.  Defined at module scope (not inside the React
 * component) so it can be called safely from both a useEffect handler and useFrame
 * without any stale-closure risk — it always calls .getState() on the live store.
 * Returns null when no building bounds data has loaded yet.
 */
function getSceneBounds() {
  const buildings = useLocalityStore.getState().buildings
  if (buildings.length === 0) return null
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const b of buildings) {
    if (!b.bounds) continue
    // b.bounds = [minBlenderX, maxBlenderX, minBlenderY, maxBlenderY]
    // Three.js Z = -Blender Y  →  minZ_scene = -maxBlenderY, maxZ_scene = -minBlenderY
    minX = Math.min(minX, b.bounds[0])
    maxX = Math.max(maxX, b.bounds[1])
    minZ = Math.min(minZ, -b.bounds[3])
    maxZ = Math.max(maxZ, -b.bounds[2])
  }
  if (!isFinite(minX)) return null
  return {
    minX: minX - PAN_BOUNDS_MARGIN_SCENE_UNITS,
    maxX: maxX + PAN_BOUNDS_MARGIN_SCENE_UNITS,
    minZ: minZ - PAN_BOUNDS_MARGIN_SCENE_UNITS,
    maxZ: maxZ + PAN_BOUNDS_MARGIN_SCENE_UNITS,
  }
}

export function CameraController({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera, gl } = useThree()
  const cameraTarget   = useLocalityStore((s) => s.cameraTarget)
  const cameraPosition = useLocalityStore((s) => s.cameraPosition)
  const cameraKey      = useLocalityStore((s) => s.cameraKey)
  const setIsPanning   = useLocalityStore((s) => s.setIsPanning)

  // ─── Fly-to animation state ───────────────────────────────────────────────
  const targetVec    = useRef(new Vector3(0, 0, 0))
  const posVec       = useRef(new Vector3(245, 220, 245))
  const isAnimating  = useRef(false)
  const animationTime = useRef(0)

  useEffect(() => {
    if (cameraTarget) {
      targetVec.current.set(...cameraTarget)
      if (cameraPosition) {
        const dx = camera.position.x - cameraTarget[0]
        const dz = camera.position.z - cameraTarget[2]
        const curDistXZ = Math.hypot(dx, dz)
        const desiredDistXZ = Math.hypot(cameraPosition[0] - cameraTarget[0], cameraPosition[2] - cameraTarget[2])

        // If focusing on a building (near distance up to 900m for skyscrapers), preserve the user's current azimuth!
        // This glides the camera straight towards the building along the user's current line of sight
        if (curDistXZ > 0.5 && desiredDistXZ > 1.0 && desiredDistXZ < 900.0) {
          const dirX = dx / curDistXZ
          const dirZ = dz / curDistXZ
          posVec.current.set(
            cameraTarget[0] + dirX * desiredDistXZ,
            cameraPosition[1],
            cameraTarget[2] + dirZ * desiredDistXZ,
          )
        } else {
          posVec.current.set(...cameraPosition)
        }
      }
      isAnimating.current = true
      animationTime.current = 0
    }
  }, [cameraTarget, cameraPosition, cameraKey, camera])

  // Cancel fly-to when user starts any manual interaction
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const cancel = () => {
      isAnimating.current = false
      animationTime.current = 0
    }
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controlsRef])

  // ─── Pan state ────────────────────────────────────────────────────────────
  const isPanningRef   = useRef(false)
  const spaceDownRef   = useRef(false)
  const velocityRef    = useRef(new Vector3())   // world-space pan velocity (per frame)
  const lastPtrRef     = useRef({ x: 0, y: 0 })

  // ─── Attach pan pointer / keyboard listeners to the WebGL canvas ──────────
  useEffect(() => {
    const canvas = gl.domElement   // The actual <canvas> element — NOT document.body

    const isPanTrigger = (e: PointerEvent) =>
      e.button === 1 || (e.button === 0 && spaceDownRef.current)

    // User gesture cancels programmatic fly-to animation immediately
    const onUserInteraction = () => {
      isAnimating.current = false
      animationTime.current = 0
    }

    // Space key: show grab cursor before the drag even starts (matches Blender UX)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spaceDownRef.current = true
        if (!isPanningRef.current) canvas.style.cursor = 'grab'
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDownRef.current = false
        if (!isPanningRef.current) canvas.style.cursor = ''
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      onUserInteraction()
      if (!isPanTrigger(e)) return
      e.preventDefault()

      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        // ignore capture errors
      }

      isPanningRef.current = true
      setIsPanning(true)
      lastPtrRef.current = { x: e.clientX, y: e.clientY }
      velocityRef.current.set(0, 0, 0)
      if (controlsRef.current) controlsRef.current.enabled = false
      canvas.style.cursor = 'grab'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isPanningRef.current) return
      canvas.style.cursor = 'grabbing'

      const dx = e.clientX - lastPtrRef.current.x
      const dy = e.clientY - lastPtrRef.current.y
      lastPtrRef.current = { x: e.clientX, y: e.clientY }

      const controls = controlsRef.current
      if (!controls) return

      const dist = Math.max(5, camera.position.distanceTo(controls.target))
      const fovRad = ((camera as PerspectiveCamera).fov || 46) * (Math.PI / 180)
      const speedScale = (2 * dist * Math.tan(fovRad / 2)) / Math.max(1, canvas.clientHeight)

      const camRight = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize()
      const camUp = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize()

      const delta = new Vector3()
        .addScaledVector(camRight, -dx * speedScale)
        .addScaledVector(camUp,     dy * speedScale)

      velocityRef.current.copy(delta)

      const newTarget = controls.target.clone().add(delta)
      const bounds = getSceneBounds()
      if (bounds) {
        newTarget.x = Math.max(bounds.minX, Math.min(bounds.maxX, newTarget.x))
        newTarget.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, newTarget.z))
        newTarget.y = Math.max(0.5, Math.min(400, newTarget.y))
      }
      const actualDelta = newTarget.clone().sub(controls.target)
      controls.target.add(actualDelta)
      camera.position.add(actualDelta)
      controls.update()
    }

    const onPointerUp = (e?: PointerEvent) => {
      if (e && canvas.hasPointerCapture(e.pointerId)) {
        try { canvas.releasePointerCapture(e.pointerId) } catch {}
      }
      isPanningRef.current = false
      setIsPanning(false)
      if (controlsRef.current) controlsRef.current.enabled = true
      canvas.style.cursor = spaceDownRef.current ? 'grab' : ''
    }

    const onWindowBlur = () => {
      spaceDownRef.current = false
      isPanningRef.current = false
      setIsPanning(false)
      if (controlsRef.current) controlsRef.current.enabled = true
      canvas.style.cursor = ''
    }

    const onContextMenu = (e: MouseEvent) => {
      if (spaceDownRef.current || e.button === 1) e.preventDefault()
    }

    const onWheel = (e: WheelEvent) => {
      onUserInteraction()
      if (e.shiftKey) {
        e.preventDefault()
        const controls = controlsRef.current
        if (!controls) return

        const dist = Math.max(5, camera.position.distanceTo(controls.target))
        const fovRad = ((camera as PerspectiveCamera).fov || 46) * (Math.PI / 180)
        const wheelScale = ((2 * dist * Math.tan(fovRad / 2)) / Math.max(1, canvas.clientHeight)) * 0.85

        const camUp = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize()
        const delta = camUp.clone().multiplyScalar(-e.deltaY * wheelScale)

        const newTarget = controls.target.clone().add(delta)
        const bounds = getSceneBounds()
        if (bounds) {
          newTarget.x = Math.max(bounds.minX, Math.min(bounds.maxX, newTarget.x))
          newTarget.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, newTarget.z))
          newTarget.y = Math.max(0.5, Math.min(400, newTarget.y))
        }
        const actualDelta = newTarget.clone().sub(controls.target)
        controls.target.add(actualDelta)
        camera.position.add(actualDelta)
        controls.update()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup',   onKeyUp)
    canvas.addEventListener('pointerdown',  onPointerDown)
    canvas.addEventListener('pointermove',  onPointerMove)
    canvas.addEventListener('pointerup',    onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('contextmenu',  onContextMenu)
    canvas.addEventListener('wheel',        onWheel, { passive: false })
    window.addEventListener('blur',         onWindowBlur)
    window.addEventListener('pointerup',    onPointerUp)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup',   onKeyUp)
      canvas.removeEventListener('pointerdown',  onPointerDown)
      canvas.removeEventListener('pointermove',  onPointerMove)
      canvas.removeEventListener('pointerup',    onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('contextmenu',  onContextMenu)
      canvas.removeEventListener('wheel',        onWheel)
      window.removeEventListener('blur',         onWindowBlur)
      window.removeEventListener('pointerup',    onPointerUp)
      canvas.style.cursor = ''
      if (controlsRef.current) controlsRef.current.enabled = true
    }
  }, [camera, gl, controlsRef, setIsPanning])

  // ─── Per-frame: fly-to animation + pan inertia ────────────────────────────
  useFrame((_, delta) => {
    const controls = controlsRef.current

    // 1. Fly-to animation (programmatic camera moves)
    if (isAnimating.current && controls) {
      animationTime.current += delta
      if (animationTime.current > 2.2) {
        // Safety timeout — arrive exactly and finish smoothly
        camera.position.copy(posVec.current)
        controls.target.copy(targetVec.current)
        controls.update()
        isAnimating.current = false
        animationTime.current = 0
      } else {
        const damping = Math.min(1, delta * 5.2)
        camera.position.lerp(posVec.current, damping)
        controls.target.lerp(targetVec.current, damping)
        controls.update()

        const distThreshold = Math.max(0.25, posVec.current.distanceTo(targetVec.current) * 0.003)
        if (
          camera.position.distanceTo(posVec.current) < distThreshold &&
          controls.target.distanceTo(targetVec.current) < 0.2
        ) {
          camera.position.copy(posVec.current)
          controls.target.copy(targetVec.current)
          controls.update()
          isAnimating.current = false
          animationTime.current = 0
        }
      }
    }

    // 2. Pan inertia — glide to stop after pointer release
    //    Only active when NOT actively dragging (isPanningRef = false) and
    //    velocity has meaningful magnitude.
    if (!isPanningRef.current && controls && velocityRef.current.lengthSq() > 0.00001) {
      const bounds = getSceneBounds()

      const newTarget = controls.target.clone().add(velocityRef.current)
      if (bounds) {
        newTarget.x = Math.max(bounds.minX, Math.min(bounds.maxX, newTarget.x))
        newTarget.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, newTarget.z))
        newTarget.y = Math.max(0.5, Math.min(400, newTarget.y))
      }
      const actualDelta = newTarget.clone().sub(controls.target)
      controls.target.add(actualDelta)
      camera.position.add(actualDelta)
      controls.update()

      // Exponential decay — same factor as OrbitControls.dampingFactor for visual consistency
      velocityRef.current.multiplyScalar(1 - PAN_DAMPING)
      if (velocityRef.current.lengthSq() < 0.00001) {
        velocityRef.current.set(0, 0, 0)
      }
    }
  })

  return null
}
