/**
 * Spatial coordinate conversion between Blender/GeoJSON locality coordinates
 * (X East, Y North, Z Up) and Three.js world space (X East, Y Up, Z South = -Y).
 * The city model center (0, 0) is the Three.js scene origin.
 */

export interface LocalPoint {
  x: number
  y: number
}

export interface ScenePoint {
  x: number
  y: number
  z: number
}

/**
 * Maps a 2D locality point (x: East, y: North) in Blender coordinates to Three.js scene space.
 * In glTF right-handed Y-up space: Three.js X = Blender X, Three.js Y = elevation, Three.js Z = -Blender Y.
 */
export function localXYToScene({ x, y }: LocalPoint, elevation = 0): ScenePoint {
  return { x, y: elevation, z: -y }
}
