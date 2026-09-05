"""Convert OpenStreetMap XML (map.osm) into a rich 3D KML file with extruded buildings, heights, and roads."""

import os
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

OSM_PATH = r"C:\Users\admin\Downloads\map.osm"
OUTPUT_KML_PROJECT = r"F:\sih 2k26\ulpin-3d-system\seed-data\bengaluru_rr_nagar.kml"
OUTPUT_KML_FRONTEND = r"F:\sih 2k26\ulpin-3d-system\frontend\public\bengaluru_rr_nagar.kml"


def main():
    if not os.path.exists(OSM_PATH):
        print(f"OSM file not found at {OSM_PATH}")
        return

    print(f"Parsing OSM file: {OSM_PATH}...")
    tree = ET.parse(OSM_PATH)
    root = tree.getroot()

    # 1. Parse all nodes
    nodes: dict[str, tuple[float, float]] = {}
    for node in root.findall("node"):
        node_id = node.attrib["id"]
        lat = float(node.attrib["lat"])
        lon = float(node.attrib["lon"])
        nodes[node_id] = (lon, lat)

    print(f"Loaded {len(nodes)} nodes.")

    # 2. Parse ways (buildings and roads)
    buildings = []
    roads = []

    for way in root.findall("way"):
        tags = {t.attrib.get("k"): t.attrib.get("v") for t in way.findall("tag")}
        nd_refs = [nd.attrib["ref"] for nd in way.findall("nd")]

        coords = [nodes[ref] for ref in nd_refs if ref in nodes]
        if len(coords) < 2:
            continue

        if "building" in tags:
            # Must be a polygon
            if len(coords) >= 4 and coords[0] == coords[-1]:
                levels = tags.get("building:levels")
                try:
                    num_levels = float(levels) if levels else 3.0
                except ValueError:
                    num_levels = 3.0
                height = num_levels * 3.5  # 3.5m per floor
                name = tags.get("name", f"Building {tags.get('building', 'Structure')}")
                b_type = tags.get("building", "residential")
                buildings.append({
                    "name": name,
                    "type": b_type,
                    "levels": int(num_levels),
                    "height": height,
                    "coords": coords,
                })
        elif "highway" in tags:
            h_type = tags.get("highway")
            name = tags.get("name", f"{h_type.replace('_', ' ').title()} Road")
            roads.append({
                "name": name,
                "type": h_type,
                "coords": coords,
            })

    print(f"Extracted {len(buildings)} buildings and {len(roads)} road segments.")

    # 3. Generate KML
    kml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">',
        '  <Document id="bengaluru_rr_nagar">',
        '    <name>Bengaluru - RR Nagar / South Locality</name>',
        '    <description>3D Land Parcels and Building Footprints for ULPIN Generation</description>',
        '    <Folder>',
        '      <name>Buildings &amp; Parcels</name>',
    ]

    for index, b in enumerate(buildings):
        coords_str = " ".join(f"{lon},{lat},{b['height']}" for lon, lat in b["coords"])
        kml_lines.extend([
            '      <Placemark>',
            f'        <name>{escape(b["name"])}</name>',
            '        <ExtendedData>',
            f'          <Data name="building_type"><value>{escape(b["type"])}</value></Data>',
            f'          <Data name="floors"><value>{b["levels"]}</value></Data>',
            f'          <Data name="height_m"><value>{b["height"]:.1f}</value></Data>',
            f'          <Data name="building_index"><value>{index + 1:02d}</value></Data>',
            '        </ExtendedData>',
            '        <Polygon>',
            '          <extrude>1</extrude>',
            '          <altitudeMode>relativeToGround</altitudeMode>',
            '          <outerBoundaryIs>',
            '            <LinearRing>',
            f'              <coordinates>{coords_str}</coordinates>',
            '            </LinearRing>',
            '          </outerBoundaryIs>',
            '        </Polygon>',
            '      </Placemark>',
        ])

    kml_lines.extend([
        '    </Folder>',
        '    <Folder>',
        '      <name>Roads &amp; Infrastructure</name>',
    ])

    for r in roads[:200]:  # Keep top 200 primary roads for crisp rendering
        coords_str = " ".join(f"{lon},{lat},0" for lon, lat in r["coords"])
        kml_lines.extend([
            '      <Placemark>',
            f'        <name>{escape(r["name"])}</name>',
            '        <ExtendedData>',
            f'          <Data name="road_type"><value>{escape(r["type"])}</value></Data>',
            '        </ExtendedData>',
            '        <LineString>',
            '          <tessellate>1</tessellate>',
            '          <altitudeMode>clampToGround</altitudeMode>',
            f'          <coordinates>{coords_str}</coordinates>',
            '        </LineString>',
            '      </Placemark>',
        ])

    kml_lines.extend([
        '    </Folder>',
        '  </Document>',
        '</kml>',
    ])

    kml_content = "\n".join(kml_lines)

    os.makedirs(os.path.dirname(OUTPUT_KML_PROJECT), exist_ok=True)
    with open(OUTPUT_KML_PROJECT, "w", encoding="utf-8") as f:
        f.write(kml_content)
    print(f"Saved: {OUTPUT_KML_PROJECT} ({len(kml_content):,} bytes)")

    os.makedirs(os.path.dirname(OUTPUT_KML_FRONTEND), exist_ok=True)
    with open(OUTPUT_KML_FRONTEND, "w", encoding="utf-8") as f:
        f.write(kml_content)
    print(f"Saved: {OUTPUT_KML_FRONTEND} ({len(kml_content):,} bytes)")


if __name__ == "__main__":
    main()
