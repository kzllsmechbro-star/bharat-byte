from app.services.ulpin_engine import (
    Floor,
    Unit,
    assemble_full_ulpin,
    generate_base_ulpin,
    generate_building_code,
    generate_floor_code,
    generate_unit_code,
    validate_building_stack,
    validate_floor_topology,
)


BASE_ULPIN = "29KA0512034521"
FLOOR_FOOTPRINT = [(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)]


def make_unit(unit_index: int, geometry: list[tuple[float, float]]) -> Unit:
    building_code = generate_building_code(BASE_ULPIN, 1)
    floor_code = generate_floor_code(1)
    unit_code = generate_unit_code(unit_index)
    return Unit(
        geometry=geometry,
        floor_footprint=FLOOR_FOOTPRINT,
        base_ulpin=BASE_ULPIN,
        building_code=building_code,
        floor_code=floor_code,
        unit_code=unit_code,
        ulpin=assemble_full_ulpin(BASE_ULPIN, building_code, floor_code, unit_code),
    )


def test_base_ulpin_generation_is_deterministic() -> None:
    first = generate_base_ulpin(12.9715987, 77.594566, "29", "KA")
    second = generate_base_ulpin(12.9715987, 77.594566, "29", "KA")

    assert first == second
    assert len(first) == 14
    assert first.startswith("29KA")
    assert first.isalnum()


def test_different_coordinates_produce_different_base_ulpins() -> None:
    bengaluru = generate_base_ulpin(12.9715987, 77.594566, "29", "KA")
    nearby_location = generate_base_ulpin(12.9725987, 77.594566, "29", "KA")

    assert bengaluru != nearby_location


def test_assemble_normal_underground_and_parcel_only_ulpins() -> None:
    building = generate_building_code(BASE_ULPIN, 1)

    assert assemble_full_ulpin(BASE_ULPIN, building, generate_floor_code(3), generate_unit_code(2)) == (
        "29KA0512034521-B01-F003-U002"
    )
    assert assemble_full_ulpin(BASE_ULPIN, building, generate_floor_code(1, is_underground=True), generate_unit_code(1)) == (
        "29KA0512034521-B01-F-U1-U001"
    )
    assert assemble_full_ulpin(BASE_ULPIN) == BASE_ULPIN


def test_floor_topology_flags_overlapping_unit_footprints() -> None:
    left_unit = make_unit(1, [(0, 0), (6, 0), (6, 5), (0, 5), (0, 0)])
    overlapping_unit = make_unit(2, [(5, 0), (10, 0), (10, 5), (5, 5), (5, 0)])

    result = validate_floor_topology([left_unit, overlapping_unit])

    assert not result.is_valid
    assert any(violation.code == "overlapping_units" for violation in result.violations)


def test_floor_topology_flags_unit_outside_floor_boundary() -> None:
    outside_unit = make_unit(1, [(8, 8), (12, 8), (12, 10), (8, 10), (8, 8)])

    result = validate_floor_topology([outside_unit])

    assert not result.is_valid
    assert any(violation.code == "unit_outside_floor" for violation in result.violations)


def test_building_stack_flags_an_implausibly_larger_upper_floor() -> None:
    building_code = generate_building_code(BASE_ULPIN, 1)
    lower_floor = Floor(
        geometry=FLOOR_FOOTPRINT,
        base_ulpin=BASE_ULPIN,
        building_code=building_code,
        floor_code=generate_floor_code(1),
        ulpin=assemble_full_ulpin(BASE_ULPIN, building_code, generate_floor_code(1)),
        floor_number=1,
    )
    upper_floor = Floor(
        geometry=[(0, 0), (15, 0), (15, 10), (0, 10), (0, 0)],
        base_ulpin=BASE_ULPIN,
        building_code=building_code,
        floor_code=generate_floor_code(2),
        ulpin=assemble_full_ulpin(BASE_ULPIN, building_code, generate_floor_code(2)),
        floor_number=2,
    )

    result = validate_building_stack([upper_floor, lower_floor])

    assert not result.is_valid
    assert any(violation.code == "implausible_floor_expansion" for violation in result.violations)
