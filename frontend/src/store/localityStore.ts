import { create } from 'zustand'

import { ApiError, getBuildingLookup, getBuildings, getUndergroundInfra } from '../api/client'
import type { Building, BuildingType, InfraType, RightTab, UndergroundInfra } from '../types/spatial'
import { getPolygonCenter, getPolygonRing, isPointInPolygon } from '../components/footprint'
import { localXYToScene } from '../utils/coordinates'
import { PROCEDURAL_UNDERGROUND_INFRA } from '../data/proceduralInfra'

export type BuildingTypeVisibility = Record<string, boolean>
export type InfraTypeVisibility = Record<InfraType, boolean>

const DEFAULT_BUILDING_VISIBILITY: BuildingTypeVisibility = {
  apartment: true,
  house: true,
  half_built: true,
  school: true,
  commercial: true,
}

const DEFAULT_INFRA_VISIBILITY: InfraTypeVisibility = {
  drainage: true,
  metro_tunnel: false,
  metro_station: false,
  water: false,
  sewer: false,
  gas: false,
  power: false,
}

export type WeatherMode = 'clear' | 'clouds' | 'monsoon'

const getInitialTime = () => {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
}

interface LocalityState {
  buildings: Building[]
  undergroundInfra: UndergroundInfra[]
  selectedBuildingId: string | null
  hoveredBuildingId: string | null
  selectedFloorId: string | null
  hoveredFloorId: string | null
  selectedUnitId: string | null
  selectedInfra: UndergroundInfra | null
  undergroundVisible: boolean
  visibleInfraTypes: InfraTypeVisibility
  depthSlice: number
  activeRightTab: RightTab | null
  visibleBuildingTypes: BuildingTypeVisibility
  underConstructionMessage: string | null
  isLoading: boolean
  error: string | null
  cameraTarget: [number, number, number] | null
  cameraPosition: [number, number, number] | null
  cameraKey: number
  /** True while a pan drag gesture is active — used to suppress building hover highlights. */
  isPanning: boolean
  lastSelectTime: number

  /* ── Celestial & Environmental Controls ── */
  timeOfDay: number
  isRealTime: boolean
  weatherMode: WeatherMode
  isExplodedView: boolean

  /* ── ULPIN Document Modal ── */
  activeDocumentBuilding: Building | null
  openDocumentModal: (building: Building) => void
  closeDocumentModal: () => void

  loadInitialData: () => Promise<void>
  selectBuilding: (id: string | null, defaultFloorId?: string | null) => void
  setHoveredBuildingId: (id: string | null) => void
  selectFloor: (id: string | null) => void
  setHoveredFloorId: (id: string | null) => void
  selectUnit: (id: string | null, floorId?: string | null) => void
  selectInfra: (infra: UndergroundInfra | null) => void
  clearSelection: () => void
  toggleUnderground: () => void
  toggleInfraType: (type: InfraType) => void
  setAllInfraTypesVisible: (visible: boolean) => void
  setDepthSlice: (depth: number) => void
  setActiveRightTab: (tab: RightTab | null) => void
  toggleBuildingType: (type: BuildingType) => void
  selectBuildingAtPoint: (x: number, z: number) => Promise<Building | null>
  setAllBuildingTypesVisible: (visible: boolean) => void
  selectUnderConstruction: (buildingId: string, floorNumber: number) => void
  flyToBuilding: (building: Building) => void
  flyToTarget: (target: [number, number, number], position?: [number, number, number]) => void
  resetCamera: () => void
  setIsPanning: (panning: boolean) => void

  setTimeOfDay: (time: number) => void
  toggleRealTime: () => void
  setWeatherMode: (mode: WeatherMode) => void
  toggleExplodedView: () => void
}

export const useLocalityStore = create<LocalityState>((set, get) => ({
  buildings: [],
  undergroundInfra: [],
  selectedBuildingId: null,
  hoveredBuildingId: null,
  selectedFloorId: null,
  hoveredFloorId: null,
  selectedUnitId: null,
  selectedInfra: null,
  undergroundVisible: false,
  visibleInfraTypes: DEFAULT_INFRA_VISIBILITY,
  depthSlice: -25,
  activeRightTab: null,
  visibleBuildingTypes: DEFAULT_BUILDING_VISIBILITY,
  underConstructionMessage: null,
  isLoading: false,
  error: null,
  cameraTarget: null,
  cameraPosition: null,
  cameraKey: 0,
  isPanning: false,
  lastSelectTime: 0,

  timeOfDay: getInitialTime(),
  isRealTime: true,
  weatherMode: 'clouds',
  isExplodedView: false,

  activeDocumentBuilding: null,
  openDocumentModal: (building) => set({ activeDocumentBuilding: building }),
  closeDocumentModal: () => set({ activeDocumentBuilding: null }),

  loadInitialData: async () => {
    if (get().isLoading) return
    set({ isLoading: true, error: null })
    try {
      const [buildings, backendInfra] = await Promise.all([
        getBuildings(15000).catch(async () => {
          // Fallback to local catalog if backend unreachable — load all buildings
          const res = await fetch('/city_buildings_catalog.json?t=' + Date.now(), { cache: 'no-cache' })
          const data = (await res.json()) as Building[]
          return data  // no slice — every building needs a ULPIN-addressable store entry
        }),
        getUndergroundInfra().catch(() => []),
      ])
      // Keep only drainage infrastructure across the entire map
      const undergroundInfra = [
        ...backendInfra.filter((i) => i.infra_type === 'drainage'),
        ...PROCEDURAL_UNDERGROUND_INFRA,
      ]
      set({ buildings, undergroundInfra, isLoading: false })
      console.info(`[ULPIN] Initial locality data loaded: ${buildings.length} buildings, ${undergroundInfra.length} underground records`)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to load locality data.'
      set({ isLoading: false, error: message })
      console.error('[ULPIN] Initial locality data load failed', error)
    }
  },

  selectBuildingAtPoint: async (x: number, z: number) => {
    // In Three.js: x is Blender X, z is -Blender Y.
    const blenderX = x
    const blenderY = -z

    const buildings = get().buildings
    if (buildings.length === 0) return null

    // 1. Search local buildings first using exact polygon test with 1.5m tolerance
    const polygonMatch = buildings.find((b) => {
      if (b.bounds) {
        const minX = Math.min(b.bounds[0], b.bounds[1]) - 1.5
        const maxX = Math.max(b.bounds[0], b.bounds[1]) + 1.5
        const minY = Math.min(b.bounds[2], b.bounds[3]) - 1.5
        const maxY = Math.max(b.bounds[2], b.bounds[3]) + 1.5

        if (minX <= blenderX && blenderX <= maxX && minY <= blenderY && blenderY <= maxY) {
          const ring = getPolygonRing(b.footprint)
          if (ring.length >= 3) {
            return isPointInPolygon(blenderX, blenderY, ring)
          }
          return true
        }
      }
      return false
    })

    if (polygonMatch) {
      get().selectBuilding(polygonMatch.id)
      return polygonMatch
    }

    // 2. Search local buildings with 3.5m bounding box tolerance (handles roofs, porches, eaves, facades)
    const boundsMatch = buildings.find((b) => {
      if (b.bounds) {
        const minX = Math.min(b.bounds[0], b.bounds[1]) - 3.5
        const maxX = Math.max(b.bounds[0], b.bounds[1]) + 3.5
        const minY = Math.min(b.bounds[2], b.bounds[3]) - 3.5
        const maxY = Math.max(b.bounds[2], b.bounds[3]) + 3.5
        return minX <= blenderX && blenderX <= maxX && minY <= blenderY && blenderY <= maxY
      }
      return false
    })

    if (boundsMatch) {
      get().selectBuilding(boundsMatch.id)
      return boundsMatch
    }

    // 3. Proximity match: find building whose 2D boundary is closest to click point (within 22m)
    let bestBldg: Building | null = null
    let minBoxDist = 22.0

    for (const b of buildings) {
      if (b.bounds) {
        const minX = Math.min(b.bounds[0], b.bounds[1])
        const maxX = Math.max(b.bounds[0], b.bounds[1])
        const minY = Math.min(b.bounds[2], b.bounds[3])
        const maxY = Math.max(b.bounds[2], b.bounds[3])
        const dx = Math.max(minX - blenderX, 0, blenderX - maxX)
        const dy = Math.max(minY - blenderY, 0, blenderY - maxY)
        const dist = Math.hypot(dx, dy)
        if (dist < minBoxDist) {
          minBoxDist = dist
          bestBldg = b
        }
      }
    }

    if (bestBldg) {
      get().selectBuilding(bestBldg.id)
      return bestBldg
    }

    // 4. Centroid proximity fallback within 25 meters
    let nearestBuilding: Building | null = null
    let nearestDistSq = 25 * 25

    for (const b of buildings) {
      const cx = b.center ? b.center[0] : b.bounds ? (b.bounds[0] + b.bounds[1]) / 2 : null
      const cy = b.center ? b.center[1] : b.bounds ? (b.bounds[2] + b.bounds[3]) / 2 : null
      if (cx != null && cy != null) {
        const dx = cx - blenderX
        const dy = cy - blenderY
        const dSq = dx * dx + dy * dy
        if (dSq < nearestDistSq) {
          nearestDistSq = dSq
          nearestBuilding = b
        }
      }
    }

    if (nearestBuilding) {
      get().selectBuilding(nearestBuilding.id)
      return nearestBuilding
    }

    // 5. Query backend spatial lookup with Blender (x, y) if available
    try {
      const bldg = await getBuildingLookup(blenderX, blenderY)
      if (bldg) {
        set((state) => ({
          buildings: state.buildings.some((b) => b.id === bldg.id) ? state.buildings : [bldg, ...state.buildings],
        }))
        get().selectBuilding(bldg.id)
        return bldg
      }
    } catch {
      // Click landed on a road or empty terrain: no building selected
    }
    return null
  },

  setHoveredBuildingId: (id) => set({ hoveredBuildingId: id }),

  selectBuilding: (id, defaultFloorId = null) =>
    set({
      selectedBuildingId: id,
      selectedFloorId: defaultFloorId,
      selectedUnitId: null,
      selectedInfra: null,
      underConstructionMessage: null,
      lastSelectTime: Date.now(),
    }),
  selectFloor: (id) =>
    set({
      selectedFloorId: id,
      selectedUnitId: null,
      selectedInfra: null,
      underConstructionMessage: null,
    }),
  selectUnit: (id, floorId) =>
    set((state) => ({
      selectedUnitId: id,
      selectedFloorId: floorId !== undefined ? floorId : state.selectedFloorId,
      selectedInfra: null,
      underConstructionMessage: null,
    })),
  selectInfra: (infra) =>
    set({
      selectedInfra: infra,
      selectedBuildingId: null,
      selectedFloorId: null,
      selectedUnitId: null,
      underConstructionMessage: null,
    }),
  clearSelection: () =>
    set({
      selectedBuildingId: null,
      selectedFloorId: null,
      hoveredFloorId: null,
      selectedUnitId: null,
      selectedInfra: null,
      underConstructionMessage: null,
      isExplodedView: false,
    }),
  toggleUnderground: () => {
    const { undergroundVisible } = get()
    if (!undergroundVisible) {
      // Turning ON: fly to a ground-level side view so underground pipes are visible
      set((state) => ({
        undergroundVisible: true,
        activeRightTab: 'underground',
        cameraTarget:   [0, -12, 0],
        cameraPosition: [320, 18, 380],
        cameraKey: state.cameraKey + 1,
      }))
    } else {
      // Turning OFF: reset to bird's eye overview
      set((state) => ({
        undergroundVisible: false,
        cameraTarget:   [0, 0, 0],
        cameraPosition: [550, 420, 550],
        cameraKey: state.cameraKey + 1,
      }))
    }
  },
  toggleInfraType: (type) =>
    set((state) => ({
      visibleInfraTypes: {
        ...state.visibleInfraTypes,
        [type]: !state.visibleInfraTypes[type],
      },
    })),
  setAllInfraTypesVisible: (visible) =>
    set({
      visibleInfraTypes: {
        drainage: visible,
        metro_tunnel: visible,
        metro_station: visible,
        water: visible,
        sewer: visible,
        gas: visible,
        power: visible,
      },
    }),
  setDepthSlice: (depth) => set({ depthSlice: depth }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  toggleBuildingType: (type) =>
    set((state) => ({
      visibleBuildingTypes: {
        ...state.visibleBuildingTypes,
        [type]: !state.visibleBuildingTypes[type],
      },
    })),
  setAllBuildingTypesVisible: (visible) =>
    set({
      visibleBuildingTypes: {
        apartment: visible,
        house: visible,
        half_built: visible,
        school: visible,
        commercial: visible,
      },
    }),
  selectUnderConstruction: (buildingId, floorNumber) => set({
    selectedBuildingId: buildingId,
    selectedFloorId: null,
    selectedUnitId: null,
    selectedInfra: null,
    underConstructionMessage: `Floor ${floorNumber} is under construction — no ULPIN assigned yet.`,
  }),
  flyToBuilding: (building) => {
    const center = getPolygonCenter(building.footprint)
    const scenePoint = localXYToScene(center)
    const height = building.height_meters || ((building.stories_count || 1) * 3.5)
    const target: [number, number, number] = [scenePoint.x, height / 2, scenePoint.z]
    const position: [number, number, number] = [scenePoint.x + 36, height + 24, scenePoint.z + 36]
    set((state) => ({
      selectedBuildingId: building.id,
      selectedFloorId: null,
      selectedUnitId: null,
      selectedInfra: null,
      underConstructionMessage: null,
      cameraTarget: target,
      cameraPosition: position,
      cameraKey: state.cameraKey + 1,
    }))
  },
  flyToTarget: (target, position) => {
    const defaultPosition: [number, number, number] = [target[0] + 48, target[1] + 35, target[2] + 48]
    set((state) => ({
      cameraTarget: target,
      cameraPosition: position ?? defaultPosition,
      cameraKey: state.cameraKey + 1,
    }))
  },
  resetCamera: () => {
    set((state) => ({
      cameraTarget: [0, 0, 0],
      cameraPosition: [550, 420, 550],
      cameraKey: state.cameraKey + 1,
    }))
  },
  setIsPanning: (panning) => set({ isPanning: panning }),
  setHoveredFloorId: (id) => set({ hoveredFloorId: id }),
  setTimeOfDay: (time) => set({ timeOfDay: time, isRealTime: false }),
  toggleRealTime: () =>
    set((s) => ({
      isRealTime: !s.isRealTime,
      timeOfDay: !s.isRealTime ? getInitialTime() : s.timeOfDay,
    })),
  setWeatherMode: (mode) => set({ weatherMode: mode }),
  toggleExplodedView: () => set((s) => ({ isExplodedView: !s.isExplodedView })),
}))
