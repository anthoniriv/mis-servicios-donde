import { gridDisk, latLngToCell } from 'h3-js';
import { describe, expect, it } from 'vitest';

import {
  boundaryContains,
  boundsOf,
  cellCenter,
  cellContainsPosition,
  cellInZone,
  describeCell,
  distanceMetres,
  formatDistance,
  leadAnswer,
  serviceStyles,
  sortByProximity,
  summarizeCells,
  toCellBlobs,
  toPublicCells,
  zoneBounds,
} from './map.js';

const limaCell = latLngToCell(-12.0464, -77.0428, 9);

describe('public cell projection', () => {
  it('keeps only the public fields', () => {
    expect(toPublicCells([{ h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 2, deviceToken: 'never-public' }]))
      .toEqual([{ h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 2 }]);
  });

  it('drops entries without an explicit report count', () => {
    expect(toPublicCells([{ h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true }])).toEqual([]);
  });

  it('drops unknown services and malformed entries', () => {
    expect(toPublicCells([{ h3Cell: limaCell, service: 'gas', provider: 'other', confirmed: true, reports: 1 }, { service: 'water', provider: 'sedapal', confirmed: true, reports: 1 }, null, 'water'])).toEqual([]);
  });

  it('answers an empty list when the payload is not an array', () => {
    expect(toPublicCells({ h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 1 })).toEqual([]);
  });
});

describe('cell geometry', () => {
  it('turns a confirmed cell into a soft blob carrying its report count', () => {
    const [blob] = toCellBlobs([{ h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 3 }]);

    expect(blob?.service).toBe('water');
    expect(blob?.h3Cells).toEqual([limaCell]);
    expect(blob?.confirmed).toBe(true);
    expect(blob?.reports).toBe(3);
    expect(blob?.centre).toHaveLength(2);
    expect(blob?.radiusMetres).toBe(120);
  });

  it('joins adjacent cells for the same service and expands their shared area', () => {
    const adjacentCell = gridDisk(limaCell, 1).find((cell) => cell !== limaCell);
    expect(adjacentCell).toBeDefined();

    const [blob] = toCellBlobs([
      { h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 3 },
      { h3Cell: adjacentCell!, service: 'water', provider: 'sedapal', confirmed: false, reports: 1 },
    ]);

    expect(blob?.h3Cells).toHaveLength(2);
    expect(blob?.reports).toBe(4);
    expect(blob?.confirmed).toBe(false);
    expect(blob?.radiusMetres).toBeGreaterThan(120);
  });

  it('does not merge adjacent reports from different providers', () => {
    const adjacentCell = gridDisk(limaCell, 1).find((cell) => cell !== limaCell);
    expect(adjacentCell).toBeDefined();

    const blobs = toCellBlobs([
      { h3Cell: limaCell, service: 'electricity', provider: 'luz_del_sur', confirmed: true, reports: 3 },
      { h3Cell: adjacentCell!, service: 'electricity', provider: 'pluz', confirmed: true, reports: 3 },
    ]);

    expect(blobs).toHaveLength(2);
    expect(blobs.map((blob) => blob.provider)).toEqual(['luz_del_sur', 'pluz']);
  });

  it('keeps the same geographic footprint for pending and confirmed cells', () => {
    const [confirmed] = toCellBlobs([{ h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 3 }]);
    const [pending] = toCellBlobs([{ h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: false, reports: 1 }]);

    expect(pending?.radiusMetres).toBe(confirmed?.radiusMetres);
    expect(pending?.radiusMetres).toBe(120);
  });

  it('gives each co-located service its own blob at the true centre', () => {
    const blobs = toCellBlobs([
      { h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 3 },
      { h3Cell: limaCell, service: 'electricity', provider: 'luz_del_sur', confirmed: true, reports: 3 },
    ]);

    expect(blobs).toHaveLength(2);
    expect(blobs[0]?.centre).toEqual(blobs[1]?.centre);
    expect(blobs.map((blob) => blob.service)).toEqual(['water', 'electricity']);
  });

  it('discards an invalid index instead of placing a blob in the ocean', () => {
    expect(toCellBlobs([{ h3Cell: '8999999999fffff', service: 'water', provider: 'sedapal', confirmed: true, reports: 1 }])).toEqual([]);
  });

  it('checks the visitor position against the same H3 cell locally', () => {
    expect(cellContainsPosition(limaCell, [-12.0464, -77.0428])).toBe(true);
    expect(cellContainsPosition(limaCell, [-12.1, -77.1])).toBe(false);
  });
});

describe('viewport bounds', () => {
  it('has no bounds to offer without geometry', () => {
    expect(boundsOf([])).toBeUndefined();
  });

  it('wraps every blob centre', () => {
    const bounds = boundsOf([
      { service: 'water', provider: 'sedapal', h3Cells: [limaCell], centre: [-12, -77], confirmed: true, reports: 1, radiusMetres: 500 },
      { service: 'internet', provider: 'movistar', h3Cells: [limaCell], centre: [-11.5, -76.5], confirmed: true, reports: 1, radiusMetres: 500 },
    ]);

    expect(bounds?.[0][0]).toBeLessThan(-12);
    expect(bounds?.[0][1]).toBeLessThan(-77);
    expect(bounds?.[1][0]).toBeGreaterThan(-11.5);
    expect(bounds?.[1][1]).toBeGreaterThan(-76.5);
  });
});

describe('accessible text alternative', () => {
  it('names a confirmed cut without revealing the cell index', () => {
    expect(describeCell('water', true)).toBe('Corte de agua en una zona cercana');
    expect(describeCell('water', true)).not.toContain(limaCell);
  });

  it('names a pending report as a single neighbour, not a confirmed cut', () => {
    expect(describeCell('electricity', false)).toBe('Posible corte de luz reportado por un vecino');
  });

  it('summarizes empty, confirmed, and pending lists', () => {
    expect(summarizeCells(0, 0)).toBe('No hay cortes reportados en este momento.');
    expect(summarizeCells(1, 0)).toBe('1 confirmado.');
    expect(summarizeCells(0, 3)).toBe('3 sin confirmar.');
    expect(summarizeCells(2, 1)).toBe('2 confirmados · 1 sin confirmar.');
  });
});

describe('service styling', () => {
  it('gives every supported service a distinct colour and label', () => {
    const styles = Object.values(serviceStyles);

    expect(styles).toHaveLength(3);
    expect(new Set(styles.map((style) => style.fill)).size).toBe(3);
    expect(new Set(styles.map((style) => style.label)).size).toBe(3);
  });
});

describe('proximity', () => {
  const origin: [number, number] = [-12.0464, -77.0428];

  it('has no centre to offer for an invalid index', () => {
    expect(cellCenter('8999999999fffff')).toBeUndefined();
    expect(cellCenter(limaCell)).toHaveLength(2);
  });

  it('measures a known separation along the equator', () => {
    expect(distanceMetres([0, 0], [0, 1])).toBeGreaterThan(111_000);
    expect(distanceMetres([0, 0], [0, 1])).toBeLessThan(111_500);
    expect(distanceMetres(origin, origin)).toBeCloseTo(0, 5);
  });

  it('reads distance the way a neighbour says it', () => {
    expect(formatDistance(0)).toBe('a 0 m');
    expect(formatDistance(304)).toBe('a 300 m');
    expect(formatDistance(1240)).toBe('a 1,2 km');
  });

  it('orders the nearest condition first once a position is known', () => {
    const far = latLngToCell(-12.15, -77.15, 9);
    const sorted = sortByProximity([{ h3Cell: far, service: 'internet', provider: 'movistar', confirmed: true, reports: 3 }, { h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 3 }], origin);

    expect(sorted[0]?.h3Cell).toBe(limaCell);
    expect(sorted[0]?.metres).toBeLessThan(sorted[1]?.metres ?? 0);
  });

  it('ranks a confirmed cut above a pending one when distances tie', () => {
    const sorted = sortByProximity([
      { h3Cell: limaCell, service: 'internet', provider: 'movistar', confirmed: false, reports: 1 },
      { h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 3 },
    ], origin);

    expect(sorted[0]).toMatchObject({ service: 'water', confirmed: true });
  });

  it('stays stable by service when the visitor shared no position', () => {
    const sorted = sortByProximity([{ h3Cell: limaCell, service: 'internet', provider: 'movistar', confirmed: true, reports: 3 }, { h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 3 }]);

    expect(sorted.map((cell) => cell.service)).toEqual(['water', 'internet']);
    expect(sorted[0]?.metres).toBeUndefined();
  });
});

describe('district geometry', () => {
  const rimac = { minLatitude: -12.045, maxLatitude: -12.005, minLongitude: -77.05, maxLongitude: -77 };

  it('turns a district box into a south-west / north-east pair', () => {
    expect(zoneBounds(rimac)).toEqual([[-12.045, -77.05], [-12.005, -77]]);
  });

  it('knows whether a point falls inside a district', () => {
    expect(boundaryContains(rimac, -12.0228, -77.0314)).toBe(true);
    expect(boundaryContains(rimac, -12.1, -77.0314)).toBe(false);
  });

  it('places a cell in a district by its centre', () => {
    expect(cellInZone(limaCell, rimac)).toBe(false);
    expect(cellInZone(latLngToCell(-12.0228, -77.0314, 9), rimac)).toBe(true);
  });
});

describe('lead answer', () => {
  it('says plainly when nothing is reported', () => {
    expect(leadAnswer([])).toBe('Ningún corte reportado ahora.');
  });

  it('leads with the nearest service and its distance', () => {
    expect(leadAnswer([{ h3Cell: limaCell, service: 'electricity', provider: 'luz_del_sur', confirmed: true, reports: 3, metres: 470 }])).toBe('Lo más cerca: Luz a 470 m');
  });

  it('falls back to a count when the visitor shared no position', () => {
    expect(leadAnswer([{ h3Cell: limaCell, service: 'water', provider: 'sedapal', confirmed: true, reports: 3 }])).toBe('1 reportes en la zona piloto.');
  });
});
