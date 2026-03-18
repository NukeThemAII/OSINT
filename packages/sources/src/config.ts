import { primaryAois } from '@investor-intel/core';
import { z } from 'zod';

const envSchema = z.object({
  GDELT_QUERY: z.string().default('Iran OR Hormuz OR Israel OR Lebanon OR Yemen OR Red Sea'),
  GDELT_MAX_RECORDS: z.coerce.number().int().positive().max(250).default(40),
  RELIEFWEB_APPNAME: z.string().default('investor-intel-osint-dashboard'),
  RELIEFWEB_QUERY: z.string().default('Iran OR Israel OR Lebanon OR Yemen OR Red Sea'),
  RELIEFWEB_MAX_RECORDS: z.coerce.number().int().positive().max(100).default(20),
  FIRMS_MAP_KEY: z.string().optional(),
  FIRMS_SENSOR: z.string().default('VIIRS_SNPP_NRT'),
  FIRMS_AREA: z.string().default('world'),
  FIRMS_DAYS: z.coerce.number().int().positive().max(10).default(1),
  OPENSKY_CLIENT_ID: z.string().optional(),
  OPENSKY_CLIENT_SECRET: z.string().optional(),
  AISSTREAM_API_KEY: z.string().optional(),
  AISSTREAM_SAMPLE_SECONDS: z.coerce.number().int().positive().max(30).default(8),
  WIKIMEDIA_PAGES: z.string().default('Iran-Israel proxy conflict,Red Sea crisis'),
  FRED_API_KEY: z.string().optional(),
  FRED_SERIES: z.string().default('DGS10,VIXCLS,DTWEXBGS'),
  EIA_API_KEY: z.string().optional(),
  EIA_SERIES: z.string().default('PET.RBRTE.D,PET.RWTC.D'),
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  MARKET_WATCHLIST: z.string().default('XLE,SPY,GLD,UUP,XAR'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().max(60000).default(20000),
});

export interface SourceRuntimeConfig {
  gdeltQuery: string;
  gdeltMaxRecords: number;
  reliefwebAppName: string;
  reliefwebQuery: string;
  reliefwebMaxRecords: number;
  firmsMapKey?: string;
  firmsSensor: string;
  firmsArea: string;
  firmsDays: number;
  openskyClientId?: string;
  openskyClientSecret?: string;
  aisstreamApiKey?: string;
  aisstreamSampleSeconds: number;
  wikimediaPages: string[];
  fredApiKey?: string;
  fredSeries: string[];
  eiaApiKey?: string;
  eiaSeries: string[];
  alphaVantageApiKey?: string;
  marketWatchlist: string[];
  requestTimeoutMs: number;
  regionalBboxes: Array<{ north: number; south: number; east: number; west: number }>;
}

export function loadSourceRuntimeConfig(env: NodeJS.ProcessEnv = process.env): SourceRuntimeConfig {
  const parsed = envSchema.parse(env);

  return {
    gdeltQuery: parsed.GDELT_QUERY,
    gdeltMaxRecords: parsed.GDELT_MAX_RECORDS,
    reliefwebAppName: parsed.RELIEFWEB_APPNAME,
    reliefwebQuery: parsed.RELIEFWEB_QUERY,
    reliefwebMaxRecords: parsed.RELIEFWEB_MAX_RECORDS,
    firmsMapKey: parsed.FIRMS_MAP_KEY,
    firmsSensor: parsed.FIRMS_SENSOR,
    firmsArea: parsed.FIRMS_AREA,
    firmsDays: parsed.FIRMS_DAYS,
    openskyClientId: parsed.OPENSKY_CLIENT_ID,
    openskyClientSecret: parsed.OPENSKY_CLIENT_SECRET,
    aisstreamApiKey: parsed.AISSTREAM_API_KEY,
    aisstreamSampleSeconds: parsed.AISSTREAM_SAMPLE_SECONDS,
    wikimediaPages: parsed.WIKIMEDIA_PAGES.split(',').map((page) => page.trim()).filter(Boolean),
    fredApiKey: parsed.FRED_API_KEY,
    fredSeries: parsed.FRED_SERIES.split(',').map((series) => series.trim()).filter(Boolean),
    eiaApiKey: parsed.EIA_API_KEY,
    eiaSeries: parsed.EIA_SERIES.split(',').map((series) => series.trim()).filter(Boolean),
    alphaVantageApiKey: parsed.ALPHA_VANTAGE_API_KEY,
    marketWatchlist: parsed.MARKET_WATCHLIST.split(',').map((symbol) => symbol.trim()).filter(Boolean),
    requestTimeoutMs: parsed.REQUEST_TIMEOUT_MS,
    regionalBboxes: primaryAois.map((area) => area.bounds),
  };
}
