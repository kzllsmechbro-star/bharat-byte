import { create } from 'zustand'

import { ApiError, getBuildingLookup, getBuildings, getUndergroundInfra } from '../api/client'
import type { Building, BuildingType, UndergroundInfra } from '../types/spatial'
import { getPolygonCenter } from '../components/footprint'
import { localXYToScene } from '../utils/coordinates'
export type BuildingTypeVisibility = Record<string, boolean>

const DEFAULT_BUILDING_VISIBILITY: BuildingTypeVisibility = {
  apartment: true,
  house: true,
  half_built: true,
  school: true,
  commercial: true,
}

interface LocalityState {
  buildings: Building[]
  undergroundInfra: UndergroundInfra[]
  selectedBuildingId: string | null
  hoveredBuildingId: string | null
  selectedFloorId: string | null
  selectedUnitId: string | null
  selectedInfra: UndergroundInfra | null
  undergroundVisible: boolean
  visibleBuildingTypes: BuildingTypeVisibility
  underConstructionMessage: string | null
  isLoading: boolean
  error: string | null
  cameraTarget: [number, number, number] | null
  cameraPosition: [number, number, number] | null
  cameraKey: number
  /** True while a pan drag gesture is active — used to suppress building hover highlights. */
  isPanning: boolean

  loadInitialData: () => Promise<void>
  selectBuilding: (id: string | null, defaultFloorId?: string | null) => void
  setHoveredBuildingId: (id: string | null) => void
  selectFloor: (id: string | null) => void
  selectUnit: (id: string | null, floorId?: string | null) => void
  selectInfra: (infra: UndergroundInfra | null) => void
  clearSelection: () => void
  toggleUnderground: () => void
  toggleBuildingType: (type: BuildingType) => void
  selectBuildingAtPoint: (x: number, z: number) => Promise<Building | null>
  setAllBuildingTypesVisible: (visible: boolean) => void
  selectUnderConstruction: (buildingId: string, floorNumber: number) => void
  flyToBuilding: (building: Building) => void
  flyToTarget: (target: [number, number, number], position?: [number, number, number]) => void
  resetCamera: () => void
  setIsPanning: (panning: boolean) => void
}

export const useLocalityStore = create<LocalityState>((set, get) => ({
  buildings: [],
  undergroundInfra: [],
  selectedBuildingId: null,
  hoveredBuildingId: null,
  selectedFloorId: null,
  selectedUnitId: null,
  selectedInfra: null,
  undergroundVisible: false,
  visibleBuildingTypes: DEFAULT_BUILDING_VISIBILITY,
  underConstructionMessage: null,
  isLoading: false,
  error: null,
  cameraTarget: null,
  cameraPosition: null,
  cameraKey: 0,
  isPanning: false,

  loadInitialData: async () => {
    if (get().isLoading) return
    set({ isLoading: true, error: null })
    try {
      const [buildings, undergroundInfra] = await Promise.all([
        getBuildings(15000).catch(async () => {
          // Fallback to local catalog if backend unreachable — load all buildings
          const res = await fetch('/city_buildings_catalog.json')
          const data = (await res.json()) as Building[]
          return data  // no slice — every building needs a ULPIN-addressable store entry
        }),
        getUndergroundInfra().catch(() => []),
      ])
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

    // 1. Search local buildings first using tight bounds
    const localMatch = get().buildings.find((b) => {
      if (b.bounds) {
        return (
          b.bounds[0] - 0.2 <= blenderX &&
          blenderX <= b.bounds[1] + 0.2 &&
          b.bounds[2] - 0.2 <= blenderY &&
          blenderY <= b.bounds[3] + 0.2
        )
      }
      return false
    })

    if (localMatch) {
      get().selectBuilding(localMatch.id)
      return localMatch
    }

    // 2. Query backend spatial lookup with Blender (x, y)
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
      selectedUnitId: null,
      selectedInfra: null,
      underConstructionMessage: null,
    }),
  toggleUnderground: () => {
    const { undergroundVisible } = get()
    if (!undergroundVisible) {
      // Turning ON: fly to a ground-level side view so underground pipes are visible
      set((state) => ({
        undergroundVisible: true,
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
}))
