import type { BoundingBox, Point } from '../schemas/common';

export interface AreaOfInterest {
  key: string;
  label: string;
  bounds: BoundingBox;
}

export interface StrategicPoint {
  key: string;
  label: string;
  point: Point;
  kind: 'chokepoint' | 'facility' | 'port';
}

export const primaryAois: AreaOfInterest[] = [
  {
    key: 'iran',
    label: 'Iran',
    bounds: { west: 44.0, south: 25.0, east: 63.5, north: 40.0 },
  },
  {
    key: 'iraq-syria',
    label: 'Iraq / Syria',
    bounds: { west: 35.5, south: 29.0, east: 48.5, north: 38.8 },
  },
  {
    key: 'levant',
    label: 'Israel / Lebanon / Jordan',
    bounds: { west: 34.0, south: 29.0, east: 37.8, north: 34.9 },
  },
  {
    key: 'yemen-red-sea',
    label: 'Yemen / Red Sea',
    bounds: { west: 32.0, south: 11.0, east: 52.0, north: 23.5 },
  },
  {
    key: 'gulf-hormuz',
    label: 'Hormuz / Gulf of Oman',
    bounds: { west: 51.0, south: 23.0, east: 62.5, north: 29.5 },
  },
];

export const strategicPoints: StrategicPoint[] = [
  {
    key: 'strait-of-hormuz',
    label: 'Strait of Hormuz',
    kind: 'chokepoint',
    point: { lat: 26.5667, lon: 56.25 },
  },
  {
    key: 'bab-el-mandeb',
    label: 'Bab-el-Mandeb',
    kind: 'chokepoint',
    point: { lat: 12.5833, lon: 43.3333 },
  },
  {
    key: 'suez-approaches',
    label: 'Suez Approaches',
    kind: 'chokepoint',
    point: { lat: 29.9668, lon: 32.5498 },
  },
  {
    key: 'kharg-island',
    label: 'Kharg Island Terminal',
    kind: 'facility',
    point: { lat: 29.238, lon: 50.324 },
  },
  {
    key: 'fujairah',
    label: 'Fujairah Port',
    kind: 'port',
    point: { lat: 25.1321, lon: 56.3265 },
  },
];
