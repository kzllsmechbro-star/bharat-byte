"""Pydantic response contracts for the public spatial API."""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class GeoJsonGeometry(BaseModel):
    """A GeoJSON geometry returned by PostGIS through PostgREST."""

    type: str
    coordinates: Any


class ParcelResponse(BaseModel):
    id: UUID
    base_ulpin: str
    geometry: GeoJsonGeometry
    state_code: str
    district_code: str
    created_at: str


class BuildingResponse(BaseModel):
    id: UUID | str
    parcel_id: UUID | str | None = None
    base_ulpin: str
    building_code: str
    building_type: str
    structure_category: str | None = None
    name: str | None = None
    house_no: str | None = None
    complex_name: str | None = None
    complex_type: str | None = None
    stories_count: int | None = None
    height_meters: float | None = None
    floors_completed: int | None = None
    floors_planned: int | None = None
    footprint: GeoJsonGeometry
    center: list[float] | None = None
    bounds: list[float] | None = None
    ai_spatial_hash: str | None = None
    postal_address: str | None = None
    total_units_count: int | None = None
    created_at: str | None = None


class FloorResponse(BaseModel):
    id: UUID | str
    building_id: UUID | str
    floor_code: str
    floor_number: int
    is_underground: bool = False
    footprint: GeoJsonGeometry
    height_meters: float = 3.5


class UnitResponse(BaseModel):
    id: UUID | str
    floor_id: UUID | str
    unit_code: str
    full_ulpin: str
    unit_number: str | None = None
    footprint: GeoJsonGeometry
    unit_type: str
    elevation_meters: list[float] | None = None
    volume_m3: float | None = None
    ai_morton_code: str | None = None
    spatial_verification_hash: str | None = None


class UnitDetailResponse(UnitResponse):
    base_ulpin: str
    building_code: str
    floor_code: str
    assembled_ulpin: str
    building_name: str | None = None
    house_no: str | None = None
    complex_name: str | None = None
    structure_category: str | None = None
    stories_count: int | None = None
    postal_address: str | None = None


class UndergroundInfraResponse(BaseModel):
    id: UUID | str
    parcel_id: UUID | str
    base_ulpin: str
    infra_type: Literal["drainage", "metro_tunnel", "metro_station"]
    path: GeoJsonGeometry
    full_ulpin: str
    depth_meters: float


class SearchRecord(BaseModel):
    record_type: Literal["parcel", "building", "floor", "unit"]
    id: UUID | str
    base_ulpin: str
    building_code: str | None = None
    floor_code: str | None = None
    unit_code: str | None = None
    full_ulpin: str
    name: str | None = None
    house_no: str | None = None
    geometry: GeoJsonGeometry


class SearchResponse(BaseModel):
    query: str
    records: list[SearchRecord] = Field(default_factory=list)
