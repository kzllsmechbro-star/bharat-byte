/**
 * Ultra-Detailed Procedural Pipeline PBR Textures
 *
 * Generates high-resolution diffuse, bump, and roughness maps for:
 *  - Water (BWSSB): Flanged ductile iron with bolted collar sleeves & flow stencils
 *  - Sewer (BWSSB): Reinforced bell-and-spigot concrete with gasket seals
 *  - Gas (GAIL): High-pressure FBE coated steel with weld seams & hazard bands
 *  - Storm (BBMP): Deeply corrugated galvanized steel culvert with bolted lap joints
 *  - Power/OFC (BESCOM/CFC): Multi-duct HDPE bundle with high-voltage warning tape
 *  - Metro (BMRCL): Precast concrete TBM segmental rings with radial bolt pockets
 */

import * as THREE from 'three'

export interface PipelinePbrTextures {
  map: THREE.CanvasTexture
  bumpMap: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
  textureLengthMeters: number
  circumferenceRepeats: number
}

function initCanvas(w = 1024, h = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  return [canvas, ctx]
}

function createTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function createDataTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.NoColorSpace
  return tex
}

// ─── 1. WATER (BWSSB): Ductile Iron Flanged Pipe ─────────────────────────────

export function createWaterTextures(): PipelinePbrTextures {
  const W = 1024
  const H = 512

  // Diffuse
  const [diffCanvas, dCtx] = initCanvas(W, H)
  // Base dark industrial blue
  const baseGrad = dCtx.createLinearGradient(0, 0, 0, H)
  baseGrad.addColorStop(0.0, '#0c4a6e')
  baseGrad.addColorStop(0.2, '#0284c7')
  baseGrad.addColorStop(0.5, '#0369a1')
  baseGrad.addColorStop(0.8, '#075985')
  baseGrad.addColorStop(1.0, '#0c4a6e')
  dCtx.fillStyle = baseGrad
  dCtx.fillRect(0, 0, W, H)

  // Subtle cast iron surface noise
  const img = dCtx.getImageData(0, 0, W, H)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n))
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n))
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n))
  }
  dCtx.putImageData(img, 0, 0)

  // Longitudinal weld seam along the pipe at y = H * 0.15
  dCtx.fillStyle = 'rgba(255, 255, 255, 0.22)'
  dCtx.fillRect(0, H * 0.15 - 1, W, 2)
  dCtx.fillStyle = 'rgba(2, 44, 74, 0.6)'
  dCtx.fillRect(0, H * 0.15 + 1, W, 2)

  // Bolted Coupling Sleeve Collars at x = 0 and x = W * 0.5 (every 6m)
  const collarPositions = [0, W * 0.5]
  collarPositions.forEach((cx) => {
    const cw = 48
    const left = cx - cw / 2

    // Shadow on left
    dCtx.fillStyle = 'rgba(3, 20, 36, 0.7)'
    dCtx.fillRect(left - 4, 0, 4, H)

    // Collar body
    const colGrad = dCtx.createLinearGradient(left, 0, left + cw, 0)
    colGrad.addColorStop(0.0, '#0369a1')
    colGrad.addColorStop(0.25, '#38bdf8')
    colGrad.addColorStop(0.5, '#0284c7')
    colGrad.addColorStop(0.85, '#075985')
    colGrad.addColorStop(1.0, '#023859')
    dCtx.fillStyle = colGrad
    dCtx.fillRect(left, 0, cw, H)

    // Highlight edge
    dCtx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    dCtx.fillRect(left + 2, 0, 2, H)

    // Circumferential hex bolts (8 bolts around the tube circumference)
    for (let b = 0; b < 8; b++) {
      const by = (H / 8) * (b + 0.5)
      // Bolt 1
      dCtx.fillStyle = '#cbd5e1'
      dCtx.beginPath()
      dCtx.arc(cx - 10, by, 5, 0, Math.PI * 2)
      dCtx.fill()
      dCtx.fillStyle = '#0f172a'
      dCtx.beginPath()
      dCtx.arc(cx - 10, by, 2.5, 0, Math.PI * 2)
      dCtx.fill()

      // Bolt 2
      dCtx.fillStyle = '#cbd5e1'
      dCtx.beginPath()
      dCtx.arc(cx + 10, by, 5, 0, Math.PI * 2)
      dCtx.fill()
      dCtx.fillStyle = '#0f172a'
      dCtx.beginPath()
      dCtx.arc(cx + 10, by, 2.5, 0, Math.PI * 2)
      dCtx.fill()
    }
  })

  // Industrial Stencils
  dCtx.font = 'bold 13px monospace'
  dCtx.fillStyle = 'rgba(224, 242, 254, 0.85)'
  dCtx.fillText('BWSSB • POTABLE WATER DI-DN600 PN16 • 6.0 BAR ▶▶▶', 90, H * 0.48)
  dCtx.fillText('BWSSB • POTABLE WATER DI-DN600 PN16 • 6.0 BAR ▶▶▶', W * 0.5 + 90, H * 0.48)

  // Bump Map (Height)
  const [bumpCanvas, bCtx] = initCanvas(W, H)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, W, H)

  // Raised collars
  collarPositions.forEach((cx) => {
    const cw = 48
    bCtx.fillStyle = '#c0c0c0'
    bCtx.fillRect(cx - cw / 2, 0, cw, H)
    // Raised bolt heads
    for (let b = 0; b < 8; b++) {
      const by = (H / 8) * (b + 0.5)
      bCtx.fillStyle = '#ffffff'
      bCtx.beginPath()
      bCtx.arc(cx - 10, by, 6, 0, Math.PI * 2)
      bCtx.fill()
      bCtx.beginPath()
      bCtx.arc(cx + 10, by, 6, 0, Math.PI * 2)
      bCtx.fill()
    }
  })
  // Weld seam
  bCtx.fillStyle = '#a0a0a0'
  bCtx.fillRect(0, H * 0.15 - 2, W, 4)

  // Roughness Map
  const [roughCanvas, rCtx] = initCanvas(W, H)
  rCtx.fillStyle = '#505050' // ~0.31 gloss
  rCtx.fillRect(0, 0, W, H)
  // Matte joints & gaskets
  collarPositions.forEach((cx) => {
    rCtx.fillStyle = '#999999'
    rCtx.fillRect(cx - 26, 0, 4, H)
    rCtx.fillRect(cx + 22, 0, 4, H)
  })

  return {
    map: createTexture(diffCanvas),
    bumpMap: createDataTexture(bumpCanvas),
    roughnessMap: createDataTexture(roughCanvas),
    textureLengthMeters: 6.0,
    circumferenceRepeats: 1.0,
  }
}

// ─── 2. SEWER (BWSSB): Reinforced Concrete / Vitrified Clay ──────────────────

export function createSewerTextures(): PipelinePbrTextures {
  const W = 1024
  const H = 512

  // Diffuse
  const [diffCanvas, dCtx] = initCanvas(W, H)
  const baseGrad = dCtx.createLinearGradient(0, 0, 0, H)
  baseGrad.addColorStop(0.0, '#2d1b33')
  baseGrad.addColorStop(0.3, '#4a2554')
  baseGrad.addColorStop(0.7, '#3c1c45')
  baseGrad.addColorStop(1.0, '#26142c')
  dCtx.fillStyle = baseGrad
  dCtx.fillRect(0, 0, W, H)

  // Concrete stippling / gravel porosity
  const img = dCtx.getImageData(0, 0, W, H)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 26
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n))
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n))
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n))
  }
  dCtx.putImageData(img, 0, 0)

  // Circumferential reinforcing ribs every 64px
  for (let x = 0; x < W; x += 64) {
    dCtx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    dCtx.fillRect(x, 0, 3, H)
    dCtx.fillStyle = 'rgba(15, 5, 20, 0.35)'
    dCtx.fillRect(x + 3, 0, 3, H)
  }

  // Bell-and-Spigot socket joint at x = 0 and x = W * 0.5
  ;[0, W * 0.5].forEach((cx) => {
    // Heavy rubber elastomeric gasket
    dCtx.fillStyle = '#18181b'
    dCtx.fillRect(cx - 8, 0, 16, H)
    // Raised bell flare
    dCtx.fillStyle = 'rgba(168, 85, 247, 0.25)'
    dCtx.fillRect(cx - 36, 0, 28, H)
    dCtx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    dCtx.fillRect(cx - 36, 0, 2, H)
  })

  // Stencils
  dCtx.font = 'bold 13px monospace'
  dCtx.fillStyle = 'rgba(243, 232, 255, 0.8)'
  dCtx.fillText('BWSSB • SEWER TRUNK RCP-DN950 GRAVITY MAIN • FLOW ▶▶▶', 60, H * 0.52)
  dCtx.fillText('BWSSB • SEWER TRUNK RCP-DN950 GRAVITY MAIN • FLOW ▶▶▶', W * 0.5 + 60, H * 0.52)

  // Bump Map
  const [bumpCanvas, bCtx] = initCanvas(W, H)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, W, H)
  for (let x = 0; x < W; x += 64) {
    bCtx.fillStyle = '#9c9c9c'
    bCtx.fillRect(x, 0, 3, H)
  }
  ;[0, W * 0.5].forEach((cx) => {
    // Recessed gasket
    bCtx.fillStyle = '#303030'
    bCtx.fillRect(cx - 8, 0, 16, H)
    // Raised bell socket
    bCtx.fillStyle = '#b8b8b8'
    bCtx.fillRect(cx - 36, 0, 28, H)
  })

  // Roughness Map
  const [roughCanvas, rCtx] = initCanvas(W, H)
  rCtx.fillStyle = '#9e9e9e' // matte concrete
  rCtx.fillRect(0, 0, W, H)

  return {
    map: createTexture(diffCanvas),
    bumpMap: createDataTexture(bumpCanvas),
    roughnessMap: createDataTexture(roughCanvas),
    textureLengthMeters: 5.0,
    circumferenceRepeats: 1.0,
  }
}

// ─── 3. GAS (GAIL): High-Pressure Coated Steel Pipeline ──────────────────────

export function createGasTextures(): PipelinePbrTextures {
  const W = 1024
  const H = 512

  // Diffuse
  const [diffCanvas, dCtx] = initCanvas(W, H)
  const baseGrad = dCtx.createLinearGradient(0, 0, 0, H)
  baseGrad.addColorStop(0.0, '#7c2d12')
  baseGrad.addColorStop(0.2, '#ea580c')
  baseGrad.addColorStop(0.5, '#c2410c')
  baseGrad.addColorStop(0.8, '#9a3412')
  baseGrad.addColorStop(1.0, '#7c2d12')
  dCtx.fillStyle = baseGrad
  dCtx.fillRect(0, 0, W, H)

  // Spiral welded seam angle
  dCtx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
  dCtx.lineWidth = 2
  dCtx.beginPath()
  dCtx.moveTo(0, 0)
  dCtx.lineTo(W, H * 0.8)
  dCtx.stroke()

  // Heat-shrink wrap sleeve joints with hazard stripes at x = 0 and x = W * 0.5
  ;[0, W * 0.5].forEach((cx) => {
    const sw = 42
    const left = cx - sw / 2
    dCtx.fillStyle = '#1c1917'
    dCtx.fillRect(left, 0, sw, H)

    // Caution yellow diagonal warning stripes
    dCtx.strokeStyle = '#eab308'
    dCtx.lineWidth = 4
    for (let y = -20; y < H + 40; y += 14) {
      dCtx.beginPath()
      dCtx.moveTo(left, y)
      dCtx.lineTo(left + sw, y + sw)
      dCtx.stroke()
    }
  })

  // Stencils
  dCtx.font = 'bold 13px monospace'
  dCtx.fillStyle = '#ffffff'
  dCtx.fillText('GAIL GAS • DANGER HIGH PRESSURE API-5L-X65 50 BAR ▶▶▶', 80, H * 0.46)
  dCtx.fillText('GAIL GAS • DANGER HIGH PRESSURE API-5L-X65 50 BAR ▶▶▶', W * 0.5 + 80, H * 0.46)

  // Bump Map
  const [bumpCanvas, bCtx] = initCanvas(W, H)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, W, H)
  ;[0, W * 0.5].forEach((cx) => {
    bCtx.fillStyle = '#b4b4b4'
    bCtx.fillRect(cx - 21, 0, 42, H)
  })

  // Roughness Map
  const [roughCanvas, rCtx] = initCanvas(W, H)
  rCtx.fillStyle = '#404040' // sleek enamel
  rCtx.fillRect(0, 0, W, H)

  return {
    map: createTexture(diffCanvas),
    bumpMap: createDataTexture(bumpCanvas),
    roughnessMap: createDataTexture(roughCanvas),
    textureLengthMeters: 8.0,
    circumferenceRepeats: 1.0,
  }
}

// ─── 4. STORM DRAINAGE (BBMP): Corrugated Galvanized Steel ───────────────────

export function createDrainageTextures(): PipelinePbrTextures {
  const W = 1024
  const H = 512

  // Diffuse
  const [diffCanvas, dCtx] = initCanvas(W, H)
  const baseGrad = dCtx.createLinearGradient(0, 0, 0, H)
  baseGrad.addColorStop(0.0, '#042f2e')
  baseGrad.addColorStop(0.3, '#0f766e')
  baseGrad.addColorStop(0.7, '#115e59')
  baseGrad.addColorStop(1.0, '#042f2e')
  dCtx.fillStyle = baseGrad
  dCtx.fillRect(0, 0, W, H)

  // Deep continuous sinusoidal corrugation rings every 16px
  for (let x = 0; x < W; x += 16) {
    const cGrad = dCtx.createLinearGradient(x, 0, x + 16, 0)
    cGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.45)')
    cGrad.addColorStop(0.3, 'rgba(94, 234, 212, 0.25)')
    cGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.35)')
    cGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.5)')
    dCtx.fillStyle = cGrad
    dCtx.fillRect(x, 0, 16, H)
  }

  // Heavy annular structural lap joint at x = W * 0.5
  dCtx.fillStyle = '#134e4a'
  dCtx.fillRect(W * 0.5 - 20, 0, 40, H)
  for (let b = 0; b < 10; b++) {
    const by = (H / 10) * (b + 0.5)
    dCtx.fillStyle = '#94a3b8'
    dCtx.fillRect(W * 0.5 - 4, by - 4, 8, 8)
  }

  // Stencils
  dCtx.font = 'bold 14px monospace'
  dCtx.fillStyle = '#ccfbf1'
  dCtx.fillText('BBMP • STORMWATER ARTERIAL CULVERT CSP-1600MM HEAVY DUTY', 70, H * 0.5)

  // Bump Map
  const [bumpCanvas, bCtx] = initCanvas(W, H)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, W, H)
  for (let x = 0; x < W; x += 16) {
    const bGrad = bCtx.createLinearGradient(x, 0, x + 16, 0)
    bGrad.addColorStop(0.0, '#404040')
    bGrad.addColorStop(0.5, '#c0c0c0')
    bGrad.addColorStop(1.0, '#404040')
    bCtx.fillStyle = bGrad
    bCtx.fillRect(x, 0, 16, H)
  }

  // Roughness Map
  const [roughCanvas, rCtx] = initCanvas(W, H)
  rCtx.fillStyle = '#6e6e6e'
  rCtx.fillRect(0, 0, W, H)

  return {
    map: createTexture(diffCanvas),
    bumpMap: createDataTexture(bumpCanvas),
    roughnessMap: createDataTexture(roughCanvas),
    textureLengthMeters: 6.0,
    circumferenceRepeats: 1.0,
  }
}

// ─── 5. POWER / OFC (BESCOM / CFC): High-Density Multi-Duct Conduits ─────────

export function createPowerTextures(): PipelinePbrTextures {
  const W = 1024
  const H = 512

  // Diffuse
  const [diffCanvas, dCtx] = initCanvas(W, H)
  const baseGrad = dCtx.createLinearGradient(0, 0, 0, H)
  baseGrad.addColorStop(0.0, '#713f12')
  baseGrad.addColorStop(0.2, '#ca8a04')
  baseGrad.addColorStop(0.5, '#a16207')
  baseGrad.addColorStop(0.8, '#854d0e')
  baseGrad.addColorStop(1.0, '#713f12')
  dCtx.fillStyle = baseGrad
  dCtx.fillRect(0, 0, W, H)

  // Co-extruded black stripes representing bundled multi-duct channels
  dCtx.fillStyle = '#0f172a'
  dCtx.fillRect(0, H * 0.25 - 4, W, 8)
  dCtx.fillRect(0, H * 0.75 - 4, W, 8)

  // Coupling rings every 128px
  for (let x = 0; x < W; x += 128) {
    dCtx.fillStyle = 'rgba(254, 240, 138, 0.4)'
    dCtx.fillRect(x, 0, 6, H)
    dCtx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    dCtx.fillRect(x + 6, 0, 4, H)
  }

  // Warning text
  dCtx.font = 'bold 12px monospace'
  dCtx.fillStyle = '#09090b'
  dCtx.fillText('BESCOM • CAUTION 11000V BURIED ELECTRIC CABLE & SMART CITY OFC • HIGH VOLTAGE', 60, H * 0.5)

  // Bump Map
  const [bumpCanvas, bCtx] = initCanvas(W, H)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, W, H)
  // Recessed stripes
  bCtx.fillStyle = '#505050'
  bCtx.fillRect(0, H * 0.25 - 4, W, 8)
  bCtx.fillRect(0, H * 0.75 - 4, W, 8)

  // Roughness Map
  const [roughCanvas, rCtx] = initCanvas(W, H)
  rCtx.fillStyle = '#555555'
  rCtx.fillRect(0, 0, W, H)

  return {
    map: createTexture(diffCanvas),
    bumpMap: createDataTexture(bumpCanvas),
    roughnessMap: createDataTexture(roughCanvas),
    textureLengthMeters: 4.0,
    circumferenceRepeats: 1.0,
  }
}

// ─── 6. METRO TUNNEL (BMRCL): Segmental Precast Concrete TBM Lining ──────────

export function createMetroTextures(): PipelinePbrTextures {
  const W = 1024
  const H = 512

  // Diffuse
  const [diffCanvas, dCtx] = initCanvas(W, H)
  const baseGrad = dCtx.createLinearGradient(0, 0, 0, H)
  baseGrad.addColorStop(0.0, '#1c1917')
  baseGrad.addColorStop(0.3, '#351829')
  baseGrad.addColorStop(0.7, '#2b1421')
  baseGrad.addColorStop(1.0, '#18181b')
  dCtx.fillStyle = baseGrad
  dCtx.fillRect(0, 0, W, H)

  // TBM Segmental Rings every 96px
  for (let x = 0; x < W; x += 96) {
    // Recessed ring gasket groove
    dCtx.fillStyle = '#09090b'
    dCtx.fillRect(x, 0, 4, H)
    // Beveled ring edge
    dCtx.fillStyle = 'rgba(236, 72, 153, 0.3)'
    dCtx.fillRect(x + 4, 0, 3, H)
    dCtx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    dCtx.fillRect(x + 7, 0, 2, H)
  }

  // Radial key joints and bolt pockets
  for (let x = 0; x < W; x += 96) {
    for (let b = 0; b < 6; b++) {
      const by = (H / 6) * (b + 0.5)
      // Bolt pocket recess
      dCtx.fillStyle = '#0c0a09'
      dCtx.fillRect(x + 20, by - 6, 16, 12)
      // Bolt head
      dCtx.fillStyle = '#78716c'
      dCtx.beginPath()
      dCtx.arc(x + 28, by, 3, 0, Math.PI * 2)
      dCtx.fill()
    }
  }

  // Stencils
  dCtx.font = 'bold 14px monospace'
  dCtx.fillStyle = '#f472b6'
  dCtx.fillText('BMRCL • PURPLE LINE TBM TUNNEL SEGMENTAL LINING R-147', 80, H * 0.5)

  // Bump Map
  const [bumpCanvas, bCtx] = initCanvas(W, H)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, W, H)
  for (let x = 0; x < W; x += 96) {
    bCtx.fillStyle = '#202020'
    bCtx.fillRect(x, 0, 4, H)
    for (let b = 0; b < 6; b++) {
      const by = (H / 6) * (b + 0.5)
      bCtx.fillStyle = '#101010'
      bCtx.fillRect(x + 20, by - 6, 16, 12)
      bCtx.fillStyle = '#c0c0c0'
      bCtx.beginPath()
      bCtx.arc(x + 28, by, 3, 0, Math.PI * 2)
      bCtx.fill()
    }
  }

  // Roughness Map
  const [roughCanvas, rCtx] = initCanvas(W, H)
  rCtx.fillStyle = '#8c8c8c'
  rCtx.fillRect(0, 0, W, H)

  return {
    map: createTexture(diffCanvas),
    bumpMap: createDataTexture(bumpCanvas),
    roughnessMap: createDataTexture(roughCanvas),
    textureLengthMeters: 6.0,
    circumferenceRepeats: 1.0,
  }
}
