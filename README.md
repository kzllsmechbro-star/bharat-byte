# 🇮🇳 Bharat Byte — 3D ULPIN System
### 3D Unique Land Parcel Identification & Vertical Property Mapping
**Smart India Hackathon (SIH 2026) | Problem Statement: SIH26011**

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20%7C%20R3F%20%7C%20Drei-black?logo=three.js)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20PostGIS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Spatial](https://img.shields.io/badge/Spatial%20Engine-Shapely%20%7C%20GeoJSON-green)](https://shapely.readthedocs.io/)
[![Catalog](https://img.shields.io/badge/3D%20Cadastre-14%2C768%20Unique%20Buildings-orange)](#-locality-coverage--unique-cadastral-registry)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Executive Summary

India's **Bhu-Aadhaar (Unique Land Parcel Identification Number — ULPIN)**, instituted by the **Department of Land Resources (DoLR), Ministry of Rural Development**, assigns a 14-digit alphanumeric identifier to land parcels based on their 2D geographic coordinates. While this standard functions effectively for flat agricultural or open land, modern urban centers have rapidly expanded vertically:
- Multi-storey residential apartment complexes and gated layouts housing hundreds of families on a single ground parcel.
- High-rise commercial trade centers with multiple distinct business tenancies.
- Multi-tiered subterranean municipal infrastructure, including stormwater culverts, high-voltage power ducts, water mains, and underground rapid transit (Metro) tunnels.

In conventional 2D cadastre, an entire multi-storey tower shares a single surface ULPIN. This creates critical operational limitations:
1. **Individual Title Registry**: Inability to issue clear, tamper-evident digital cadastral deeds for individual flats, duplexes, or tenements.
2. **Volumetric Municipal Assessment**: Ambiguity in assessing floor-level and unit-level municipal property taxes and floor space indexes (FSI / FAR).
3. **Sub-Surface Infrastructure Conflicts**: Lack of standardized legal easements and clearance buffers between underground utilities and deep building foundations.
4. **Vertical Dispute Resolution**: Ambiguities regarding air rights, cantilevers, and mortgage collateralization.

**Bharat Byte** resolves this by extending the national Bhu-Aadhaar standard into a **deterministic, hierarchical 3D Cadastral Digital Twin**. It provides sub-centimeter spatial registration spanning 14,768 unique buildings across Bengaluru's **Chamrajpet** and **Basaveshwaranagar** localities, down to individual floor strata, private residential units, and underground municipal utilities.

---

## 🧬 ULPIN 3D Hierarchical ID Schema

The system enforces a standardized hierarchical schema that preserves full backward compatibility with India's 14-character Base ULPIN while embedding vertical and sub-surface ancestry:

```
BASE-ULPIN (14 chars) + "-B{2-digit building}" + "-F{3-digit floor | F-U{n} underground}" + "-U{3-digit unit}"
```

```
Parcel (BASE-ULPIN: 14 chars)
 └── Building Structure (-B{xx})
      └── Vertical Floor Stratum (-F{xxx} or -F-U{n})
           └── Private Unit / Flat (-U{xxx})
```

### Schema Breakdown

| Segment | Format | Example | Description |
|---|---|---|---|
| **Base ULPIN** | 14 chars | `29KAKE5YSQVHEL` | Standard Bhu-Aadhaar surface parcel ID (State 29 + District KA + Centroid Hash) |
| **Building Code** | `-B{2-digit}` | `-B01` | Discrete building structure situated on that parcel |
| **Floor (Above Ground)** | `-F{3-digit}` | `-F001` | Vertical floor level (`001` = Ground / First Story, `002` = Second Story) |
| **Floor (Underground)** | `-F-U{n}` | `-F-U1` | Sub-surface level (e.g. Basement 1, utility duct, metro concourse) |
| **Unit Code** | `-U{3-digit}` | `-U001` | Individual apartment, flat, commercial office, or shop tenement |

### Sample Assembled 3D ULPIN
```
29KAKE5YSQVHEL-B01-F003-U002
├── 29KAKE5YSQVHEL  -> Surface Land Parcel (Karnataka State 29, Bengaluru)
├── B01             -> Building Structure 01
├── F003            -> 3rd Story Level
└── U002            -> Flat 302 on the 3rd Floor
```

---

## 🏙️ Locality Coverage & Unique Cadastral Registry

The cadastral database encompasses **14,768 registered buildings** covering two of Bengaluru's most prominent urban sectors, each assigned a **strictly unique name with zero repetition**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          BENGALURU 3D CADASTRAL REGISTRY                               │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ 1. Chamrajpet Locality (Pincode: 560018)  │ 2. Basaveshwaranagar (Pincode: 560079)     │
│    - 5,592 Unique Buildings               │    - 9,176 Unique Buildings                │
│    - 1st to 8th Main Road, 1st to 15th    │    - 1st to 4th Stages, 1st to 4th Blocks  │
│      Cross, AV Road, Bull Temple Road,    │    - Siddaiah Puranik Rd, BEML Layout,     │
│      Raghavendra Colony, Tippu Palace Rd  │      KHB Colony, Gruhalakshmi Layout       │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

- **Residential Houses & Duplexes (10,593 buildings)**:
  Named using authentic traditional Karnataka home typologies (`Nilaya`, `Nivasa`, `Kuteera`, `Gruha`, `Bhavana`, `Mane`, `Nivas`, `Ashraya`, `Dhaama`, `Sannidhi`, `Sadana`, `Kuteer`) combined with 160+ historical Karnataka dynasties, sacred rivers, saints, and deities:
  e.g., `Sri Raghavendra Prasanna Nilaya`, `Basaveshwara Prasanna Nilaya`, `Sharadamba Prasanna Nilaya`, `Chamundeshwari Prasanna Nilaya`, `Kaveri Paramananda Nivasa`, `Hoysala Samruddhi Kuteera`, `Kadamba Ashirwada Bhavana`, `Siddhaganga Punya Mane`.
- **Apartment Complexes (4,013 buildings)**:
  Named with authentic regional Karnataka residences (avoiding generic Western branding like "Silver Cascade"):
  e.g., `Sharadamba Vaibhava Residency Block B`, `Bhima Vaibhava Residency Block D`, `Kumudvathi Prasanna Residency Block C`, `Hoysala Siri Residency Block E`, `Kuvempu Paramananda Residency Block B`, `Masti Sadashiva Residency Block C`.
- **Commercial Complexes (162 buildings)**:
  Traditional Karnataka commercial and mercantile establishments:
  e.g., `Vanijya Soudha`, `Vyapara Kendra`, `Vanijya Complex`, `Vyavahara Bhavan`, `Vardhana Complex`, `Udyoga Soudha`, `Samruddhi Trade Center`.

> **100% Strict Uniqueness (Zero Repetition Guarantee)**:
> Every building across all 14,768 records possesses a **completely unique, non-repeating Karnataka name** verified via automated programmatic set assertions, eliminating identical duplicate names.

---

## 📐 Real 3D Mesh Footprint Extraction & Millimeter Alignment

Earlier iterations relied on axis-aligned 4-corner bounding boxes, which produced misaligned rectangular highlights cutting diagonally across angled 3D city buildings.

The system now extracts building footprints directly from the **3D City Environment Mesh** (`modular_city_environment.glb`):
1. **Geometric Parsing**:
   - Parses all **254,114 vertices** and **127,058 triangles** of `map_4.osm_buildings`.
   - Isolates vertical wall geometries meeting the ground plane ($Y < 0.1\text{m}$), indexing **63,303 unique ground vertices**.
2. **Planar Half-Edge Euler Traversal**:
   - Constructs a directed half-edge graph sorted by polar angle.
   - Automatically traces closed planar loops to recover the true rotated multi-vertex polygons.
3. **1-to-1 Cadastral Matching**:
   - Matches 14,719 buildings (**99.67% of the entire catalog**) with exact millimeter accuracy to their corresponding 3D mesh prisms.
   - Highlights and 3D floor slabs fit the physical 3D city model with **sub-centimeter precision** at the exact orientation angles of the street corridor.

---

## 📜 Dynamic 3D ULPIN Deed & Property Certificate Generator

Clicking any building in the 3D scene allows users to launch the **ULPIN Property Document Modal** or generate an official **Bhu-Aadhaar 3D Cadastral Deed (PDF)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│         GOVERNMENT OF INDIA • MINISTRY OF RURAL DEVELOPMENT            │
│         BHU-AADHAAR 3D CADASTRAL CERTIFICATE & PROPERTY DEED           │
├────────────────────────────────────────────────────────────────────────┤
│ [QR Code]   Certificate ID: IN-3D-ULPIN-29KAKE-B01-49281               │
│             State: Karnataka (29) | Locality: Chamrajpet (560018)      │
│             Base ULPIN: 29KAKE5YSQVHEL | Building: B01                 │
├────────────────────────────────────────────────────────────────────────┤
│ 1. SPATIAL CADASTRE & GEODETIC ATTRIBUTES                              │
│    - Planimetric Area: 264.1 m² (Shoelace Formula)                     │
│    - True Perimeter: 68.4 m | Height: 16.0 m | Stories: 5              │
│    - 3D Volumetric Airspace: 4,225.6 m³                                │
│    - 3D Morton Spatial Code: 036FC722 (Z-Order Space-Filling Curve)    │
│    - Cryptographic Spatial Hash: 0x06F3DEADBEEF... (Tamper-Proof)      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. SUBTERRANEAN INFRASTRUCTURE CLEARANCE AUDIT                         │
│    - Potable Water Main: 12.3m (Compliant - Safe Buffer)               │
│    - Gravity Sewer Trunk: 14.8m (Compliant - Safe Buffer)              │
│    - Stormwater Drainage Culvert: 18.5m (Compliant)                    │
│    - Underground High Voltage Power Duct: 22.0m (Compliant)            │
├────────────────────────────────────────────────────────────────────────┤
│ 3. VERTICAL PROPERTY & UNIT SCHEDULE (FLOOR-BY-FLOOR)                  │
│    - Floor F001 [0.0m - 3.5m]: Units U001, U002, U003                  │
│    - Floor F002 [3.5m - 7.0m]: Units U001, U002, U003                  │
│    - Floor F003 [7.0m - 10.5m]: Units U001, U002, U003                 │
├────────────────────────────────────────────────────────────────────────┤
│ 4. STATUTORY AIRSPACE & PLANNING CLEARANCES                            │
│    - Floor Area Ratio (FAR): 3.25 | Airspace Permissible Limit: 45.0m  │
│    - Structural Stability: IS 456:2000 & IS 1893 (Seismic Zone II)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Analytical Features:
- **Dynamic Planimetric Mathematics**:
  - Exact area calculated via the **Shoelace Formula (Surveyor's Formula)** from boundary coordinates.
  - 3D volumetric airspace envelope calculated from true floor heights.
- **3D Space-Filling Morton Curves (Z-Order Indexing)**:
  - Bit-interleaved 3D coordinates ensure spatial proximity in database indexes.
- **Cryptographic Spatial Verification Hash**:
  - Deterministic 128-bit hash computed from base ULPIN, building code, floor count, height, and area, rendering records tamper-evident.
- **Subterranean Utility Proximity Audit**:
  - Real-time Euclidean distance calculations from building foundations to municipal water, sewer, drainage, power ducts, and metro tunnels with statutory clearance buffer checks.
- **ISO/IEC 18004 Compliant QR Code**:
  - Embedded digital payload for instant field validation using surveyor mobile tablets.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Data & 3D Assets
        GLB[modular_city_environment.glb (3D Mesh)]
        Catalog[city_buildings_catalog.json (14,768 Unique Buildings)]
        Underground[underground_infra.json (Subterranean Utilities)]
    end

    subgraph Backend Engine (FastAPI)
        FastAPI[FastAPI REST Server (:8000)]
        ULPINEngine[ULPIN 3D Engine & Topology Validator]
        SpatialService[Spatial Service]
        FastAPI --> SpatialService
        SpatialService --> ULPINEngine
        SpatialService --> Catalog
    end

    subgraph Frontend Application (React 18 + Vite + Three.js)
        Store[Zustand localityStore]
        Canvas[R3F 3D WebGL Canvas]
        CityMesh[ModularCityModel (3D City)]
        BuildingHighlight[Building3D (Floor Slices & Highlight)]
        PDFGen[jsPDF Document Generator]
        UI[HUD Panels & Info Drawer]

        Store --> Canvas
        Store --> UI
        Canvas --> CityMesh
        Canvas --> BuildingHighlight
        UI --> PDFGen
        GLB --> CityMesh
    end

    Backend Engine <--> Frontend Application
```

---

## 📂 Repository Structure

```
ulpin-3d-system/
├── frontend/                     # React 18 + TypeScript + Vite + Three.js
│   ├── public/
│   │   ├── modular_city_environment.glb  # 3D Bengaluru City Mesh (10.9 MB)
│   │   ├── city_buildings_catalog.json   # 14,768 unique building spatial catalog
│   │   ├── underground_infra.json        # Subterranean infrastructure dataset
│   │   └── favicon.svg
│   └── src/
│       ├── api/                 # Axios REST client with offline fallback
│       ├── components/          # 3D and UI components
│       │   ├── Building3D.tsx           # 3D floor slabs & perimeter highlights
│       │   ├── CameraController.tsx     # Smooth camera fly-to lerp with safety timeouts
│       │   ├── CelestialSky.tsx         # Day/night cycle with sun, moon & stars
│       │   ├── IndianArchitecture.tsx   # Procedural roofs, tanks & balconies
│       │   ├── IndianStreetProps.tsx    # Neem trees, streetlamps, transformers
│       │   ├── LayerToggles.tsx         # HUD visibility toggles
│       │   ├── Legend.tsx               # Collapsible Map Legend pill badge
│       │   ├── LocalityBuildings.tsx    # Active selected 3D building overlay
│       │   ├── ModularCityModel.tsx     # Three.js 3D city environment renderer
│       │   ├── SatelliteTerrain.tsx     # Base ground plane with raycast handling
│       │   ├── SearchBar.tsx            # Autocomplete cadastral search
│       │   ├── UlpinDocumentModal.tsx   # Interactive ULPIN Certificate modal viewer
│       │   ├── UlpinInfoPanel.tsx       # Property inspector & metadata drawer
│       │   ├── UndergroundLayer.tsx     # Subterranean utility pipelines & metro
│       │   └── Unit3D.tsx               # Internal flat & unit 3D extrusion
│       ├── scenes/              # R3F scene definition (LocalityScene.tsx)
│       ├── store/               # Zustand state store (localityStore.ts)
│       ├── types/               # TypeScript cadastral & spatial interfaces
│       └── utils/
│           ├── coordinates.ts          # Blender to Three.js coordinate conversion
│           ├── spatialCalculations.ts  # Shoelace area, perimeter, clearances & hash
│           └── ulpinPdfGenerator.ts    # Official A4 Bhu-Aadhaar PDF generator
├── backend/                      # Python 3.11 + FastAPI application
│   ├── app/
│   │   ├── db/                  # Database session & seed scripts
│   │   ├── routers/             # API routes (spatial.py)
│   │   ├── schemas/             # Pydantic data validation schemas
│   │   ├── services/
│   │   │   ├── spatial_service.py # Spatial query handling & catalog search
│   │   │   └── ulpin_engine.py    # Deterministic ULPIN math & topology validator
│   │   └── main.py              # FastAPI entry point & CORS configuration
│   ├── tests/                   # Pytest test suite
│   ├── city_buildings_catalog.json # Backend building cache
│   └── requirements.txt         # Python dependencies
├── scripts/                      # Automated data processing pipelines
│   ├── update_catalog_polygons.js       # Extracts 3D building polygons from GLB mesh
│   ├── update_catalog_locality_names.js # Generates 100% unique Chamrajpet & Basaveshnagar names
│   ├── verify_all_homes_alignment.js    # Automated millimeter alignment verification
│   └── convert_osm_to_kml.py            # OSM to KML parser
├── seed-data/                    # Spatial seed datasets
└── README.md                     # Project documentation (this file)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher
- **Python**: v3.11 or higher (optional, for backend API)

---

### 1. Frontend Setup (React 18 + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at **http://localhost:5173** to launch the interactive 3D Locality Viewer.

---

### 2. Backend Setup (FastAPI - Optional)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Interactive Swagger API docs are available at **http://127.0.0.1:8000/docs**.

---

## 🧪 Verification & Automated Tests

### 1. 3D Building Mesh Alignment Verification
Verify that all 14,768 building footprints align with the 3D city mesh:
```bash
node scripts/verify_all_homes_alignment.js
```
- **Result**: 14,719 / 14,768 buildings (99.67%) verified with sub-centimeter vertex coincidence.

### 2. Locality Name Uniqueness Assertion
Verify that all names across Chamrajpet and Basaveshnagar are strictly unique:
```bash
node scripts/update_catalog_locality_names.js
```
- **Result**: 14,768 / 14,768 unique records (PASSED with zero duplicates).

### 3. Frontend Production Build & Type Check
```bash
cd frontend
npm run build
npm run lint
```
- **Result**: Compiles cleanly with zero errors.

---

## 👥 Smart India Hackathon (SIH 2026)

- **Problem Statement ID**: SIH26011
- **Domain**: Smart Cities, Land Records & Geospatial Information Systems
- **Team**: Bharat Byte
- **Repository**: [https://github.com/kzllsmechbro-star/bharat-byte](https://github.com/kzllsmechbro-star/bharat-byte)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
