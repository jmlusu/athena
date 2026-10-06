# Athena Metrics Registry — Team Usage Guide

> Canonical source: `src/lib/athena/metrics-registry.ts`
> Status: implemented and adopted by MetricsAndBarChart (2026-10-06)

## The one rule

**Never hand-roll metric math or ATS thresholds in a component.** If you need a
metric value, a conversion rate, a funnel stage, or an ATS classification, import
it from the registry. Duplicated inline math is exactly what this registry exists
to eliminate (see Roadmap Step 2, "2,557 Fix").

## Quick start

### 1. Build the stats shape for a component

You have a job list and (optionally) the backend pipeline stats response:

```tsx
import { buildStatsShapeFromJobs } from '@/lib/athena/metrics-registry';

const statsShape = buildStatsShapeFromJobs(jobs, stats);
return <MetricsAndBarChart stats={statsShape} ... />;
```

This is the preferred builder. It derives `criticalMatch`, `flaggedReview`,
`signOffPending`, and `submitted` from job-level data using the shared ATS
threshold constants, and falls back to `pipeline` stats for `total_jobs`, `new`,
and `avg_ats_score`.

### 2. API-response-only fallback

If you only have the `PipelineStatsAPI` response (no job list), use the
approximating mapper:

```ts
import { mapPipelineStatsToStatsShape } from '@/lib/athena/metrics-registry';

const statsShape = mapPipelineStatsToStatsShape(pipeline);
```

Caveat: this approximates `criticalMatch` from matched/new ratios and sets
`flaggedReview`/`signOffPending` to 0, because those fields do not exist in the
API payload. Prefer `buildStatsShapeFromJobs` when you have jobs.

## ATS thresholds (single source of truth)

```ts
import { ATS_CRITICAL_MIN, ATS_FLAGGED_MIN, ATS_FLAGGED_MAX } from '@/lib/athena/metrics-registry';
```

| Constant           | Value | Meaning                                  |
| ------------------ | ----- | ---------------------------------------- |
| `ATS_CRITICAL_MIN` | 90    | `score >= 90` → critical match (auto-apply eligible) |
| `ATS_FLAGGED_MIN`  | 80    | lower bound of the flagged-review range  |
| `ATS_FLAGGED_MAX`  | 90    | upper bound (exclusive): `score < 90`    |

Classification rule everywhere in the app:

- **Critical**: `atsScore >= ATS_CRITICAL_MIN`
- **Flagged**: `ATS_FLAGGED_MIN <= atsScore < ATS_FLAGGED_MAX`

Implemented in the registry itself (`buildStatsShapeFromJobs`):

```ts
const criticalMatch = jobs.filter((j) => j.atsScore >= ATS_CRITICAL_MIN).length;
const flaggedReview = jobs.filter((j) => j.atsScore >= ATS_FLAGGED_MIN && j.atsScore < ATS_FLAGGED_MAX).length;
```

Changing a threshold constant changes it everywhere. That is the point.

## Conversion rates — the "2,557 Fix"

All funnel conversion rates use **`stats.new` as the denominator** (the full
discovered cohort), never `matched`, `applied`, or an implicit default.

```ts
import { calculateConversionRate, calculateFunnelData } from '@/lib/athena/metrics-registry';

const rate = calculateConversionRate(count, stats); // (count / stats.new) * 100, 0 when new === 0
const funnel = calculateFunnelData(stats);          // 5 stages: Discovered → ATS Evaluated → Tailored → Submitted → Interview
```

Rules:

- Use `calculateConversionRate(numerator, stats)` — it enforces the denominator.
- Use `calculateConversionRateWithDenominator` only when the standard denominator
  is genuinely wrong for your question; justify it in a comment.
- The rationale and audit reference live in `METRICS_GLOSSARY['2,557-fix']`.

## Metric definitions and custom UIs

```ts
import { METRIC_DEFINITIONS, getMetricDefinition, getMetricValue } from '@/lib/athena/metrics-registry';

getMetricValue(stats, 'criticalMatch');          // typed lookup on StatsShape
getMetricDefinition('flagged');                  // name, description, formula, apiField, dataSource
METRIC_DEFINITIONS.forEach(/* render a metric card */);
```

Six canonical metric keys: `discovered`, `critical`, `flagged`, `signoff`,
`submitted`, `avg_ats`. `MetricKey` is deliberately distinct from `StatsShape`
field names (e.g. `discovered` → `stats.new`).

## `StatsShape` contract

`StatsShape` is the backward-compatible prop type expected by
`MetricsAndBarChart`. Do not rename fields or change types without updating all
dependents:

```
total_jobs, new, criticalMatch, flaggedReview, signOffPending, submitted, avg_ats_score
```

## Currently adopted by

| File | Uses |
|---|---|
| `src/components/charts/MetricsAndBarChart.tsx` | `calculateFunnelData`, `defaultFunnelData`, `buildStatsShapeFromJobs`, ATS constants |

## Backend counterpart — Prometheus endpoint

The backend exposes the same metrics for ops/monitoring:

```bash
curl http://127.0.0.1:8000/api/v1/athena/metrics
# → athena_jobs_total 134
# → athena_ats_score_mean 28.702...
```

Implementation: `backend/src/athena/metrics/prometheus.py` (mounted under the
`/api/v1/athena` prefix in `api/app.py`). Job counts come from
`store.get_pipeline_stats_dict()`.

## Verification

```bash
# Frontend typecheck (registry + all consumers)
npm run lint              # tsc --noEmit

# Backend metrics endpoint (server must be running)
curl http://127.0.0.1:8000/api/v1/athena/metrics
```

## Checklist for new code

1. Need a metric number? Import from the registry — don't filter arrays inline.
2. Need ATS classification? Use `ATS_CRITICAL_MIN` / `ATS_FLAGGED_MIN` / `ATS_FLAGGED_MAX`.
3. Need a rate? `calculateConversionRate(numerator, stats)` (denominator is `stats.new`).
4. Building a stats prop? `buildStatsShapeFromJobs(jobs, pipeline)`.
5. Added a new metric? Add it to `StatsShape` + `METRIC_DEFINITIONS` together,
   and update `MetricsAndBarChart` — keep the registry exhaustive.
