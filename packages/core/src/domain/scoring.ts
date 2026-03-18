import type { NormalizedEventCandidate } from '../schemas/domain';

const severityWeightByType: Record<string, number> = {
  airstrike: 34,
  missile: 42,
  naval_incident: 36,
  drone: 28,
  humanitarian_update: 18,
  explosion: 30,
  protest: 12,
  sanctions: 24,
  fire_hotspot: 16,
  conflict: 20,
};

const marketSensitiveTags = new Set([
  'oil',
  'energy',
  'shipping',
  'hormuz',
  'red-sea',
  'port',
  'refinery',
  'terminal',
  'airspace',
  'sanctions',
  'tanker',
]);

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreBand(score: number): 'low' | 'elevated' | 'significant' | 'severe' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'severe';
  if (score >= 40) return 'significant';
  if (score >= 20) return 'elevated';
  return 'low';
}

export function scoreSeverity(candidate: Pick<NormalizedEventCandidate, 'eventType' | 'killed' | 'injured' | 'tags' | 'confidence' | 'countryCode'>): number {
  const base = severityWeightByType[candidate.eventType ?? 'conflict'] ?? 20;
  const casualtyScore = Math.min(30, (candidate.killed ?? 0) * 2 + (candidate.injured ?? 0));
  const tagScore = Math.min(18, (candidate.tags?.length ?? 0) * 3);
  const confidenceScore = candidate.confidence === 'high' ? 8 : candidate.confidence === 'medium' ? 4 : 0;
  const strategicGeoScore = candidate.countryCode && ['IR', 'IQ', 'SY', 'IL', 'LB', 'YE', 'OM', 'SA', 'AE'].includes(candidate.countryCode)
    ? 10
    : 0;

  return clampScore(base + casualtyScore + tagScore + confidenceScore + strategicGeoScore);
}

export function scoreEscalation(options: {
  recentEventCount: number;
  priorEventCount: number;
  highSeverityCount: number;
  marketMovePct?: number;
  publicAttentionDeltaPct?: number;
}): number {
  const velocityDelta = Math.max(0, options.recentEventCount - options.priorEventCount) * 6;
  const severityMix = options.highSeverityCount * 9;
  const marketReaction = Math.min(16, Math.abs(options.marketMovePct ?? 0) * 4);
  const attentionShift = Math.min(12, Math.abs(options.publicAttentionDeltaPct ?? 0) / 10);
  return clampScore(velocityDelta + severityMix + marketReaction + attentionShift);
}

export function scoreMarketRelevance(candidate: Pick<NormalizedEventCandidate, 'tags' | 'eventType' | 'placeName'>): number {
  const tagHits = (candidate.tags ?? []).filter((tag) => marketSensitiveTags.has(tag.toLowerCase())).length;
  const infrastructureHint = /terminal|port|pipeline|refinery|strait|chokepoint/i.test(candidate.placeName ?? '') ? 20 : 0;
  const eventTypeHint = /missile|naval|sanctions|drone|airstrike/i.test(candidate.eventType ?? '') ? 18 : 8;
  return clampScore(tagHits * 12 + infrastructureHint + eventTypeHint);
}
