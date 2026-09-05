-- SIH26011 Phase 3: metre-based synthetic-locality spatial schema.
-- SRID 3857 is used because the prototype seed data is a local XY grid in metres.

create extension if not exists postgis;
create extension if not exists pgcrypto;

do $$
begin
    create type building_type as enum ('apartment', 'house', 'half_built', 'school');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type unit_type as enum ('residential', 'commercial', 'common_area');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type infra_type as enum ('drainage', 'metro_tunnel', 'metro_station');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.parcels (
    id uuid primary key default gen_random_uuid(),
    base_ulpin text not null unique check (base_ulpin ~ '^[A-Z0-9]{14}$'),
    geometry geometry(Polygon, 3857) not null,
    state_code varchar(2) not null,
    district_code varchar(2) not null,
    created_at timestamptz not null default now()
);

create table if not exists public.buildings (
    id uuid primary key default gen_random_uuid(),
    parcel_id uuid not null references public.parcels(id) on delete cascade,
    building_code varchar(3) not null check (building_code ~ '^B[0-9]{2}$'),
    building_type building_type not null,
    floors_completed integer,
    floors_planned integer,
    footprint geometry(Polygon, 3857) not null,
    created_at timestamptz not null default now(),
    unique (parcel_id, building_code),
    check (
        (building_type = 'half_built' and floors_completed is not null and floors_planned is not null
         and floors_completed >= 0 and floors_planned >= floors_completed)
        or
        (building_type <> 'half_built' and floors_completed is null and floors_planned is null)
    )
);

create table if not exists public.floors (
    id uuid primary key default gen_random_uuid(),
    building_id uuid not null references public.buildings(id) on delete cascade,
    floor_code text not null check (floor_code ~ '^F([0-9]{3}|-U[0-9]+)$'),
    floor_number integer not null check (floor_number >= 1),
    is_underground boolean not null default false,
    footprint geometry(Polygon, 3857) not null,
    height_meters double precision not null check (height_meters > 0),
    unique (building_id, floor_code),
    unique (building_id, floor_number, is_underground)
);

create table if not exists public.units (
    id uuid primary key default gen_random_uuid(),
    floor_id uuid not null references public.floors(id) on delete cascade,
    unit_code varchar(4) not null check (unit_code ~ '^U[0-9]{3}$'),
    full_ulpin text not null unique check (full_ulpin ~ '^[A-Z0-9]{14}-B[0-9]{2}-F([0-9]{3}|-U[0-9]+)-U[0-9]{3}$'),
    footprint geometry(Polygon, 3857) not null,
    unit_type unit_type not null,
    unique (floor_id, unit_code)
);

create table if not exists public.underground_infra (
    id uuid primary key default gen_random_uuid(),
    parcel_id uuid not null references public.parcels(id) on delete cascade,
    infra_type infra_type not null,
    path geometry(Geometry, 3857) not null,
    full_ulpin text not null,
    depth_meters double precision not null check (depth_meters > 0),
    check (geometrytype(path) in ('LINESTRING', 'POINT')),
    check (
        (infra_type in ('drainage', 'metro_tunnel') and geometrytype(path) = 'LINESTRING')
        or (infra_type = 'metro_station' and geometrytype(path) = 'POINT')
    )
);

create index if not exists parcels_geometry_gix on public.parcels using gist (geometry);
create index if not exists buildings_footprint_gix on public.buildings using gist (footprint);
create index if not exists floors_footprint_gix on public.floors using gist (footprint);
create index if not exists units_footprint_gix on public.units using gist (footprint);
create index if not exists underground_infra_path_gix on public.underground_infra using gist (path);
create index if not exists buildings_parcel_id_idx on public.buildings (parcel_id);
create index if not exists floors_building_id_idx on public.floors (building_id);
create index if not exists units_floor_id_idx on public.units (floor_id);
create index if not exists underground_infra_parcel_id_idx on public.underground_infra (parcel_id);

-- Prototype-only access policies. Replace with authenticated roles before production.
alter table public.parcels enable row level security;
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.units enable row level security;
alter table public.underground_infra enable row level security;

drop policy if exists "prototype public access" on public.parcels;
drop policy if exists "prototype public access" on public.buildings;
drop policy if exists "prototype public access" on public.floors;
drop policy if exists "prototype public access" on public.units;
drop policy if exists "prototype public access" on public.underground_infra;

create policy "prototype public access" on public.parcels for all to anon, authenticated using (true) with check (true);
create policy "prototype public access" on public.buildings for all to anon, authenticated using (true) with check (true);
create policy "prototype public access" on public.floors for all to anon, authenticated using (true) with check (true);
create policy "prototype public access" on public.units for all to anon, authenticated using (true) with check (true);
create policy "prototype public access" on public.underground_infra for all to anon, authenticated using (true) with check (true);
