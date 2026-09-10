import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { Building, Floor, UndergroundInfra, Unit } from '../types/spatial'
import {
  calculateBoundingDimensions,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  evaluateSubterraneanClearances,
  generateDeterministicSpatialHash,
} from './spatialCalculations'

export interface UlpinDocumentData {
  building: Building
  floors?: Floor[]
  units?: Unit[]
  undergroundInfra?: UndergroundInfra[]
}

export async function generateUlpinPdf(data: UlpinDocumentData): Promise<void> {
  const { building, floors = [], units = [], undergroundInfra = [] } = data

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Calculated spatial metrics
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
  const certId = `IN-3D-ULPIN-${building.base_ulpin.slice(0, 6)}-${building.building_code}-${Math.floor(Date.now() / 60000)}`
  const issueDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  // Dynamic QR code payload
  const qrPayload = JSON.stringify({
    registry: 'BHU-AADHAAR-3D-CADASTRE',
    base_ulpin: building.base_ulpin,
    building_code: building.building_code,
    full_3d_ulpin: full3DUlpin,
    house_no: building.house_no ?? null,
    structure: building.structure_category ?? building.building_type,
    area_m2: areaM2,
    height_m: heightM,
    stories: storiesCount,
    spatial_hash: spatialHash,
    cert_id: certId,
  })

  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
  } catch (err) {
    console.error('[ULPIN PDF] Failed to generate QR code', err)
  }

  // ── 1. Security Frame & Background Accents ──────────────────────────────
  doc.setDrawColor(30, 41, 59) // slate-800
  doc.setLineWidth(0.8)
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

  doc.setDrawColor(217, 119, 6) // amber-600 gold border
  doc.setLineWidth(0.3)
  doc.rect(8.5, 8.5, pageWidth - 17, pageHeight - 17)

  // Top header banner background
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(8.5, 8.5, pageWidth - 17, 26, 'F')

  // Top decorative tri-color stripe (Indian Identity)
  doc.setFillColor(249, 115, 22) // Saffron
  doc.rect(8.5, 8.5, (pageWidth - 17) / 3, 1.2, 'F')
  doc.setFillColor(255, 255, 255) // White
  doc.rect(8.5 + (pageWidth - 17) / 3, 8.5, (pageWidth - 17) / 3, 1.2, 'F')
  doc.setFillColor(34, 197, 94) // Green
  doc.rect(8.5 + ((pageWidth - 17) * 2) / 3, 8.5, (pageWidth - 17) / 3, 1.2, 'F')

  // ── 2. Official Header Typography ───────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(245, 158, 11) // Gold
  doc.text('GOVERNMENT OF INDIA • MINISTRY OF RURAL DEVELOPMENT', pageWidth / 2, 14, { align: 'center' })

  doc.setFontSize(7.5)
  doc.setTextColor(226, 232, 240) // Slate-200
  doc.text('DIGITAL INDIA LAND RECORDS MODERNIZATION PROGRAMME (DILRMP) • SIH 2026', pageWidth / 2, 18, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(45, 212, 191) // Teal-400
  doc.text('3D BHU-AADHAAR / ULPIN CADASTRAL PROPERTY RECORD', pageWidth / 2, 24.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(148, 163, 184)
  doc.text('FORM 3D-B: CERTIFICATE OF SPATIAL VERTICAL TITLE & VOLUMETRIC CLEARANCE', pageWidth / 2, 29, { align: 'center' })

  // ── 3. Primary Identification Hero Box ──────────────────────────────────
  const heroY = 38
  doc.setFillColor(248, 250, 252) // slate-50
  doc.setDrawColor(203, 213, 225) // slate-300
  doc.setLineWidth(0.4)
  doc.roundedRect(12, heroY, pageWidth - 24, 28, 2, 2, 'FD')

  // Left Block: 3D ULPIN Code
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text('PRIMARY 3D ULPIN (BHU-AADHAAR)', 16, heroY + 6)

  doc.setFont('courier', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(full3DUlpin, 16, heroY + 13)

  // Secondary subline: Base Parcel ULPIN
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(71, 85, 105)
  doc.text(`SURFACE BASE ULPIN: ${building.base_ulpin}`, 16, heroY + 18)
  doc.text(`BUILDING CODE: ${building.building_code}    |    REGISTRY ID: ${certId}`, 16, heroY + 23)

  // Right Block: QR Code
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 37, heroY + 2.5, 23, 23)
  }

  // ── 4. Property & Structure Specification Table ─────────────────────────
  let cursorY = 70

  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(241, 245, 249) // slate-100
    doc.rect(12, yPos, pageWidth - 24, 5.5, 'F')
    doc.setDrawColor(45, 212, 191) // teal accent line
    doc.setLineWidth(0.8)
    doc.line(12, yPos, 12, yPos + 5.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)
    doc.text(title, 15, yPos + 4)
  }

function fitText(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 2 && doc.getTextWidth(truncated + '…') > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + '…'
}

function cleanStructureName(building: Building): string {
  const houseNo = building.house_no?.trim()
  const name = building.name?.trim()
  if (name && houseNo && name.includes(houseNo)) return name
  if (houseNo && name) return `${houseNo} — ${name}`
  return name || (houseNo ? `House ${houseNo}` : `Building ${building.building_code}`)
}

  drawSectionHeader('1. PROPERTY IDENTITY & PHYSICAL ADDRESS', cursorY)
  cursorY += 7.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)

  const propRows = [
    [
      'House / Structure Name:',
      cleanStructureName(building),
      'Structure Category:',
      (building.structure_category || building.building_type).replace(/_/g, ' ').toUpperCase(),
    ],
    [
      'Complex / Colony Layout:',
      building.complex_name || 'Individual Freehold Parcel',
      'Construction Status:',
      building.building_type === 'half_built' ? 'Under Construction / Suspended' : 'Completed & Registered (3D As-Built)',
    ],
    [
      'Jurisdiction / State:',
      'Karnataka (State 29)',
      'Local Cadastral Authority:',
      'BBMP / Bengaluru Urban Division',
    ],
  ]

  for (const row of propRows) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text(row[0], 15, cursorY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(fitText(doc, row[1], 52), 52, cursorY)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text(row[2], 108, cursorY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(fitText(doc, row[3], 48), 146, cursorY)

    cursorY += 5.2
  }

  // Dedicated Full-Width Row for Registered Address (wraps cleanly without overlapping anything)
  const addressText = building.postal_address || `Plot ${building.house_no || building.building_code}, Bengaluru Urban, Karnataka`
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('Registered Postal Address:', 15, cursorY)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  const addressLines = doc.splitTextToSize(addressText, 142)
  doc.text(addressLines, 52, cursorY)
  cursorY += Math.max(5.2, addressLines.length * 4.0 + 1.5)

  // ── 5. Spatial & Volumetric Cadastre Metrics ─────────────────────────────
  cursorY += 2.5
  drawSectionHeader('2. SPATIAL GEOMETRY & 3D VOLUMETRIC EXTENTS', cursorY)
  cursorY += 7.5

  const metricRows = [
    [
      'Plinth Footprint Area:',
      `${areaM2.toFixed(1)} m²  (${areaSqFt.toLocaleString()} sq.ft)`,
      'Total Structural Height:',
      `${heightM.toFixed(1)} meters above ground`,
    ],
    [
      'Boundary Perimeter:',
      `${perimeterM.toFixed(1)} meters`,
      'Above-Ground Volume:',
      `${volumeM3.toLocaleString()} m³`,
    ],
    [
      'Footprint Dimensions:',
      `${dimensions.length} m (Length) × ${dimensions.width} m (Width)`,
      'Vertical Levels:',
      `${storiesCount} Stories / Levels Recorded`,
    ],
    [
      'Centroid Grid Coords:',
      building.center ? `X: ${building.center[0].toFixed(2)}, Y: ${building.center[1].toFixed(2)}` : 'Verified Locality Origin',
      'Spatial Hash ID:',
      spatialHash.slice(0, 16) + '…',
    ],
  ]

  for (const row of metricRows) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text(row[0], 15, cursorY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(fitText(doc, row[1], 52), 52, cursorY)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text(row[2], 108, cursorY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(fitText(doc, row[3], 48), 146, cursorY)

    cursorY += 5.2
  }

  // ── 6. Vertical Division & Units Breakdown ──────────────────────────────
  cursorY += 2.5
  drawSectionHeader('3. VERTICAL PROPERTY DIVISION & FLOOR SCHEDULE', cursorY)
  cursorY += 6.5

  // Table header
  doc.setFillColor(30, 41, 59) // slate-800
  doc.rect(12, cursorY, pageWidth - 24, 4.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(255, 255, 255)

  doc.text('LEVEL / STORY', 15, cursorY + 3.4)
  doc.text('FLOOR CODE', 42, cursorY + 3.4)
  doc.text('3D FLOOR ULPIN', 66, cursorY + 3.4)
  doc.text('ELEVATION (Z)', 122, cursorY + 3.4)
  doc.text('UNITS / TYPE', 154, cursorY + 3.4)

  cursorY += 4.8

  // Render floors or default ground level
  const floorsToRender = floors.length > 0 ? floors : [
    {
      id: `${building.id}-F001`,
      building_id: building.id,
      floor_code: 'F001',
      floor_number: 1,
      is_underground: false,
      footprint: building.footprint,
      height_meters: heightM,
    },
  ]

  let runningHeight = 0
  const maxFloorsShown = Math.min(floorsToRender.length, 5)

  for (let i = 0; i < maxFloorsShown; i++) {
    const f = floorsToRender[i]
    const floorH = f.height_meters || 3.5
    const zStart = runningHeight
    const zEnd = runningHeight + floorH
    runningHeight = zEnd

    const floorUlpin = `${building.base_ulpin}-${building.building_code}-${f.floor_code}`
    const unitsOnFloor = units.filter((u) => u.floor_id === f.id || u.floor_id === `${building.id}-${f.floor_code}`)
    const unitSummary = unitsOnFloor.length > 0
      ? `${unitsOnFloor.length} Flat(s) (${unitsOnFloor.map((u) => u.unit_number || u.unit_code).slice(0, 2).join(', ')}${unitsOnFloor.length > 2 ? '…' : ''})`
      : building.building_type === 'house'
      ? 'Primary Residence'
      : 'Standard Commercial / Apt Floor'

    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252)
    doc.rect(12, cursorY, pageWidth - 24, 4.8, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.15)
    doc.line(12, cursorY + 4.8, pageWidth - 12, cursorY + 4.8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(30, 41, 59)

    doc.text(f.floor_number === 1 ? 'Ground Level (F1)' : `Level ${f.floor_number}`, 15, cursorY + 3.3)
    doc.text(f.floor_code, 42, cursorY + 3.3)
    doc.setFont('courier', 'normal')
    doc.setFontSize(6.5)
    doc.text(fitText(doc, floorUlpin, 52), 66, cursorY + 3.3)

    doc.setFont('helvetica', 'normal')
    doc.text(`+${zStart.toFixed(1)}m to +${zEnd.toFixed(1)}m`, 122, cursorY + 3.3)
    doc.text(fitText(doc, unitSummary, 42), 154, cursorY + 3.3)

    cursorY += 4.8
  }

  if (floorsToRender.length > 5) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(6)
    doc.setTextColor(100, 116, 139)
    doc.text(`… and ${floorsToRender.length - 5} additional vertical levels recorded in 3D Cadastre database.`, 15, cursorY + 3.3)
    cursorY += 4.8
  }

  // ── 7. Subterranean Utilities & Environmental Clearance ─────────────────
  cursorY += 2.5
  drawSectionHeader('4. SUBTERRANEAN GIS CLEARANCE & UTILITIES ASSESSMENT', cursorY)
  cursorY += 6.5

  doc.setFillColor(30, 41, 59)
  doc.rect(12, cursorY, pageWidth - 24, 4.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(255, 255, 255)

  doc.text('INFRASTRUCTURE ASSET', 15, cursorY + 3.4)
  doc.text('PROXIMITY (BUFFER)', 75, cursorY + 3.4)
  doc.text('DEPTH', 118, cursorY + 3.4)
  doc.text('CLEARANCE STATUS', 148, cursorY + 3.4)

  cursorY += 4.8

  const maxClearancesShown = Math.min(clearances.length, 4)
  for (let i = 0; i < maxClearancesShown; i++) {
    const cl = clearances[i]
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252)
    doc.rect(12, cursorY, pageWidth - 24, 4.6, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.15)
    doc.line(12, cursorY + 4.6, pageWidth - 12, cursorY + 4.6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(30, 41, 59)
    doc.text(fitText(doc, cl.label, 56), 15, cursorY + 3.1)

    doc.setFont('helvetica', 'normal')
    doc.text(fitText(doc, `${cl.closestDistanceMeters.toFixed(1)} m lateral offset`, 38), 75, cursorY + 3.1)
    doc.text(fitText(doc, `${cl.depthMeters.toFixed(1)} m depth`, 26), 118, cursorY + 3.1)

    const statusText = cl.clearanceStatus === 'Compliant (Safe Buffer)'
      ? `[PASS] ${cl.clearanceStatus}`
      : `[ATTN] ${cl.clearanceStatus}`

    if (cl.clearanceStatus === 'Compliant (Safe Buffer)') {
      doc.setTextColor(22, 101, 52) // green-800
    } else {
      doc.setTextColor(180, 83, 9) // amber-700
    }
    doc.text(fitText(doc, statusText, 46), 148, cursorY + 3.1)

    cursorY += 4.6
  }

  // ── 8. Authentication & Official Sign-off Footer ────────────────────────
  const footerBoxY = pageHeight - 38
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.3)
  doc.roundedRect(12, footerBoxY, pageWidth - 24, 25, 1.5, 1.5)

  // Security Hash Line
  doc.setFont('courier', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`SPATIAL SHA-256 HASH: ${spatialHash}`, 15, footerBoxY + 4)
  doc.text(`CERTIFICATE NUMBER: ${certId}    |    TIMESTAMP: ${issueDate}`, 15, footerBoxY + 7.5)

  // Left Legal Statement
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(71, 85, 105)
  const disclaimer =
    'This is a digitally generated 3D Cadastral Record under the National Land Records Modernization Programme (DILRMP). ' +
    'The 3D ULPIN uniquely addresses volumetric parcels above and below surface ground level. Verified by Spatial GIS Engine.'
  doc.text(doc.splitTextToSize(disclaimer, 115), 15, footerBoxY + 12.5)

  // Right Sign-off Stamp Box
  doc.setDrawColor(45, 212, 191)
  doc.rect(pageWidth - 62, footerBoxY + 3, 47, 18)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(15, 23, 42)
  doc.text('DIGITALLY CERTIFIED', pageWidth - 38.5, footerBoxY + 7, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.setTextColor(71, 85, 105)
  doc.text('OFFICE OF THE CADASTRAL REGISTRAR', pageWidth - 38.5, footerBoxY + 10.5, { align: 'center' })
  doc.text('3D ULPIN SPATIAL REGISTRY • SIH 2026', pageWidth - 38.5, footerBoxY + 13.5, { align: 'center' })
  doc.setFont('courier', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text('STATUS: VERIFIED ACTIVE', pageWidth - 38.5, footerBoxY + 17.5, { align: 'center' })

  // Bottom-most copyright line
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  doc.text('Smart India Hackathon 2026  •  Digital 3D ULPIN Infrastructure  •  Page 1 of 1', pageWidth / 2, pageHeight - 9.5, {
    align: 'center',
  })

  // Trigger browser download
  const cleanName = (building.house_no || building.name || building.building_code).replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `ULPIN_Document_${cleanName}_${building.base_ulpin}.pdf`
  doc.save(filename)
}
