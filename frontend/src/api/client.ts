import axios, { type AxiosError } from 'axios'

import type {
  Building,
  Floor,
  GeoJsonGeometry,
  Parcel,
  SearchRecord,
  SearchResponse,
  UndergroundInfra,
  Unit,
  UnitDetail,
} from '../types/spatial'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api',
  timeout: 4000,
})

export class ApiError extends Error {
  readonly status: number | undefined
  readonly detail: unknown

  constructor(message: string, status?: number, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: unknown }>
    const detail = axiosError.response?.data?.detail
    return new ApiError(
      typeof detail === 'string' ? detail : axiosError.message || 'The API request failed.',
      axiosError.response?.status,
      detail,
    )
  }
  return new ApiError(error instanceof Error ? error.message : 'An unexpected API error occurred.')
}

async function request<T>(operation: () => Promise<{ data: T }>): Promise<T> {
  try {
    return (await operation()).data
  } catch (error) {
    throw toApiError(error)
  }
}

// In-memory catalog cache for instant offline / fallback resolution
let catalogCache: Building[] | null = null
let catalogPromise: Promise<Building[]> | null = null

async function getLocalCatalog(): Promise<Building[]> {
  if (catalogCache) return catalogCache
  if (!catalogPromise) {
    catalogPromise = fetch('/city_buildings_catalog.json')
      .then((res) => res.json())
      .then((data: Building[]) => {
        catalogCache = data
        return data
      })
      .catch((err) => {
        catalogPromise = null
        throw err
      })
  }
  return catalogPromise
}

export function subdividePolygon(
  geometry: GeoJsonGeometry,
  unitIndex: number,
  totalUnits: number,
): GeoJsonGeometry {
  if (totalUnits <= 1 || geometry.type !== 'Polygon') return geometry
  const coords = (geometry.coordinates as number[][][])?.[0]
  if (!coords || coords.length < 3) return geometry

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of coords) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  const width = maxX - minX
  const depth = maxY - minY
  const gap = Math.min(0.2, Math.min(width, depth) * 0.04)

  if (width >= depth) {
    const step = width / totalUnits
    const uMinX = minX + unitIndex * step + gap
    const uMaxX = minX + (unitIndex + 1) * step - gap
    const uMinY = minY + gap
    const uMaxY = maxY - gap
    return {
      type: 'Polygon',
      coordinates: [
        [
          [uMinX, uMinY],
          [uMaxX, uMinY],
          [uMaxX, uMaxY],
          [uMinX, uMaxY],
          [uMinX, uMinY],
        ],
      ],
    }
  } else {
    const step = depth / totalUnits
    const uMinX = minX + gap
    const uMaxX = maxX - gap
    const uMinY = minY + unitIndex * step + gap
    const uMaxY = minY + (unitIndex + 1) * step - gap
    return {
      type: 'Polygon',
      coordinates: [
        [
          [uMinX, uMinY],
          [uMaxX, uMinY],
          [uMaxX, uMaxY],
          [uMinX, uMaxY],
          [uMinX, uMinY],
        ],
      ],
    }
  }
}

export const getParcels = (): Promise<Parcel[]> => request(() => api.get<Parcel[]>('/parcels'))

export const getBuildings = async (limit: number = 15000): Promise<Building[]> => {
  try {
    return await request(() => api.get<Building[]>('/buildings', { params: { limit } }))
  } catch {
    const catalog = await getLocalCatalog()
    return catalog  // return full catalog — no slice — every building must be ULPIN-addressable
  }
}

export const getBuilding = async (buildingId: string): Promise<Building> => {
  try {
    return await request(() => api.get<Building>(`/buildings/${buildingId}`))
  } catch {
    const catalog = await getLocalCatalog()
    const match = catalog.find((b) => String(b.id).toLowerCase() === String(buildingId).toLowerCase())
    if (match) return match
    throw new ApiError('Building not found', 404)
  }
}

export const getBuildingLookup = (x: number, y: number): Promise<Building> =>
  request(() => api.get<Building>('/buildings/lookup', { params: { x, y } }))

export const getBuildingFloors = async (buildingId: string): Promise<Floor[]> => {
  try {
    const remoteFloors = await request(() => api.get<Floor[]>(`/buildings/${buildingId}/floors`))
    if (remoteFloors && remoteFloors.length > 0) return remoteFloors
  } catch {
    // Fallback to local catalog
  }

  const catalog = await getLocalCatalog()
  const b = catalog.find((item) => String(item.id).toLowerCase() === String(buildingId).toLowerCase())
  if (!b || !b.floors || b.floors.length === 0) {
    // If no floors array, generate default ground floor
    if (!b) return []
    return [
      {
        id: `${b.id}-F001`,
        building_id: b.id,
        floor_code: 'F001',
        floor_number: 1,
        is_underground: false,
        footprint: b.footprint,
        height_meters: b.height_meters || 3.5,
      },
    ]
  }

  return b.floors.map((f) => ({
    id: `${b.id}-${f.floor_code}`,
    building_id: b.id,
    floor_code: f.floor_code,
    floor_number: f.floor_number,
    is_underground: f.floor_code.startsWith('F-U'),
    footprint: b.footprint,
    height_meters: f.height_meters || 3.5,
  }))
}

export const getFloorUnits = async (floorId: string): Promise<Unit[]> => {
  try {
    const remoteUnits = await request(() => api.get<Unit[]>(`/floors/${floorId}/units`))
    if (remoteUnits && remoteUnits.length > 0) {
      // Ensure subdivided 3D footprints if all units share the exact same building footprint
      const total = remoteUnits.length
      if (total > 1) {
        return remoteUnits.map((u, i) => ({
          ...u,
          footprint: subdividePolygon(u.footprint, i, total),
        }))
      }
      return remoteUnits
    }
  } catch {
    // Fallback to local catalog
  }

  const catalog = await getLocalCatalog()
  for (const b of catalog) {
    for (const f of b.floors || []) {
      const expectedFloorId = `${b.id}-${f.floor_code}`
      if (expectedFloorId === floorId || f.id === floorId) {
        const units = f.units || []
        const total = units.length
        return units.map((u, index) => ({
          ...u,
          id: `${expectedFloorId}-${u.unit_code}`,
          floor_id: expectedFloorId,
          footprint: subdividePolygon(b.footprint, index, total),
        }))
      }
    }
  }

  return []
}

export const getUnit = async (unitId: string): Promise<UnitDetail> => {
  try {
    return await request(() => api.get<UnitDetail>(`/units/${unitId}`))
  } catch {
    // Fallback to local catalog
  }

  const catalog = await getLocalCatalog()
  for (const b of catalog) {
    const floors = b.floors || []
    for (const f of floors) {
      const fId = `${b.id}-${f.floor_code}`
      const units = f.units || []
      for (let i = 0; i < units.length; i++) {
        const u = units[i]
        const uId = `${fId}-${u.unit_code}`
        if (uId === unitId || u.full_ulpin === unitId || u.unit_code === unitId) {
          return {
            ...u,
            id: uId,
            floor_id: fId,
            footprint: subdividePolygon(b.footprint, i, units.length),
            base_ulpin: b.base_ulpin,
            building_code: b.building_code,
            floor_code: f.floor_code,
            assembled_ulpin: u.full_ulpin,
            building_name: b.name,
            house_no: b.house_no,
            complex_name: b.complex_name,
            structure_category: b.structure_category,
            stories_count: b.stories_count || floors.length || 1,
            postal_address: b.postal_address,
          }
        }
      }
    }
  }

  throw new ApiError('Unit not found', 404)
}

export const getUndergroundInfra = async (): Promise<UndergroundInfra[]> => {
  try {
    return await request(() => api.get<UndergroundInfra[]>('/underground'))
  } catch {
    // Backend offline — load static catalog (always present in /public)
    const res = await fetch('/underground_catalog.json')
    return (await res.json()) as UndergroundInfra[]
  }
}

export const searchUlpIn = async (ulpin: string): Promise<SearchResponse> => {
  try {
    return await request(() => api.get<SearchResponse>('/search', { params: { ulpin } }))
  } catch {
    const catalog = await getLocalCatalog()
    const q = ulpin.toLowerCase()
    const records: SearchRecord[] = []

    for (const b of catalog) {
      const bMatches =
        b.base_ulpin.toLowerCase().includes(q) ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.house_no && b.house_no.toLowerCase().includes(q)) ||
        (b.complex_name && b.complex_name.toLowerCase().includes(q))

      if (bMatches) {
        records.push({
          record_type: 'building',
          id: b.id,
          base_ulpin: b.base_ulpin,
          building_code: b.building_code,
          floor_code: null,
          unit_code: null,
          full_ulpin: `${b.base_ulpin}-${b.building_code}`,
          name: b.name,
          house_no: b.house_no,
          geometry: b.footprint,
        })
      }

      for (const f of b.floors || []) {
        for (const u of f.units || []) {
          if (
            u.full_ulpin.toLowerCase().includes(q) ||
            (u.unit_number && u.unit_number.toLowerCase().includes(q))
          ) {
            records.push({
              record_type: 'unit',
              id: `${b.id}-${f.floor_code}-${u.unit_code}`,
              base_ulpin: b.base_ulpin,
              building_code: b.building_code,
              floor_code: f.floor_code,
              unit_code: u.unit_code,
              full_ulpin: u.full_ulpin,
              name: u.unit_number || `Unit ${u.unit_code}`,
              house_no: b.house_no,
              geometry: b.footprint,
            })
          }
        }
      }

      if (records.length >= 25) break
    }

    return { query: ulpin, records }
  }
}
