import { useEffect } from 'react'

import './App.css'
import { LocalityScene } from './scenes/LocalityScene'
import { SceneErrorBoundary } from './components/SceneErrorBoundary'
import { UlpinInfoPanel } from './components/UlpinInfoPanel'
import { SearchBar } from './components/SearchBar'
import { LayerToggles } from './components/LayerToggles'
import { Legend } from './components/Legend'
import { BuildingListPanel } from './components/BuildingListPanel'
import { useLocalityStore } from './store/localityStore'

function App() {
  const isLoading = useLocalityStore((state) => state.isLoading)
  const error = useLocalityStore((state) => state.error)
  const loadInitialData = useLocalityStore((state) => state.loadInitialData)

  useEffect(() => {
    void loadInitialData()
  }, [loadInitialData])

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

      {/* Top Center Search Header */}
      <header className="top-navigation-bar">
        <div className="branding-title">
          <span className="badge-sih">SIH26011</span>
          <h1>3D ULPIN System</h1>
        </div>
        <SearchBar />
      </header>

      {/* Offline notice toast when backend is unreachable */}
      {error && (
        <div className="fixed bottom-4 right-4 z-40 bg-slate-900/95 border border-amber-500/60 text-amber-200 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 shadow-2xl backdrop-blur-sm">
          <span>⚠️ Backend offline (port 8000). Showing cached/simulated locality.</span>
        </div>
      )}

      {/* Selection Inspector (Top Left) */}
      <UlpinInfoPanel />

      {/* Layer Controls & Type Filters (Top Right) */}
      <LayerToggles />

      {/* Buildings Directory Drawer (Right Side) */}
      <BuildingListPanel />

      {/* Color Code Legend (Bottom Left) */}
      <Legend />
    </main>
  )
}

export default App

