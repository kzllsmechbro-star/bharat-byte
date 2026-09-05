import axios, { type AxiosError } from 'axios'

import type { Building, Floor, Parcel, SearchResponse, UndergroundInfra, Unit, UnitDetail } from '../types/spatial'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api',
  timeout: 10_000,
})

export class ApiError extends Error {
  readonly status: number | undefined
  readonly detail: unknown

  constructor(
    message: string,
    status?: number,
    detail?: unknown,
  ) {
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
    return new ApiError(typeof detail === 'string' ? detail : axiosError.message || 'The API request failed.', axiosError.response?.status, detail)
  }
  return new ApiError(error instanceof Error ? error.message : 'An unexpected API error occurred.')
}

async function request<T>(operation: () => Promise<{ data: T }>): Promise<T> {
  try { return (await operation()).data } catch (error) { throw toApiError(error) }
}

export const getParcels = (): Promise<Parcel[]> => request(() => api.get<Parcel[]>('/parcels'))
export const getBuildings = (limit: number = 1500): Promise<Building[]> => request(() => api.get<Building[]>('/buildings', { params: { limit } }))
export const getBuilding = (buildingId: string): Promise<Building> => request(() => api.get<Building>(`/buildings/${buildingId}`))
export const getBuildingLookup = (x: number, y: number): Promise<Building> => request(() => api.get<Building>('/buildings/lookup', { params: { x, y } }))
export const getBuildingFloors = (buildingId: string): Promise<Floor[]> => request(() => api.get<Floor[]>(`/buildings/${buildingId}/floors`))
export const getFloorUnits = (floorId: string): Promise<Unit[]> => request(() => api.get<Unit[]>(`/floors/${floorId}/units`))
export const getUnit = (unitId: string): Promise<UnitDetail> => request(() => api.get<UnitDetail>(`/units/${unitId}`))
export const getUndergroundInfra = (): Promise<UndergroundInfra[]> => request(() => api.get<UndergroundInfra[]>('/underground'))
export const searchUlpIn = (ulpin: string): Promise<SearchResponse> => request(() => api.get<SearchResponse>('/search', { params: { ulpin } }))
