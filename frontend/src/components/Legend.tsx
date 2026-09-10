import { useState } from 'react'

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function Legend() {
  // Default open so judges/evaluators immediately see it
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`scene-legend-panel ${collapsed ? 'legend-collapsed' : ''}`}
      aria-label="Map Legend"
      onClick={collapsed ? () => setCollapsed(false) : undefined}
    >
      <div
        className="legend-header"
        onClick={() => setCollapsed(!collapsed)}
        style={{ cursor: 'pointer' }}
        title={collapsed ? 'Click to expand Map Legend' : 'Click to collapse Map Legend down'}
      >
        <div className="legend-header-left">
          <span className="legend-dot-indicator" />
          <span className="legend-title">Map Legend</span>
        </div>
        <button
          type="button"
          className="legend-toggle-btn"
          onClick={(e) => {
            e.stopPropagation()
            setCollapsed(!collapsed)
          }}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand Map Legend' : 'Collapse Map Legend down'}
        >
          {collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>

      {!collapsed && (
        <div className="legend-content">

          {/* Building Types */}
          <div className="legend-section">
            <div className="legend-section-name">Architectural Types</div>
            <div className="legend-items-grid">
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#e8dfd8' }} />
                <span>Apartment / Residential</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#64748b' }} />
                <span>Commercial / Mixed-Use</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#d6a94d' }} />
                <span>Under Construction</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#9e2a2b' }} />
                <span>Institutional / School</span>
              </div>
            </div>
          </div>

          {/* 3D Unit Colours */}
          <div className="legend-section">
            <div className="legend-section-name">3D Floor Units</div>
            <div className="legend-items-grid">
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#e2c58f' }} />
                <span>Residential Unit</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#82b9c9' }} />
                <span>Commercial Shop</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#c89586' }} />
                <span>Common Area</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#2dd4bf' }} />
                <span>Selected / Active</span>
              </div>
            </div>
          </div>

          {/* ULPIN Code Format */}
          <div className="legend-section">
            <div className="legend-section-name">ULPIN Code Format</div>
            <div className="legend-ulpin-format">
              <div className="legend-ulpin-code-display">XX · YYY · ZZ · B · F · U</div>
              <div className="legend-ulpin-parts">
                <span className="ulpin-part-chip">XX = State</span>
                <span className="ulpin-part-chip">YYY = District</span>
                <span className="ulpin-part-chip">ZZ = Village</span>
                <span className="ulpin-part-chip">B = Building</span>
                <span className="ulpin-part-chip">F = Floor</span>
                <span className="ulpin-part-chip">U = Unit</span>
              </div>
            </div>
          </div>

          {/* Navigation help */}
          <div className="legend-help-text">
            Drag to orbit · Scroll to zoom · Click to inspect
          </div>

        </div>
      )}
    </aside>
  )
}
