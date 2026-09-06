/** TypeScript contracts mirroring the Phase 4 FastAPI response schemas. */

export interface GeoJsonGeometry {
  type: string
  coordinates: unknown
}

export interface Parcel {
  id: string
  base_ulpin: string
  geometry: GeoJsonGeometry
  state_code: string
  district_code: string
  created_at: string
}

export type BuildingType = 'apartment' | 'house' | 'half_built' | 'school' | 'commercial'

export interface RawCatalogUnit {
  unit_code: string
  full_ulpin: string
  unit_number?: string | null
  unit_type: string
  elevation_meters?: [number, number] | null
  volume_m3?: number | null
  ai_morton_code?: string | null
  spatial_verification_hash?: string | null
}

export interface RawCatalogFloor {
  id?: string
  floor_code: string
  floor_number: number
  height_meters?: number
  units?: RawCatalogUnit[]
}

export interface Building {
  id: string
  parcel_id?: string | null
  base_ulpin: string
  building_code: string
  building_type: string
  structure_category?: string | null
  name?: string | null
  house_no?: string | null
  complex_name?: string | null
  complex_type?: string | null
  stories_count?: number | null
  height_meters?: number | null
  floors_completed?: number | null
  floors_planned?: number | null
  footprint: GeoJsonGeometry
  center?: [number, number] | null
  bounds?: [number, number, number, number] | null
  ai_spatial_hash?: string | null
  postal_address?: string | null
  total_units_count?: number | null
  created_at?: string | null
  floors?: RawCatalogFloor[]
}

export interface Floor {
  id: string
  building_id: string
  floor_code: string
  floor_number: number
  is_underground: boolean
  footprint: GeoJsonGeometry
  height_meters: number
}

export type UnitType = 'residential' | 'commercial' | 'common_area' | string

export interface Unit {
  id: string
  floor_id: string
  unit_code: string
  full_ulpin: string
  unit_number?: string | null
  footprint: GeoJsonGeometry
  unit_type: UnitType
  elevation_meters?: [number, number] | null
  volume_m3?: number | null
  ai_morton_code?: string | null
  spatial_verification_hash?: string | null
}

export interface UlpinBreakdown {
  base_ulpin: string
  building_code: string
  floor_code: string
  unit_code: string
  assembled_ulpin: string
}

export interface UnitDetail extends Unit, UlpinBreakdown {
  building_name?: string | null
  house_no?: string | null
  complex_name?: string | null
  structure_category?: string | null
  stories_count?: number | null
  postal_address?: string | null
}

export type InfraType = 'drainage' | 'metro_tunnel' | 'metro_station'

export interface UndergroundInfra {
  id: string
  parcel_id?: string | null
  base_ulpin: string
  infra_type: InfraType
  path: GeoJsonGeometry
  full_ulpin: string
  depth_meters: number
  /** Three.js scene-coordinate waypoints [x, y, z] — negative y = underground. */
  waypoints?: [number, number, number][]
  diameter_m?: number
  material?: string
  /** Assembled hierarchical ULPIN (only present for metro_station nodes). */
  assembled_ulpin?: string
  segment_name?: string
}

export type SearchRecordType = 'parcel' | 'building' | 'floor' | 'unit'

export interface SearchRecord {
  record_type: SearchRecordType
  id: string
  base_ulpin: string
  building_code: string | null
  floor_code: string | null
  unit_code: string | null
  full_ulpin: string
  name?: string | null
  house_no?: string | null
  geometry: GeoJsonGeometry
}

export interface SearchResponse {
  query: string
  records: SearchRecord[]
}
