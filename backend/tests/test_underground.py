"""Underground infrastructure tests.

Three test cases per spec:
  1. test_underground_segments_are_connected  — zero orphan segments per type
  2. test_metro_station_ulpin_assembly        — stations produce valid F-U1 ULPINs
  3. test_drain_paths_stay_within_locality_bounds — all waypoints within ±800 scene units
"""
import re

import pytest

from app.services.underground_catalog import (
    LOCALITY_BOUND,
    list_underground_infra,
)
from app.services.topology_validator import validate_underground_connectivity

ALL_INFRA = list_underground_infra()

# ── helpers ──────────────────────────────────────────────────────────────────

def _segments_of_type(t: str):
    return [s for s in ALL_INFRA if s["infra_type"] == t]


# ── Test 1: Connectivity ─────────────────────────────────────────────────────

def test_underground_segments_are_connected_drainage() -> None:
    """No drain segment should be an orphan (zero node connections)."""
    report = validate_underground_connectivity(ALL_INFRA, "drainage")
    assert report.is_valid, (
        f"Orphan drain segments found: {report.orphan_segment_ids}"
    )


def test_underground_segments_are_connected_metro_tunnel() -> None:
    """No metro-tunnel segment should be an orphan."""
    report = validate_underground_connectivity(ALL_INFRA, "metro_tunnel")
    assert report.is_valid, (
        f"Orphan metro_tunnel segments found: {report.orphan_segment_ids}"
    )


def test_underground_segments_are_connected_metro_station() -> None:
    """Station nodes must each reference at least one node ID."""
    report = validate_underground_connectivity(ALL_INFRA, "metro_station")
    assert report.is_valid, (
        f"Orphan metro_station nodes found: {report.orphan_segment_ids}"
    )


def test_drain_segments_have_node_ids() -> None:
    """Every drain segment must declare at least 2 node IDs (start + end)."""
    for seg in _segments_of_type("drainage"):
        assert len(seg.get("node_ids", [])) >= 2, (
            f"Drain segment '{seg['id']}' has fewer than 2 node IDs"
        )


def test_metro_tunnel_segments_form_a_single_line() -> None:
    """All metro-tunnel segments share parent_line_id 'metro-purple'."""
    for seg in _segments_of_type("metro_tunnel"):
        assert seg.get("parent_line_id") == "metro-purple", (
            f"Tunnel '{seg['id']}' has unexpected parent_line_id"
        )


# ── Test 2: Metro station ULPIN assembly ────────────────────────────────────

_FULL_ULPIN_RE = re.compile(
    r"^[A-Z0-9]{14}-B\d{2}-F-U\d+-U\d{3}$"
)


def test_metro_station_ulpin_assembly() -> None:
    """Each metro station must carry a valid assembled F-U{n}-U{unit} ULPIN."""
    stations = _segments_of_type("metro_station")
    assert len(stations) == 3, f"Expected 3 metro stations, got {len(stations)}"

    for s in stations:
        ulpin = s.get("assembled_ulpin") or s.get("full_ulpin", "")
        assert _FULL_ULPIN_RE.match(ulpin), (
            f"Station '{s['id']}' has malformed assembled_ulpin: '{ulpin}'"
        )


def test_metro_station_base_ulpins_are_unique() -> None:
    """Each station must have a distinct 14-char base ULPIN."""
    base_ulpins = [s["base_ulpin"] for s in _segments_of_type("metro_station")]
    assert len(base_ulpins) == len(set(base_ulpins)), "Duplicate station base ULPINs"
    for bu in base_ulpins:
        assert len(bu) == 14 and bu.isalnum(), f"Invalid base_ulpin format: {bu}"


# ── Test 3: Locality bounds check ────────────────────────────────────────────

def test_drain_paths_stay_within_locality_bounds() -> None:
    """Every waypoint in every drain segment must lie within ±LOCALITY_BOUND."""
    for seg in _segments_of_type("drainage"):
        for wp in seg.get("waypoints", []):
            x, y, z = wp[0], wp[1], wp[2]
            assert abs(x) <= LOCALITY_BOUND, (
                f"Drain '{seg['id']}' waypoint X={x} exceeds ±{LOCALITY_BOUND}"
            )
            assert abs(z) <= LOCALITY_BOUND, (
                f"Drain '{seg['id']}' waypoint Z={z} exceeds ±{LOCALITY_BOUND}"
            )
            assert y <= 0, (
                f"Drain '{seg['id']}' waypoint Y={y} is above ground (should be negative)"
            )


def test_metro_paths_stay_within_locality_bounds() -> None:
    """Every waypoint in every metro segment must lie within ±LOCALITY_BOUND."""
    for seg in _segments_of_type("metro_tunnel"):
        for wp in seg.get("waypoints", []):
            x, y, z = wp[0], wp[1], wp[2]
            assert abs(x) <= LOCALITY_BOUND, (
                f"Metro tunnel '{seg['id']}' waypoint X={x} exceeds ±{LOCALITY_BOUND}"
            )
            assert abs(z) <= LOCALITY_BOUND, (
                f"Metro tunnel '{seg['id']}' waypoint Z={z} exceeds ±{LOCALITY_BOUND}"
            )


def test_metro_depth_is_correct() -> None:
    """Metro tunnels must all sit at or below -18 m."""
    for seg in _segments_of_type("metro_tunnel"):
        assert seg["depth_meters"] <= -18, (
            f"Metro tunnel '{seg['id']}' depth {seg['depth_meters']} is shallower than -18 m"
        )


def test_drain_depth_is_reasonable() -> None:
    """Drain depths should be between -3 m and -10 m."""
    for seg in _segments_of_type("drainage"):
        d = seg["depth_meters"]
        assert -10 <= d <= -3, (
            f"Drain '{seg['id']}' has implausible depth {d}"
        )
