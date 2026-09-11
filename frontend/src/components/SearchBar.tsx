/* oxlint-disable react(set-state-in-effect) -- query reset state is intentionally immediate. */
import { useEffect, useRef, useState } from 'react'
import { getBuilding, getBuildingFloors, searchUlpIn } from '../api/client'

import type { SearchRecord } from '../types/spatial'
import { useLocalityStore } from '../store/localityStore'

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13" aria-hidden="true">
      <line x1="12" y1="4" x2="4" y2="12" />
      <line x1="4" y1="4" x2="12" y2="12" />
    </svg>
  )
}

function ArrowRightSmIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12" aria-hidden="true">
      <line x1="2" y1="8" x2="13" y2="8" />
      <polyline points="8 3 13 8 8 13" />
    </svg>
  )
}

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

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Ctrl+K / Cmd+K global shortcut to focus the search bar
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', handleGlobalKey)
    return () => document.removeEventListener('keydown', handleGlobalKey)
  }, [])

  // Debounced search
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
        // fallback
      }
    }

    if (matchedBuilding) {
      if (record.record_type === 'unit') {
        void getBuildingFloors(matchedBuilding.id).then((bFloors) => {
          const matchedFloor = bFloors.find((f) => f.floor_code === record.floor_code)
          selectBuilding(matchedBuilding!.id, matchedFloor?.id || null, true)
          selectUnit(record.id, matchedFloor?.id || null)
        })
      } else if (record.record_type === 'floor') {
        selectBuilding(matchedBuilding.id, record.id, true)
        selectFloor(record.id)
      } else {
        selectBuilding(matchedBuilding.id, null, true)
      }
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && results.length > 0) {
      void handleSelectRecord(results[0])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const isOnMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)

  return (
    <div ref={containerRef} className="search-bar-container">
      <div className="search-input-wrapper">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder="Search by house #, complex, or ULPIN code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0 || errorMessage) setIsOpen(true) }}
          onKeyDown={handleKeyDown}
          aria-label="Search 3D ULPIN locality"
          id="ulpin-search-input"
        />
        {!query && (
          <div className="search-kbd-hint" aria-hidden="true">
            <kbd>{isOnMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd>
          </div>
        )}
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false) }}
            aria-label="Clear search"
          >
            <XIcon />
          </button>
        )}
        {isSearching && <div className="search-spinner" aria-hidden="true" />}
      </div>

      {isOpen && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          {results.length > 0 && (
            <div className="search-dropdown-header">
              <span className="search-result-count">{results.length} result{results.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {errorMessage && <div className="search-empty-state">{errorMessage}</div>}
          {results.map((record) => (
            <button
              key={`${record.record_type}-${record.id}`}
              type="button"
              className="search-result-item"
              role="option"
              aria-selected="false"
              onClick={() => void handleSelectRecord(record)}
            >
              <div className="result-header">
                <span className={`result-type-tag tag-${record.record_type}`}>{record.record_type}</span>
                <span className="result-ulpin">{record.name || record.full_ulpin}</span>
              </div>
              <div className="result-subtext">
                {record.name && <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{record.full_ulpin} · </span>}
                Base: {record.base_ulpin}
                {record.building_code && ` · Bldg: ${record.building_code}`}
                {record.floor_code && ` · Floor: ${record.floor_code}`}
                {record.unit_code && ` · Unit: ${record.unit_code}`}
              </div>
              <span className="result-arrow" aria-hidden="true">
                <ArrowRightSmIcon />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
