"""Export 3D city environment from rrr.blend to optimized GLB for Three.js rendering."""

import os
import sys
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
BLEND_FILE = os.path.join(PROJECT_ROOT, "models", "rrr.blend")
OUTPUT_GLB_FRONTEND = os.path.join(PROJECT_ROOT, "frontend", "public", "modular_city_environment.glb")
OUTPUT_GLB_PROJECT = os.path.join(PROJECT_ROOT, "modular_city_environment.glb")


def main():
    print(f"Loading {BLEND_FILE}...")
    bpy.ops.wm.open_mainfile(filepath=BLEND_FILE)

    # 1. Enrich & configure Principled BSDF materials
    for mat in bpy.data.materials:
        bsdf = None
        if mat.node_tree:
            for n in mat.node_tree.nodes:
                if n.type == "BSDF_PRINCIPLED":
                    bsdf = n
                    break
        if bsdf:
            bsdf.inputs["Base Color"].default_value = mat.diffuse_color
            name = mat.name.lower()
            if "water" in name:
                bsdf.inputs["Roughness"].default_value = 0.1
                bsdf.inputs["Base Color"].default_value = (0.05, 0.40, 0.85, 1.0)
            elif any(k in name for k in ("road", "path", "footway", "steps", "cycleway", "areas_service", "areas_pedestrian")):
                bsdf.inputs["Roughness"].default_value = 0.85
                bsdf.inputs["Base Color"].default_value = (0.18, 0.20, 0.23, 1.0)
            elif "forest" in name:
                bsdf.inputs["Roughness"].default_value = 0.95
                bsdf.inputs["Base Color"].default_value = (0.12, 0.38, 0.15, 1.0)
            elif "vegetation" in name:
                bsdf.inputs["Roughness"].default_value = 0.95
                bsdf.inputs["Base Color"].default_value = (0.18, 0.45, 0.20, 1.0)
            elif "roof" in name:
                bsdf.inputs["Roughness"].default_value = 0.75
                bsdf.inputs["Base Color"].default_value = (0.45, 0.35, 0.30, 1.0)
            elif "wall" in name:
                bsdf.inputs["Roughness"].default_value = 0.80
                bsdf.inputs["Base Color"].default_value = (0.85, 0.75, 0.65, 1.0)
            elif "buildings" in name:
                bsdf.inputs["Roughness"].default_value = 0.80
                bsdf.inputs["Base Color"].default_value = (0.75, 0.75, 0.78, 1.0)

    # 2. Deselect all objects
    bpy.ops.object.select_all(action="DESELECT")

    # 3. Select objects in map_4.osm collection and convert curves to meshes
    col = bpy.data.collections.get("map_4.osm")
    if not col:
        print("Error: collection 'map_4.osm' not found!")
        sys.exit(1)

    export_count = 0
    for obj in col.objects:
        obj.hide_set(False)
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        if obj.type == "CURVE":
            bpy.ops.object.convert(target="MESH")
        export_count += 1

    print(f"Exporting {export_count} objects from map_4.osm...")

    # 4. Export GLB to frontend public directory
    os.makedirs(os.path.dirname(OUTPUT_GLB_FRONTEND), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB_FRONTEND,
        use_selection=True,
        export_format="GLB",
        export_apply=True,
    )
    frontend_size = os.path.getsize(OUTPUT_GLB_FRONTEND)
    print(f"Successfully exported {OUTPUT_GLB_FRONTEND} ({frontend_size:,} bytes)")

    # 5. Export / copy to project root copy
    os.makedirs(os.path.dirname(OUTPUT_GLB_PROJECT), exist_ok=True)
    import shutil
    shutil.copyfile(OUTPUT_GLB_FRONTEND, OUTPUT_GLB_PROJECT)
    print(f"Copied to {OUTPUT_GLB_PROJECT}")


if __name__ == "__main__":
    main()
