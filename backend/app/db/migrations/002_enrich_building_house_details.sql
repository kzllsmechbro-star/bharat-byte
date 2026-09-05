-- 002_enrich_building_house_details.sql
-- Enriches the spatial schema with house numbers, complex definitions, 3D story counts, and AI spatial hashes.

alter table public.buildings
    add column if not exists name text,
    add column if not exists house_no text,
    add column if not exists complex_name text,
    add column if not exists complex_type text,
    add column if not exists structure_category text,
    add column if not exists stories_count integer,
    add column if not exists height_meters double precision,
    add column if not exists postal_address text,
    add column if not exists ai_spatial_hash text;

alter table public.units
    add column if not exists unit_number text,
    add column if not exists elevation_min double precision,
    add column if not exists elevation_max double precision,
    add column if not exists volume_m3 double precision,
    add column if not exists ai_morton_code text,
    add column if not exists spatial_verification_hash text;

create index if not exists buildings_house_no_idx on public.buildings (house_no);
create index if not exists buildings_complex_name_idx on public.buildings (complex_name);
create index if not exists units_unit_number_idx on public.units (unit_number);
