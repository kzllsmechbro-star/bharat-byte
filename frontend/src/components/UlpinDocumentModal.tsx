/* oxlint-disable react(set-state-in-effect) -- selection loading state is intentionally immediate. */
import { useEffect, useState, useMemo } from 'react'
import { useLocalityStore } from '../store/localityStore'
import { getBuildingFloors, getFloorUnits } from '../api/client'
import type { Floor, Unit } from '../types/spatial'
import {
  calculateBoundingDimensions,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  evaluateSubterraneanClearances,
  generateDeterministicSpatialHash,
} from '../utils/spatialCalculations'
import { generateUlpinPdf } from '../utils/ulpinPdfGenerator'

function cleanStructureName(houseNo: string | null | undefined, name: string | null | undefined, code: string): string {
  const h = houseNo?.trim()
  const n = name?.trim()
  if (n && h && n.includes(h)) return n
  if (h && n) return `${h} — ${n}`
  return n || (h ? `House ${h}` : `Building ${code}`)
}

export function UlpinDocumentModal() {
  const building = useLocalityStore((state) => state.activeDocumentBuilding)
  const closeDocumentModal = useLocalityStore((state) => state.closeDocumentModal)
  const undergroundInfra = useLocalityStore((state) => state.undergroundInfra)

  const [floors, setFloors] = useState<Floor[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const [copied, setCopied] = useState(false)

  // Fetch floors and units for this specific building when modal opens
  useEffect(() => {
    if (!building) {
      setFloors([])
      setUnits([])
      return
    }

    let isSubscribed = true
    setIsLoadingDetails(true)

    // Check if building already has cached floors
    if (building.floors && building.floors.length > 0) {
      const immediateFloors: Floor[] = building.floors.map((f) => ({
        id: `${building.id}-${f.floor_code}`,
        building_id: building.id,
        floor_code: f.floor_code,
        floor_number: f.floor_number,
        is_underground: f.floor_code.startsWith('F-U'),
        footprint: building.footprint,
        height_meters: f.height_meters || 3.5,
      }))

      const immediateUnits: Unit[] = []
      for (const f of building.floors) {
        const fId = `${building.id}-${f.floor_code}`
        for (const u of f.units || []) {
          immediateUnits.push({
            ...u,
            id: `${fId}-${u.unit_code}`,
            floor_id: fId,
            footprint: building.footprint,
          })
        }
      }

      setFloors(immediateFloors)
      setUnits(immediateUnits)
      setIsLoadingDetails(false)
      return
    }

    // Otherwise fetch dynamically from API client
    getBuildingFloors(building.id)
      .then(async (fetchedFloors) => {
        if (!isSubscribed) return
        setFloors(fetchedFloors)

        const allUnits: Unit[] = []
        for (const f of fetchedFloors.slice(0, 10)) {
          try {
            const fUnits = await getFloorUnits(f.id)
            allUnits.push(...fUnits)
          } catch {
            // Ignore unit fetch error for individual floors
          }
        }

        if (isSubscribed) {
          setUnits(allUnits)
          setIsLoadingDetails(false)
        }
      })
      .catch((err: unknown) => {
        console.error('[ULPIN Document Modal] Failed to load floors', err)
        if (isSubscribed) setIsLoadingDetails(false)
      })

    return () => {
      isSubscribed = false
    }
  }, [building])

  // Calculated spatial metrics for this specific home/building
  const metrics = useMemo(() => {
    if (!building) return null
    const areaM2 = calculatePolygonArea(building.footprint)
    const areaSqFt = Math.round(areaM2 * 10.7639)
    const perimeterM = calculatePolygonPerimeter(building.footprint)
    const dimensions = calculateBoundingDimensions(building.footprint)
    const storiesCount = building.stories_count || (floors.length > 0 ? floors.length : 1)
    const heightM = building.height_meters || storiesCount * 3.5
    const volumeM3 = Math.round(areaM2 * heightM * 10) / 10
    const spatialHash = generateDeterministicSpatialHash(building.base_ulpin, building.building_code, areaM2, heightM)
    const clearances = evaluateSubterraneanClearances(building.center, undergroundInfra)
    const full3DUlpin = `${building.base_ulpin}-${building.building_code}`
    const certId = `IN-3D-ULPIN-${building.base_ulpin.slice(0, 6)}-${building.building_code}-${building.base_ulpin.slice(-4)}`

    return {
      areaM2,
      areaSqFt,
      perimeterM,
      dimensions,
      storiesCount,
      heightM,
      volumeM3,
      spatialHash,
      clearances,
      full3DUlpin,
      certId,
    }
  }, [building, floors, undergroundInfra])


  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDocumentModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeDocumentModal])

  if (!building || !metrics) return null

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true)
      await generateUlpinPdf({
        building,
        floors,
        units,
        undergroundInfra,
      })
    } catch (err) {
      console.error('[ULPIN Document] PDF Generation failed', err)
      alert('Failed to generate PDF document. Please check console.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyUlpin = async () => {
    try {
      await navigator.clipboard.writeText(metrics.full3DUlpin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard error
    }
  }

  return (
    <div className="ulpin-modal-backdrop" onClick={closeDocumentModal} role="dialog" aria-modal="true">
      <div className="ulpin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="ulpin-modal-topbar no-print">
          <div className="flex items-center gap-2">
            <span className="modal-badge-live">Live Cadastral Generator</span>
            <span className="text-xs text-slate-300">
              {building.house_no || `Building ${building.building_code}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="modal-action-btn copy-btn"
              onClick={handleCopyUlpin}
              title="Copy 3D ULPIN Code"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copied ? 'Copied ULPIN' : 'Copy ULPIN'}</span>
            </button>

            <button
              type="button"
              className="modal-action-btn print-btn"
              onClick={handlePrint}
              title="Print Official Document / Save as PDF"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Document</span>
            </button>

            <button
              type="button"
              className="modal-action-btn download-btn"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Download Vector PDF Certificate"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="mini-spinner" />
                  <span>Generating PDF…</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download PDF Document</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="modal-close-icon-btn"
              onClick={closeDocumentModal}
              title="Close (ESC)"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Official Printable Certificate Paper Sheet ──────────────────── */}
        <div className="ulpin-cert-paper" id="printable-ulpin-certificate">
          {/* Decorative Tri-color Header Ribbon */}
          <div className="cert-tricolor-bar">
            <span className="bar-saffron" />
            <span className="bar-white" />
            <span className="bar-green" />
          </div>

          {/* Certificate Inner Double Border Frame */}
          <div className="cert-inner-frame">
            {/* National Header */}
            <header className="cert-header">
              <div className="cert-emblem-badge">
                <svg viewBox="0 0 32 32" fill="none" width="34" height="34" aria-hidden="true">
                  <path d="M16 2L28 8.5V23.5L16 30L4 23.5V8.5L16 2Z" stroke="#d97706" strokeWidth="1.5" fill="#fef3c7" />
                  <circle cx="16" cy="16" r="6" stroke="#0284c7" strokeWidth="1.2" fill="none" />
                  <path d="M16 10V22M10 16H22" stroke="#0284c7" strokeWidth="1" strokeDasharray="1.5 1.5" />
                  <circle cx="16" cy="16" r="2" fill="#0284c7" />
                </svg>
              </div>

              <div className="cert-header-titles">
                <span className="cert-govt-subhead">GOVERNMENT OF INDIA • DEPARTMENT OF LAND RESOURCES</span>
                <span className="cert-dilrmp">DIGITAL INDIA LAND RECORDS MODERNIZATION PROGRAMME (DILRMP)</span>
                <h1 className="cert-main-title">3D BHU-AADHAAR / ULPIN CADASTRAL PROPERTY RECORD</h1>
                <span className="cert-form-tag">
                  FORM 3D-B: CERTIFICATE OF SPATIAL VERTICAL TITLE & VOLUMETRIC REGISTRATION
                </span>
              </div>

              <div className="cert-sih-tag">
                <span className="sih-badge-pill">SIH 2026</span>
                <span className="cert-auth-tag">VERIFIED 3D</span>
              </div>
            </header>

            {/* Primary Hero Identification Box */}
            <section className="cert-hero-box">
              <div className="hero-left">
                <div className="hero-label">PRIMARY 3D ULPIN (BHU-AADHAAR)</div>
                <div className="hero-code">{metrics.full3DUlpin}</div>
                <div className="hero-sublines">
                  <div>
                    <span className="text-slate-500">SURFACE BASE ULPIN:</span>{' '}
                    <strong className="text-slate-800 font-mono">{building.base_ulpin}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">BUILDING CODE:</span>{' '}
                    <strong className="text-slate-800">{building.building_code}</strong>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">CERTIFICATE NO:</span>{' '}
                    <strong className="text-slate-800 font-mono">{metrics.certId}</strong>
                  </div>
                </div>
              </div>


            </section>

            {/* 1. Property Identity & Address Table */}
            <section className="cert-section">
              <div className="cert-section-header">
                <span className="sec-num">1</span>
                <h3>PROPERTY IDENTITY & PHYSICAL ADDRESS</h3>
              </div>

              <table className="cert-table">
                <tbody>
                  <tr>
                    <td className="cell-label">House / Structure:</td>
                    <td className="cell-val font-semibold">
                      {cleanStructureName(building.house_no, building.name, building.building_code)}
                    </td>
                    <td className="cell-label">Structure Category:</td>
                    <td className="cell-val capitalize">
                      {(building.structure_category || building.building_type).replace(/_/g, ' ')}
                    </td>
                  </tr>
                  <tr>
                    <td className="cell-label">Complex / Layout:</td>
                    <td className="cell-val">
                      {building.complex_name || 'Individual Freehold Parcel'}
                    </td>
                    <td className="cell-label">Construction Status:</td>
                    <td className="cell-val">
                      {building.building_type === 'half_built'
                        ? 'Under Construction / Partially Built'
                        : 'Completed & Verified (3D As-Built)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="cell-label">Jurisdiction / State:</td>
                    <td className="cell-val">
                      Karnataka (State 29)
                    </td>
                    <td className="cell-label">Cadastral Authority:</td>
                    <td className="cell-val">
                      BBMP / Bengaluru Urban Division
                    </td>
                  </tr>
                  <tr>
                    <td className="cell-label">Registered Postal Address:</td>
                    <td className="cell-val" colSpan={3}>
                      {building.postal_address || `Plot ${building.house_no || building.building_code}, Bengaluru Urban, Karnataka`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* 2. Spatial Geometry & Volumetric Boundary */}
            <section className="cert-section">
              <div className="cert-section-header">
                <span className="sec-num">2</span>
                <h3>SPATIAL GEOMETRY & 3D VOLUMETRIC EXTENTS</h3>
              </div>

              <div className="spatial-metrics-grid">
                <div className="metric-card">
                  <span className="m-label">Plinth Footprint Area</span>
                  <span className="m-val">{metrics.areaM2.toFixed(1)} m²</span>
                  <span className="m-sub">≈ {metrics.areaSqFt.toLocaleString()} sq.ft</span>
                </div>
                <div className="metric-card">
                  <span className="m-label">Structural Height</span>
                  <span className="m-val">{metrics.heightM.toFixed(1)} m</span>
                  <span className="m-sub">Above ground level</span>
                </div>
                <div className="metric-card">
                  <span className="m-label">Volumetric Capacity</span>
                  <span className="m-val">{metrics.volumeM3.toLocaleString()} m³</span>
                  <span className="m-sub">Total 3D spatial space</span>
                </div>
                <div className="metric-card">
                  <span className="m-label">Boundary Perimeter</span>
                  <span className="m-val">{metrics.perimeterM.toFixed(1)} m</span>
                  <span className="m-sub">{metrics.dimensions.length}m × {metrics.dimensions.width}m footprint</span>
                </div>
              </div>

              <div className="centroid-strip">
                <div>
                  <span className="text-slate-500">Centroid Locality Coords:</span>{' '}
                  <span className="font-mono text-slate-800">
                    {building.center ? `X: ${building.center[0].toFixed(2)}, Y: ${building.center[1].toFixed(2)}` : 'Verified Origin'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Spatial Hash:</span>{' '}
                  <span className="font-mono text-slate-800 text-[11px]">{metrics.spatialHash}</span>
                </div>
              </div>
            </section>

            {/* 3. Vertical Property Division & Floor Schedule */}
            <section className="cert-section">
              <div className="cert-section-header">
                <span className="sec-num">3</span>
                <h3>VERTICAL PROPERTY DIVISION & FLOOR SCHEDULE ({metrics.storiesCount} Levels)</h3>
              </div>

              <div className="table-responsive">
                <table className="cert-table vertical-table">
                  <thead>
                    <tr>
                      <th>Level / Story</th>
                      <th>Floor Code</th>
                      <th>3D Floor / Unit ULPIN</th>
                      <th>Elevation (Z)</th>
                      <th>Units / Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(floors.length > 0 ? floors : [
                      {
                        id: `${building.id}-F001`,
                        building_id: building.id,
                        floor_code: 'F001',
                        floor_number: 1,
                        is_underground: false,
                        footprint: building.footprint,
                        height_meters: metrics.heightM,
                      },
                    ]).slice(0, 8).map((f, idx, arr) => {
                      const floorH = f.height_meters || 3.5
                      const zStart = arr.slice(0, idx).reduce((sum, prev) => sum + (prev.height_meters || 3.5), 0)
                      const zEnd = zStart + floorH
                      const floorUlpin = `${building.base_ulpin}-${building.building_code}-${f.floor_code}`
                      const floorUnits = units.filter((u) => u.floor_id === f.id || u.floor_id === `${building.id}-${f.floor_code}`)

                      return (
                        <tr key={f.id}>
                          <td className="font-semibold">
                            {f.floor_number === 1 ? 'Ground Level (F1)' : `Level ${f.floor_number}`}
                          </td>
                          <td className="font-mono">{f.floor_code}</td>
                          <td className="font-mono font-medium text-slate-800">{floorUlpin}</td>
                          <td className="font-mono">+{zStart.toFixed(1)}m to +{zEnd.toFixed(1)}m</td>
                          <td>
                            {floorUnits.length > 0 ? (
                              <span className="units-tag">
                                {floorUnits.length} Flat(s): {floorUnits.map((u) => u.unit_number || u.unit_code).slice(0, 3).join(', ')}
                                {floorUnits.length > 3 ? '…' : ''}
                              </span>
                            ) : building.building_type === 'house' ? (
                              <span className="text-slate-600">Single Household Unit</span>
                            ) : (
                              <span className="text-slate-600">Standard Floor Extent</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {isLoadingDetails && (
                <div className="text-center text-xs text-slate-400 py-1">Loading vertical unit breakdown…</div>
              )}
            </section>

            {/* 4. Subterranean Infrastructure & Environmental Clearance */}
            <section className="cert-section">
              <div className="cert-section-header">
                <span className="sec-num">4</span>
                <h3>SUBTERRANEAN GIS CLEARANCE & INFRASTRUCTURE PROXIMITY</h3>
              </div>

              <table className="cert-table clearance-table">
                <thead>
                  <tr>
                    <th>Subterranean Utility Network</th>
                    <th>Measured Lateral Proximity</th>
                    <th>Subsurface Depth</th>
                    <th>Clearance Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.clearances.map((cl) => (
                    <tr key={cl.infraType}>
                      <td className="font-medium text-slate-800">{cl.label}</td>
                      <td>{cl.closestDistanceMeters.toFixed(1)} meters lateral buffer</td>
                      <td>{cl.depthMeters.toFixed(1)} meters underground</td>
                      <td>
                        <span className={`status-pill ${cl.clearanceStatus === 'Compliant (Safe Buffer)' ? 'pill-pass' : 'pill-warn'}`}>
                          {cl.clearanceStatus === 'Compliant (Safe Buffer)' ? '✓ ' : '! '}
                          {cl.clearanceStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Certificate Footer & Sign-off */}
            <footer className="cert-footer">
              <div className="footer-left">
                <div className="footer-hash font-mono text-[10px] text-slate-500">
                  DIGITAL SPATIAL HASH: {metrics.spatialHash}
                </div>
                <p className="footer-disclaimer">
                  This document is generated by the National 3D Urban Land Parcel Identification System (3D-ULPIN).
                  The 3D Cadastral boundary coordinates define an unambiguous volumetric deed for land administration,
                  municipal taxation, smart utility clearance, and property conveyance.
                </p>
                <div className="footer-meta">
                  Date of Generation: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} |
                  Authority: Ministry of Rural Development / SIH 2026 Spatial Cadastre Registry
                </div>
              </div>

              <div className="footer-seal-box">
                <div className="seal-emblem">★</div>
                <div className="seal-title">DIGITALLY CERTIFIED</div>
                <div className="seal-dept">OFFICE OF THE CADASTRAL REGISTRAR</div>
                <div className="seal-verified">STATUS: ACTIVE RECORD</div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
