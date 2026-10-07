# MERGE_DECISIONS — Current

Record integration/merge decisions here (or in the PR description), per `AGENTS.md` §1.

**Historical decisions (pre-consolidation):** `docs/archive/integration/MERGE_DECISIONS.md`.

---

## 2026-10-07 — C-sec5 / S7+S8+S9: pushed-history PII — DOCUMENTED ACCEPTANCE

**Decision:** Accept residual PII in pushed git history. No history rewrite (no R5 purge).

**Context:** Repository visibility is PRIVATE (NEW-Q1 answer, `repo-audit/OPEN_QUESTIONS.md`).
History contains: `.media/` certificates (17 files / 5.3 MB, added `579c7e7`, removed `1fe30bf`),
`profile/*.md` resume (same commits), one `user_profiles.jsonl` email value (removed `6ea0ea3`).
All are ancestors of `origin/main` but unreachable from HEAD.

**Acceptance rationale:** (a) exposure requires collaborator access to a private repo;
(b) an R5 history rewrite would invalidate every downstream SHA — breaking, and far above
this cleanup's risk budget.

**Conditions:**

1. Repository stays private. If visibility ever changes to public, this acceptance is void
   and an R5 purge becomes mandatory — revisit `repo-audit/SECURITY_AUDIT.md` S7–S9 first.
2. `.media/` remains gitignored (added `c71cea5`) so new certificate files cannot be tracked.
3. Live-tree PII removed independently: C-sec4 (bundle persona), C-sec6 (fixtures).

**Approval:** APPROVAL GATE 4 (PROTOCOL §9) — approved by repo owner 2026-10-07.

---

## 2026-10-07 — C-sec7 / S11: presence-only authorization signature — DOCUMENTED ACCEPTANCE

**Decision:** Accept presence-only (non-HMAC) `authorization_signature` on
`POST /api/v1/athena/ai/submit-application`; relabel wording instead of
implementing cryptographic verification.

**Context:** The endpoint requires a non-empty `authorization_signature`
but never verifies it (no HMAC, no key). The receipt's `confirmation_hash`
is a base64-derived opaque label, not a SHA-256 digest (DEF-009, historical).
Implementing real HMAC verification would change the submission contract
(receipts, modals, n8n webhooks) — above this cleanup's risk budget.

**Acceptance rationale:** (a) the endpoint already requires a valid
X-API-Key (S1/S2 fail-closed posture), so the signature is an attestation
field, not an auth control; (b) relabelling removes the false "cryptographic
receipt" claim without contract churn; (c) DEF-009 stays on the defect
register for a dedicated auth wave.

**Evidence:** `ec329ad` (docstring relabel), SECURITY_AUDIT S11 row.

---

## 2026-10-07 — C-sec7 / S14: interactive API docs — DEV-ONLY GATING

**Decision:** Serve `/docs`, `/redoc`, `/openapi.json` only when
`ATHENA_AUTH_MODE=open` (localhost-only dev posture); default `api_key`
mode returns 404. Removed the three prefixes from `_API_EXEMPT_PREFIXES`
(only `/health` remains exempt).

**Rationale:** Docs exposed the full API surface to unauthenticated,
unrate-limited discovery (S14). `ATHENA_AUTH_MODE=open` already encodes
"localhost-only development", making it the natural gate — no new env var.
Production deployments run `api_key` mode, so docs are unreachable.

**Evidence:** `f5ddc88`, `.env.example` AUTH_MODE block.

---

## 2026-10-07 — C-sec7 / S16: rate limiter keyed on socket IP — DEPLOY PREREQUISITE

**Decision:** No code change. Record as a mandatory pre-deployment step:
configure a trusted reverse proxy (or X-Forwarded-For handling) before any
non-loopback deployment, so the limiter keys on the real client IP.

**Rationale:** Today the backend binds loopback-only in practice (BFF
default `127.0.0.1`, S3), so raw-socket-IP keying is correct for the
current posture. The limiter only becomes spoofable behind an untrusted
proxy — a deployment-config concern, not a code defect.

**Evidence:** SECURITY_AUDIT S16 row (accepted, deploy prerequisite).
