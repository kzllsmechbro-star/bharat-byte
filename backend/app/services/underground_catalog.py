"""Deterministic in-memory underground infrastructure catalog.

Generates storm-water drain and Bengaluru Metro Purple-Line tunnel data
aligned with the synthetic RR Nagar locality mesh.  All coordinates are
Three.js scene units (X = Blender-X, Y = height/depth, Z = -Blender-Y).
Scene extents: approx ±750 in X and Z.

No database or HTTP dependencies — safe to call from tests, API handlers,
and seed scripts identically.
"""
from __future__ import annotations

from typing import Any

from app.services.ulpin_engine import (
    assemble_full_ulpin,
    generate_building_code,
    generate_floor_code,
    generate_unit_code,
)

# ── Locality bounds used for bounds validation ──────────────────────────────
LOCALITY_BOUND = 800.0  # scene units with a small margin beyond the ±750 mesh

# ── Segment definitions ─────────────────────────────────────────────────────
#
# Each segment is a dict compatible with UndergroundInfraResponse.
# waypoints: list of [x, y, z]   (Three.js world coords)
# node_ids : start-node and end-node ids  (ensures connectivity)
#
_SEGMENTS: list[dict[str, Any]] = [
    # ── Stormwater drains ─────────────────────────────────────────────────
    {
        "id": "drain-ns-a",
        "base_ulpin": "29KADRAINS0001",
        "infra_type": "drainage",
        "segment_type": "drain",
        "waypoints": [[-30, -6, -680], [-32, -6, -460], [-29, -6, -230], [-30, -6, 0], [-30, -6, 80]],
        "depth_meters": -6.0,
        "diameter_m": 1.8,
        "material": "corrugated_steel",
        "segment_name": "Central N–S Drain (North arm)",
        "parent_line_id": "drain-ns-main",
        "node_ids": ["dn-ns-north", "dn-junction-1"],
    },
    {
        "id": "drain-ns-b",
        "base_ulpin": "29KADRAINS0002",
        "infra_type": "drainage",
        "segment_type": "drain",
        "waypoints": [[-30, -6, 80], [-31, -6, 230], [-29, -6, 460], [-30, -6, 680]],
        "depth_meters": -6.0,
        "diameter_m": 1.8,
        "material": "corrugated_steel",
        "segment_name": "Central N–S Drain (South arm)",
        "parent_line_id": "drain-ns-main",
        "node_ids": ["dn-junction-1", "dn-ns-south"],
    },
    {
        "id": "drain-ew-a",
        "base_ulpin": "29KADRAINE0001",
        "infra_type": "drainage",
        "segment_type": "drain",
        "waypoints": [[-680, -6, 80], [-460, -6, 78], [-230, -6, 80], [-30, -6, 80]],
        "depth_meters": -6.0,
        "diameter_m": 1.8,
        "material": "corrugated_steel",
        "segment_name": "Central E–W Drain (West arm)",
        "parent_line_id": "drain-ew-main",
        "node_ids": ["dn-ew-west", "dn-junction-1"],
    },
    {
        "id": "drain-ew-b",
        "base_ulpin": "29KADRAINE0002",
        "infra_type": "drainage",
        "segment_type": "drain",
        "waypoints": [[-30, -6, 80], [230, -6, 82], [460, -6, 79], [680, -6, 80]],
        "depth_meters": -6.0,
        "diameter_m": 1.8,
        "material": "corrugated_steel",
        "segment_name": "Central E–W Drain (East arm)",
        "parent_line_id": "drain-ew-main",
        "node_ids": ["dn-junction-1", "dn-ew-east"],
    },
    {
        "id": "drain-orr",
        "base_ulpin": "29KADRAINORR01",
        "infra_type": "drainage",
        "segment_type": "drain",
        "waypoints": [
            [-580, -5.5, -540], [-380, -5.5, -300],
            [-180, -5.5, -60], [20, -5.5, 180],
            [260, -5.5, 380], [520, -5.5, 560],
        ],
        "depth_meters": -5.5,
        "diameter_m": 2.2,
        "material": "corrugated_steel",
        "segment_name": "Outer Ring Road Collector Drain",
        "parent_line_id": "drain-orr",
        "node_ids": ["dn-orr-west", "dn-orr-east"],
    },
    # ── Metro Purple Line tunnels (Mysore Road – Kengeri alignment) ────────
    {
        "id": "metro-t1",
        "base_ulpin": "29KAMETROGRN01",
        "infra_type": "metro_tunnel",
        "segment_type": "metro_tunnel",
        "waypoints": [[-680, -18, 160], [-600, -18, 154], [-530, -18, 148], [-450, -18, 140]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "reinforced_concrete_tbm",
        "segment_name": "Purple Line — West Portal to RR Nagar Stn",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-west-portal", "mn-station-1"],
    },
    {
        "id": "metro-t2",
        "base_ulpin": "29KAMETROGRN02",
        "infra_type": "metro_tunnel",
        "segment_type": "metro_tunnel",
        "waypoints": [[-450, -18, 140], [-370, -18, 128], [-295, -18, 118], [-225, -18, 110]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "reinforced_concrete_tbm",
        "segment_name": "Purple Line — RR Nagar Stn to Midpoint",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-station-1", "mn-mid-1"],
    },
    {
        "id": "metro-t3",
        "base_ulpin": "29KAMETROGRN03",
        "infra_type": "metro_tunnel",
        "segment_type": "metro_tunnel",
        "waypoints": [[-225, -18, 110], [-148, -18, 100], [-74, -18, 95], [0, -18, 90]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "reinforced_concrete_tbm",
        "segment_name": "Purple Line — Midpoint to RRMP Stn",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-mid-1", "mn-station-2"],
    },
    {
        "id": "metro-t4",
        "base_ulpin": "29KAMETROGRN04",
        "infra_type": "metro_tunnel",
        "segment_type": "metro_tunnel",
        "waypoints": [[0, -18, 90], [75, -18, 82], [150, -18, 74], [225, -18, 68]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "reinforced_concrete_tbm",
        "segment_name": "Purple Line — RRMP Stn to Midpoint",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-station-2", "mn-mid-2"],
    },
    {
        "id": "metro-t5",
        "base_ulpin": "29KAMETROGRN05",
        "infra_type": "metro_tunnel",
        "segment_type": "metro_tunnel",
        "waypoints": [[225, -18, 68], [300, -18, 60], [375, -18, 52], [450, -18, 45]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "reinforced_concrete_tbm",
        "segment_name": "Purple Line — Midpoint to Konanakunte Stn",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-mid-2", "mn-station-3"],
    },
    {
        "id": "metro-t6",
        "base_ulpin": "29KAMETROGRN06",
        "infra_type": "metro_tunnel",
        "segment_type": "metro_tunnel",
        "waypoints": [[450, -18, 45], [530, -18, 36], [605, -18, 29], [680, -18, 22]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "reinforced_concrete_tbm",
        "segment_name": "Purple Line — Konanakunte Stn to East Portal",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-station-3", "mn-east-portal"],
    },
]

# ── Station nodes (metro_station type — get assembled ULPINs) ───────────────
_STATION_DEFS: list[dict[str, Any]] = [
    {
        "id": "metro-s1",
        "base_ulpin": "29KAMETROST001",
        "infra_type": "metro_station",
        "segment_type": "metro_station",
        "waypoints": [[-450, -18, 140]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "platform_concrete",
        "segment_name": "Rajarajeshwari Nagar Metro Station",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-station-1"],
    },
    {
        "id": "metro-s2",
        "base_ulpin": "29KAMETROST002",
        "infra_type": "metro_station",
        "segment_type": "metro_station",
        "waypoints": [[0, -18, 90]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "platform_concrete",
        "segment_name": "RRMP Central Metro Station",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-station-2"],
    },
    {
        "id": "metro-s3",
        "base_ulpin": "29KAMETROST003",
        "infra_type": "metro_station",
        "segment_type": "metro_station",
        "waypoints": [[450, -18, 45]],
        "depth_meters": -18.0,
        "diameter_m": 6.0,
        "material": "platform_concrete",
        "segment_name": "Konanakunte Cross Metro Station",
        "parent_line_id": "metro-purple",
        "node_ids": ["mn-station-3"],
    },
]


def _assemble_station_ulpin(station: dict[str, Any]) -> str:
    """Build a valid F-U1 underground ULPIN for a metro station node."""
    base = station["base_ulpin"]
    bcode = generate_building_code(base, 1)
    fcode = generate_floor_code(1, is_underground=True)
    ucode = generate_unit_code(1)
    return assemble_full_ulpin(base, bcode, fcode, ucode)


def _build_stations() -> list[dict[str, Any]]:
    result = []
    for s in _STATION_DEFS:
        assembled = _assemble_station_ulpin(s)
        result.append({
            **s,
            "assembled_ulpin": assembled,
            "full_ulpin": assembled,
            "path": {"type": "Point", "coordinates": s["waypoints"][0][:2]},
        })
    return result


def _build_segments() -> list[dict[str, Any]]:
    result = []
    for seg in _SEGMENTS:
        result.append({
            **seg,
            "assembled_ulpin": None,
            "path": {
                "type": "LineString",
                "coordinates": [[wp[0], wp[2]] for wp in seg["waypoints"]],
            },
        })
    return result


# Module-level cache — safe for multi-worker use (read-only after init)
_ALL_INFRA: list[dict[str, Any]] = _build_segments() + _build_stations()


def list_underground_infra() -> list[dict[str, Any]]:
    """Return all underground segments and station nodes."""
    return _ALL_INFRA


def list_segments_by_type(infra_type: str) -> list[dict[str, Any]]:
    return [s for s in _ALL_INFRA if s["infra_type"] == infra_type]


def list_all_node_ids() -> set[str]:
    """Return the full set of node IDs referenced by all segments."""
    nodes: set[str] = set()
    for seg in _ALL_INFRA:
        for nid in seg.get("node_ids", []):
            nodes.add(nid)
    return nodes
