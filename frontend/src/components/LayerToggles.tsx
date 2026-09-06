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

function ItemIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
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

  // When underground view is active: hide all other buttons, showing ONLY the turn-off button
  if (undergroundVisible) {
    return (
      <nav className="vertical-tab-bar classy-dual-tone underground-exit-bar" aria-label="Exit Underground View">
        <button
          type="button"
          className="vtab vtab-active vtab-exit-underground"
          onClick={toggleUnderground}
          title="Turn off underground view (Return to city)"
          aria-label="Turn off underground view"
        >
          <LayersIcon />
        </button>
      </nav>
    )
  }

  return (
    <nav className="vertical-tab-bar classy-dual-tone" aria-label="Sidebar Navigation">
      {/* ── Quick Reset Camera ────────────────────────────────────────── */}
      <button
        type="button"
        className="vtab-action-btn"
        onClick={resetCamera}
        title="Reset camera view"
        aria-label="Reset camera view"
      >
        <ResetIcon />
      </button>

      {/* ── Sidebar Tabs (Icon-Only) ──────────────────────────────────── */}
      <button
        type="button"
        className={`vtab ${activeRightTab === 'item' ? 'vtab-active' : ''}`}
        onClick={() => handleTabClick('item')}
        title="ULPIN Item Inspector"
        aria-label="ULPIN Item Inspector"
      >
        <ItemIcon />
      </button>

      <button
        type="button"
        className={`vtab ${activeRightTab === 'view' ? 'vtab-active' : ''}`}
        onClick={() => handleTabClick('view')}
        title="Camera & Viewport Controls"
        aria-label="Camera & Viewport Controls"
      >
        <ViewIcon />
      </button>

      <button
        type="button"
        className={`vtab ${activeRightTab === 'underground' ? 'vtab-active' : ''}`}
        onClick={() => handleTabClick('underground')}
        title="Subterranean Utility Layers"
        aria-label="Subterranean Utility Layers"
      >
        <LayersIcon />
      </button>
    </nav>
  )
}
