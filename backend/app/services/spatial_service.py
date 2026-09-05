"""Spatial service connecting Supabase and the master 3D building catalog."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client

from app.schemas.spatial import (
    BuildingResponse,
    FloorResponse,
    ParcelResponse,
    SearchRecord,
    UndergroundInfraResponse,
    UnitDetailResponse,
    UnitResponse,
)
from app.services.ulpin_engine import (
    assemble_full_ulpin,
    calculate_3d_morton_code,
    calculate_spatial_verification_hash,
    generate_unit_display_label,
)

load_dotenv()

CATALOG_PATHS = [
    os.path.join(os.path.dirname(__file__), "..", "..", "city_buildings_catalog.json"),
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "city_buildings_catalog.json"),
    os.path.join(os.path.dirname(__file__), "..", "db", "city_buildings_catalog.json"),
]


@lru_cache(maxsize=1)
def _load_catalog() -> list[dict[str, Any]]:
    for path in CATALOG_PATHS:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return data
            except Exception as e:
                print(f"[SpatialService] Failed to load catalog from {path}: {e}")
    return []


@lru_cache(maxsize=1)
def _catalog_index() -> dict[str, dict[str, Any]]:
    catalog = _load_catalog()
    index_map: dict[str, dict[str, Any]] = {}
    for b in catalog:
        index_map[str(b["id"]).lower()] = b
        index_map[str(b["base_ulpin"]).upper()] = b
        if b.get("house_no"):
            index_map[b["house_no"].lower()] = b
    return index_map


@lru_cache(maxsize=1)
def _client() -> Client:
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured")
    return create_client(url, key)


def _one(response: Any) -> dict[str, Any] | None:
    return response.data[0] if response.data else None


def _parcel_base(row: dict[str, Any]) -> str:
    return row["parcels"]["base_ulpin"]


def lookup_building_at_point(x: float, y: float) -> BuildingResponse | None:
    """Find building whose bounding box contains (x, y)."""
    catalog = _load_catalog()
    for b in catalog:
        b_min_x, b_max_x, b_min_y, b_max_y = b["bounds"]
        if b_min_x - 0.2 <= x <= b_max_x + 0.2 and b_min_y - 0.2 <= y <= b_max_y + 0.2:
            return BuildingResponse.model_validate(b)
    return None


def list_parcels() -> list[ParcelResponse]:
    try:
        rows = _client().table("parcels").select("*").order("base_ulpin").limit(100).execute().data
        return [ParcelResponse.model_validate(row) for row in rows]
    except Exception:
        catalog = _load_catalog()
        return [
            ParcelResponse.model_validate({
                "id": b["id"],
                "base_ulpin": b["base_ulpin"],
                "geometry": b["footprint"],
                "state_code": "29",
                "district_code": "KA",
                "created_at": "2026-09-04T00:00:00Z",
            })
            for b in catalog[:100]
        ]


def list_buildings(limit: int = 1500) -> list[BuildingResponse]:
    """Return catalog of buildings with house numbers, story counts, and ULPINs."""
    catalog = _load_catalog()
    if catalog:
        return [BuildingResponse.model_validate(b) for b in catalog[:limit]]

    # Fallback to Supabase
    try:
        rows = _client().table("buildings").select("*,parcels!inner(base_ulpin)").order("building_code").execute().data
        return [
            BuildingResponse.model_validate({
                **row,
                "base_ulpin": _parcel_base(row),
                "name": f"Building {row['building_code']}",
            })
            for row in rows
        ]
    except Exception as e:
        print(f"[SpatialService] Error in list_buildings: {e}")
        return []


def get_building(building_id: str) -> BuildingResponse | None:
    catalog_map = _catalog_index()
    match = catalog_map.get(str(building_id).lower()) or catalog_map.get(str(building_id).upper())
    if match:
        return BuildingResponse.model_validate(match)
    return None


def list_building_floors(building_id: str) -> list[FloorResponse] | None:
    catalog_map = _catalog_index()
    match = catalog_map.get(str(building_id).lower()) or catalog_map.get(str(building_id).upper())
    if match and "floors" in match:
        results = []
        for f in match["floors"]:
            results.append(
                FloorResponse.model_validate({
                    "id": f"{match['id']}-{f['floor_code']}",
                    "building_id": match["id"],
                    "floor_code": f["floor_code"],
                    "floor_number": f["floor_number"],
                    "is_underground": False,
                    "footprint": match["footprint"],
                    "height_meters": f.get("height_meters", 3.5),
                })
            )
        return results

    try:
        building = _one(_client().table("buildings").select("id").eq("id", building_id).execute())
        if building is None:
            return None
        rows = _client().table("floors").select("*").eq("building_id", building_id).order("is_underground").order("floor_number").execute().data
        return [FloorResponse.model_validate(row) for row in rows]
    except Exception:
        return None


def list_floor_units(floor_id: str) -> list[UnitResponse] | None:
    # Floor ID format: bldg-{idx}-F{num}
    catalog = _load_catalog()
    for b in catalog:
        for f in b.get("floors", []):
            expected_f_id = f"{b['id']}-{f['floor_code']}"
            if expected_f_id == floor_id or f.get("id") == floor_id:
                return [
                    UnitResponse.model_validate({
                        **u,
                        "id": f"{expected_f_id}-{u['unit_code']}",
                        "floor_id": expected_f_id,
                        "footprint": b["footprint"],
                    })
                    for u in f.get("units", [])
                ]

    try:
        rows = _client().table("units").select("*").eq("floor_id", floor_id).order("unit_code").execute().data
        return [UnitResponse.model_validate(row) for row in rows]
    except Exception:
        return None


def get_unit(unit_id: str) -> UnitDetailResponse | None:
    catalog = _load_catalog()
    for b in catalog:
        for f in b.get("floors", []):
            f_id = f"{b['id']}-{f['floor_code']}"
            for u in f.get("units", []):
                u_id = f"{f_id}-{u['unit_code']}"
                if u_id == unit_id or u.get("id") == unit_id or u["full_ulpin"] == unit_id:
                    return UnitDetailResponse.model_validate({
                        **u,
                        "id": u_id,
                        "floor_id": f_id,
                        "footprint": b["footprint"],
                        "base_ulpin": b["base_ulpin"],
                        "building_code": b["building_code"],
                        "floor_code": f["floor_code"],
                        "assembled_ulpin": u["full_ulpin"],
                        "building_name": b["name"],
                        "house_no": b.get("house_no"),
                        "complex_name": b.get("complex_name"),
                        "structure_category": b.get("structure_category"),
                        "stories_count": b.get("stories_count", 1),
                        "postal_address": b.get("postal_address"),
                    })
    return None


def list_underground_infra() -> list[UndergroundInfraResponse]:
    try:
        rows = _client().table("underground_infra").select("*,parcels!inner(base_ulpin)").order("infra_type").execute().data
        return [UndergroundInfraResponse.model_validate({**row, "base_ulpin": _parcel_base(row)}) for row in rows]
    except Exception:
        return []


def search_ulpin(query: str) -> list[SearchRecord]:
    """Search across house numbers, complexes, building names, and ULPIN codes."""
    q = query.strip()
    q_lower = q.lower()
    q_upper = q.upper()
    catalog = _load_catalog()
    records: list[SearchRecord] = []
    seen_ids: set[str] = set()

    for b in catalog:
        b_id = b["id"]
        house_no = b.get("house_no") or ""
        name = b.get("name") or ""
        complex_name = b.get("complex_name") or ""
        base_ulpin = b["base_ulpin"]
        full_bldg_ulpin = f"{base_ulpin}-{b['building_code']}"

        matches = (
            q_upper in base_ulpin
            or q_upper in full_bldg_ulpin
            or (house_no and q_lower in house_no.lower())
            or (name and q_lower in name.lower())
            or (complex_name and q_lower in complex_name.lower())
        )

        if matches and b_id not in seen_ids:
            seen_ids.add(b_id)
            records.append(
                SearchRecord.model_validate({
                    "record_type": "building",
                    "id": b_id,
                    "base_ulpin": base_ulpin,
                    "building_code": b["building_code"],
                    "full_ulpin": full_bldg_ulpin,
                    "name": name,
                    "house_no": house_no,
                    "geometry": b["footprint"],
                })
            )
            if len(records) >= 30:
                break

    # Also search units
    if len(records) < 30:
        for b in catalog:
            for f in b.get("floors", []):
                for u in f.get("units", []):
                    u_ulpin = u["full_ulpin"]
                    u_num = u.get("unit_number") or ""
                    if q_upper in u_ulpin or (u_num and q_lower in u_num.lower()):
                        u_id = f"{b['id']}-{f['floor_code']}-{u['unit_code']}"
                        if u_id not in seen_ids:
                            seen_ids.add(u_id)
                            records.append(
                                SearchRecord.model_validate({
                                    "record_type": "unit",
                                    "id": u_id,
                                    "base_ulpin": b["base_ulpin"],
                                    "building_code": b["building_code"],
                                    "floor_code": f["floor_code"],
                                    "unit_code": u["unit_code"],
                                    "full_ulpin": u_ulpin,
                                    "name": u_num,
                                    "house_no": b.get("house_no"),
                                    "geometry": b["footprint"],
                                })
                            )
                            if len(records) >= 30:
                                break
                if len(records) >= 30:
                    break
            if len(records) >= 30:
                break

    return records
