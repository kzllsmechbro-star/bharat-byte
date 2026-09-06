"""Lightweight structural connectivity validator for underground infrastructure.

Runs a BFS over the segment → node adjacency graph for each infrastructure type
and identifies orphan segments (segments with zero node connections) and
disconnected sub-graphs.

No database or HTTP dependencies.
"""
from __future__ import annotations

from collections import deque
from typing import Any


class ConnectivityReport:
    """Result of a connectivity validation run."""

    def __init__(self) -> None:
        self.orphan_segment_ids: list[str] = []
        self.connected_components: list[set[str]] = []

    @property
    def is_valid(self) -> bool:
        return len(self.orphan_segment_ids) == 0

    def __repr__(self) -> str:
        return (
            f"ConnectivityReport("
            f"orphans={self.orphan_segment_ids}, "
            f"components={len(self.connected_components)})"
        )


def validate_underground_connectivity(
    segments: list[dict[str, Any]],
    infra_type: str,
) -> ConnectivityReport:
    """BFS connectivity check for one infrastructure type.

    A segment is an **orphan** if its ``node_ids`` list is empty.
    Otherwise the segment is part of at least one connected component
    (even if that component has only one segment with two terminal nodes —
    e.g. a standalone drain run with unique start and end nodes).

    Args:
        segments: Full list of underground infra dicts (from the catalog).
        infra_type: One of ``'drainage'``, ``'metro_tunnel'``, ``'metro_station'``.

    Returns:
        ConnectivityReport with orphan IDs and connected components (sets of
        segment IDs reachable from each other via shared nodes).
    """
    report = ConnectivityReport()

    # Filter to the requested type
    typed = [s for s in segments if s.get("infra_type") == infra_type]

    # Index: node_id → set of segment IDs that reference that node
    node_to_segs: dict[str, set[str]] = {}
    for seg in typed:
        nids = seg.get("node_ids") or []
        if not nids:
            report.orphan_segment_ids.append(seg["id"])
            continue
        for nid in nids:
            node_to_segs.setdefault(nid, set()).add(seg["id"])

    # Build segment adjacency: two segments are adjacent if they share a node
    seg_ids = {s["id"] for s in typed if s.get("node_ids")}
    adj: dict[str, set[str]] = {sid: set() for sid in seg_ids}
    for neighbour_set in node_to_segs.values():
        nl = list(neighbour_set)
        for i, a in enumerate(nl):
            for b in nl[i + 1 :]:
                adj[a].add(b)
                adj[b].add(a)

    # BFS to find connected components
    visited: set[str] = set()
    for start in seg_ids:
        if start in visited:
            continue
        component: set[str] = set()
        queue: deque[str] = deque([start])
        while queue:
            node = queue.popleft()
            if node in visited:
                continue
            visited.add(node)
            component.add(node)
            for neighbour in adj[node]:
                if neighbour not in visited:
                    queue.append(neighbour)
        report.connected_components.append(component)

    return report
