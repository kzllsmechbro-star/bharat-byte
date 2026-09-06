import { useLocalityStore } from '../store/localityStore'

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function ViewPanel() {
  const resetCamera = useLocalityStore((s) => s.resetCamera)
  const flyToTarget = useLocalityStore((s) => s.flyToTarget)
  const toggleUnderground = useLocalityStore((s) => s.toggleUnderground)
  const undergroundVisible = useLocalityStore((s) => s.undergroundVisible)

  return (
    <aside className="subterranean-panel classy-dual-tone" aria-label="Camera Controls">
      <div className="sub-panel-header">
        <div className="sub-panel-title-group">
          <EyeIcon />
          <span className="sub-panel-title">Camera &amp; Viewports</span>
        </div>
        <button
          type="button"
          className="icon-action-btn"
          onClick={resetCamera}
          title="Reset camera view"
          aria-label="Reset camera view"
        >
          <ResetIcon />
        </button>
      </div>

      <div className="sub-section">
        <div className="sub-section-header">
          <span className="sub-section-title">Perspective Presets</span>
        </div>

        <div className="view-presets-list">
          <button
            type="button"
            className="view-preset-btn"
            onClick={resetCamera}
          >
            <GlobeIcon />
            <div>
              <div className="preset-name">Bird's Eye Overview</div>
              <div className="preset-desc">Standard isometric perspective (550m)</div>
            </div>
          </button>

          <button
            type="button"
            className="view-preset-btn"
            onClick={() => flyToTarget([0, 0, 0], [0, 950, 0])}
          >
            <CompassIcon />
            <div>
              <div className="preset-name">Cadastral Plan (Top-Down)</div>
              <div className="preset-desc">90° overhead 2D alignment</div>
            </div>
          </button>

          <button
            type="button"
            className="view-preset-btn"
            onClick={() => {
              if (!undergroundVisible) toggleUnderground()
              else flyToTarget([0, -12, 0], [320, 18, 380])
            }}
          >
            <LayersIcon />
            <div>
              <div className="preset-name">Subterranean Cross-Section</div>
              <div className="preset-desc">Ground-level cutaway for utility inspection</div>
            </div>
          </button>

          <button
            type="button"
            className="view-preset-btn"
            onClick={() => flyToTarget([0, 8, 0], [140, 24, 140])}
          >
            <EyeIcon />
            <div>
              <div className="preset-name">Pedestrian Walkthrough</div>
              <div className="preset-desc">Ground elevation (24m eye level)</div>
            </div>
          </button>
        </div>
      </div>

      <div className="sub-section">
        <div className="sub-section-header">
          <span className="sub-section-title">Navigation Gestures</span>
        </div>
        <div className="navigation-shortcuts">
          <div className="shortcut-row">
            <span className="shortcut-key">LMB Drag</span>
            <span className="shortcut-action">Orbit Rotate</span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-key">MMB / Space+LMB</span>
            <span className="shortcut-action">Pan Viewport</span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-key">Wheel</span>
            <span className="shortcut-action">Zoom In / Out</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
