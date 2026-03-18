import type { SourceKind, SourceType } from '../schemas/common';

export interface SourceRegistryEntry {
  key: string;
  name: string;
  sourceKind: SourceKind;
  sourceType: SourceType;
  description: string;
  cadence: string;
  attribution: string;
  docsUrl: string;
  defaultEnabled: boolean;
  requiresEnv: string[];
  notes?: string;
}

export const sourceRegistry: SourceRegistryEntry[] = [
  {
    key: 'gdelt',
    name: 'GDELT',
    sourceKind: 'news',
    sourceType: 'news',
    description: 'Global conflict-related news/event discovery backbone.',
    cadence: '5-15 minutes',
    attribution: 'GDELT Project',
    docsUrl: 'https://www.gdeltproject.org/data.html',
    defaultEnabled: true,
    requiresEnv: [],
    notes: 'Use as discovery input, not final truth.',
  },
  {
    key: 'reliefweb',
    name: 'ReliefWeb',
    sourceKind: 'humanitarian',
    sourceType: 'humanitarian',
    description: 'Authoritative humanitarian updates, reports, and situation context.',
    cadence: '15-60 minutes',
    attribution: 'ReliefWeb / UN OCHA',
    docsUrl: 'https://apidoc.reliefweb.int/',
    defaultEnabled: true,
    requiresEnv: ['RELIEFWEB_APPNAME'],
  },
  {
    key: 'firms',
    name: 'NASA FIRMS',
    sourceKind: 'satellite',
    sourceType: 'satellite-derived',
    description: 'Near-real-time fire and hotspot remote sensing layer.',
    cadence: '1-3 hours',
    attribution: 'NASA FIRMS',
    docsUrl: 'https://firms.modaps.eosdis.nasa.gov/api/',
    defaultEnabled: true,
    requiresEnv: ['FIRMS_MAP_KEY'],
  },
  {
    key: 'opensky',
    name: 'OpenSky Network',
    sourceKind: 'air',
    sourceType: 'crowdsourced',
    description: 'Regional aircraft state vectors for air activity overlays.',
    cadence: '15-60 minutes',
    attribution: 'OpenSky Network',
    docsUrl: 'https://opensky-network.org/data/api',
    defaultEnabled: true,
    requiresEnv: ['OPENSKY_CLIENT_ID', 'OPENSKY_CLIENT_SECRET'],
  },
  {
    key: 'aisstream',
    name: 'AISStream',
    sourceKind: 'maritime',
    sourceType: 'crowdsourced',
    description: 'Live vessel movement around chokepoints using websocket bounding boxes.',
    cadence: 'continuous',
    attribution: 'AISStream',
    docsUrl: 'https://aisstream.io/documentation',
    defaultEnabled: true,
    requiresEnv: ['AISSTREAM_API_KEY'],
  },
  {
    key: 'wikimedia',
    name: 'Wikimedia',
    sourceKind: 'encyclopedic',
    sourceType: 'inferred',
    description: 'Context enrichment and pageview-based public attention proxy.',
    cadence: '15-60 minutes',
    attribution: 'Wikimedia Foundation',
    docsUrl: 'https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/',
    defaultEnabled: true,
    requiresEnv: [],
  },
  {
    key: 'eia',
    name: 'EIA',
    sourceKind: 'energy',
    sourceType: 'official',
    description: 'Energy-specific context and oil reference series.',
    cadence: '15-60 minutes',
    attribution: 'U.S. Energy Information Administration',
    docsUrl: 'https://www.eia.gov/opendata/documentation.php',
    defaultEnabled: true,
    requiresEnv: ['EIA_API_KEY'],
  },
  {
    key: 'fred',
    name: 'FRED',
    sourceKind: 'macro',
    sourceType: 'official',
    description: 'Macro and rates indicators for investor context.',
    cadence: '15-60 minutes',
    attribution: 'Federal Reserve Bank of St. Louis',
    docsUrl: 'https://fred.stlouisfed.org/docs/api/fred/',
    defaultEnabled: true,
    requiresEnv: ['FRED_API_KEY'],
  },
  {
    key: 'alphavantage',
    name: 'Alpha Vantage',
    sourceKind: 'market',
    sourceType: 'official',
    description: 'Equity, ETF, FX, and commodity market quotes.',
    cadence: '5-15 minutes',
    attribution: 'Alpha Vantage',
    docsUrl: 'https://www.alphavantage.co/documentation/',
    defaultEnabled: true,
    requiresEnv: ['ALPHA_VANTAGE_API_KEY'],
  },
];

export const sourceRegistryByKey = Object.fromEntries(
  sourceRegistry.map((entry) => [entry.key, entry] as const),
);
