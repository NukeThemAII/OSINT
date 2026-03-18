import { describe, it, expect } from 'vitest';

import { clampScore, scoreBand, scoreSeverity, scoreEscalation, scoreMarketRelevance } from './scoring';

describe('clampScore', () => {
  it('returns 0 for negative values', () => {
    expect(clampScore(-10)).toBe(0);
  });

  it('returns 100 for values above 100', () => {
    expect(clampScore(150)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(clampScore(42.7)).toBe(43);
    expect(clampScore(42.3)).toBe(42);
  });

  it('passes through values in range', () => {
    expect(clampScore(50)).toBe(50);
    expect(clampScore(0)).toBe(0);
    expect(clampScore(100)).toBe(100);
  });
});

describe('scoreBand', () => {
  it('maps 0-19 to low', () => {
    expect(scoreBand(0)).toBe('low');
    expect(scoreBand(19)).toBe('low');
  });

  it('maps 20-39 to elevated', () => {
    expect(scoreBand(20)).toBe('elevated');
    expect(scoreBand(39)).toBe('elevated');
  });

  it('maps 40-59 to significant', () => {
    expect(scoreBand(40)).toBe('significant');
    expect(scoreBand(59)).toBe('significant');
  });

  it('maps 60-79 to severe', () => {
    expect(scoreBand(60)).toBe('severe');
    expect(scoreBand(79)).toBe('severe');
  });

  it('maps 80-100 to critical', () => {
    expect(scoreBand(80)).toBe('critical');
    expect(scoreBand(100)).toBe('critical');
  });
});

describe('scoreSeverity', () => {
  it('returns base score for minimal event', () => {
    const score = scoreSeverity({
      eventType: 'conflict',
      killed: null,
      injured: null,
      tags: [],
      confidence: 'low',
      countryCode: undefined,
    });
    // conflict base=20, no casualties, no tags, low confidence=0, no strategic geo=0
    expect(score).toBe(20);
  });

  it('scores higher for missile events with casualties in strategic countries', () => {
    const score = scoreSeverity({
      eventType: 'missile',
      killed: 5,
      injured: 10,
      tags: ['oil', 'hormuz', 'port'],
      confidence: 'high',
      countryCode: 'IR',
    });
    // missile base=42, casualty=min(30, 5*2+10)=20, tags=min(18,3*3)=9, conf=8, geo=10
    expect(score).toBe(89);
  });

  it('caps casualty contribution at 30', () => {
    const score = scoreSeverity({
      eventType: 'airstrike',
      killed: 100,
      injured: 200,
      tags: [],
      confidence: 'medium',
      countryCode: 'US',
    });
    // airstrike base=34, casualty=min(30,100*2+200)=30, tags=0, conf=4, no strategic geo=0
    expect(score).toBe(68);
  });

  it('uses default event type weight for unknown types', () => {
    const score = scoreSeverity({
      eventType: 'unknown_something',
      killed: 0,
      injured: 0,
      tags: [],
      confidence: 'low',
      countryCode: undefined,
    });
    // default base=20
    expect(score).toBe(20);
  });

  it('adds strategic geo score for recognized country codes', () => {
    const baseScore = scoreSeverity({
      eventType: 'conflict',
      killed: null,
      injured: null,
      tags: [],
      confidence: 'low',
      countryCode: undefined,
    });
    const withGeo = scoreSeverity({
      eventType: 'conflict',
      killed: null,
      injured: null,
      tags: [],
      confidence: 'low',
      countryCode: 'IL',
    });
    expect(withGeo - baseScore).toBe(10);
  });
});

describe('scoreEscalation', () => {
  it('returns 0 for no change', () => {
    expect(scoreEscalation({
      recentEventCount: 5,
      priorEventCount: 5,
      highSeverityCount: 0,
    })).toBe(0);
  });

  it('increases with velocity delta', () => {
    const score = scoreEscalation({
      recentEventCount: 10,
      priorEventCount: 2,
      highSeverityCount: 0,
    });
    // (10-2)*6 = 48
    expect(score).toBe(48);
  });

  it('factors in high severity events', () => {
    const score = scoreEscalation({
      recentEventCount: 5,
      priorEventCount: 5,
      highSeverityCount: 3,
    });
    // 0 + 3*9 = 27
    expect(score).toBe(27);
  });

  it('clamps to 100', () => {
    const score = scoreEscalation({
      recentEventCount: 50,
      priorEventCount: 0,
      highSeverityCount: 10,
      marketMovePct: 15,
      publicAttentionDeltaPct: 200,
    });
    expect(score).toBe(100);
  });
});

describe('scoreMarketRelevance', () => {
  it('returns base score for generic event', () => {
    const score = scoreMarketRelevance({
      tags: [],
      eventType: 'conflict',
      placeName: 'Unknown',
    });
    // no tag hits, no infrastructure, generic event type = 8
    expect(score).toBe(8);
  });

  it('scores high for oil/shipping events at strategic locations', () => {
    const score = scoreMarketRelevance({
      tags: ['oil', 'shipping', 'tanker'],
      eventType: 'missile',
      placeName: 'Strait of Hormuz terminal',
    });
    // tags: 3*12=36, infrastructure (terminal+strait)=20, eventType (missile)=18
    expect(score).toBe(74);
  });

  it('returns max score for highly relevant scenarios', () => {
    const score = scoreMarketRelevance({
      tags: ['oil', 'energy', 'shipping', 'hormuz', 'red-sea', 'port', 'refinery', 'terminal', 'tanker'],
      eventType: 'naval_incident',
      placeName: 'Strait chokepoint refinery pipeline terminal port',
    });
    expect(score).toBe(100);
  });
});
