"""Unit tests for Prometheus metrics text-format output.

The canonical TypeScript metrics registry lives at
``src/lib/athena/metrics-registry.ts`` (no dedicated unit test file yet;
verification approach documented in ``docs/METRICS_REGISTRY_GUIDE.md``).
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from athena.api.app import create_app
from athena.metrics.prometheus import _build_metrics, compute_conversion_rate
from athena.store import AthenaDB

OK = 200


def test_prometheus_metrics_format() -> None:
    """_build_metrics should produce valid Prometheus text-format output."""
    stats = {
        "total_jobs": 100,
        "new": 25,
        "conversion_rate": 75.0,
        "avg_ats_score": 72.5,
    }

    output = _build_metrics(stats)
    assert isinstance(output, str)
    assert "athena_jobs_total 100" in output
    assert "athena_jobs_new_total 25" in output
    assert "athena_conversion_rate 75" in output
    assert "athena_ats_score_mean 72.5" in output
    assert "# HELP" in output
    assert "# TYPE" in output


def test_compute_conversion_rate_zero_new_jobs() -> None:
    """new=0 must return 0.0 (2,557 Fix zero-guard, no division by zero)."""
    stats = {"criticalMatch": 45, "flaggedReview": 10, "new": 0}
    assert compute_conversion_rate(stats) == 0.0


def test_compute_conversion_rate_known_values() -> None:
    """(criticalMatch + flaggedReview) / new * 100 for known inputs."""
    stats = {"criticalMatch": 45, "flaggedReview": 10, "new": 100}
    assert compute_conversion_rate(stats) == pytest.approx(55.0)


def test_compute_conversion_rate_negative_or_missing_keys() -> None:
    """Negative or missing keys fall back to the safe 0.0 default."""
    assert compute_conversion_rate({}) == 0.0
    assert compute_conversion_rate({"new": -5}) == 0.0
    assert compute_conversion_rate({"criticalMatch": 45, "flaggedReview": 10, "new": -100}) == 0.0
    assert compute_conversion_rate({"new": 100}) == 0.0


def test_metrics_endpoint_format(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """The /metrics endpoint still serves valid Prometheus text format."""
    db = AthenaDB(base_dir=tmp_path / "athena")
    monkeypatch.setattr("athena.metrics.prometheus.athena_db", db)
    client = TestClient(create_app())

    response = client.get("/api/v1/athena/metrics")

    assert response.status_code == OK
    assert response.headers["Content-Type"].startswith("text/plain")
    output = response.text
    assert isinstance(output, str)
    assert "athena_jobs_total" in output
    assert "athena_jobs_new_total" in output
    assert "athena_conversion_rate" in output
    assert "athena_ats_score_mean" in output
    assert "# HELP" in output
    assert "# TYPE" in output
