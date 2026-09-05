/* oxlint-disable react(set-state-in-effect) -- query reset state is intentionally immediate. */
import { useEffect, useRef, useState } from 'react'
import { getBuilding, getBuildingFloors, searchUlpIn } from '../api/client'

import type { SearchRecord } from '../types/spatial'
import { useLocalityStore } from '../store/localityStore'
import { getPolygonCenter } from './footprint'
import { localXYToScene } from '../utils/coordinates'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchRecord[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const buildings = useLocalityStore((state) => state.buildings)
  const selectBuilding = useLocalityStore((state) => state.selectBuilding)
  const selectFloor = useLocalityStore((state) => state.selectFloor)
  const selectUnit = useLocalityStore((state) => state.selectUnit)
  const flyToTarget = useLocalityStore((state) => state.flyToTarget)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setErrorMessage(null)
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setErrorMessage(null)
      try {
        const response = await searchUlpIn(trimmed)
        setResults(response.records)
        setIsOpen(true)
        if (response.records.length === 0) {
          setErrorMessage('No matching ULPIN records found.')
        }
      } catch {
        setErrorMessage('Search query failed.')
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectRecord = async (record: SearchRecord) => {
    setIsOpen(false)

    // Locate related building from current loaded buildings or fetch by ID
    let matchedBuilding = buildings.find(
      (b) =>
        b.id === record.id ||
        b.base_ulpin === record.base_ulpin ||
        (record.building_code && b.building_code === record.building_code && b.base_ulpin === record.base_ulpin),
    )

    if (!matchedBuilding) {
      try {
        matchedBuilding = await getBuilding(record.id)
      } catch {
        // Fallback: search by coordinate if present in record geometry
      }
    }

    if (matchedBuilding) {
      const center = getPolygonCenter(matchedBuilding.footprint)
      const scenePoint = localXYToScene(center)
      const target: [number, number, number] = [scenePoint.x, 8, scenePoint.z]
      const position: [number, number, number] = [scenePoint.x + 46, 40, scenePoint.z + 46]

      if (record.record_type === 'unit') {
        void getBuildingFloors(matchedBuilding.id).then((bFloors) => {
          const matchedFloor = bFloors.find((f) => f.floor_code === record.floor_code)
          selectBuilding(matchedBuilding.id, matchedFloor?.id || null)
          selectUnit(record.id, matchedFloor?.id || null)
        })
      } else if (record.record_type === 'floor') {
        selectBuilding(matchedBuilding.id, record.id)
        selectFloor(record.id)
      } else {
        selectBuilding(matchedBuilding.id)
      }

      flyToTarget(target, position)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && results.length > 0) {
      void handleSelectRecord(results[0])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="search-bar-container">
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          className="search-input"
          placeholder="Search House #, Complex, or ULPIN (e.g. House #15, Sunrise, 29KA)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0 || errorMessage) setIsOpen(true) }}
          onKeyDown={handleKeyDown}
          aria-label="Search 3D ULPIN locality"
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false) }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        {isSearching && <div className="search-spinner" aria-hidden="true" />}
      </div>

      {isOpen && (
        <div className="search-dropdown" role="listbox">
          {errorMessage && <div className="search-empty-state">{errorMessage}</div>}
          {results.map((record) => (
            <button
              key={`${record.record_type}-${record.id}`}
              type="button"
              className="search-result-item"
              onClick={() => void handleSelectRecord(record)}
            >
              <div className="result-header">
                <span className={`result-type-tag tag-${record.record_type}`}>{record.record_type}</span>
                <span className="result-ulpin font-bold">{record.name || record.full_ulpin}</span>
              </div>
              <div className="result-subtext">
                {record.name && <span className="font-mono text-emerald-300 font-semibold">{record.full_ulpin} • </span>}
                Base: {record.base_ulpin}
                {record.building_code && ` • Bldg: ${record.building_code}`}
                {record.floor_code && ` • Floor: ${record.floor_code}`}
                {record.unit_code && ` • Unit: ${record.unit_code}`}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
