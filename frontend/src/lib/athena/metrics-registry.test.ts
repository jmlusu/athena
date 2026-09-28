import { describe, expect, it } from 'vitest';

import type { Job, PipelineStatsResponse } from './types';
import {
  ATS_CRITICAL_MIN,
  ATS_FLAGGED_MAX,
  ATS_FLAGGED_MIN,
  METRIC_DEFINITIONS,
  METRICS_GLOSSARY,
  buildStatsShapeFromJobs,
  calculateConversionRate,
  calculateConversionRateWithDenominator,
  calculateFunnelData,
  getMetricDefinition,
  getMetricValue,
  mapPipelineStatsToStatsShape,
} from './metrics-registry';
import type { PipelineStatsAPI, StatsShape } from './metrics-registry';

const STATS: StatsShape = {
  total_jobs: 100,
  new: 25,
  criticalMatch: 10,
  flaggedReview: 8,
  signOffPending: 5,
  submitted: 3,
  avg_ats_score: 72.5,
};

const makeJob = (overrides: Partial<Job>): Job => ({
  id: 'job-1',
  source: 'linkedin',
  title: 'Software Engineer',
  company: 'Acme',
  location: 'Remote',
  job_type: 'full_time',
  description: '',
  requirements: [],
  responsibilities: [],
  keywords: [],
  application_url: 'https://example.com/job',
  benefits: [],
  status: 'new',
  scraped_at: '2026-09-28T00:00:00Z',
  updated_at: '2026-09-28T00:00:00Z',
  metadata: {},
  ...overrides,
});

describe('METRIC_DEFINITIONS', () => {
  it('defines exactly the six canonical metrics', () => {
    const keys = METRIC_DEFINITIONS.map((m) => m.key);
    expect(new Set(keys)).toEqual(
      new Set(['discovered', 'critical', 'flagged', 'signoff', 'submitted', 'avg_ats'])
    );
    expect(keys).toHaveLength(6);
  });

  it('each metric formula resolves against a StatsShape', () => {
    // MetricKey is intentionally distinct from StatsShape field names; the
    // formula is the mapping between the two. This is the contract test.
    const expected: Record<string, number> = {
      discovered: 25, // stats.new
      critical: 10, // stats.criticalMatch
      flagged: 8, // stats.flaggedReview
      signoff: 5, // stats.signOffPending
      submitted: 3, // stats.submitted
      avg_ats: 72.5, // stats.avg_ats_score
    };

    for (const metric of METRIC_DEFINITIONS) {
      expect(metric.formula(STATS)).toBe(expected[metric.key]);
    }
  });

  it('every definition carries a name, description, and data source', () => {
    for (const metric of METRIC_DEFINITIONS) {
      expect(metric.name.length).toBeGreaterThan(0);
      expect(metric.description.length).toBeGreaterThan(0);
      expect(['pipeline-stats', 'job-scores', 'combined']).toContain(metric.dataSource);
    }
  });
});

describe('getMetricValue', () => {
  it('returns each StatsShape field', () => {
    expect(getMetricValue(STATS, 'new')).toBe(25);
    expect(getMetricValue(STATS, 'criticalMatch')).toBe(10);
    expect(getMetricValue(STATS, 'flaggedReview')).toBe(8);
    expect(getMetricValue(STATS, 'signOffPending')).toBe(5);
    expect(getMetricValue(STATS, 'submitted')).toBe(3);
    expect(getMetricValue(STATS, 'avg_ats_score')).toBe(72.5);
    expect(getMetricValue(STATS, 'total_jobs')).toBe(100);
  });
});

describe('getMetricDefinition', () => {
  it('resolves a definition for every metric key', () => {
    const keys = ['discovered', 'critical', 'flagged', 'signoff', 'submitted', 'avg_ats'] as const;
    for (const key of keys) {
      const def = getMetricDefinition(key);
      expect(def).toBeDefined();
      expect(def?.key).toBe(key);
      expect(typeof def?.formula).toBe('function');
    }
  });
});

describe('calculateConversionRate (2,557 Fix)', () => {
  const stats: StatsShape = {
    total_jobs: 100,
    new: 50,
    criticalMatch: 25,
    flaggedReview: 15,
    signOffPending: 10,
    submitted: 8,
    avg_ats_score: 70.0,
  };

  it('uses stats.new as the denominator', () => {
    // critical + flagged = 40; 40 / 50 * 100 = 80%
    expect(calculateConversionRate(40, stats)).toBe(80.0);
  });

  it('returns 0 when stats.new is 0', () => {
    const zero: StatsShape = { ...stats, new: 0 };
    expect(calculateConversionRate(40, zero)).toBe(0);
  });

  it('calculateConversionRateWithDenominator honors a custom denominator', () => {
    expect(calculateConversionRateWithDenominator(40, 50)).toBe(80.0);
    expect(calculateConversionRateWithDenominator(40, 0)).toBe(0);
  });
});

describe('calculateFunnelData', () => {
  const stats: StatsShape = {
    total_jobs: 100,
    new: 50,
    criticalMatch: 25,
    flaggedReview: 15,
    signOffPending: 10,
    submitted: 8,
    avg_ats_score: 72.5,
  };

  it('returns 5 stages with count and conversionRate', () => {
    const funnel = calculateFunnelData(stats);
    expect(funnel).toHaveLength(5);

    const stages = funnel.map((f) => f.stage);
    expect(stages).toEqual(['Discovered', 'ATS Evaluated', 'Tailored', 'Submitted', 'Interview']);

    for (const stage of funnel) {
      expect(stage).toHaveProperty('count');
      expect(stage).toHaveProperty('conversionRate');
    }
  });

  it('uses stats.new as the denominator for every rate', () => {
    const s: StatsShape = {
      total_jobs: 100,
      new: 40,
      criticalMatch: 20,
      flaggedReview: 12,
      signOffPending: 8,
      submitted: 5,
      avg_ats_score: 70.0,
    };

    const funnel = calculateFunnelData(s);
    const atsEvaluated = funnel.find((f) => f.stage === 'ATS Evaluated');
    const submitted = funnel.find((f) => f.stage === 'Submitted');

    // (20 + 12) / 40 * 100 = 80%
    expect(atsEvaluated?.conversionRate).toBe(80.0);
    // 5 / 40 * 100 = 12.5%
    expect(submitted?.conversionRate).toBeCloseTo(12.5, 2);
  });

  it('stage 1 (Discovered) is the 100% baseline', () => {
    const funnel = calculateFunnelData(stats);
    expect(funnel[0]).toEqual({ stage: 'Discovered', count: 50, conversionRate: 100 });
  });
});

describe('mapPipelineStatsToStatsShape', () => {
  const pipeline: PipelineStatsAPI = {
    total_jobs: 100,
    new: 50,
    fetched: 30,
    matched: 20,
    scored: 25,
    applied: 15,
    interview: 8,
    offer: 5,
    rejected: 3,
    by_source: {},
    by_type: {},
    avg_ats_score: 70.0,
    avg_match_score: 0.0,
  };

  it('carries forward new and total_jobs', () => {
    const shape = mapPipelineStatsToStatsShape(pipeline);
    expect(shape.new).toBe(50);
    expect(shape.total_jobs).toBe(100);
    expect(shape.avg_ats_score).toBe(70.0);
  });

  it('approximates criticalMatch and baselines the job-score metrics', () => {
    const shape = mapPipelineStatsToStatsShape(pipeline);
    // matched/new ratio = 20/50 -> 40%
    expect(shape.criticalMatch).toBe(40);
    // flaggedReview/signOffPending require job-level data this API lacks
    expect(shape.flaggedReview).toBe(0);
    expect(shape.signOffPending).toBe(0);
    // submitted maps from the closest API field
    expect(shape.submitted).toBe(15);
  });
});

describe('buildStatsShapeFromJobs', () => {
  const jobs: Job[] = [
    makeJob({ id: 'j1', ats_score: 95, status: 'new' }), // critical
    makeJob({ id: 'j2', ats_score: 90, status: 'matched' }), // critical (boundary)
    makeJob({ id: 'j3', ats_score: 85, status: 'scored' }), // flagged + signoff
    makeJob({ id: 'j4', ats_score: 80, status: 'scored' }), // flagged (boundary) + signoff
    makeJob({ id: 'j5', ats_score: 79, status: 'new' }), // neither
    makeJob({ id: 'j6', ats_score: undefined, status: 'applied' }), // submitted
    makeJob({ id: 'j7', status: 'interview' }), // submitted
    makeJob({ id: 'j8', status: 'offer' }), // submitted
    makeJob({ id: 'j9', status: 'scored' }), // signoff
  ];

  it('classifies ATS scores using the shared threshold constants', () => {
    const shape = buildStatsShapeFromJobs(jobs, null);
    expect(shape.criticalMatch).toBe(2); // 95, 90
    expect(shape.flaggedReview).toBe(2); // 85, 80
    expect(shape.signOffPending).toBe(3); // j3, j4, j9
    expect(shape.submitted).toBe(3); // applied, interview, offer
  });

  it('derives totals from the jobs array when pipeline stats are unavailable', () => {
    const shape = buildStatsShapeFromJobs(jobs, null);
    expect(shape.total_jobs).toBe(9);
    expect(shape.new).toBe(2); // j1, j5 have status 'new'
    expect(shape.avg_ats_score).toBeCloseTo((95 + 90 + 85 + 80 + 79) / 5, 5);
  });

  it('prefers pipeline stats for totals while keeping derived counts', () => {
    const pipeline: PipelineStatsResponse = {
      total_jobs: 134,
      new: 30,
      fetched: 0,
      matched: 0,
      scored: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      by_source: {},
      by_type: {},
      avg_ats_score: 68.0,
      avg_match_score: 0,
    };
    const shape = buildStatsShapeFromJobs(jobs, pipeline);
    expect(shape.total_jobs).toBe(134);
    expect(shape.new).toBe(30);
    expect(shape.avg_ats_score).toBe(68.0);
    // derived counts still come from job-level data
    expect(shape.criticalMatch).toBe(2);
    expect(shape.flaggedReview).toBe(2);
  });
});

describe('ATS threshold constants', () => {
  it('exposes 90 / 80 / 90 as the single source of truth', () => {
    expect(ATS_CRITICAL_MIN).toBe(90);
    expect(ATS_FLAGGED_MIN).toBe(80);
    expect(ATS_FLAGGED_MAX).toBe(90);
    expect(ATS_FLAGGED_MIN).toBeLessThan(ATS_CRITICAL_MIN);
  });
});

describe('METRICS_GLOSSARY', () => {
  it("documents the '2,557-fix' denominator standardisation", () => {
    const entry = METRICS_GLOSSARY['2,557-fix'];
    expect(entry).toBeDefined();
    expect(entry.description.length).toBeGreaterThan(0);
    expect(entry.fixedIn.length).toBeGreaterThan(0);
    expect(entry.fixedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry.before.length).toBeGreaterThan(0);
    expect(entry.after.length).toBeGreaterThan(0);
    expect(entry.impact.length).toBeGreaterThan(0);
  });
});
