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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function ViewPanel() {
  const resetCamera = useLocalityStore((s) => s.resetCamera)
  const flyToTarget = useLocalityStore((s) => s.flyToTarget)
  const toggleUnderground = useLocalityStore((s) => s.toggleUnderground)
  const undergroundVisible = useLocalityStore((s) => s.undergroundVisible)

  const timeOfDay = useLocalityStore((s) => s.timeOfDay)
  const isRealTime = useLocalityStore((s) => s.isRealTime)
  const setTimeOfDay = useLocalityStore((s) => s.setTimeOfDay)
  const toggleRealTime = useLocalityStore((s) => s.toggleRealTime)
  const weatherMode = useLocalityStore((s) => s.weatherMode)
  const setWeatherMode = useLocalityStore((s) => s.setWeatherMode)

  const hours = Math.floor(timeOfDay)
  const mins = Math.floor((timeOfDay % 1) * 60)
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`

  return (
    <aside className="subterranean-panel classy-dual-tone" aria-label="Camera and Celestial Controls">
      <div className="sub-panel-header">
        <div className="sub-panel-title-group">
          <EyeIcon />
          <span className="sub-panel-title">Environment &amp; View</span>
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

      {/* ── Real-Life Time & Celestial Atmosphere Section ── */}
      <div className="sub-section">
        <div className="sub-section-header">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <ClockIcon />
            <span>Celestial Sky &amp; Atmosphere</span>
          </div>
          <button
            type="button"
            className={`realtime-badge-btn ${isRealTime ? 'active' : ''}`}
            onClick={toggleRealTime}
            title={isRealTime ? 'Click to switch to manual time control' : 'Click to sync with real local time'}
          >
            <span className="live-dot" />
            <span>{isRealTime ? 'Live Sync' : 'Manual'}</span>
          </button>
        </div>

        {/* Time Scrubber & Digital Display */}
        <div className="time-scrubber-box">
          <div className="time-scrubber-top">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              {timeOfDay >= 6 && timeOfDay <= 18 ? <SunIcon /> : <MoonIcon />}
              <span>{timeOfDay >= 6 && timeOfDay <= 18 ? 'Daytime' : 'Night Sky'}</span>
            </div>
            <span className="time-digital-display">{timeFormatted}</span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="0.05"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(Number.parseFloat(e.target.value))}
            className="time-slider"
            aria-label="Time of Day Slider"
          />
          <div className="time-slider-ticks">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>

        {/* Quick Time of Day Presets */}
        <div className="time-presets-grid">
          <button
            type="button"
            className={`time-preset-chip ${Math.abs(timeOfDay - 6) < 0.8 && !isRealTime ? 'selected' : ''}`}
            onClick={() => setTimeOfDay(6.0)}
          >
            Dawn
          </button>
          <button
            type="button"
            className={`time-preset-chip ${Math.abs(timeOfDay - 12) < 0.8 && !isRealTime ? 'selected' : ''}`}
            onClick={() => setTimeOfDay(12.0)}
          >
            Midday
          </button>
          <button
            type="button"
            className={`time-preset-chip ${Math.abs(timeOfDay - 18) < 0.8 && !isRealTime ? 'selected' : ''}`}
            onClick={() => setTimeOfDay(18.0)}
          >
            Sunset
          </button>
          <button
            type="button"
            className={`time-preset-chip ${Math.abs(timeOfDay - 21) < 0.8 && !isRealTime ? 'selected' : ''}`}
            onClick={() => setTimeOfDay(21.0)}
          >
            Night
          </button>
          <button
            type="button"
            className={`time-preset-chip ${Math.abs(timeOfDay - 0) < 0.8 && !isRealTime ? 'selected' : ''}`}
            onClick={() => setTimeOfDay(0.0)}
          >
            Midnight
          </button>
        </div>

        {/* Dynamic Cloud & Weather Simulation */}
        <div className="weather-modes-row mt-2">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <CloudIcon />
            <span>Weather Simulation:</span>
          </span>
          <div className="weather-chips-group">
            <button
              type="button"
              className={`weather-chip ${weatherMode === 'clear' ? 'active' : ''}`}
              onClick={() => setWeatherMode('clear')}
              title="Clear Sky without clouds"
            >
              Clear
            </button>
            <button
              type="button"
              className={`weather-chip ${weatherMode === 'clouds' ? 'active' : ''}`}
              onClick={() => setWeatherMode('clouds')}
              title="Drifting Cumulus Clouds"
            >
              Clouds
            </button>
            <button
              type="button"
              className={`weather-chip monsoon ${weatherMode === 'monsoon' ? 'active' : ''}`}
              onClick={() => setWeatherMode('monsoon')}
              title="Bengaluru Monsoon Rain Simulation"
            >
              🌧️ Monsoon
            </button>
          </div>
        </div>
      </div>

      {/* ── Perspective Presets ── */}
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

