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
import { Vector3 } from 'three'
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

  useEffect(() => {
    if (cameraTarget) {
      targetVec.current.set(...cameraTarget)
      if (cameraPosition) posVec.current.set(...cameraPosition)
      isAnimating.current = true
    }
  }, [cameraTarget, cameraPosition, cameraKey])

  // Cancel fly-to when user starts any manual interaction
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const cancel = () => { isAnimating.current = false }
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
      if (!isPanTrigger(e)) return
      e.preventDefault()

      // ── Fix #2: capture the pointer so pointermove keeps firing even when
      //    the cursor leaves the canvas rect mid-gesture (fast swipe scenario).
      canvas.setPointerCapture(e.pointerId)

      isPanningRef.current = true
      setIsPanning(true)
      lastPtrRef.current = { x: e.clientX, y: e.clientY }
      velocityRef.current.set(0, 0, 0)
      isAnimating.current = false                          // abort any fly-to
      if (controlsRef.current) controlsRef.current.enabled = false
      canvas.style.cursor = 'grab'                        // open-hand on mousedown
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isPanningRef.current) return
      canvas.style.cursor = 'grabbing'                    // closed-hand while dragging

      const dx = e.clientX - lastPtrRef.current.x
      const dy = e.clientY - lastPtrRef.current.y
      lastPtrRef.current = { x: e.clientX, y: e.clientY }

      // Scale pan speed by camera elevation above the ground plane so that
      // zoomed-out views move faster (more world per pixel) and zoomed-in
      // views feel precise — identical to Blender's dolly-relative pan scaling.
      const cameraHeight = Math.max(1, camera.position.y)
      const viewportH    = Math.max(1, canvas.clientHeight)
      const speedScale   = cameraHeight / viewportH

      // Decompose screen motion into world-space axes on the camera's local XZ plane.
      // We never rotate or tilt the camera — this is pure translation.
      const camRight = new Vector3()
      const camForward = new Vector3()
      camera.getWorldDirection(camForward)
      camRight.crossVectors(camForward, camera.up).normalize()

      // Project camera "up" onto the world XZ plane for the vertical pan axis
      // so the movement stays on the ground surface regardless of pitch angle.
      const screenUp = camera.up.clone().projectOnPlane(new Vector3(0, 1, 0))
      if (screenUp.lengthSq() < 0.001) screenUp.set(0, 0, -1) // degenerate top-down guard

      const delta = new Vector3()
        .addScaledVector(camRight,  -dx * speedScale)   // left/right
        .addScaledVector(screenUp,   dy * speedScale)   // up/down (inverted Y)

      // Store as the current-frame velocity for the inertia system
      velocityRef.current.copy(delta)

      // Apply delta immediately, then clamp target to scene extents
      const controls = controlsRef.current
      if (!controls) return

      const newTarget = controls.target.clone().add(delta)
      const bounds = getSceneBounds()
      if (bounds) {
        newTarget.x = Math.max(bounds.minX, Math.min(bounds.maxX, newTarget.x))
        newTarget.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, newTarget.z))
      }
      const actualDelta = newTarget.clone().sub(controls.target)
      controls.target.add(actualDelta)
      camera.position.add(actualDelta)
      controls.update()
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!isPanningRef.current) return
      // ── Fix #2 counterpart: release the capture so normal pointer routing resumes
      canvas.releasePointerCapture(e.pointerId)
      isPanningRef.current = false
      setIsPanning(false)
      if (controlsRef.current) controlsRef.current.enabled = true
      // Restore cursor: grab if Space is still held, otherwise default
      canvas.style.cursor = spaceDownRef.current ? 'grab' : ''
    }

    // Suppress browser context menu that fires on MMB release in some browsers
    const onContextMenu = (e: MouseEvent) => {
      if (spaceDownRef.current || e.button === 1) e.preventDefault()
    }

    // Keyboard listeners go on the document (Space has no focus requirement)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup',   onKeyUp)
    canvas.addEventListener('pointerdown',  onPointerDown)
    canvas.addEventListener('pointermove',  onPointerMove)
    canvas.addEventListener('pointerup',    onPointerUp)
    canvas.addEventListener('contextmenu',  onContextMenu)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup',   onKeyUp)
      canvas.removeEventListener('pointerdown',  onPointerDown)
      canvas.removeEventListener('pointermove',  onPointerMove)
      canvas.removeEventListener('pointerup',    onPointerUp)
      canvas.removeEventListener('contextmenu',  onContextMenu)
      // Always restore cursor and controls on unmount
      canvas.style.cursor = ''
      if (controlsRef.current) controlsRef.current.enabled = true
    }
  }, [camera, gl, controlsRef, setIsPanning])

  // ─── Per-frame: fly-to animation + pan inertia ────────────────────────────
  useFrame((_, delta) => {
    const controls = controlsRef.current

    // 1. Fly-to animation (programmatic camera moves)
    if (isAnimating.current && controls) {
      const damping = Math.min(1, delta * 4.5)
      camera.position.lerp(posVec.current, damping)
      controls.target.lerp(targetVec.current, damping)
      controls.update()

      if (
        camera.position.distanceTo(posVec.current) < 0.25 &&
        controls.target.distanceTo(targetVec.current) < 0.1
      ) {
        camera.position.copy(posVec.current)
        controls.target.copy(targetVec.current)
        controls.update()
        isAnimating.current = false
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
