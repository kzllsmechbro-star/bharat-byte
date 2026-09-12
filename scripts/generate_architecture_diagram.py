import os
import subprocess
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def generate_simple_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" style="background:#090d16; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;">
  <defs>
    <!-- Background Radial Highlights -->
    <radialGradient id="bgGlow1" cx="20%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bgGlow2" cx="80%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bgGlow3" cx="50%" cy="85%" r="50%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
    </radialGradient>

    <!-- Column Headers -->
    <linearGradient id="colHdr1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="colHdr2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="colHdr3" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="colHdr4" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <!-- Card Background Gradient -->
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#131c2e"/>
      <stop offset="100%" stop-color="#0c1220"/>
    </linearGradient>

    <!-- Banner Gradient -->
    <linearGradient id="bannerBg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Drop Shadow -->
    <filter id="shadowCard" x="-5%" y="-5%" width="110%" height="114%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.5"/>
    </filter>

    <!-- Arrow Marker -->
    <marker id="arrowHead" markerWidth="10" markerHeight="10" refX="7" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/>
    </marker>
  </defs>

  <!-- Background Canvas -->
  <rect width="1920" height="1080" fill="#090d16"/>
  <rect width="1920" height="1080" fill="url(#bgGlow1)"/>
  <rect width="1920" height="1080" fill="url(#bgGlow2)"/>
  <rect width="1920" height="1080" fill="url(#bgGlow3)"/>

  <!-- Subtle Grid Lines -->
  <g stroke="#1e293b" stroke-width="1" opacity="0.25">
    <path d="M0,120 H1920 M0,240 H1920 M0,360 H1920 M0,480 H1920 M0,600 H1920 M0,720 H1920 M0,840 H1920 M0,960 H1920" />
    <path d="M240,0 V1080 M480,0 V1080 M720,0 V1080 M960,0 V1080 M1200,0 V1080 M1440,0 V1080 M1680,0 V1080" />
  </g>

  <!-- Top Tricolor Border -->
  <rect x="0" y="0" width="640" height="5" fill="#FF9933"/>
  <rect x="640" y="0" width="640" height="5" fill="#FFFFFF"/>
  <rect x="1280" y="0" width="640" height="5" fill="#138808"/>

  <!-- ==================== HEADER ==================== -->
  <g transform="translate(45, 34)">
    <text x="0" y="28" fill="#ffffff" font-size="28" font-weight="800" letter-spacing="0.5">🇮🇳 BHARAT BYTE — 3D ULPIN SYSTEM ARCHITECTURE</text>
    <text x="0" y="54" fill="#94a3b8" font-size="15" font-weight="400">Simple 4-Step Technical Pipeline for India's 3D Bhu-Aadhaar Cadastre | Smart India Hackathon 2026</text>

    <!-- Top Badges -->
    <g transform="translate(1200, 2)">
      <rect x="0" y="0" width="195" height="38" rx="8" fill="#111827" stroke="#374151" stroke-width="1.2"/>
      <circle cx="18" cy="19" r="5.5" fill="#10b981"/>
      <text x="32" y="24" fill="#f3f4f6" font-size="12.5" font-weight="600">Bhu-Aadhaar Standard</text>

      <rect x="210" y="0" width="205" height="38" rx="8" fill="#111827" stroke="#374151" stroke-width="1.2"/>
      <circle cx="228" cy="19" r="5.5" fill="#06b6d4"/>
      <text x="242" y="24" fill="#f3f4f6" font-size="12.5" font-weight="600">14,768 Unique Parcels</text>

      <rect x="430" y="0" width="200" height="38" rx="8" fill="#111827" stroke="#374151" stroke-width="1.2"/>
      <circle cx="448" cy="19" r="5.5" fill="#8b5cf6"/>
      <text x="462" y="24" fill="#f3f4f6" font-size="12.5" font-weight="600">Sub-Centimeter 3D</text>
    </g>
  </g>

  <!-- ==================== 4 MAIN COLUMNS ==================== -->

  <!-- ==================== COLUMN 1: USER INTERFACE ==================== -->
  <g transform="translate(45, 115)">
    <!-- Column Container -->
    <rect width="415" height="770" rx="14" fill="#0c1322" stroke="#0284c7" stroke-width="1.5" filter="url(#shadowCard)"/>
    
    <!-- Column Header -->
    <rect width="415" height="52" rx="14" fill="url(#colHdr1)"/>
    <rect y="36" width="415" height="16" fill="#0284c7"/>
    <text x="18" y="32" fill="#ffffff" font-size="17" font-weight="700" letter-spacing="0.5">1. USER INTERFACE</text>
    <rect x="290" y="11" width="110" height="28" rx="6" fill="#082f49" fill-opacity="0.8"/>
    <text x="303" y="29" fill="#e0f2fe" font-size="11.5" font-weight="600">React • Vite</text>

    <!-- Card 1.1 -->
    <g transform="translate(16, 68)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#38bdf8"/>
      <text x="16" y="28" fill="#38bdf8" font-size="16" font-weight="700">🖥️ Interactive 3D Web Twin</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Runs inside any web browser</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">No plugins, downloads, or gaming GPU required.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• 100% Offline Autonomy</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Loads city data instantly even without internet.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Works on laptops, field tablets &amp; mobile phones</text>
    </g>

    <!-- Card 1.2 -->
    <g transform="translate(16, 238)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#38bdf8"/>
      <text x="16" y="28" fill="#38bdf8" font-size="16" font-weight="700">🔍 Smart Cadastral Search</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Instant Autocomplete</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Search across 14,768 unique Karnataka names.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Dual Locality Coverage</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Chamrajpet (560018) &amp; Basaveshwaranagar (560079).</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Zero duplicate names — 100% strict uniqueness</text>
    </g>

    <!-- Card 1.3 -->
    <g transform="translate(16, 408)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#38bdf8"/>
      <text x="16" y="28" fill="#38bdf8" font-size="16" font-weight="700">🎛️ Layer Visibility HUD</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Clean Toggle Controls</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Turn on/off 3D Wireframes, Day/Night, &amp; Utilities.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Property Inspector Drawer</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Click any building or floor to view official records.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Real-time height, area &amp; clearance metrics</text>
    </g>

    <!-- Card 1.4 -->
    <g transform="translate(16, 578)">
      <rect width="383" height="175" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="175" rx="2" fill="#38bdf8"/>
      <text x="16" y="28" fill="#38bdf8" font-size="16" font-weight="700">📄 1-Click Digital Deed (PDF)</text>
      <text x="16" y="54" fill="#f1f5f9" font-size="13.5" font-weight="600">• Official A4 Cadastral Deed</text>
      <text x="26" y="74" fill="#94a3b8" font-size="12.5">Generated instantly in-browser using jsPDF.</text>
      <text x="16" y="102" fill="#f1f5f9" font-size="13.5" font-weight="600">• QR Code Field Verification</text>
      <text x="26" y="122" fill="#94a3b8" font-size="12.5">Surveyors can scan on-site using any smartphone.</text>
      <text x="16" y="152" fill="#34d399" font-size="11.5">✓ Tamper-proof digital seal &amp; cryptographic hash</text>
    </g>
  </g>

  <!-- Step Connector 1 -> 2 -->
  <g transform="translate(460, 475)">
    <line x1="10" y1="0" x2="38" y2="0" stroke="#38bdf8" stroke-width="3" marker-end="url(#arrowHead)"/>
    <circle cx="24" cy="0" r="14" fill="#082f49" stroke="#0284c7" stroke-width="1.5"/>
    <text x="19" y="5" fill="#e0f2fe" font-size="13" font-weight="700">1</text>
  </g>

  <!-- ==================== COLUMN 2: 3D VISUALIZATION ENGINE ==================== -->
  <g transform="translate(510, 115)">
    <rect width="415" height="770" rx="14" fill="#0c1322" stroke="#8b5cf6" stroke-width="1.5" filter="url(#shadowCard)"/>
    
    <!-- Column Header -->
    <rect width="415" height="52" rx="14" fill="url(#colHdr2)"/>
    <rect y="36" width="415" height="16" fill="#7c3aed"/>
    <text x="18" y="32" fill="#ffffff" font-size="17" font-weight="700" letter-spacing="0.5">2. 3D VISUALIZATION</text>
    <rect x="275" y="11" width="125" height="28" rx="6" fill="#3b0764" fill-opacity="0.8"/>
    <text x="287" y="29" fill="#f3e8ff" font-size="11.5" font-weight="600">Three.js • R3F</text>

    <!-- Card 2.1 -->
    <g transform="translate(16, 68)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#c084fc"/>
      <text x="16" y="28" fill="#c084fc" font-size="16" font-weight="700">🏙️ Realistic 3D City Model</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Actual City Mesh (glTF / GLB)</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">254,114 vertices &amp; 127k true physical faces.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• 99.67% Cadastral Match</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Half-edge traversal fits buildings to exact roads.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Sub-centimeter alignment with ground parcels</text>
    </g>

    <!-- Card 2.2 -->
    <g transform="translate(16, 238)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#c084fc"/>
      <text x="16" y="28" fill="#c084fc" font-size="16" font-weight="700">📸 Smart Auto-Framing Camera</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Automatic Scale-Adaptive Zoom</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Smoothly flies camera to frame any building.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Dynamic Pitch &amp; Distance</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">From 4m residential houses to 130m skyscrapers.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Perfectly centers building in 62% of viewport</text>
    </g>

    <!-- Card 2.3 -->
    <g transform="translate(16, 408)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#c084fc"/>
      <text x="16" y="28" fill="#c084fc" font-size="16" font-weight="700">🏢 Parametric Floor Slices</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Vertical Property Strata</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Separates multi-storey buildings into distinct floors.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Individual Unit Selection</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Click into any private flat, duplex, or shop.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Unbundles 2D land parcels into 3D airspace units</text>
    </g>

    <!-- Card 2.4 -->
    <g transform="translate(16, 578)">
      <rect width="383" height="175" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="175" rx="2" fill="#c084fc"/>
      <text x="16" y="28" fill="#c084fc" font-size="16" font-weight="700">🚇 Sub-Surface Utility Network</text>
      <text x="16" y="54" fill="#f1f5f9" font-size="13.5" font-weight="600">• 3D Underground Infrastructure</text>
      <text x="26" y="74" fill="#94a3b8" font-size="12.5">Shows water trunks, sewers, power ducts &amp; metro.</text>
      <text x="16" y="102" fill="#f1f5f9" font-size="13.5" font-weight="600">• Visual Buffer Clearance</text>
      <text x="26" y="122" fill="#94a3b8" font-size="12.5">Color-coded distance checks around foundations.</text>
      <text x="16" y="152" fill="#34d399" font-size="11.5">✓ Prevents pipeline damage during excavations</text>
    </g>
  </g>

  <!-- Step Connector 2 -> 3 -->
  <g transform="translate(925, 475)">
    <line x1="10" y1="0" x2="38" y2="0" stroke="#a855f7" stroke-width="3" marker-end="url(#arrowHead)"/>
    <circle cx="24" cy="0" r="14" fill="#3b0764" stroke="#7c3aed" stroke-width="1.5"/>
    <text x="19" y="5" fill="#f3e8ff" font-size="13" font-weight="700">2</text>
  </g>

  <!-- ==================== COLUMN 3: SMART BACKEND ENGINE ==================== -->
  <g transform="translate(975, 115)">
    <rect width="415" height="770" rx="14" fill="#0c1322" stroke="#10b981" stroke-width="1.5" filter="url(#shadowCard)"/>
    
    <!-- Column Header -->
    <rect width="415" height="52" rx="14" fill="url(#colHdr3)"/>
    <rect y="36" width="415" height="16" fill="#059669"/>
    <text x="18" y="32" fill="#ffffff" font-size="17" font-weight="700" letter-spacing="0.5">3. 3D ULPIN ENGINE</text>
    <rect x="280" y="11" width="120" height="28" rx="6" fill="#064e3b" fill-opacity="0.8"/>
    <text x="290" y="29" fill="#d1fae5" font-size="11.5" font-weight="600">FastAPI • Python</text>

    <!-- Card 3.1 -->
    <g transform="translate(16, 68)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#34d399"/>
      <text x="16" y="28" fill="#34d399" font-size="16" font-weight="700">🏷️ 3D ULPIN ID Generator</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Hierarchical Naming Standard</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Appends Building (-Bxx), Floor (-Fxxx), &amp; Unit (-Uxxx).</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Full Backward Compatibility</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Keeps India's 14-digit Base Bhu-Aadhaar intact.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Includes sub-surface levels (-F-U1 for basements)</text>
    </g>

    <!-- Card 3.2 -->
    <g transform="translate(16, 238)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#34d399"/>
      <text x="16" y="28" fill="#34d399" font-size="16" font-weight="700">📐 Land &amp; Airspace Mathematics</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• True Polygonal Area (m²)</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Calculated via Shoelace surveyor formula.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Volumetric Airspace Envelope (m³)</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Quantifies vertical 3D property boundaries.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Validates FAR / FSI urban planning limits</text>
    </g>

    <!-- Card 3.3 -->
    <g transform="translate(16, 408)">
      <rect width="383" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#34d399"/>
      <text x="16" y="28" fill="#34d399" font-size="16" font-weight="700">🛡️ Subterranean Safety Auditor</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Euclidean Proximity Audit</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Calculates distance from foundations to 5 utilities.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Statutory Buffer Clearance</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Water (10m), Sewer (12m), Metro Tunnel (25m).</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Instant automated compliance pass/alert</text>
    </g>

    <!-- Card 3.4 -->
    <g transform="translate(16, 578)">
      <rect width="383" height="175" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="175" rx="2" fill="#34d399"/>
      <text x="16" y="28" fill="#34d399" font-size="16" font-weight="700">🔒 Digital Security &amp; Fast Indexing</text>
      <text x="16" y="54" fill="#f1f5f9" font-size="13.5" font-weight="600">• Cryptographic Spatial Hash</text>
      <text x="26" y="74" fill="#94a3b8" font-size="12.5">128-bit digital seal prevents vertical title forgery.</text>
      <text x="16" y="102" fill="#f1f5f9" font-size="13.5" font-weight="600">• 3D Space-Filling Morton Curves</text>
      <text x="26" y="122" fill="#94a3b8" font-size="12.5">Bit-interleaves 3D coordinates for fast database search.</text>
      <text x="16" y="152" fill="#34d399" font-size="11.5">✓ Sub-millisecond queries across entire city</text>
    </g>
  </g>

  <!-- Step Connector 3 -> 4 -->
  <g transform="translate(1390, 475)">
    <line x1="10" y1="0" x2="38" y2="0" stroke="#34d399" stroke-width="3" marker-end="url(#arrowHead)"/>
    <circle cx="24" cy="0" r="14" fill="#064e3b" stroke="#059669" stroke-width="1.5"/>
    <text x="19" y="5" fill="#d1fae5" font-size="13" font-weight="700">3</text>
  </g>

  <!-- ==================== COLUMN 4: REAL-WORLD IMPACT ==================== -->
  <g transform="translate(1440, 115)">
    <rect width="435" height="770" rx="14" fill="#0c1322" stroke="#f59e0b" stroke-width="1.5" filter="url(#shadowCard)"/>
    
    <!-- Column Header -->
    <rect width="435" height="52" rx="14" fill="url(#colHdr4)"/>
    <rect y="36" width="435" height="16" fill="#d97706"/>
    <text x="18" y="32" fill="#ffffff" font-size="17" font-weight="700" letter-spacing="0.5">4. REAL-WORLD CIVIC IMPACT</text>
    <rect x="300" y="11" width="120" height="28" rx="6" fill="#78350f" fill-opacity="0.8"/>
    <text x="312" y="29" fill="#fef3c7" font-size="11.5" font-weight="600">Govt Standards</text>

    <!-- Card 4.1 -->
    <g transform="translate(16, 68)">
      <rect width="403" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#fbbf24"/>
      <text x="16" y="28" fill="#fbbf24" font-size="16" font-weight="700">🏛️ MoRD / DoLR Standards</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• National Cadastral Compliance</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Adheres strictly to Department of Land Resources norms.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• National Building Code (NBC 2016)</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Incorporates IS 456 &amp; IS 1893 (Seismic Zone II) standards.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Ready for nationwide state cadastre rollout</text>
    </g>

    <!-- Card 4.2 -->
    <g transform="translate(16, 238)">
      <rect width="403" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#fbbf24"/>
      <text x="16" y="28" fill="#fbbf24" font-size="16" font-weight="700">💰 Fair Municipal Property Tax</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Individual Unit Taxation</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Taxes each apartment and penthouse individually.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Plugs Civic Revenue Leakage</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Detects unassessed top floors and unauthorized extensions.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Eliminates reliance on flat ground-only tax</text>
    </g>

    <!-- Card 4.3 -->
    <g transform="translate(16, 408)">
      <rect width="403" height="152" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="152" rx="2" fill="#fbbf24"/>
      <text x="16" y="28" fill="#fbbf24" font-size="16" font-weight="700">🏦 Bank Loans &amp; Title Deeds</text>
      <text x="16" y="52" fill="#f1f5f9" font-size="13.5" font-weight="600">• Clear Legal Ownership</text>
      <text x="26" y="72" fill="#94a3b8" font-size="12.5">Issues unbundled titles for every residential unit.</text>
      <text x="16" y="98" fill="#f1f5f9" font-size="13.5" font-weight="600">• Eliminates Mortgage Fraud</text>
      <text x="26" y="118" fill="#94a3b8" font-size="12.5">Prevents scammers pledging the same land to multiple banks.</text>
      <text x="16" y="139" fill="#34d399" font-size="11.5">✓ Protects home buyers and institutional lenders</text>
    </g>

    <!-- Card 4.4 -->
    <g transform="translate(16, 578)">
      <rect width="403" height="175" rx="10" fill="url(#cardBg)" stroke="#1e293b" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="175" rx="2" fill="#fbbf24"/>
      <text x="16" y="28" fill="#fbbf24" font-size="16" font-weight="700">🚒 Emergency &amp; Field Survey</text>
      <text x="16" y="54" fill="#f1f5f9" font-size="13.5" font-weight="600">• Instant First-Responder Access</text>
      <text x="26" y="74" fill="#94a3b8" font-size="12.5">Fire teams see exact floor layouts &amp; utility shutoff valves.</text>
      <text x="16" y="102" fill="#f1f5f9" font-size="13.5" font-weight="600">• Field Officer Mobile Scanning</text>
      <text x="26" y="122" fill="#94a3b8" font-size="12.5">Village accountants verify titles on-site via QR code scan.</text>
      <text x="16" y="152" fill="#34d399" font-size="11.5">✓ Resolves boundary disputes in seconds</text>
    </g>
  </g>

  <!-- ==================== BOTTOM HIGHLIGHT BANNER ==================== -->
  <g transform="translate(45, 905)">
    <rect width="1830" height="142" rx="12" fill="url(#bannerBg)" stroke="#334155" stroke-width="1.5" filter="url(#shadowCard)"/>

    <!-- Line 1: Title -->
    <text x="30" y="28" fill="#f8fafc" font-size="15" font-weight="700" letter-spacing="0.5">🧬 HOW A 3D ULPIN WORKS (HIERARCHICAL BREAKDOWN):</text>
    
    <!-- Line 2: Plain English subtitle -->
    <text x="30" y="48" fill="#94a3b8" font-size="12.5">Every individual apartment, commercial shop, and basement receives an immutable national ID that traces directly back to the surface land parcel.</text>

    <!-- Segment 1: Base ULPIN -->
    <g transform="translate(30, 60)">
      <rect width="320" height="64" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="16" y="26" fill="#38bdf8" font-size="16" font-weight="800">29KAKE5YSQVHEL</text>
      <text x="16" y="48" fill="#cbd5e1" font-size="12">14-Digit Base Land Parcel (Karnataka 29)</text>
    </g>

    <text x="365" y="98" fill="#64748b" font-size="24" font-weight="700">+</text>

    <!-- Segment 2: Building -->
    <g transform="translate(390, 60)">
      <rect width="180" height="64" rx="8" fill="#1e293b" stroke="#c084fc" stroke-width="1.5"/>
      <text x="16" y="26" fill="#c084fc" font-size="16" font-weight="800">-B01</text>
      <text x="16" y="48" fill="#cbd5e1" font-size="12">Building Structure 01</text>
    </g>

    <text x="585" y="98" fill="#64748b" font-size="24" font-weight="700">+</text>

    <!-- Segment 3: Floor -->
    <g transform="translate(610, 60)">
      <rect width="210" height="64" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="1.5"/>
      <text x="16" y="26" fill="#34d399" font-size="16" font-weight="800">-F003</text>
      <text x="16" y="48" fill="#cbd5e1" font-size="12">3rd Floor Level (Above Ground)</text>
    </g>

    <text x="835" y="98" fill="#64748b" font-size="24" font-weight="700">+</text>

    <!-- Segment 4: Unit -->
    <g transform="translate(860, 60)">
      <rect width="210" height="64" rx="8" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/>
      <text x="16" y="26" fill="#fbbf24" font-size="16" font-weight="800">-U002</text>
      <text x="16" y="48" fill="#cbd5e1" font-size="12">Unit 302 (Private Residence)</text>
    </g>

    <text x="1085" y="98" fill="#64748b" font-size="24" font-weight="700">=</text>

    <!-- Full Result Box -->
    <g transform="translate(1115, 60)">
      <rect width="470" height="64" rx="8" fill="#064e3b" stroke="#10b981" stroke-width="1.5"/>
      <text x="18" y="26" fill="#ffffff" font-size="16.5" font-weight="800">29KAKE5YSQVHEL-B01-F003-U002</text>
      <text x="18" y="48" fill="#a7f3d0" font-size="12">Full 3D ULPIN: Flat 302, Building 1, Chamrajpet Parcel</text>
    </g>

    <!-- Sub-surface Note -->
    <g transform="translate(1600, 60)">
      <rect width="200" height="64" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="12" y="25" fill="#f43f5e" font-size="12" font-weight="700">Sub-Surface / Metro:</text>
      <text x="12" y="46" fill="#cbd5e1" font-size="11">-F-U1 (Basement / Ducts)</text>
    </g>
  </g>

  <!-- ==================== FOOTER ==================== -->
  <g transform="translate(45, 1065)">
    <text x="0" y="0" fill="#64748b" font-size="12.5">Bharat Byte: Volumetric Cadastre Architecture • Department of Land Resources (DoLR), Ministry of Rural Development • Smart India Hackathon (SIH 2026)</text>
    <text x="1560" y="0" fill="#64748b" font-size="12.5">Clean Presentation Format (1920 × 1080 px, 16:9)</text>
  </g>
</svg>'''

def generate_clean_html(svg_markup):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    html, body {{
      margin: 0;
      padding: 0;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background: #090d16;
    }}
    svg {{
      width: 1920px;
      height: 1080px;
      display: block;
    }}
  </style>
</head>
<body>
{svg_markup}
</body>
</html>'''

def generate_viewer_html(svg_markup):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bharat Byte — Simple &amp; Understandable Architecture Diagram (SIH 2026)</title>
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }}
    header {{
      text-align: center;
      margin-bottom: 16px;
    }}
    header h1 {{
      font-size: 26px;
      font-weight: 800;
      background: linear-gradient(90deg, #38bdf8, #a855f7, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }}
    header p {{
      color: #94a3b8;
      font-size: 14px;
    }}
    .toolbar {{
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      justify-content: center;
    }}
    .btn {{
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #334155;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.2s ease;
    }}
    .btn:hover {{
      background: #334155;
      color: #ffffff;
      transform: translateY(-1px);
    }}
    .btn-primary {{
      background: #0284c7;
      border-color: #0ea5e9;
      color: #ffffff;
    }}
    .btn-primary:hover {{
      background: #0369a1;
    }}
    .diagram-frame {{
      width: 100%;
      max-width: 1720px;
      background: #090d16;
      border-radius: 14px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8);
      border: 1px solid #1e293b;
      overflow: hidden;
    }}
    svg {{
      width: 100%;
      height: auto;
      display: block;
    }}
  </style>
</head>
<body>
  <header>
    <h1>🇮🇳 Bharat Byte — Simple &amp; Understandable System Architecture</h1>
    <p>4-Step Flow &amp; 3D ULPIN Schema | Smart India Hackathon 2026 (Problem Statement SIH26011)</p>
  </header>

  <div class="toolbar">
    <a href="architecture_diagram.png" download="Bharat_Byte_Architecture_Diagram.png" class="btn btn-primary">
      ⬇️ Download High-Res Image (PNG, 1920×1080)
    </a>
    <a href="architecture_diagram.svg" download="Bharat_Byte_Architecture_Diagram.svg" class="btn">
      ⬇️ Download Scalable Vector (SVG)
    </a>
    <button onclick="window.print()" class="btn">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="diagram-frame">
    {svg_markup}
  </div>
</body>
</html>'''

def main():
    workspace_root = r"c:\Users\Dhiren P Reddy\Downloads\sih 2026 updated\sih 2k26"
    presentation_dir = os.path.join(workspace_root, "ulpin-3d-system", "presentation")
    scripts_dir = os.path.join(workspace_root, "ulpin-3d-system", "scripts")
    os.makedirs(presentation_dir, exist_ok=True)
    os.makedirs(scripts_dir, exist_ok=True)

    svg_markup = generate_simple_svg()
    clean_html = generate_clean_html(svg_markup)
    viewer_html = generate_viewer_html(svg_markup)

    # Output paths
    svg_root = os.path.join(workspace_root, "architecture_diagram.svg")
    svg_pres = os.path.join(presentation_dir, "architecture_diagram.svg")
    
    html_temp = os.path.join(workspace_root, "temp_render_simple.html")
    html_root = os.path.join(workspace_root, "architecture_diagram.html")
    html_pres = os.path.join(presentation_dir, "architecture_diagram.html")
    
    png_root = os.path.join(workspace_root, "architecture_diagram.png")
    png_pres = os.path.join(presentation_dir, "architecture_diagram.png")

    # Write SVGs
    with open(svg_root, "w", encoding="utf-8") as f:
        f.write(svg_markup)
    with open(svg_pres, "w", encoding="utf-8") as f:
        f.write(svg_markup)

    # Write HTMLs
    with open(html_temp, "w", encoding="utf-8") as f:
        f.write(clean_html)
    with open(html_root, "w", encoding="utf-8") as f:
        f.write(viewer_html)
    with open(html_pres, "w", encoding="utf-8") as f:
        f.write(viewer_html)

    # Render PNG with Chrome Headless at 1920x1080
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if os.path.exists(chrome_path):
        cmd = [
            chrome_path,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--window-size=1920,1080",
            f"--screenshot={png_root}",
            html_temp
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and os.path.exists(png_root):
            with open(png_root, "rb") as src, open(png_pres, "wb") as dst:
                dst.write(src.read())
            print(f"Rendered simple & readable PNG: {os.path.getsize(png_root)} bytes")
    
    if os.path.exists(html_temp):
        os.remove(html_temp)

    # Try updating Word doc if unlocked
    doc_path = os.path.join(workspace_root, "Bharat_Byte_Project_Report_and_Abstract.docx")
    try:
        if os.path.exists(doc_path) and os.path.exists(png_root):
            doc = Document(doc_path)
            doc.save(doc_path)
            doc.save(os.path.join(presentation_dir, "Bharat_Byte_Project_Report_and_Abstract.docx"))
            print("Updated docx successfully.")
    except Exception as e:
        print(f"Note: Docx currently open in Word ({e}), skipping docx file write.")

if __name__ == "__main__":
    main()
