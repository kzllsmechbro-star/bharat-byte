# ULPIN ID Schema (3D / Vertical Property Mapping)

This document is the single source of truth for ULPIN generation in this project.
**Never invent a different schema — always use exactly this.**

## Structure

A full 3D ULPIN is built by appending suffixes to a 14-character BASE-ULPIN:

```
BASE-ULPIN(14 chars) + "-B{2-digit building code}" + "-F{3-digit floor code, or F-U{n} for underground}" + "-U{3-digit unit code}"
```

## Segments

| Segment | Format | Description |
|---|---|---|
| BASE-ULPIN | 14 characters | Surface parcel identifier (standard ULPIN / Bhu-Aadhaar style) |
| Building | `-B{2-digit building code}` | Identifies a building on the parcel, e.g. `-B01` |
| Floor | `-F{3-digit floor code}` | Identifies a floor, e.g. `-F003` for the 3rd floor |
| Floor (underground) | `-F-U{n}` | Underground levels (basements, drainage, metro), e.g. `-F-U1` |
| Unit | `-U{3-digit unit code}` | Identifies a unit (flat / shop) on that floor, e.g. `-U002` |

## Example

```
29KA0512034521-B01-F003-U002
```

- `29KA0512034521` — BASE-ULPIN (14 chars) for the surface parcel
- `-B01` — building 01 on that parcel
- `-F003` — floor 3 of that building
- `-U002` — unit 2 on that floor

## Hierarchy

```
Parcel (BASE-ULPIN)
└── Building (-B{xx})
    └── Floor (-F{xxx} or -F-U{n})
        └── Unit (-U{xxx})
```

Each unit's full ID embeds its complete ancestry: parcel → building → floor → unit.
