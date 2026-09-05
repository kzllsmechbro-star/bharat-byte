"""Deterministic ULPIN generation and lightweight spatial topology validation.

This module intentionally has no database or HTTP dependencies so it can be used by
seed scripts, API handlers, and unit tests in exactly the same way.
"""

from __future__ import annotations

import hashlib
import re
from enum import Enum
from typing import TypeAlias

from pydantic import BaseModel, Field, field_validator, model_validator
from shapely.geometry import Polygon


Coordinate: TypeAlias = tuple[float, float]
PolygonCoordinates: TypeAlias = list[Coordinate]
_BASE36_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
_MAX_FLOOR_AREA_GROWTH_RATIO = 1.20


class BuildingType(str, Enum):
    """Building categories represented by the prototype."""

    APARTMENT = "apartment"
    HOUSE = "house"
    HALF_BUILT = "half_built"
    SCHOOL = "school"


class ConstructionStatus(BaseModel):
    """Progress data used when ``building_type`` is ``half_built``."""

    floors_completed: int = Field(ge=0)
    floors_planned: int = Field(ge=0)

    @model_validator(mode="after")
    def completed_floors_cannot_exceed_planned(self) -> "ConstructionStatus":
        if self.floors_completed > self.floors_planned:
            raise ValueError("floors_completed cannot exceed floors_planned")
        return self


class Parcel(BaseModel):
    """A surface land parcel and its base ULPIN."""

    geometry: PolygonCoordinates
    base_ulpin: str = Field(min_length=14, max_length=14)


class Building(BaseModel):
    """A building situated on a parcel."""

    geometry: PolygonCoordinates
    base_ulpin: str = Field(min_length=14, max_length=14)
    building_code: str = Field(pattern=r"^B\d{2}$")
    ulpin: str
    building_type: BuildingType
    construction_status: ConstructionStatus | None = None

    @model_validator(mode="after")
    def half_built_requires_status(self) -> "Building":
        if self.building_type is BuildingType.HALF_BUILT and self.construction_status is None:
            raise ValueError("half_built buildings require construction_status")
        return self


class Floor(BaseModel):
    """One horizontal building level, represented by its plan footprint."""

    geometry: PolygonCoordinates
    base_ulpin: str = Field(min_length=14, max_length=14)
    building_code: str = Field(pattern=r"^B\d{2}$")
    floor_code: str = Field(pattern=r"^F(?:\d{3}|-U\d+)$")
    ulpin: str
    floor_number: int = Field(ge=1)
    is_underground: bool = False


class Unit(BaseModel):
    """An individually identifiable flat, shop, or other floor-level unit.

    ``geometry`` is the unit footprint. ``floor_footprint`` repeats the containing
    Floor.geometry deliberately: the public validator accepts only a list of Units,
    so this keeps containment validation self-contained and serializable.
    """

    geometry: PolygonCoordinates
    floor_footprint: PolygonCoordinates
    base_ulpin: str = Field(min_length=14, max_length=14)
    building_code: str = Field(pattern=r"^B\d{2}$")
    floor_code: str = Field(pattern=r"^F(?:\d{3}|-U\d+)$")
    unit_code: str = Field(pattern=r"^U\d{3}$")
    ulpin: str


class UndergroundInfraSegment(BaseModel):
    """A drainage or metro segment below the surface parcel."""

    geometry: list[Coordinate]
    base_ulpin: str = Field(min_length=14, max_length=14)
    ulpin: str
    infrastructure_type: str
    underground_level: int = Field(ge=1)


class TopologyViolation(BaseModel):
    code: str
    message: str
    subject: str | None = None


class ValidationResult(BaseModel):
    """Structured validation output suitable for displaying or returning via an API."""

    violations: list[TopologyViolation] = Field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return not self.violations


def _normalise_administrative_code(value: str, field_name: str) -> str:
    code = re.sub(r"[^A-Za-z0-9]", "", value).upper()
    if len(code) != 2:
        raise ValueError(f"{field_name} must contain exactly two alphanumeric characters")
    return code


def _base36(value: int, width: int) -> str:
    characters: list[str] = []
    for _ in range(width):
        value, remainder = divmod(value, 36)
        characters.append(_BASE36_ALPHABET[remainder])
    return "".join(reversed(characters))


def generate_base_ulpin(latitude: float, longitude: float, state_code: str, district_code: str) -> str:
    """Return a reproducible 14-character parcel identifier.

    Algorithm: state and district codes are each normalised to exactly two uppercase
    alphanumeric characters and form the first four characters. Latitude and longitude
    are canonicalised to seven decimal places (about centimetre-level precision), then
    joined as ``latitude|longitude``. A SHA-256 digest of that UTF-8 string is converted
    from its first eight bytes to Base36, modulo ``36**10``, and padded to ten characters.
    The four-character administrative prefix plus that ten-character suffix produces a
    stable, 14-character alphanumeric ID. SHA-256 makes the coordinate-derived part
    repeatable while avoiding a readable direct-coordinate encoding.
    """
    if not -90 <= latitude <= 90:
        raise ValueError("latitude must be between -90 and 90")
    if not -180 <= longitude <= 180:
        raise ValueError("longitude must be between -180 and 180")

    state = _normalise_administrative_code(state_code, "state_code")
    district = _normalise_administrative_code(district_code, "district_code")
    canonical_coordinates = f"{latitude:.7f}|{longitude:.7f}"
    digest_value = int.from_bytes(
        hashlib.sha256(canonical_coordinates.encode("utf-8")).digest()[:8], "big"
    )
    return state + district + _base36(digest_value % (36**10), width=10)


def generate_building_code(base_ulpin: str, building_index: int) -> str:
    """Return the sequential building code for a parcel (``B01``, ``B02``, ...)."""
    _validate_base_ulpin(base_ulpin)
    if not 1 <= building_index <= 99:
        raise ValueError("building_index must be between 1 and 99")
    return f"B{building_index:02d}"


def generate_floor_code(floor_number: int, is_underground: bool = False) -> str:
    """Return a floor code; floor number one is ground floor, or basement level one."""
    if floor_number < 1:
        raise ValueError("floor_number must be at least 1")
    return f"F-U{floor_number}" if is_underground else f"F{floor_number:03d}"


def generate_unit_code(unit_index: int) -> str:
    """Return a sequential code local to one floor (``U001``, ``U002``, ...)."""
    if not 1 <= unit_index <= 999:
        raise ValueError("unit_index must be between 1 and 999")
    return f"U{unit_index:03d}"


def assemble_full_ulpin(
    base_ulpin: str,
    building_code: str | None = None,
    floor_code: str | None = None,
    unit_code: str | None = None,
) -> str:
    """Assemble the available levels of the ULPIN hierarchy in schema order."""
    _validate_base_ulpin(base_ulpin)
    if building_code is None:
        if floor_code is not None or unit_code is not None:
            raise ValueError("floor_code and unit_code require a building_code")
        return base_ulpin
    if not re.fullmatch(r"B\d{2}", building_code):
        raise ValueError("building_code must match B followed by two digits")
    if floor_code is None:
        if unit_code is not None:
            raise ValueError("unit_code requires a floor_code")
        return f"{base_ulpin}-{building_code}"
    if not re.fullmatch(r"F(?:\d{3}|-U\d+)", floor_code):
        raise ValueError("floor_code must match F001 or F-U1 style")
    result = f"{base_ulpin}-{building_code}-{floor_code}"
    if unit_code is None:
        return result
    if not re.fullmatch(r"U\d{3}", unit_code):
        raise ValueError("unit_code must match U001 style")
    return f"{result}-{unit_code}"


def _part1by2(n: int) -> int:
    """Spread the lower 10 bits of n into 30 bits, placing 2 zeros between each bit."""
    n &= 0x3FF
    n = (n | (n << 16)) & 0x30000FF
    n = (n | (n << 8)) & 0x0300F00F
    n = (n | (n << 4)) & 0x30C30C3
    n = (n | (n << 2)) & 0x9249249
    return n


def calculate_3d_morton_code(x: float, y: float, z: float, scale: float = 10.0) -> str:
    """Compute a 3D Morton (Z-order) space-filling curve code for a 3D coordinate point.

    x, y, z are local coordinates in metres. Quantised to decimetre resolution (scale=10.0)
    for exact non-overlapping voxel registration. Returns an 8-character hex string.
    """
    ix = max(0, min(1023, int((x + 500) * scale / 100)))
    iy = max(0, min(1023, int((y + 500) * scale / 100)))
    iz = max(0, min(1023, int((z + 100) * scale / 100)))
    morton = (_part1by2(iz) << 2) | (_part1by2(iy) << 1) | _part1by2(ix)
    return f"{morton:08X}"


def calculate_spatial_verification_hash(
    base_ulpin: str,
    building_code: str,
    floor_code: str,
    unit_code: str,
    volume_m3: float,
    morton_code: str,
) -> str:
    """Generate a 4-character deterministic AI spatial verification checksum."""
    payload = f"{base_ulpin}:{building_code}:{floor_code}:{unit_code}:{volume_m3:.1f}:{morton_code}"
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return digest[:4].upper()


def classify_structure_category(height_meters: float, footprint_area_m2: float = 100.0) -> tuple[str, int, str]:
    """Classify physical 3D structure into typologies, story count, and general building type.

    Returns:
        tuple[structure_category, stories_count, general_building_type]
    """
    if height_meters <= 4.5:
        return "1_story_house", 1, "house"
    elif height_meters <= 8.5:
        return "2_story_house", 2, "house"
    elif height_meters <= 12.5:
        if footprint_area_m2 > 250:
            return "commercial_annex", 3, "commercial"
        return "3_story_villa", 3, "house"
    elif height_meters <= 28.0:
        stories = max(4, round(height_meters / 3.5))
        return "apartment_complex", stories, "apartment"
    else:
        stories = max(9, round(height_meters / 3.5))
        return "commercial_tower", stories, "commercial"


def generate_unit_display_label(
    building_type: str,
    floor_number: int,
    unit_index: int,
    house_number: str | None = None,
    structure_category: str | None = None,
) -> str:
    """Generate human-readable unit identifiers (e.g. 'House #15 (Ground Story)', 'Flat 201')."""
    if structure_category == "1_story_house" or (building_type == "house" and floor_number == 1 and house_number):
        if structure_category == "1_story_house":
            return f"{house_number} (Ground Story)" if house_number else f"House #{unit_index} (Ground Story)"
    if structure_category == "2_story_house" or (building_type == "house" and house_number):
        suffix = "Ground Story" if floor_number == 1 else "Upper Story"
        return f"{house_number} - {suffix}" if house_number else f"House #{unit_index} - {suffix}"
    if structure_category == "3_story_villa":
        return f"{house_number} - Floor {floor_number} Suite" if house_number else f"Villa Suite {floor_number}0{unit_index}"
    if building_type == "school":
        return f"Wing Class {floor_number}0{unit_index}"
    if building_type in ("commercial", "office"):
        prefix = "Shop" if floor_number == 1 else "Suite"
        return f"{prefix} {floor_number}0{unit_index}"
    # Standard apartment numbering (e.g. 101, 102, 201, 202)
    return f"Flat {floor_number * 100 + unit_index}"


def validate_floor_topology(floor_units: list[Unit]) -> ValidationResult:
    """Detect overlapping units and units outside their shared floor footprint.

    Adjacent units that merely touch at an edge are valid; only positive-area
    intersections are reported as overlaps.
    """
    result = ValidationResult()
    unit_polygons: list[tuple[Unit, Polygon]] = []
    for unit in floor_units:
        polygon = _polygon_or_violation(unit.geometry, "invalid_unit_geometry", unit.ulpin, result)
        floor_polygon = _polygon_or_violation(
            unit.floor_footprint, "invalid_floor_geometry", unit.ulpin, result
        )
        if polygon is not None and floor_polygon is not None and not floor_polygon.covers(polygon):
            result.violations.append(
                TopologyViolation(
                    code="unit_outside_floor",
                    subject=unit.ulpin,
                    message=f"Unit {unit.ulpin} extends outside its floor footprint.",
                )
            )
        if polygon is not None:
            unit_polygons.append((unit, polygon))

    for index, (left_unit, left_polygon) in enumerate(unit_polygons):
        for right_unit, right_polygon in unit_polygons[index + 1 :]:
            if left_polygon.intersection(right_polygon).area > 0:
                result.violations.append(
                    TopologyViolation(
                        code="overlapping_units",
                        subject=f"{left_unit.ulpin},{right_unit.ulpin}",
                        message=f"Units {left_unit.ulpin} and {right_unit.ulpin} overlap.",
                    )
                )
    return result


def validate_building_stack(floors: list[Floor]) -> ValidationResult:
    """Apply a simple demo-grade stacking rule to consecutive levels.

    Floors are checked bottom-up. Each level may be up to 20% larger in plan area than
    the level below it; a greater increase is flagged as physically implausible for this
    prototype. This is intentionally not an architectural compliance check.
    """
    result = ValidationResult()
    ordered_floors = sorted(floors, key=lambda floor: -floor.floor_number if floor.is_underground else floor.floor_number)
    valid_floors: list[tuple[Floor, Polygon]] = []
    for floor in ordered_floors:
        polygon = _polygon_or_violation(floor.geometry, "invalid_floor_geometry", floor.ulpin, result)
        if polygon is not None:
            valid_floors.append((floor, polygon))

    for (lower, lower_polygon), (upper, upper_polygon) in zip(valid_floors, valid_floors[1:]):
        if upper_polygon.area > lower_polygon.area * _MAX_FLOOR_AREA_GROWTH_RATIO:
            result.violations.append(
                TopologyViolation(
                    code="implausible_floor_expansion",
                    subject=upper.ulpin,
                    message=(
                        f"Floor {upper.ulpin} is more than 20% larger than the level below "
                        f"({lower.ulpin})."
                    ),
                )
            )
    return result


def _validate_base_ulpin(base_ulpin: str) -> None:
    if not re.fullmatch(r"[A-Z0-9]{14}", base_ulpin):
        raise ValueError("base_ulpin must be exactly 14 uppercase alphanumeric characters")


def _polygon_or_violation(
    coordinates: PolygonCoordinates,
    code: str,
    subject: str,
    result: ValidationResult,
) -> Polygon | None:
    polygon = Polygon(coordinates)
    if polygon.is_empty or not polygon.is_valid or polygon.area <= 0:
        result.violations.append(
            TopologyViolation(code=code, subject=subject, message=f"Geometry for {subject} is not a valid polygon.")
        )
        return None
    return polygon
