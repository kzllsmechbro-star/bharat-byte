import { useState } from 'react'

export function Legend() {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <aside className={`scene-legend-panel ${collapsed ? 'legend-collapsed' : ''}`} aria-label="3D Scene Legend">
      <div className="legend-header">
        <span className="legend-title">🗺️ Indian Locality Key</span>
        <button
          type="button"
          className="legend-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand legend' : 'Collapse legend'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <div className="legend-content">
          <div className="legend-section">
            <div className="legend-section-name">Indian Architectural Styles</div>
            <div className="legend-items-grid">
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#e8dfd8' }} />
                <span>Apartment (Balconies/Chajjas)</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#64748b' }} />
                <span>Commercial / Mixed Use</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#d6a94d' }} />
                <span>Half-Built (TMT Rebar/Scaffold)</span>
              </div>
              <div className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: '#9e2a2b' }} />
                <span>School (Clock Portico)</span>
              </div>
            </div>
          </div>

          <div className="legend-section">
            <div className="legend-section-name">3D Floor Units (Subdivided)</div>
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
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
