import { useLocalityStore } from '../store/localityStore'
import type { RightTab } from '../types/spatial'

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}


function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

export function LayerToggles() {
  const activeRightTab = useLocalityStore((s) => s.activeRightTab)
  const setActiveRightTab = useLocalityStore((s) => s.setActiveRightTab)
  const undergroundVisible = useLocalityStore((s) => s.undergroundVisible)
  const toggleUnderground = useLocalityStore((s) => s.toggleUnderground)
  const resetCamera = useLocalityStore((s) => s.resetCamera)

  const handleTabClick = (tab: RightTab) => {
    if (activeRightTab === tab) {
      setActiveRightTab(null)
    } else {
      setActiveRightTab(tab)
      if (tab === 'underground' && !undergroundVisible) {
        toggleUnderground()
      }
    }
  }

  /* ── Underground mode: only show Exit button ─────────────────────────────── */
  if (undergroundVisible) {
    return (
      <nav className="vertical-tab-bar classy-dual-tone underground-exit-bar" aria-label="Exit Underground View">
        <button
          type="button"
          className="vtab vtab-active vtab-exit-underground"
          onClick={toggleUnderground}
          title="Return to city view"
          aria-label="Turn off underground view"
        >
          <LayersIcon />
          <span className="vtab-tooltip">Exit Underground</span>
        </button>
      </nav>
    )
  }

  return (
    <nav className="vertical-tab-bar classy-dual-tone" aria-label="Sidebar Navigation">

      {/* Reset Camera */}
      <button
        type="button"
        className="vtab-action-btn"
        onClick={resetCamera}
        aria-label="Reset camera view"
        id="btn-reset-camera"
      >
        <ResetIcon />
        <span className="vtab-action-btn-tooltip">Reset Camera</span>
      </button>

      {/* Separator */}
      <div className="vtab-separator" role="separator" />


      {/* Camera / View Tab */}
      <button
        type="button"
        className={`vtab ${activeRightTab === 'view' ? 'vtab-active' : ''}`}
        onClick={() => handleTabClick('view')}
        aria-label="Camera & Viewport Controls"
        aria-pressed={activeRightTab === 'view'}
        id="btn-tab-view"
      >
        <ViewIcon />
        <span className="vtab-tooltip">Camera & Views</span>
      </button>

      {/* Underground / Subterranean Tab */}
      <button
        type="button"
        className={`vtab ${activeRightTab === 'underground' ? 'vtab-active' : ''}`}
        onClick={() => handleTabClick('underground')}
        aria-label="Subterranean Utility Layers"
        aria-pressed={activeRightTab === 'underground'}
        id="btn-tab-underground"
      >
        <LayersIcon />
        {/* Notification dot indicating underground data is available */}
        <span className="vtab-notif-dot" aria-hidden="true" />
        <span className="vtab-tooltip">Underground Layers</span>
      </button>

    </nav>
  )
}
