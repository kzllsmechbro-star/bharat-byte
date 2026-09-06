import { useMemo, useState } from 'react'
import type { Building } from '../types/spatial'
import { useLocalityStore } from '../store/localityStore'

function getBuildingTypeBadge(building: Building) {
  if (building.structure_category === '1_story_house' || building.stories_count === 1) {
    return <span className="bldg-badge badge-house">🏠 1-Story House</span>
  }
  if (building.structure_category === '2_story_house' || building.stories_count === 2) {
    return <span className="bldg-badge badge-house">🏡 2-Story Duplex</span>
  }
  if (building.structure_category === '3_story_villa' || building.stories_count === 3) {
    return <span className="bldg-badge badge-school">🏰 3-Story Villa</span>
  }
  if (building.building_type === 'commercial' || building.structure_category === 'commercial_tower') {
    return <span className="bldg-badge badge-halfbuilt">🏬 Commercial ({building.stories_count || 1} St)</span>
  }
  return (
    <span className="bldg-badge badge-apartment">
      🏢 {building.stories_count ? `${building.stories_count} St Apt` : 'Apartment'}
    </span>
  )
}

export function BuildingListPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'house' | 'duplex' | 'villa' | 'apartment'>('all')

  const buildings = useLocalityStore((state) => state.buildings)
  const selectedBuildingId = useLocalityStore((state) => state.selectedBuildingId)
  const setHoveredBuildingId = useLocalityStore((state) => state.setHoveredBuildingId)
  const flyToBuilding = useLocalityStore((state) => state.flyToBuilding)
  const selectBuilding = useLocalityStore((state) => state.selectBuilding)
  const visibleBuildingTypes = useLocalityStore((state) => state.visibleBuildingTypes)

  const filteredBuildings = useMemo(() => {
    const q = searchFilter.trim().toLowerCase()
    return buildings.filter((b) => {
      // Category filter
      if (activeCategory === 'house' && b.structure_category !== '1_story_house' && b.stories_count !== 1) return false
      if (activeCategory === 'duplex' && b.structure_category !== '2_story_house' && b.stories_count !== 2) return false
      if (activeCategory === 'villa' && b.structure_category !== '3_story_villa' && b.stories_count !== 3) return false
      if (activeCategory === 'apartment' && b.structure_category !== 'apartment_complex' && b.building_type !== 'apartment') return false

      if (!q) return true
      return (
        (b.house_no && b.house_no.toLowerCase().includes(q)) ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.complex_name && b.complex_name.toLowerCase().includes(q)) ||
        b.base_ulpin.toLowerCase().includes(q)
      )
    })
  }, [buildings, searchFilter, activeCategory])

  return (
    <aside className={`building-list-drawer ${isOpen ? 'drawer-open' : 'drawer-closed'}`} aria-label="Buildings Directory">
      <button
        type="button"
        className="drawer-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="toggle-chevron">{isOpen ? '▶' : '◀'}</span>
        <span className="drawer-btn-label">🏢 City Buildings & Houses ({buildings.length})</span>
      </button>

      {isOpen && (
        <div className="drawer-content">
          <div className="drawer-header">
            <div>
              <h3>Locality Directory</h3>
              <span className="drawer-count">Showing {filteredBuildings.length} of {buildings.length} Structures</span>
            </div>
          </div>

          {/* Quick Filter Search inside Drawer */}
          <div style={{ padding: '0.5rem 0.75rem 0.25rem' }}>
            <input
              type="search"
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--border-line)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius)',
                padding: '0.3rem 0.6rem',
                outline: 'none',
              }}
              className="drawer-inner-search"
              placeholder="Filter by House #, Complex, or ULPIN..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />

            {/* Category Filter Chips — same style as LayerToggles filter chips */}
            <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', padding: '0.25rem 0', fontSize: '0.68rem' }}>
              {(['all', 'house', 'duplex', 'villa', 'apartment'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`filter-chip ${activeCategory === cat ? 'chip-active' : 'chip-inactive'}`}
                  style={{ padding: '0.2rem 0.5rem', whiteSpace: 'nowrap', fontSize: '0.68rem' }}
                >
                  {cat === 'all' ? 'All' : cat === 'house' ? '🏠 1-St' : cat === 'duplex' ? '🏡 Duplex' : cat === 'villa' ? '🏰 Villa' : '🏢 Apt'}
                </button>
              ))}
            </div>
          </div>

          <div className="buildings-scroll-list">
            {filteredBuildings.slice(0, 300).map((building) => {
              const isSelected = selectedBuildingId === building.id
              const isHidden = !(visibleBuildingTypes[building.building_type as keyof typeof visibleBuildingTypes] ?? true)

              return (
                <button
                  key={building.id}
                  type="button"
                  className={`building-list-item ${isSelected ? 'item-selected' : ''} ${isHidden ? 'item-dimmed' : ''}`}
                  onMouseEnter={() => setHoveredBuildingId(building.id)}
                  onMouseLeave={() => setHoveredBuildingId(null)}
                  onClick={() => {
                    selectBuilding(building.id)
                    flyToBuilding(building)
                  }}
                >
                  <div className="item-row-top">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="bldg-code-tag font-bold">
                        {building.house_no ? building.house_no.replace('House #', 'H#') : building.building_code}
                      </span>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {building.name || `Building ${building.building_code}`}
                      </span>
                    </div>
                    {getBuildingTypeBadge(building)}
                  </div>
                  <div className="item-row-bottom">
                    <span className="bldg-ulpin-text">{building.base_ulpin}</span>
                    {building.complex_name && (
                      <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                        {building.complex_name}
                      </span>
                    )}
                    {isHidden && <span className="hidden-indicator">(hidden)</span>}
                  </div>
                </button>
              )
            })}
            {filteredBuildings.length > 300 && (
              <div className="p-2 text-center text-[11px] text-slate-500 italic">
                Showing top 300 results. Use search above to narrow down.
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
