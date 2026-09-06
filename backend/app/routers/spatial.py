"""HTTP layer for spatial locality data; database work remains in spatial_service."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.spatial import (
    BuildingResponse,
    FloorResponse,
    ParcelResponse,
    SearchResponse,
    UndergroundInfraResponse,
    UnitDetailResponse,
    UnitResponse,
)
from app.services import spatial_service

router = APIRouter(prefix="/api", tags=["spatial"])
UlpInQuery = Annotated[
    str,
    Query(min_length=1, max_length=100, description="Full or partial ULPIN, house number, or complex name"),
]


@router.get("/parcels", response_model=list[ParcelResponse])
def get_parcels() -> list[ParcelResponse]:
    return spatial_service.list_parcels()


@router.get("/buildings", response_model=list[BuildingResponse])
def get_buildings(limit: int = 15000) -> list[BuildingResponse]:
    return spatial_service.list_buildings(limit=limit)


@router.get("/buildings/lookup", response_model=BuildingResponse | None)
def lookup_building(x: float = Query(...), y: float = Query(...)) -> BuildingResponse:
    building = spatial_service.lookup_building_at_point(x, y)
    if building is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No building at coordinates")
    return building


@router.get("/buildings/{building_id}", response_model=BuildingResponse)
def get_building(building_id: str) -> BuildingResponse:
    building = spatial_service.get_building(building_id)
    if building is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Building not found")
    return building


@router.get("/buildings/{building_id}/floors", response_model=list[FloorResponse])
def get_building_floors(building_id: str) -> list[FloorResponse]:
    floors = spatial_service.list_building_floors(building_id)
    if floors is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Building not found")
    return floors


@router.get("/floors/{floor_id}/units", response_model=list[UnitResponse])
def get_floor_units(floor_id: str) -> list[UnitResponse]:
    units = spatial_service.list_floor_units(floor_id)
    if units is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Floor not found")
    return units


@router.get("/units/{unit_id}", response_model=UnitDetailResponse)
def get_unit(unit_id: str) -> UnitDetailResponse:
    unit = spatial_service.get_unit(unit_id)
    if unit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return unit


@router.get("/underground", response_model=list[UndergroundInfraResponse])
def get_underground() -> list[UndergroundInfraResponse]:
    return spatial_service.list_underground_infra()


@router.get("/search", response_model=SearchResponse)
def search_ulpin(ulpin: UlpInQuery) -> SearchResponse:
    return SearchResponse(query=ulpin, records=spatial_service.search_ulpin(ulpin))
