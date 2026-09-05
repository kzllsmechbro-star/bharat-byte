"""Seed the 3D ULPIN locality into Supabase using the master building catalog.

Run from the backend directory:
    .\\.venv\\Scripts\\python.exe -m app.db.seed_locality
"""

from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client

from app.services.ulpin_engine import (
    assemble_full_ulpin,
    generate_floor_code,
    generate_unit_code,
)

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "city_buildings_catalog.json")


def ring_wkt(ring: list[list[float]]) -> str:
    return "SRID=3857;POLYGON((" + ", ".join(f"{x} {y}" for x, y in ring) + "))"


def line_wkt(points: list[tuple[float, float]]) -> str:
    return "SRID=3857;LINESTRING(" + ", ".join(f"{x} {y}" for x, y in points) + ")"


def point_wkt(point: tuple[float, float]) -> str:
    return f"SRID=3857;POINT({point[0]} {point[1]})"


def insert_row(client: Client, table: str, row: dict) -> dict:
    response = client.table(table).insert(row).execute()
    if not response.data:
        raise RuntimeError(f"No row returned after insert into {table}")
    return response.data[0]


def report_counts(client: Client) -> None:
    print("\nSupabase row counts:")
    for table in ("parcels", "buildings", "floors", "units", "underground_infra"):
        response = client.table(table).select("id", count="exact").execute()
        print(f"  {table}: {response.count}")


def seed_infrastructure(client: Client) -> None:
    """Seed underground infrastructure aligned under the city road network."""
    parcel_rows = client.table("parcels").select("id,base_ulpin").limit(4).execute().data
    if len(parcel_rows) < 4:
        return
    drainage_paths = [
        [(10, 110), (100, 110)],
        [(100, 110), (250, 110)],
        [(100, 110), (100, 210)],
        [(100, 210), (250, 210)],
    ]
    for row, path in zip(parcel_rows, drainage_paths):
        insert_row(client, "underground_infra", {
            "parcel_id": row["id"], "infra_type": "drainage", "path": line_wkt(path),
            "full_ulpin": assemble_full_ulpin(row["base_ulpin"]), "depth_meters": 1.5,
        })

    metro_parcel = parcel_rows[0]
    insert_row(client, "underground_infra", {
        "parcel_id": metro_parcel["id"], "infra_type": "metro_tunnel",
        "path": line_wkt([(10, 240), (290, 240)]),
        "full_ulpin": assemble_full_ulpin(metro_parcel["base_ulpin"]), "depth_meters": 14.0,
    })
    for station_point in [(90, 240), (230, 240)]:
        insert_row(client, "underground_infra", {
            "parcel_id": metro_parcel["id"], "infra_type": "metro_station", "path": point_wkt(station_point),
            "full_ulpin": assemble_full_ulpin(metro_parcel["base_ulpin"]), "depth_meters": 10.0,
        })


def main() -> None:
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in backend/.env")
    client = create_client(url, key)

    if not os.path.exists(CATALOG_PATH):
        raise RuntimeError(f"Catalog file not found at {CATALOG_PATH}")

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    print(f"Loaded {len(catalog)} buildings from catalog.")

    print("Clearing previous database tables in Supabase...")
    for t in ("units", "floors", "underground_infra", "buildings", "parcels"):
        try:
            client.table(t).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        except Exception as e:
            print(f"  Note while clearing {t}: {e}")

    # Seed representative core buildings into Supabase (diverse selection of 1-story, 2-story, villas, apartments, towers)
    # Covering houses, duplexes, villas, and apartments across the city
    core_buildings = []
    category_counts: dict[str, int] = {}
    for b in catalog:
        cat = b["structure_category"]
        if category_counts.get(cat, 0) < 15:
            core_buildings.append(b)
            category_counts[cat] = category_counts.get(cat, 0) + 1
        if len(core_buildings) >= 60:
            break

    print(f"Seeding {len(core_buildings)} diverse core buildings into Supabase database...")

    for i, bldg in enumerate(core_buildings, start=1):
        base_ulpin = bldg["base_ulpin"]
        footprint_poly = bldg["footprint"]["coordinates"][0]
        # Expand slightly for parcel boundary
        parcel_poly = [
            [footprint_poly[0][0] - 0.5, footprint_poly[0][1] - 0.5],
            [footprint_poly[1][0] + 0.5, footprint_poly[1][1] - 0.5],
            [footprint_poly[2][0] + 0.5, footprint_poly[2][1] + 0.5],
            [footprint_poly[3][0] - 0.5, footprint_poly[3][1] + 0.5],
            [footprint_poly[0][0] - 0.5, footprint_poly[0][1] - 0.5],
        ]

        parcel = insert_row(client, "parcels", {
            "base_ulpin": base_ulpin,
            "geometry": ring_wkt(parcel_poly),
            "state_code": "29",
            "district_code": "KA",
        })

        b_type = bldg["building_type"]
        if b_type not in ("apartment", "house", "half_built", "school"):
            b_type = "apartment"  # map commercial to apartment enum for postgres

        building = insert_row(client, "buildings", {
            "parcel_id": parcel["id"],
            "building_code": "B01",
            "building_type": b_type,
            "floors_completed": None,
            "floors_planned": None,
            "footprint": ring_wkt(footprint_poly),
        })

        for floor in bldg.get("floors", []):
            f_code = floor["floor_code"]
            f_num = floor["floor_number"]
            f_height = floor.get("height_meters", 3.5)

            floor_row = insert_row(client, "floors", {
                "building_id": building["id"],
                "floor_code": f_code,
                "floor_number": f_num,
                "is_underground": False,
                "footprint": ring_wkt(footprint_poly),
                "height_meters": f_height,
            })

            for unit in floor.get("units", []):
                u_code = unit["unit_code"]
                full_ulpin = unit["full_ulpin"]
                u_type = unit.get("unit_type", "residential")
                if u_type not in ("residential", "commercial", "common_area"):
                    u_type = "residential"

                insert_row(client, "units", {
                    "floor_id": floor_row["id"],
                    "unit_code": u_code,
                    "full_ulpin": full_ulpin,
                    "footprint": ring_wkt(footprint_poly),
                    "unit_type": u_type,
                })

        if i % 10 == 0:
            print(f"  Seeded {i}/{len(core_buildings)} buildings...")

    seed_infrastructure(client)
    report_counts(client)
    print("Database seeding completed successfully! Connected with master building catalog.")


if __name__ == "__main__":
    main()