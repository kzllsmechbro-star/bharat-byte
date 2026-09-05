/* oxlint-disable react(set-state-in-effect) -- remote selection loading state is intentionally immediate. */
import { useEffect, useRef, useState } from 'react'

import { getBuildingFloors, getFloorUnits, getUnit } from '../api/client'
import { useLocalityStore } from '../store/localityStore'
import type { Floor, Unit, UnitDetail } from '../types/spatial'

function floorLabel(floorCode: string): string {
  if (floorCode.startsWith('F-U')) return `Basement ${floorCode.slice(3)}`
  const number = Number.parseInt(floorCode.slice(1), 10)
  return number === 1 ? 'Ground floor (1)' : `Floor ${number}`
}

function displayBuildingType(value: string): string {
  return value.replace('_', ' ')
}

function UlpinLoadingSkeleton() {
  return (
    <div className="skeleton-container" aria-label="Loading property details">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-box skeleton-code" />
      <div className="skeleton-line skeleton-btn" />
      <div className="skeleton-breakdown">
        <div className="skeleton-tag" />
        <div className="skeleton-tag" />
        <div className="skeleton-tag" />
        <div className="skeleton-tag" />
      </div>
      <div className="skeleton-grid">
        <div className="skeleton-fact" />
        <div className="skeleton-fact" />
        <div className="skeleton-fact" />
      </div>
    </div>
  )
}

export function UlpinInfoPanel() {
  const selectedUnitId = useLocalityStore((state) => state.selectedUnitId)
  const selectedBuildingId = useLocalityStore((state) => state.selectedBuildingId)
  const selectedFloorId = useLocalityStore((state) => state.selectedFloorId)
  const selectedInfra = useLocalityStore((state) => state.selectedInfra)
  const buildings = useLocalityStore((state) => state.buildings)
  const underConstructionMessage = useLocalityStore((state) => state.underConstructionMessage)
  const clearSelection = useLocalityStore((state) => state.clearSelection)
  const selectFloor = useLocalityStore((state) => state.selectFloor)
  const selectUnit = useLocalityStore((state) => state.selectUnit)

  const [unit, setUnit] = useState<UnitDetail | null>(null)
  const [floors, setFloors] = useState<Floor[]>([])
  const [floorUnits, setFloorUnits] = useState<Unit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoadingUnit, setIsLoadingUnit] = useState(false)
  const [isLoadingFloors, setIsLoadingFloors] = useState(false)
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const activeUnitRequestId = useRef(0)
  const copyTimerRef = useRef<number | null>(null)

  const building = buildings.find((entry) => entry.id === selectedBuildingId)

  // 1. Fetch floors when building is selected
  useEffect(() => {
    if (!selectedBuildingId) {
      setFloors([])
      return
    }

    // Immediately populate from building.floors if available in catalog
    if (building?.floors && building.floors.length > 0) {
      const immediateFloors = building.floors
        .filter((f) => !f.floor_code.startsWith('F-U'))
        .map((f) => ({
          id: `${building.id}-${f.floor_code}`,
          building_id: building.id,
          floor_code: f.floor_code,
          floor_number: f.floor_number,
          is_underground: false,
          footprint: building.footprint,
          height_meters: f.height_meters || 3.5,
        }))
        .sort((a, b) => a.floor_number - b.floor_number)

      setFloors(immediateFloors)
      setIsLoadingFloors(false)
      if (immediateFloors.length > 0) {
        selectFloor(immediateFloors[0].id)
      }
      return
    }

    setIsLoadingFloors(true)
    let isActive = true
    getBuildingFloors(selectedBuildingId)
      .then((data) => {
        if (isActive) {
          const sorted = [...data].sort((a, b) => a.floor_number - b.floor_number)
          setFloors(sorted)
          setIsLoadingFloors(false)
          // If no floor selected, auto-select first floor
          if (sorted.length > 0) {
            selectFloor(sorted[0].id)
          }
        }
      })
      .catch((err: unknown) => {
        if (isActive) {
          console.error('[ULPIN] Failed to load building floors', err)
          setIsLoadingFloors(false)
        }
      })
    return () => {
      isActive = false
    }
  }, [selectedBuildingId, selectFloor, building])

  // 2. Fetch units when active floor changes
  useEffect(() => {
    if (!selectedFloorId) {
      setFloorUnits([])
      return
    }
    setIsLoadingUnits(true)
    let isActive = true
    getFloorUnits(selectedFloorId)
      .then((data) => {
        if (isActive) {
          setFloorUnits(data)
          setIsLoadingUnits(false)
        }
      })
      .catch((err: unknown) => {
        if (isActive) {
          console.error('[ULPIN] Failed to load floor units', err)
          setIsLoadingUnits(false)
        }
      })
    return () => {
      isActive = false
    }
  }, [selectedFloorId])

  // 3. Fetch unit details when a specific unit is selected
  useEffect(() => {
    if (!selectedUnitId) {
      setUnit(null)
      setIsLoadingUnit(false)
      return
    }

    const currentRequestId = ++activeUnitRequestId.current
    setIsLoadingUnit(true)
    setError(null)

    getUnit(selectedUnitId)
      .then((data) => {
        if (activeUnitRequestId.current === currentRequestId) {
          setUnit(data)
          setIsLoadingUnit(false)
        }
      })
      .catch((requestError: unknown) => {
        if (activeUnitRequestId.current === currentRequestId) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load flat ULPIN details.')
          setIsLoadingUnit(false)
        }
      })
  }, [selectedUnitId])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  if (!selectedBuildingId && !selectedUnitId && !underConstructionMessage && !selectedInfra) {
    return null
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopiedText(null), 2200)
    } catch {
      setCopiedText(null)
    }
  }

  const currentFloor = floors.find((f) => f.id === selectedFloorId)

  return (
    <aside className="ulpin-info-panel" aria-live="polite">
      <button className="panel-clear" type="button" onClick={clearSelection} title="Close inspector">
        ✕ Clear
      </button>

      {selectedInfra ? (
        <>
          <p className="panel-eyebrow">Subterranean Asset</p>
          <h2>
            {selectedInfra.infra_type === 'drainage' && 'Stormwater / Sewage Culvert'}
            {selectedInfra.infra_type === 'metro_tunnel' && 'Underground Metro Tunnel'}
            {selectedInfra.infra_type === 'metro_station' && 'Subterranean Metro Station'}
          </h2>
          <code className="full-ulpin">{selectedInfra.full_ulpin}</code>
          <button
            className={`copy-ulpin ${copiedText === selectedInfra.full_ulpin ? 'copy-success' : ''}`}
            type="button"
            onClick={() => {
              void copyText(selectedInfra.full_ulpin)
            }}
          >
            {copiedText === selectedInfra.full_ulpin ? '✓ Copied to clipboard!' : '📋 Copy ULPIN'}
          </button>
          <dl className="property-facts">
            <div>
              <dt>Asset Type</dt>
              <dd>{selectedInfra.infra_type.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt>Depth</dt>
              <dd>{selectedInfra.depth_meters} m Subterranean</dd>
            </div>
            <div>
              <dt>Right of Way</dt>
              <dd>Road Corridor</dd>
            </div>
          </dl>
          <div className="infra-parcel-ref">
            <span>Aligned Base Parcel:</span>
            <code>{selectedInfra.base_ulpin}</code>
          </div>
        </>
      ) : underConstructionMessage ? (
        /* Case B: Under Construction Notice */
        <>
          <p className="panel-eyebrow">Under Construction</p>
          <h2>Structure Status</h2>
          <p className="construction-notice">{underConstructionMessage}</p>
        </>
      ) : (
        /* Case C: Building / Floor / Flat Inspector */
        <>
          {building && (
            <div className="panel-building-header">
              <div className="flex items-center justify-between">
                <span className="panel-eyebrow">
                  {building.building_type === 'house'
                    ? building.stories_count === 1
                      ? '1-Story Single House'
                      : building.stories_count === 2
                      ? '2-Story Duplex / Townhouse'
                      : `${building.stories_count || 3}-Story Villa`
                    : building.building_type === 'apartment'
                    ? `${building.stories_count || floors.length}-Story Apartment Complex`
                    : building.building_type === 'school'
                    ? 'Educational & Civic Complex'
                    : 'Structure & Vertical Property'}
                </span>
                <span className="bldg-type-tag text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  {displayBuildingType(building.building_type)}
                </span>
              </div>
              <h2 className="text-xl font-bold flex items-center gap-2 mt-1">
                <span>{building.name || `Building ${building.building_code}`}</span>
              </h2>
              <div className="bldg-meta-box p-2.5 rounded bg-slate-800/60 border border-slate-700/60 text-xs flex flex-col gap-1.5 my-2">
                {building.house_no && (
                  <div className="flex justify-between items-center">
                    <span className="text-amber-400 font-semibold">Assigned House No:</span>
                    <span className="font-bold text-white bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                      {building.house_no}
                    </span>
                  </div>
                )}
                {building.complex_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-sky-300 font-semibold">Complex / Enclave:</span>
                    <span className="font-medium text-slate-200 text-right">
                      {building.complex_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Parcel Base ULPIN:</span>
                  <code className="font-mono text-emerald-300 font-bold">{building.base_ulpin}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Building 3D ULPIN:</span>
                  <code className="font-mono text-cyan-300">{building.base_ulpin}-{building.building_code}</code>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-700/50 text-[11px]">
                  <span className="text-slate-400">Stories / Height:</span>
                  <span className="text-white font-semibold">
                    {building.stories_count || floors.length || 1} Stories (
                    {building.height_meters ? `${building.height_meters.toFixed(1)} m` : `${((building.stories_count || floors.length || 1) * 3.5).toFixed(1)} m`})
                  </span>
                </div>
                {building.postal_address && (
                  <div className="pt-1 border-t border-slate-700/50 text-[10px] text-slate-300">
                    <span className="text-slate-400 block">Postal Address:</span>
                    <span className="text-slate-200 italic">{building.postal_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Flat / House Unit Detailed Hero Card */}
          {selectedUnitId && (
            <div className="selected-flat-card mb-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 shadow-inner">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  {building?.building_type === 'house' ? 'Selected House Unit' : 'Selected Flat / Unit'}
                </span>
                {unit && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    ✓ Verified Unique ULPIN
                  </span>
                )}
              </div>

              {isLoadingUnit ? (
                <UlpinLoadingSkeleton />
              ) : error ? (
                <p className="panel-error-msg text-red-400 text-xs">{error}</p>
              ) : unit ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-white">
                      {unit.unit_number || `Unit ${unit.unit_code}`}
                      <span className="text-xs font-normal text-slate-300 ml-2">
                        ({building?.building_type === 'house'
                          ? currentFloor?.floor_number === 1
                            ? 'Ground Story'
                            : 'Upper Story'
                          : floorLabel(unit.floor_code)})
                      </span>
                    </h3>
                  </div>

                  <code className="full-ulpin text-sm font-bold font-mono text-amber-300 bg-slate-900/90 border border-amber-400/40 my-1.5 block">
                    {unit.assembled_ulpin}
                  </code>

                  <button
                    className={`copy-ulpin w-full text-center ${copiedText === unit.assembled_ulpin ? 'copy-success' : ''}`}
                    type="button"
                    onClick={() => {
                      void copyText(unit.assembled_ulpin)
                    }}
                  >
                    {copiedText === unit.assembled_ulpin ? '✓ Copied 3D ULPIN!' : '📋 Copy 3D ULPIN'}
                  </button>

                  <dl className="ulpin-breakdown my-2 text-xs">
                    <div>
                      <dt>Parcel</dt>
                      <dd>{unit.base_ulpin}</dd>
                    </div>
                    <span aria-hidden="true" className="text-slate-500">→</span>
                    <div>
                      <dt>{building?.house_no ? 'House' : 'Bldg'}</dt>
                      <dd>{building?.house_no || unit.building_code}</dd>
                    </div>
                    <span aria-hidden="true" className="text-slate-500">→</span>
                    <div>
                      <dt>Story</dt>
                      <dd>{unit.floor_code}</dd>
                    </div>
                    <span aria-hidden="true" className="text-slate-500">→</span>
                    <div>
                      <dt>Unit</dt>
                      <dd className="text-amber-300 font-bold">{unit.unit_code}</dd>
                    </div>
                  </dl>

                  {/* AI 3D Mathematical Spatial Signature */}
                  <div className="ai-spatial-box p-2.5 rounded bg-slate-900/90 border border-sky-500/40 text-xs my-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-300 font-bold flex items-center gap-1">
                        <span>🤖</span>
                        <span>AI 3D Spatial Registration:</span>
                      </span>
                      {unit.spatial_verification_hash && (
                        <span className="font-mono text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40 font-bold">
                          Sig: #{unit.spatial_verification_hash}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">3D Morton Code:</span>
                        <code className="font-mono text-cyan-300 font-bold">
                          {unit.ai_morton_code || '00000000'}
                        </code>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Vertical Volume:</span>
                        <span className="font-semibold text-white">
                          {unit.volume_m3 ? `${unit.volume_m3} m³` : '—'}
                        </span>
                      </div>
                      {unit.elevation_meters && (
                        <div className="col-span-2 text-[10px] text-slate-300 pt-0.5 border-t border-slate-800">
                          <span className="text-slate-400">Elevation Bounds: </span>
                          <span className="font-mono text-emerald-300 font-semibold">
                            {unit.elevation_meters[0]}m to {unit.elevation_meters[1]}m (Height: 3.5m)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="uniqueness-callout p-2 rounded bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-200 mt-2 flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong>Unique 3D Bhu-Aadhaar ID:</strong> Mathematically verified non-overlapping 3D volume in coordinate space.
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Floor Selector Pills */}
          {isLoadingFloors ? (
            <div className="text-xs text-slate-400 py-2">Loading building floors…</div>
          ) : floors.length > 0 ? (
            <div className="floor-navigator mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-300">
                  {building?.building_type === 'house' ? 'Select Story Level:' : 'Select Floor Level:'}
                </span>
                <span className="text-[11px] text-sky-400 font-mono">
                  {currentFloor
                    ? building?.building_type === 'house'
                      ? currentFloor.floor_number === 1
                        ? 'Ground Story (F001)'
                        : 'Upper Story (F002)'
                      : `${currentFloor.floor_code} (${floorLabel(currentFloor.floor_code)})`
                    : ''}
                </span>
              </div>
              <div className="floor-pills-row flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {floors.map((f) => {
                  const isActive = f.id === selectedFloorId
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className={`floor-pill-btn px-2.5 py-1 rounded text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                        isActive
                          ? 'bg-sky-500 text-white border-sky-300 shadow-md ring-1 ring-sky-300'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-700'
                      }`}
                      onClick={() => selectFloor(f.id)}
                    >
                      {building?.building_type === 'house'
                        ? f.floor_number === 1
                          ? 'Ground (F1)'
                          : 'Story 2 (F2)'
                        : f.floor_code}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Flats on Current Floor */}
          <div className="floor-flats-directory mt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <span>
                  {building?.building_type === 'house'
                    ? '🏡 House Units & Suites'
                    : `🏠 Flats on ${currentFloor?.floor_code || 'Selected Floor'}`}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-emerald-400 font-mono">
                  {floorUnits.length} {building?.building_type === 'house' ? 'Unit' : 'Flats'}
                </span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-medium">All Unique 3D ULPINs</span>
            </div>

            {isLoadingUnits ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading units…</div>
            ) : floorUnits.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-850 rounded border border-slate-700">
                No individual units recorded on this level.
              </div>
            ) : (
              <div className="flats-list flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {floorUnits.map((u) => {
                  const isUnitSelected = selectedUnitId === u.id
                  return (
                    <div
                      key={u.id}
                      className={`flat-item-card p-2.5 rounded-lg border transition-all ${
                        isUnitSelected
                          ? 'bg-amber-950/60 border-amber-400/80 ring-1 ring-amber-400/40'
                          : 'bg-slate-800/70 border-slate-700/80 hover:border-sky-500/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isUnitSelected ? 'bg-amber-400' : 'bg-sky-400'}`} />
                          <span className="font-bold text-xs text-white">
                            {u.unit_number || `Flat ${u.unit_code}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {u.spatial_verification_hash && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-500/30">
                              #{u.spatial_verification_hash}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-900/80 text-sky-300 border border-slate-700">
                            {u.unit_type}
                          </span>
                        </div>
                      </div>

                      {/* Unique ULPIN */}
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <code className="font-mono text-[11px] text-emerald-300 font-bold bg-slate-950/80 px-2 py-1 rounded border border-slate-800 flex-1 truncate">
                          {u.full_ulpin}
                        </code>
                        <button
                          type="button"
                          className={`copy-mini-btn px-2 py-1 text-[10px] font-semibold rounded transition-colors whitespace-nowrap ${
                            copiedText === u.full_ulpin
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            void copyText(u.full_ulpin)
                          }}
                          title="Copy ULPIN"
                        >
                          {copiedText === u.full_ulpin ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700/50 text-[10px]">
                        <span className="text-emerald-400 font-medium">
                          {u.volume_m3 ? `✓ ${u.volume_m3} m³ volume` : '✓ Unique 3D ID'}
                        </span>
                        <button
                          type="button"
                          className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2"
                          onClick={() => {
                            if (currentFloor) selectUnit(u.id, currentFloor.id)
                            else selectUnit(u.id)
                          }}
                        >
                          {isUnitSelected ? 'Viewing in 3D' : 'Inspect Unit →'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
