"""Canonical timezone policy for Athena.

Every datetime that crosses a boundary in Athena (model fields, API schemas,
JSONL persistence, sort keys) must be timezone-aware and expressed in UTC:

- naive values are treated as legacy UTC (``datetime.utcnow()``-era writes) and
  get ``tzinfo=UTC`` attached;
- aware values are converted with ``astimezone(UTC)``;
- values that are not datetimes are returned unchanged so Pydantic raises its
  own validation error instead of a misleading one from this module.

Use ``UTCDateTime`` on every datetime field so the policy is enforced at
validation time regardless of where the value came from (model construction,
JSONL load, request body, or a re-validating update path).
"""

from datetime import UTC, datetime
from typing import Annotated

from pydantic import AfterValidator


def ensure_utc(value: datetime) -> datetime:
    """Return ``value`` as an aware UTC datetime."""
    if not isinstance(value, datetime):
        return value  # type: ignore[return-value]
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


#: Datetime field annotation that enforces the aware-UTC policy on validation.
UTCDateTime = Annotated[datetime, AfterValidator(ensure_utc)]


def utc_now() -> datetime:
    """Current time as an aware UTC datetime (the only "now" Athena uses)."""
    return datetime.now(UTC)


def sort_key_utc(value: datetime | None) -> datetime:
    """Total-order sort key that tolerates naive, aware, or missing values.

    Sort keys must never raise: a single legacy naive timestamp must not be
    able to take down a list endpoint.
    """
    if value is None:
        return datetime.min.replace(tzinfo=UTC)
    return ensure_utc(value)
