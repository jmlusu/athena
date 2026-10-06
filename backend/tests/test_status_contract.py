"""Cross-language status-map contract.

`models/status_mapping.py` JOB_TO_PIPELINE_STATUS is canonical; the frontend's
`athena-mapper.ts` STATUS_MAP (repo root) is derived and must match it exactly.
This test parses the TS block directly, so a one-sided edit fails CI on the
other side instead of drifting silently (D1 / NEW-Q2 ruling: option (a)).
"""

import re
from pathlib import Path

from athena.models import JobStatus
from athena.models.status_mapping import JOB_TO_PIPELINE_STATUS, job_to_pipeline_status

TS_MAPPER = Path(__file__).resolve().parents[2] / "athena-mapper.ts"


def parse_ts_status_map() -> dict[str, str]:
    text = TS_MAPPER.read_text(encoding="utf-8")
    match = re.search(r"export const STATUS_MAP[^{]*\{(.*?)\}", text, re.DOTALL)
    assert match, "STATUS_MAP block not found in athena-mapper.ts"
    return dict(re.findall(r'(\w+):\s*"(\w+)"', match.group(1)))


def test_ts_status_map_matches_canonical_python_map():
    ts_map = parse_ts_status_map()
    canonical = {status.value: job_to_pipeline_status(status) for status in JobStatus}
    assert ts_map == canonical, (
        "athena-mapper.ts STATUS_MAP diverged from canonical JOB_TO_PIPELINE_STATUS: "
        f"ts_only={ {k: v for k, v in ts_map.items() if canonical.get(k) != v} } "
        f"py_only={ {k: v for k, v in canonical.items() if ts_map.get(k) != v} }"
    )


def test_contract_covers_every_job_status():
    ts_map = parse_ts_status_map()
    assert set(ts_map) == {status.value for status in JobStatus}
    assert len(JOB_TO_PIPELINE_STATUS) == len(list(JobStatus))
