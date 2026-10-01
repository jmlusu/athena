"""
Prometheus-style metrics exposure for Athena.

Provides /metrics endpoint with standard metrics used across the dashboard.
All conversion rates use the "2,557 Fix" denominator convention:
stats.new (total new jobs discovered) as the standard denominator,
ensuring consistent "of the original cohort" semantics.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Response

from athena.store import athena_db

router = APIRouter(tags=["metrics"])


def _build_metrics(stats: dict[str, Any]) -> str:
    """Build Prometheus text-format metrics from stats dict."""
    lines: list[str] = []

    total_jobs = stats.get("total_jobs", 0)
    lines.append("# HELP athena_jobs_total Total number of jobs in the pipeline")
    lines.append("# TYPE athena_jobs_total counter")
    lines.append(f"athena_jobs_total {total_jobs}")

    new_total = stats.get("new", 0)
    lines.append("# HELP athena_jobs_new_total Total new jobs discovered")
    lines.append("# TYPE athena_jobs_new_total counter")
    lines.append(f"athena_jobs_new_total {new_total}")

    # Conversion rate using 2,557 Fix denominator (stats.new)
    conversion_rate = stats.get("conversion_rate", 0)
    lines.append("# HELP athena_conversion_rate Conversion rate from discovered stage")
    lines.append("# TYPE athena_conversion_rate gauge")
    lines.append(f"athena_conversion_rate {conversion_rate}")

    avg_ats = stats.get("avg_ats_score", 0)
    lines.append("# HELP athena_ats_score_mean Mean ATS score across all jobs")
    lines.append("# TYPE athena_ats_score_mean gauge")
    lines.append(f"athena_ats_score_mean {avg_ats}")

    return "\n".join(lines) + "\n"


def compute_conversion_rate(stats: dict) -> float:
    """Compute conversion rate using the 2,557 Fix denominator convention.

    The denominator is stats.new (total new jobs discovered), so the rate
    is (criticalMatch + flaggedReview) / new * 100. Returns 0 when
    stats.new is missing or <= 0.
    """
    new_jobs: float = stats.get("new", 0)
    critical_and_flagged: float = stats.get("criticalMatch", 0) + stats.get("flaggedReview", 0)
    if new_jobs > 0:
        return (critical_and_flagged / new_jobs) * 100
    return 0


@router.get("/metrics", include_in_schema=False)
async def prometheus_metrics_endpoint(response: Response) -> Response:
    """Prometheus metrics endpoint.

    Returns metrics in Prometheus text format for dashboard monitoring,
    alerting, and external system ingestion. Rates use the "2,557 Fix"
    denominator (stats.new) for consistent funnel analysis semantics.

    Endpoint is exempt from API-key auth and rate limiting so monitors
    can always scrape metrics.
    """
    # Get current pipeline stats
    stats = athena_db.get_pipeline_stats_dict()

    # Build conversion rate: critical + flagged over new jobs
    new_jobs = stats.get("new", 0)
    conversion_rate = compute_conversion_rate(stats)

    metrics_text = _build_metrics(
        {
            "total_jobs": stats.get("total_jobs", 0),
            "new": new_jobs,
            "conversion_rate": conversion_rate,
            "avg_ats_score": stats.get("avg_ats_score", 0),
        },
    )

    response.status_code = 200
    response.headers["Content-Type"] = "text/plain; version=0.0.4; charset=utf-8"
    response.body = metrics_text.encode("utf-8")
    return response
