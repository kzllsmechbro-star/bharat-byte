import { useEffect } from 'react'

import './App.css'
import { LocalityScene } from './scenes/LocalityScene'
import { SceneErrorBoundary } from './components/SceneErrorBoundary'
import { UlpinInfoPanel } from './components/UlpinInfoPanel'
import { SearchBar } from './components/SearchBar'
import { LayerToggles } from './components/LayerToggles'
import { Legend } from './components/Legend'
import { BuildingListPanel } from './components/BuildingListPanel'
import { SubterraneanPanel } from './components/SubterraneanPanel'
import { ViewPanel } from './components/ViewPanel'
import { useLocalityStore } from './store/localityStore'

function App() {
  const isLoading = useLocalityStore((state) => state.isLoading)
  const error = useLocalityStore((state) => state.error)
  const loadInitialData = useLocalityStore((state) => state.loadInitialData)
  const activeRightTab = useLocalityStore((state) => state.activeRightTab)

  useEffect(() => {
    void loadInitialData()
  }, [loadInitialData])

  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)

  if (isLoading) {
    return (
      <main className="pipeline-status" aria-live="polite">
        <div className="spinner" />
        <p>Loading locality spatial data…</p>
      </main>
    )
  }

  return (
    <main className="scene-shell">
      {/* 3D Scene Viewport protected by Error Boundary */}
      <SceneErrorBoundary>
        <LocalityScene />
      </SceneErrorBoundary>

      {/* Top Center Search Header — hidden in underground mode */}
      {!undergroundVisible && (
        <header className="top-navigation-bar">
          <div className="branding-title">
            <span className="badge-sih">sih26011</span>
            <h1>3D ULPIN System</h1>
          </div>
          <SearchBar />
        </header>
      )}

      {/* Offline notice toast when backend is unreachable */}
      {error && !undergroundVisible && (
        <div className="fixed bottom-4 right-4 z-40 bg-slate-900/95 border border-amber-500/60 text-amber-200 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 shadow-2xl backdrop-blur-sm">
          <span>Backend offline (port 8000). Showing cached/simulated locality.</span>
        </div>
      )}

      {/* Selection Inspector (Top Left) */}
      <UlpinInfoPanel />

      {/* Minimalist Vertical Tab Bar (Right Edge) — in underground mode, only shows the turn-off button */}
      <LayerToggles />

      {/* Dynamic Right Sidebar Panels — hidden in underground mode */}
      {!undergroundVisible && activeRightTab === 'underground' && <SubterraneanPanel />}
      {!undergroundVisible && activeRightTab === 'view' && <ViewPanel />}

      {/* Buildings Directory Drawer (Bottom Right) — hidden in underground mode */}
      {!undergroundVisible && <BuildingListPanel />}

      {/* Color Code Legend (Bottom Left) — hidden in underground mode */}
      {!undergroundVisible && <Legend />}
    </main>
  )
}

export default App

