const fs = require('fs');
const path = require('path');

console.log('=== STARTING 3D BUILDING FOOTPRINT EXTRACTION & CATALOG ALIGNMENT ===');

const glbPath = path.resolve(__dirname, '../frontend/public/modular_city_environment.glb');
const frontendCatPath = path.resolve(__dirname, '../frontend/public/city_buildings_catalog.json');
const backendCatPath = path.resolve(__dirname, '../backend/city_buildings_catalog.json');

const buf = fs.readFileSync(glbPath);
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const binOffset = 20 + jsonLen + 8;

const bldgNode = gltf.nodes.find(n => n.name === 'map_4.osm_buildings');
if (!bldgNode) {
  console.error('Error: map_4.osm_buildings node not found in GLTF');
  process.exit(1);
}

const mesh = gltf.meshes[bldgNode.mesh];
const prim = mesh.primitives[0]; // Prim 0 contains all wall faces

const posAcc = gltf.accessors[prim.attributes.POSITION];
const posBv = gltf.bufferViews[posAcc.bufferView];
const posByteOffset = binOffset + (posBv.byteOffset || 0) + (posAcc.byteOffset || 0);

const idxAcc = gltf.accessors[prim.indices];
const idxBv = gltf.bufferViews[idxAcc.bufferView];
const idxByteOffset = binOffset + (idxBv.byteOffset || 0) + (idxAcc.byteOffset || 0);

const positions = new Float32Array(buf.buffer, buf.byteOffset + posByteOffset, posAcc.count * 3);
const indices = new Uint32Array(buf.buffer, buf.byteOffset + idxByteOffset, idxAcc.count);

console.log(`GLB Mesh loaded: ${posAcc.count} vertices, ${indices.length / 3} triangles.`);

// Build planar directed half-edge graph of ground wall edges
const outgoing = new Map();

function addDirectedHalfEdge(i1, i2) {
  const x1 = Number(positions[i1 * 3].toFixed(2));
  const z1 = Number(positions[i1 * 3 + 2].toFixed(2));
  const x2 = Number(positions[i2 * 3].toFixed(2));
  const z2 = Number(positions[i2 * 3 + 2].toFixed(2));
  if (x1 === x2 && z1 === z2) return;

  const k1 = x1 + ',' + z1;
  const k2 = x2 + ',' + z2;

  if (!outgoing.has(k1)) outgoing.set(k1, []);
  const list = outgoing.get(k1);
  if (!list.includes(k2)) list.push(k2);
}

for (let t = 0; t < indices.length; t += 3) {
  const i0 = indices[t], i1 = indices[t + 1], i2 = indices[t + 2];
  const y0 = positions[i0 * 3 + 1], y1 = positions[i1 * 3 + 1], y2 = positions[i2 * 3 + 1];

  // Triangles where 2 vertices are on the ground (y < 0.1) and 1 is extruded vertically (y >= 0.1)
  if (y0 < 0.1 && y1 < 0.1 && y2 >= 0.1) {
    addDirectedHalfEdge(i0, i1);
  } else if (y1 < 0.1 && y2 < 0.1 && y0 >= 0.1) {
    addDirectedHalfEdge(i1, i2);
  } else if (y2 < 0.1 && y0 < 0.1 && y1 >= 0.1) {
    addDirectedHalfEdge(i2, i0);
  }
}

console.log(`Directed ground graph constructed: ${outgoing.size} unique ground corner vertices.`);

// Sort outgoing edges around each vertex by polar angle
const sortedAdj = new Map();
for (const [u, nbrs] of outgoing) {
  const [ux, uz] = u.split(',').map(Number);
  const nbrAngles = nbrs.map(v => {
    const [vx, vz] = v.split(',').map(Number);
    return { v, angle: Math.atan2(vz - uz, vx - ux) };
  });
  nbrAngles.sort((a, b) => a.angle - b.angle);
  sortedAdj.set(u, nbrAngles);
}

// Planar face traversal
const visitedEdges = new Set();
const allFaces = [];

for (const [u, nbrs] of sortedAdj) {
  for (const { v } of nbrs) {
    const edgeKey = u + '->' + v;
    if (visitedEdges.has(edgeKey)) continue;

    const face = [u];
    let currU = u;
    let currV = v;
    let ok = false;

    while (true) {
      const currEdgeKey = currU + '->' + currV;
      if (visitedEdges.has(currEdgeKey)) break;
      visitedEdges.add(currEdgeKey);
      face.push(currV);

      if (currV === u) {
        ok = true;
        break;
      }

      if (face.length > 250) break;

      const [vx, vz] = currV.split(',').map(Number);
      const [ux, uz] = currU.split(',').map(Number);
      const inAngle = Math.atan2(uz - vz, ux - vx);

      const outList = sortedAdj.get(currV);
      if (!outList || outList.length === 0) break;

      let nextEdge = null;
      let minDelta = Infinity;
      for (const cand of outList) {
        let delta = cand.angle - inAngle;
        while (delta <= 1e-6) delta += 2 * Math.PI;
        if (delta < minDelta) {
          minDelta = delta;
          nextEdge = cand.v;
        }
      }

      if (!nextEdge) break;
      currU = currV;
      currV = nextEdge;
    }

    if (ok && face.length >= 4) {
      const pts = face.map(str => str.split(',').map(Number));
      let signedArea = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        signedArea += (pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]);
      }
      signedArea /= 2;

      // Filter valid building interior faces
      if (Math.abs(signedArea) > 0.5 && Math.abs(signedArea) < 200000) {
        // Convert to catalog Blender coordinates: x_cat = x, y_cat = -z
        const catPoly = pts.map(p => [Number(p[0].toFixed(2)), Number((-p[1]).toFixed(2))]);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let sumX = 0, sumY = 0;
        const n = catPoly.length - 1;
        for (let i = 0; i < n; i++) {
          const [px, py] = catPoly[i];
          minX = Math.min(minX, px);
          maxX = Math.max(maxX, px);
          minY = Math.min(minY, py);
          maxY = Math.max(maxY, py);
          sumX += px;
          sumY += py;
        }

        allFaces.push({
          id: allFaces.length,
          coordinates: catPoly,
          center: [Number((sumX / n).toFixed(2)), Number((sumY / n).toFixed(2))],
          bounds: [Number(minX.toFixed(2)), Number(maxX.toFixed(2)), Number(minY.toFixed(2)), Number(maxY.toFixed(2))],
          area: Math.abs(signedArea),
        });
      }
    }
  }
}

console.log(`Planar faces extracted: ${allFaces.length} building polygons.`);

// Build Spatial Hash Grid for GLB Faces
const grid = new Map();
function gridKey(x, y) {
  return Math.floor(x / 40) + '_' + Math.floor(y / 40);
}
for (const p of allFaces) {
  const k = gridKey(p.center[0], p.center[1]);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(p);
}

function bboxIoU(b1, b2) {
  const ix0 = Math.max(b1[0], b2[0]), ix1 = Math.min(b1[1], b2[1]);
  const iy0 = Math.max(b1[2], b2[2]), iy1 = Math.min(b1[3], b2[3]);
  if (ix1 <= ix0 || iy1 <= iy0) return 0;
  const inter = (ix1 - ix0) * (iy1 - iy0);
  const a1 = (b1[1] - b1[0]) * (b1[3] - b1[2]);
  const a2 = (b2[1] - b2[0]) * (b2[3] - b2[2]);
  return inter / (a1 + a2 - inter);
}

const catalog = JSON.parse(fs.readFileSync(frontendCatPath, 'utf8'));
console.log(`Loaded catalog: ${catalog.length} buildings.`);

// Score candidate pairs
const pairScores = [];
for (let bIdx = 0; bIdx < catalog.length; bIdx++) {
  const b = catalog[bIdx];
  const cx = b.center[0], cy = b.center[1];
  const candidates = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const k = gridKey(cx + dx * 40, cy + dy * 40);
      const list = grid.get(k);
      if (list) candidates.push(...list);
    }
  }

  for (const c of candidates) {
    const iou = bboxIoU(b.bounds, c.bounds);
    const dCenter = Math.hypot(c.center[0] - cx, c.center[1] - cy);
    const dBbox = Math.abs(c.bounds[0] - b.bounds[0]) +
                  Math.abs(c.bounds[1] - b.bounds[1]) +
                  Math.abs(c.bounds[2] - b.bounds[2]) +
                  Math.abs(c.bounds[3] - b.bounds[3]);

    let score;
    if (iou > 0.5) {
      score = (1 - iou) * 2 + dBbox * 0.1;
    } else {
      score = dCenter + dBbox * 0.5;
    }

    if (score < 3.0 || (iou > 0.4 && score < 7.0)) {
      pairScores.push({ bIdx, polyId: c.id, score, iou });
    }
  }
}

// Greedy 1-to-1 matching by best score
pairScores.sort((a, b) => a.score - b.score);

const assignedBldg = new Set();
const assignedPoly = new Set();
const matchedPolyForBldg = new Map();

for (const pair of pairScores) {
  if (!assignedBldg.has(pair.bIdx) && !assignedPoly.has(pair.polyId)) {
    assignedBldg.add(pair.bIdx);
    assignedPoly.add(pair.polyId);
    matchedPolyForBldg.set(pair.bIdx, allFaces[pair.polyId]);
  }
}

console.log(`1-to-1 matches achieved: ${matchedPolyForBldg.size} out of ${catalog.length} (${((matchedPolyForBldg.size / catalog.length) * 100).toFixed(2)}%).`);

// Update catalog
let updatedCount = 0;
let unchangedCount = 0;

for (let bIdx = 0; bIdx < catalog.length; bIdx++) {
  const b = catalog[bIdx];
  const poly = matchedPolyForBldg.get(bIdx);

  if (poly) {
    // Replace axis-aligned bounding box with real rotated polygon
    b.footprint = {
      type: 'Polygon',
      coordinates: [poly.coordinates],
    };
    b.bounds = poly.bounds;
    b.center = poly.center;
    b.area_m2 = Number(poly.area.toFixed(1));
    const h = b.height_meters || (b.stories_count || 1) * 3.5;
    b.volume_m3 = Number((poly.area * h).toFixed(1));
    updatedCount++;
  } else {
    unchangedCount++;
  }
}

console.log(`Updated ${updatedCount} buildings with exact rotated GLB polygons.`);
console.log(`Preserved ${unchangedCount} campus/block complex bounding outlines.`);

// Verification check on key buildings
const b10 = catalog.find(b => b.id === 'bldg-00010');
console.log('\n=== VERIFICATION: bldg-00010 (User Screenshot Building) ===');
console.log('ID:', b10.id);
console.log('Name:', b10.name);
console.log('Bounds:', b10.bounds);
console.log('Center:', b10.center);
console.log('Vertices count:', b10.footprint.coordinates[0].length);
console.log('Polygon:', JSON.stringify(b10.footprint.coordinates[0]));

// Verify a sample of diverse homes across sectors
const sampleIds = ['bldg-00001', 'bldg-00002', 'bldg-00003', 'bldg-00016', 'bldg-00021', 'bldg-00274'];
console.log('\n=== VERIFICATION: Sample diverse buildings ===');
for (const sid of sampleIds) {
  const s = catalog.find(b => b.id === sid);
  if (s) {
    console.log(`- ${s.id} (${s.name}): ${s.footprint.coordinates[0].length} vertices, area ${s.area_m2}m²`);
  }
}

// Write to frontend and backend catalogs
fs.writeFileSync(frontendCatPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Successfully saved updated catalog to: ${frontendCatPath}`);

if (fs.existsSync(backendCatPath)) {
  fs.writeFileSync(backendCatPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`Successfully saved updated catalog to: ${backendCatPath}`);
}

console.log('\n=== COMPLETED SUCCESSFULLY ===');
