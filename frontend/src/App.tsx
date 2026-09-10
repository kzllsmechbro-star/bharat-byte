import { useEffect } from 'react'

import './App.css'
import { LocalityScene } from './scenes/LocalityScene'
import { SceneErrorBoundary } from './components/SceneErrorBoundary'
import { UlpinInfoPanel } from './components/UlpinInfoPanel'
import { SearchBar } from './components/SearchBar'
import { LayerToggles } from './components/LayerToggles'
import { Legend } from './components/Legend'
import { SubterraneanPanel } from './components/SubterraneanPanel'
import { ViewPanel } from './components/ViewPanel'
import { UlpinDocumentModal } from './components/UlpinDocumentModal'
import { useLocalityStore } from './store/localityStore'

/* ── Branded 3D cube SVG icon ─────────────────────────────────────────────── */
function UlpinLogoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" width="28" height="28" aria-hidden="true">
      <path d="M16 3L28 9.5V22.5L16 29L4 22.5V9.5L16 3Z" stroke="#2dd4bf" strokeWidth="1.5" fill="rgba(45,212,191,0.08)" />
      <path d="M16 3L16 16M16 16L28 9.5M16 16L4 9.5" stroke="#2dd4bf" strokeWidth="1" strokeDasharray="2 1" opacity="0.5" />
      <circle cx="16" cy="16" r="3" fill="#2dd4bf" opacity="0.8" />
    </svg>
  )
}

/* ── Loading Splash ─────────────────────────────────────────────────────────── */
function SplashScreen() {
  return (
    <main className="pipeline-status" aria-live="polite">
      <div className="splash-logo">
        <div className="splash-logo-icon">
          <UlpinLogoIcon />
        </div>
        <h1 className="splash-title">3D ULPIN</h1>
        <p className="splash-subtitle">Spatial Land Registry System</p>
      </div>

      <div className="splash-loading-wrap">
        <div className="splash-spinner" />
        <p className="splash-status-text">Loading spatial data…</p>
      </div>

      <div className="splash-badge">
        <span className="splash-badge-dot" />
        Smart India Hackathon 2026
      </div>
    </main>
  )
}

function App() {
  const isLoading = useLocalityStore((state) => state.isLoading)
  const error = useLocalityStore((state) => state.error)
  const loadInitialData = useLocalityStore((state) => state.loadInitialData)
  const activeRightTab = useLocalityStore((state) => state.activeRightTab)
  const buildings = useLocalityStore((state) => state.buildings)
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)

  useEffect(() => {
    void loadInitialData()
  }, [loadInitialData])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <main className="scene-shell">
      {/* 3D Scene Viewport */}
      <SceneErrorBoundary>
        <LocalityScene />
      </SceneErrorBoundary>

      {/* Top Navigation Bar — hidden in underground mode */}
      {!undergroundVisible && (
        <header className="top-navigation-bar">
          {/* Branding Block */}
          <div className="branding-title">
            <div className="branding-inner">
              <div className="branding-icon">
                <UlpinLogoIcon />
              </div>
              <div className="branding-text-group">
                <h1>3D ULPIN System</h1>
                <span className="badge-sih">SIH 2026</span>
              </div>
            </div>
            {buildings.length > 0 && (
              <div className="branding-stat">
                <span className="branding-stat-dot" />
                {buildings.length.toLocaleString()} parcels
              </div>
            )}
          </div>

          {/* Search */}
          <SearchBar />
        </header>
      )}

      {/* Offline notice */}
      {error && !undergroundVisible && (
        <div className="offline-toast" role="status">
          <span className="offline-toast-dot" />
          <span>Backend offline — showing cached locality data</span>
        </div>
      )}

      {/* Selection Inspector (Top Left) */}
      <UlpinInfoPanel />

      {/* Dynamic ULPIN Document Generator & Viewer Modal */}
      <UlpinDocumentModal />

      {/* Vertical Tab Bar (Right Edge) */}
      <LayerToggles />

      {/* Right Sidebar Panels */}
      {!undergroundVisible && activeRightTab === 'underground' && <SubterraneanPanel />}
      {!undergroundVisible && activeRightTab === 'view' && <ViewPanel />}

      {/* Map Legend (Bottom Left) */}
      {!undergroundVisible && <Legend />}
    </main>
  )
}

export default App
