import { useLocalityStore } from '../store/localityStore'

// ─── Crisp Standard SVG Vector Icons (Classy Dual-Tone) ──────────────────────

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function DrainageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M11 19v3" />
      <path d="M15 19v3" />
    </svg>
  )
}

export function SubterraneanPanel() {
  const undergroundVisible = useLocalityStore((s) => s.undergroundVisible)
  const toggleUnderground = useLocalityStore((s) => s.toggleUnderground)
  const visibleInfraTypes = useLocalityStore((s) => s.visibleInfraTypes)
  const toggleInfraType = useLocalityStore((s) => s.toggleInfraType)
  const resetCamera = useLocalityStore((s) => s.resetCamera)

  const isDrainageVisible = visibleInfraTypes.drainage ?? true

  return (
    <aside className="subterranean-panel classy-dual-tone sub-icon-dock" aria-label="Subterranean Controls">
      {/* ── Top Controls: 3D Subterranean View Mode & Camera Reset ────── */}
      <div className="sub-dock-grid sub-dock-top">
        <button
          type="button"
          className={`sub-icon-btn ${undergroundVisible ? 'active' : 'inactive'}`}
          onClick={toggleUnderground}
          title={`Subterranean 3D Mode: ${undergroundVisible ? 'ON' : 'OFF'}`}
          aria-label="Subterranean 3D Mode"
          aria-pressed={undergroundVisible}
        >
          <LayersIcon />
        </button>

        <button
          type="button"
          className="sub-icon-btn action-btn"
          onClick={resetCamera}
          title="Reset Camera View"
          aria-label="Reset Camera View"
        >
          <ResetIcon />
        </button>
      </div>

      <div className="sub-dock-divider" role="separator" />

      {/* ── Storm Water Drainage Pipeline Only ──────────────────── */}
      <div className="sub-dock-single">
        <button
          type="button"
          className={`sub-icon-btn sub-drainage-btn ${isDrainageVisible ? 'active' : 'inactive'}`}
          style={{
            '--infra-color': '#2dd4bf',
          } as React.CSSProperties}
          onClick={() => toggleInfraType('drainage')}
          title={`Drainage Pipe Network: ${isDrainageVisible ? 'Visible' : 'Hidden'}`}
          aria-label="Drainage Pipeline"
          aria-pressed={isDrainageVisible}
        >
          <span className="sub-btn-icon" style={{ color: isDrainageVisible ? '#2dd4bf' : undefined }}>
            <DrainageIcon />
          </span>
        </button>
      </div>
    </aside>
  )
}
