"""Canonical ATS score thresholds.

Mirror of frontend `src/lib/athena/metrics-registry.ts`
(ATS_CRITICAL_MIN / ATS_FLAGGED_MIN / ATS_FLAGGED_MAX). Lives in models/ so
ats/, matching/, and ai/providers/ can import it without package cycles.
"""

ATS_CRITICAL_MIN = 90
ATS_FLAGGED_MIN = 80
ATS_FLAGGED_MAX = 90
