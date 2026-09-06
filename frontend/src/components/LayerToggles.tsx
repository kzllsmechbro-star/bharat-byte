import { useLocalityStore } from '../store/localityStore'

/**
 * Two stacked floating buttons (top-right):
 *  1. Reset Camera  — always present
 *  2. Eye toggle    — reveal / hide underground infrastructure layer
 */
export function LayerToggles() {
  const resetCamera        = useLocalityStore((s) => s.resetCamera)
  const undergroundVisible = useLocalityStore((s) => s.undergroundVisible)
  const toggleUnderground  = useLocalityStore((s) => s.toggleUnderground)

  return (
    <>
      {/* ── Reset camera ──────────────────────────────────────────────── */}
      <button
        type="button"
        className="reset-camera-floating-btn"
        onClick={resetCamera}
        title="Reset 3D camera to overview"
        aria-label="Reset camera to overview"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
        Reset Camera
      </button>

      {/* ── Underground utilities toggle (eye icon) ────────────────────── */}
      <button
        type="button"
        className={`underground-toggle-btn${undergroundVisible ? ' underground-toggle-active' : ''}`}
        onClick={toggleUnderground}
        title={undergroundVisible ? 'Hide underground infrastructure' : 'Reveal underground infrastructure'}
        aria-label={undergroundVisible ? 'Hide underground layer' : 'Show underground layer'}
        aria-pressed={undergroundVisible}
      >
        {undergroundVisible ? (
          /* Eye-open (layer visible) */
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          /* Eye-slash (layer hidden) */
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1 1 0 000-.7C17.523 5.943 13.932 3 10 3a9.958 9.958 0 00-4.512 1.074L3.28 2.22zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
              clipRule="evenodd"
            />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10a1 1 0 000 .7C1.732 14.057 5.522 17 10 17c1.347 0 2.638-.27 3.819-.76l-1.365-1.543z" />
          </svg>
        )}
        {undergroundVisible ? 'Hide Utilities' : 'Underground'}
      </button>
    </>
  )
}
