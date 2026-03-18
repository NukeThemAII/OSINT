import { describe, it, expect } from 'vitest';

import {
  normalizedEventCandidateSchema,
  marketSignalSchema,
  hotspotSignalSchema,
  assetTrackSchema,
  normalizedRecordSchema,
  eventSchema,
  sourceItemSchema,
  loginRequestSchema,
} from './domain';

describe('normalizedEventCandidateSchema', () => {
  const validCandidate = {
    kind: 'event_candidate' as const,
    sourceName: 'GDELT',
    sourceType: 'news' as const,
    confidence: 'medium' as const,
    externalId: 'abc123',
    title: 'Test event',
    urls: ['https://example.com/article'],
  };

  it('accepts a valid minimal event candidate', () => {
    const result = normalizedEventCandidateSchema.safeParse(validCandidate);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = normalizedEventCandidateSchema.safeParse({ kind: 'event_candidate' });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields when provided', () => {
    const result = normalizedEventCandidateSchema.safeParse({
      ...validCandidate,
      lat: 33.5,
      lon: 44.3,
      killed: 5,
      injured: 12,
      tags: ['oil', 'conflict'],
      countryCode: 'IQ',
      eventType: 'airstrike',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lat).toBe(33.5);
      expect(result.data.tags).toEqual(['oil', 'conflict']);
    }
  });

  it('defaults tags and urls to empty arrays', () => {
    const result = normalizedEventCandidateSchema.safeParse({
      kind: 'event_candidate',
      sourceName: 'Test',
      sourceType: 'news',
      confidence: 'low',
      externalId: 'x',
      title: 'Test',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
      expect(result.data.urls).toEqual([]);
    }
  });

  it('rejects invalid confidence values', () => {
    const result = normalizedEventCandidateSchema.safeParse({
      ...validCandidate,
      confidence: 'super_high',
    });
    expect(result.success).toBe(false);
  });
});

describe('marketSignalSchema', () => {
  it('accepts a valid market signal', () => {
    const result = marketSignalSchema.safeParse({
      kind: 'market_signal',
      sourceName: 'Alpha Vantage',
      sourceType: 'official',
      confidence: 'medium',
      externalId: 'XLE-2026-03-18',
      symbol: 'XLE',
      assetClass: 'etf',
      observedAt: '2026-03-18T00:00:00Z',
      price: 82.45,
      changePct: -1.23,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid asset class', () => {
    const result = marketSignalSchema.safeParse({
      kind: 'market_signal',
      sourceName: 'Test',
      sourceType: 'official',
      confidence: 'high',
      externalId: 'x',
      symbol: 'BAD',
      assetClass: 'crypto',
      observedAt: '2026-01-01T00:00:00Z',
      price: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe('normalizedRecordSchema (discriminated union)', () => {
  it('resolves event_candidate type correctly', () => {
    const result = normalizedRecordSchema.safeParse({
      kind: 'event_candidate',
      sourceName: 'Test',
      sourceType: 'news',
      confidence: 'low',
      externalId: 'e1',
      title: 'Test event',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe('event_candidate');
    }
  });

  it('resolves hotspot type correctly', () => {
    const result = normalizedRecordSchema.safeParse({
      kind: 'hotspot',
      sourceName: 'NASA FIRMS',
      sourceType: 'satellite-derived',
      confidence: 'medium',
      externalId: 'h1',
      observedAt: '2026-03-18T12:00:00Z',
      lat: 33.0,
      lon: 44.0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe('hotspot');
    }
  });

  it('rejects unknown kind discriminator', () => {
    const result = normalizedRecordSchema.safeParse({
      kind: 'earthquake',
      sourceName: 'USGS',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginRequestSchema', () => {
  it('accepts valid login', () => {
    const result = loginRequestSchema.safeParse({
      email: 'admin@example.com',
      password: 'strongpassword123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginRequestSchema.safeParse({
      email: 'not-an-email',
      password: 'strongpassword123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginRequestSchema.safeParse({
      email: 'admin@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});
