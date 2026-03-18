import { gdeltAdapter } from './adapters/gdelt';
import { reliefwebAdapter } from './adapters/reliefweb';
import { firmsAdapter } from './adapters/firms';
import { openskyAdapter } from './adapters/opensky';
import { aisstreamAdapter } from './adapters/aisstream';
import { wikimediaAdapter } from './adapters/wikimedia';
import { eiaAdapter } from './adapters/eia';
import { fredAdapter } from './adapters/fred';
import { alphaVantageAdapter } from './adapters/alphavantage';

export const sourceAdapters = [
  gdeltAdapter,
  reliefwebAdapter,
  firmsAdapter,
  openskyAdapter,
  aisstreamAdapter,
  wikimediaAdapter,
  eiaAdapter,
  fredAdapter,
  alphaVantageAdapter,
];

export const sourceAdaptersByKey = Object.fromEntries(sourceAdapters.map((adapter) => [adapter.key, adapter] as const));
