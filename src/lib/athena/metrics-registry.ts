import type { Opportunity } from "../../types";

export const ATS_CRITICAL_MIN = 90;
export const ATS_FLAGGED_MIN = 80;
export const ATS_FLAGGED_MAX = 90;

export interface PipelineStatsAPI {
  total_jobs: number;
  new: number;
  matched: number;
  tailored: number;
  applied: number;
  avg_ats_score: number;
}

export interface StatsShape {
  total_jobs: number;
  new: number;
  criticalMatch: number;
  flaggedReview: number;
  signOffPending: number;
  submitted: number;
  avg_ats_score: number;
  skills_distribution?: Array<{ label: string; count: number; percentage: number; color: string }>;
  pipeline_trend?: Array<{ stage: string; count: number }>;
}

export type MetricKey =
  | "discovered"
  | "critical"
  | "flagged"
  | "signoff"
  | "submitted"
  | "avg_ats";

export interface MetricDefinition {
  key: MetricKey;
  name: string;
  description: string;
  formula: string;
  apiField?: string;
  dataSource: "jobs" | "pipeline" | "derived";
}

export const METRIC_DEFINITIONS: ReadonlyArray<MetricDefinition> = [
  {
    key: "discovered",
    name: "Discovered",
    description: "Total jobs scraped across all sources",
    formula: "pipeline.new",
    apiField: "new",
    dataSource: "pipeline",
  },
  {
    key: "critical",
    name: "Critical Match (ATS ≥ 90)",
    description: "Jobs with ATS score ≥ 90 — auto-document eligible",
    formula: "count(jobs where ats_score >= ATS_CRITICAL_MIN)",
    dataSource: "jobs",
  },
  {
    key: "flagged",
    name: "Flagged Review (ATS 80–89)",
    description: "Jobs in flagged range requiring human review",
    formula: "count(jobs where ATS_FLAGGED_MIN <= ats_score < ATS_FLAGGED_MAX)",
    dataSource: "jobs",
  },
  {
    key: "signoff",
    name: "Awaiting Sign-Off",
    description: "Jobs pending human authorization",
    formula: "count(jobs where status === 'awaiting_signoff')",
    dataSource: "jobs",
  },
  {
    key: "submitted",
    name: "Submitted Proofs",
    description: "Jobs with signed receipt archived",
    formula: "count(jobs where status === 'submitted' OR receipt exists)",
    dataSource: "jobs",
  },
  {
    key: "avg_ats",
    name: "Average ATS Score",
    description: "Mean ATS score across discovered cohort",
    formula: "pipeline.avg_ats_score",
    apiField: "avg_ats_score",
    dataSource: "pipeline",
  },
] as const;

export function getMetricDefinition(key: MetricKey): MetricDefinition {
  const def = METRIC_DEFINITIONS.find((d) => d.key === key);
  if (!def) throw new Error(`Unknown metric key: ${key}`);
  return def;
}

export function getMetricValue(stats: StatsShape, key: MetricKey): number {
  switch (key) {
    case "discovered":
      return stats.new;
    case "critical":
      return stats.criticalMatch;
    case "flagged":
      return stats.flaggedReview;
    case "signoff":
      return stats.signOffPending;
    case "submitted":
      return stats.submitted;
    case "avg_ats":
      return stats.avg_ats_score;
  }
}

export function calculateConversionRate(
  numerator: number,
  stats: Pick<StatsShape, "new">,
): number {
  if (stats.new === 0) return 0;
  return Math.round((numerator / stats.new) * 100);
}

export function calculateFunnelData(stats: StatsShape): ReadonlyArray<{
  stage: string;
  count: number;
  rate: number;
}> {
  const denom = stats.new || 1;
  return [
    { stage: "Discovered", count: stats.new, rate: 100 },
    { stage: "ATS Evaluated", count: stats.criticalMatch + stats.flaggedReview, rate: calculateConversionRate(stats.criticalMatch + stats.flaggedReview, stats) },
    { stage: "Tailored", count: stats.criticalMatch, rate: calculateConversionRate(stats.criticalMatch, stats) },
    { stage: "Submitted", count: stats.submitted, rate: calculateConversionRate(stats.submitted, stats) },
    { stage: "Interview", count: 0, rate: 0 },
  ] as const;
}

export function buildStatsShapeFromJobs(
  jobs: ReadonlyArray<Opportunity>,
  pipeline?: Pick<PipelineStatsAPI, "total_jobs" | "avg_ats_score">,
): StatsShape {
  const criticalMatch = jobs.filter((j) => (j.atsScore ?? 0) >= ATS_CRITICAL_MIN).length;
  const flaggedReview = jobs.filter((j) => (j.atsScore ?? 0) >= ATS_FLAGGED_MIN && (j.atsScore ?? 0) < ATS_FLAGGED_MAX).length;
  const signOffPending = jobs.filter((j) => j.status === "awaiting_signoff").length;
  const submitted = jobs.filter((j) => j.status === "submitted" || Boolean(j.receipt)).length;
  const newCount = jobs.length;
  const avg_ats_score = pipeline?.avg_ats_score ?? (jobs.reduce((s, j) => s + (j.atsScore ?? 0), 0) / (newCount || 1));
  const total_jobs = pipeline?.total_jobs ?? newCount;

  return {
    total_jobs,
    new: newCount,
    criticalMatch,
    flaggedReview,
    signOffPending,
    submitted,
    avg_ats_score,
  };
}

export function mapPipelineStatsToStatsShape(pipeline: PipelineStatsAPI): StatsShape {
  const matched = pipeline.matched ?? 0;
  const criticalMatch = Math.round(matched * 0.35);
  const flaggedReview = Math.max(0, matched - criticalMatch);
  return {
    total_jobs: pipeline.total_jobs,
    new: pipeline.new,
    criticalMatch,
    flaggedReview,
    signOffPending: 0,
    submitted: pipeline.applied ?? 0,
    avg_ats_score: pipeline.avg_ats_score,
  };
}

export const defaultFunnelData = calculateFunnelData({
  total_jobs: 0,
  new: 0,
  criticalMatch: 0,
  flaggedReview: 0,
  signOffPending: 0,
  submitted: 0,
  avg_ats_score: 0,
});

export type { StatsShape as StatsShapeType };