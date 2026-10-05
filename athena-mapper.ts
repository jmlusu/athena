// Maps FastAPI's snake_case `Job` onto the SPA's camelCase `Opportunity`.
//
// This lives beside server.ts rather than inside it so node:test can import the
// mapper without booting Express -- importing server.ts would call app.listen()
// and hang the test runner.
//
// The JSONL store under company/athena/ is hand-editable and has produced null in
// optional fields before, so every read coerces rather than assuming well-formed
// input. A mapper that trusts its input reintroduces the crash it prevents.

import type {
  ApplicantProfile,
  Opportunity,
  OpportunityCategory,
  OpportunityPlatform,
  OpportunityScope,
  PipelineStatus,
} from "./src/types.ts";

export const SOURCE_PLATFORM: Record<string, OpportunityPlatform> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
  company_career: "Corporate",
  malawi_jobs: "MyJobo",
  malawi_work: "MalawiWork",
  jobs_malawi: "JobsMalawi",
  upwork: "Upwork",
  toptal: "Toptal",
  freelancer: "Freelancer",
  guru: "Guru",
  people_per_hour: "PeoplePerHour",
  remote_ok: "RemoteOK",
  we_work_remotely: "WeWorkRemotely",
  remote_co: "Remote.co",
  other: "Other",
};

// JobStatus has 10 members, PipelineStatus 7. `rejected` and `archived` collapse
// into `evaluated` on purpose: the frontend has no rejected state, and the reason
// every job is currently rejected is tracked separately (spec Q1/Q2). Folding them
// into `awaiting_signoff` would be worse -- it invites a human to sign off on a
// role the engine already declined.
export const STATUS_MAP: Record<string, PipelineStatus> = {
  new: "discovered",
  fetched: "evaluated",
  matched: "evaluated",
  scored: "tailored",
  flagged: "awaiting_signoff",
  applied: "submitted",
  interview: "interview",
  offer: "offer",
  rejected: "evaluated",
  archived: "evaluated",
};

// UI bands stay at >=90 auto-generate / 80-89 flagged even though real scores
// currently top out at 57.5 (spec: thresholds deliberately unchanged).
const ATS_AUTO_GENERATE = 90;
const ATS_FLAGGED = 80;

export function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

// Lilongwe-local only when the location names Lilongwe without advertising remote
// work; a Lilongwe role that is remote is lilongwe-remote; everything else is
// international-remote.
export function deriveScope(location: string): OpportunityScope {
  const text = location.toLowerCase();
  if (!text.includes("lilongwe")) return "international-remote";
  return text.includes("remote") ? "lilongwe-remote" : "lilongwe-local";
}

export function deriveCategory(jobType: string): OpportunityCategory {
  return jobType === "consultancy" ? "consultancy" : "job";
}

export function toOpportunity(job: Record<string, unknown>): Opportunity {
  const location = str(job.location) || "Not specified";
  const atsScore = num(job.ats_score);
  const platform = SOURCE_PLATFORM[str(job.source)];
  // `keywords` is the only place a scraped job records its skill tags; JSONL rows
  // often carry an empty `requirements` list, so fall back or the detail modal
  // renders empty.
  const requirements = strArray(job.requirements);
  const keywordTags = strArray(job.keywords);

  return {
    id: str(job.id),
    title: str(job.title) || "Untitled role",
    company: str(job.company) || "Unknown employer",
    location,
    category: deriveCategory(str(job.job_type)),
    scope: deriveScope(location),
    platform: platform ?? "Corporate",
    description: str(job.description),
    requirements: requirements.length > 0 ? requirements : keywordTags,
    salaryOrBudget: str(job.salary_range) || "Not disclosed",
    deadline: str(job.expiry_date),
    atsScore,
    postedDate: str(job.posted_date) || str(job.scraped_at),
    status: STATUS_MAP[str(job.status)] ?? "discovered",
    isFlagged: atsScore >= ATS_FLAGGED && atsScore < ATS_AUTO_GENERATE,
  };
}

export function toOpportunityList(payload: unknown): Opportunity[] {
  const jobs = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { jobs?: unknown })?.jobs)
      ? ((payload as { jobs: unknown[] }).jobs as unknown[])
      : [];
  return jobs
    .filter((job): job is Record<string, unknown> => typeof job === "object" && job !== null)
    .map(toOpportunity);
}

// ── Profile ──────────────────────────────────────────────────────────────
//
// The backend profile and the SPA's ApplicantProfile disagree on shape, and the
// gap is not cosmetic: backend `skills` is a list of objects
// ({name, level, years_experience, category}) where the SPA expects string[].
// Casting the raw response to ApplicantProfile -- which is what listProfiles()
// used to do -- makes React throw "Objects are not valid as a React child" the
// moment a view renders a skill chip. So profiles get mapped, not asserted.
//
// Note the BFF camelCases only top-level keys, so nested fields stay snake_case.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2023-11-01T00:00:00Z" -> "Nov 2023"; unparseable input -> "". */
export function formatMonthYear(value: unknown): string {
  const text = str(value);
  if (!text) return "";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${MONTHS[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
}

/** Current roles read "Nov 2023 - Present"; closed roles read the end month. */
export function formatPeriod(startDate: unknown, endDate: unknown, isCurrent: unknown): string {
  const start = formatMonthYear(startDate);
  const end = formatMonthYear(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start && (isCurrent === true || endDate === null)) return `${start} - Present`;
  return start || end;
}

/** Accepts both "AI Strategy" and {name: "AI Strategy"} so either side is safe. */
function toSkillName(skill: unknown): string {
  if (typeof skill === "string") return skill;
  if (typeof skill === "object" && skill !== null) {
    return str((skill as { name?: unknown }).name);
  }
  return "";
}

export function toSkillList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(toSkillName).filter((name) => name.length > 0);
}

function toExperienceList(value: unknown): ApplicantProfile["experience"] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const description = str(item.description);
      const bullets = strArray(item.achievements);
      return {
        // Backend calls it `title`; the SPA labels the same field `role`.
        role: str(item.title) || description || "Role not specified",
        company: str(item.company) || "Employer not specified",
        period: formatPeriod(item.start_date, item.end_date, item.current),
        location: str(item.location) || "Not specified",
        // Achievements are the substance; the summary line only earns its place
        // when it says something the bullets do not.
        bullets: bullets.length > 0 ? bullets : description ? [description] : [],
      };
    });
}

function toEducationList(value: unknown): ApplicantProfile["education"] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      // `honors` is dropped on purpose: the SPA's Education type has no field for
      // it, and widening the type for a value no reader renders is not worth it.
      const degree = str(item.degree);
      const field = str(item.field_of_study);
      // Many degrees already name their field ("MSc in Chemical Engineering"), so
      // appending it unconditionally renders the subject twice.
      const mentionsField = field !== "" && degree.toLowerCase().includes(field.toLowerCase());
      return {
        degree:
          [degree, mentionsField ? "" : field].filter(Boolean).join(", ") ||
          "Qualification not specified",
        institution: str(item.institution) || "Institution not specified",
        year: formatMonthYear(item.end_date) || formatMonthYear(item.start_date),
      };
    });
}

export function toApplicantProfile(payload: Record<string, unknown>): ApplicantProfile {
  const fullName = str(payload.fullName) || str(payload.full_name);
  const certifications = strArray(payload.certifications);

  return {
    id: str(payload.id) || "unknown",
    fullName: fullName || "Name not specified",
    email: str(payload.email),
    phone: str(payload.phone),
    location: str(payload.location) || "Not specified",
    headline: str(payload.headline),
    summary: str(payload.summary),
    skills: toSkillList(payload.skills),
    experience: toExperienceList(payload.experience),
    education: toEducationList(payload.education),
    certifications,
    // Quote inputs for the Documents view. The BFF hands this mapper the raw
    // snake_case body, so both spellings are read and the SPA defaults survive
    // a profile that predates the fields or stores them as empty.
    hourlyRateUsd: num(payload.hourlyRateUsd) || num(payload.hourly_rate_usd) || 85,
    expectedMonthlyMwk:
      num(payload.expectedMonthlyMwk) || num(payload.expected_monthly_mwk) || 4500000,
    legalAuthorizedSigner:
      str(payload.legalAuthorizedSigner) || str(payload.legal_authorized_signer) || fullName,
  };
}

export function toApplicantProfileList(payload: unknown): ApplicantProfile[] {
  const profiles = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { profiles?: unknown })?.profiles)
      ? ((payload as { profiles: unknown[] }).profiles as unknown[])
      : [];
  return profiles
    .filter(
      (item): item is Record<string, unknown> => typeof item === "object" && item !== null
    )
    .map(toApplicantProfile);
}

// ── Profile: SPA -> backend ─────────────────────────────────────────────
//
// toApplicantProfile's inverse, and it has to exist because the BFF snake_cases
// request bodies at the top level only (snakeCaseKeys in server.ts). Nested
// structures therefore reach FastAPI still in SPA shape, and FastAPI rejects
// them: `skills: ["Strategy"]` is not a list[Skill], `experience[].role` is not
// Experience.title, `education[].year` carries no field_of_study. Every PUT was
// answering 422. The response mapper solved this gap in the other direction;
// this honours the same contract on the way back in.
//
// Round-trip notes, all deliberate:
//   - Skill.level/years_experience/category are unrecoverable: toSkillList
//     already collapses each skill to its name on read, so there is nothing
//     left to send back.
//   - education.field_of_study is written as "" because the SPA has no field
//     for it, and an empty string keeps toEducationList's `mentionsField` false
//     so the degree string it returns is byte-identical to what we sent.
//   - A bare year reads back as "Jan YYYY": the backend models a degree's end
//     as a datetime and the SPA renders it through formatMonthYear. The SPA
//     form does not edit this field, so nothing a user typed is rewritten.

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  MONTHS.map((name, index) => [name.toLowerCase(), index])
);

/** Sentinel for a period the parser cannot read. Only reachable from hand-edited JSONL; the Profile form never exposes `period`. */
const UNPARSEABLE_PERIOD_DATE = "1970-01-01T00:00:00Z";

/** "Nov 2023" -> "2023-11-01T00:00:00Z"; "2023" -> "2023-01-01T00:00:00Z"; ISO passes through; anything else -> null. */
export function toIsoDate(value: unknown): string | null {
  const text = str(value).trim();
  if (!text) return null;
  // Already ISO. Checked before the year-only branch, which would otherwise
  // swallow the leading four digits of a full timestamp.
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text;
  const monthYear = /^([A-Za-z]{3})\s+(\d{4})$/.exec(text);
  if (monthYear) {
    const month = MONTH_INDEX[monthYear[1].toLowerCase()];
    if (month === undefined) return null;
    return `${monthYear[2]}-${String(month + 1).padStart(2, "0")}-01T00:00:00Z`;
  }
  const yearOnly = /^(\d{4})$/.exec(text);
  if (yearOnly) return `${yearOnly[1]}-01-01T00:00:00Z`;
  return null;
}

/** Splits the `formatPeriod` string back into the three fields Experience stores. */
export function parsePeriod(period: unknown): {
  startDate: string;
  endDate: string | null;
  current: boolean;
} {
  const text = str(period).trim();
  if (!text) {
    return { startDate: UNPARSEABLE_PERIOD_DATE, endDate: null, current: false };
  }
  const [rawStart = "", rawEnd = ""] = text.split(/\s+-\s+/).map((part) => part.trim());
  const current = rawEnd === "" || /^present$/i.test(rawEnd);

  const start = toIsoDate(rawStart);
  const end = current ? null : toIsoDate(rawEnd);
  // start_date is required with no default, so a date is always supplied: the
  // parsed start if we have it, else the parsed end, else the sentinel.
  return {
    startDate: start ?? end ?? UNPARSEABLE_PERIOD_DATE,
    endDate: end,
    current,
  };
}

/**
 * SPA `ApplicantProfile` -> the body FastAPI's `UserProfileRequest` accepts.
 * Returns snake_case directly: snakeCaseKeys is a no-op on it, and routing it
 * through a second transform would only risk double-conversion.
 */
export function toBackendProfile(profile: ApplicantProfile): Record<string, unknown> {
  const source = (profile ?? {}) as Partial<ApplicantProfile>;

  return {
    email: str(source.email),
    full_name: str(source.fullName),
    phone: str(source.phone),
    location: str(source.location),
    headline: str(source.headline),
    summary: str(source.summary),
    skills: strArray(source.skills).map((name) => ({ name })),
    experience: (source.experience ?? []).map((item) => {
      const bullets = strArray(item.bullets);
      const { startDate, endDate, current } = parsePeriod(item.period);
      return {
        title: str(item.role),
        company: str(item.company),
        location: str(item.location),
        start_date: startDate,
        end_date: endDate,
        current,
        // Experience.description is a required str with no default. Joining the
        // bullets keeps it non-empty without inventing prose, and toExperienceList
        // prefers `achievements` on the way back so the join is never rendered.
        description: bullets.join(". "),
        achievements: bullets,
      };
    }),
    education: (source.education ?? []).map((item) => ({
      institution: str(item.institution),
      degree: str(item.degree),
      field_of_study: "",
      end_date: toIsoDate(item.year),
      start_date: null,
    })),
    certifications: strArray(source.certifications),
    hourly_rate_usd: num(source.hourlyRateUsd) || null,
    expected_monthly_mwk: num(source.expectedMonthlyMwk) || null,
    legal_authorized_signer: str(source.legalAuthorizedSigner) || null,
  };
}

/**
 * The only UserProfile fields the Applicant Profile form can actually change.
 * Everything else FastAPI's model carries -- search `preferences`, uploaded
 * `documents`, `languages`, the url fields, `resume_base`, `summary`,
 * `certifications`, every nested id/date/category, and `created_at` -- has no
 * editor anywhere in the SPA.
 *
 * PUT is a full replace, so forwarding `toBackendProfile()` straight through
 * silently rewrites a real profile at ~55% of its original size: a measured
 * round-trip on a live profile dropped 18 documents, 2 languages, 231 search
 * keywords, 5 experience `skills_used` lists, both `field_of_study` values and
 * all 43 skill categories.
 */
const PROFILE_FORM_FIELDS = new Set([
  "full_name",
  "email",
  "phone",
  "location",
  "headline",
  "legal_authorized_signer",
  "hourly_rate_usd",
  "expected_monthly_mwk",
]);

/** Backend entries keyed by skill name, so metadata survives a name edit. */
function indexSkillsByName(raw: unknown): Map<string, Record<string, unknown>> {
  const byName = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(raw)) return byName;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const name = str((entry as Record<string, unknown>).name).trim();
    if (name) byName.set(name, entry as Record<string, unknown>);
  }
  return byName;
}

/**
 * The form owns the *set* of skill names and nothing else about them.
 * A name that survives keeps the backend's `category`/`level`/
 * `years_experience`; a removed name is dropped; a newly added name starts
 * bare. A patch without a `skills` array leaves the backend's list alone.
 */
function mergeSkills(current: unknown, patch: unknown): unknown[] {
  const byName = indexSkillsByName(current);
  if (!Array.isArray(patch)) return [...byName.values()];
  const seen = new Set<string>();
  const merged: Record<string, unknown>[] = [];
  for (const entry of patch) {
    const raw = typeof entry === "string" ? entry : str((entry as Record<string, unknown> | null)?.name);
    const name = raw.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    merged.push(byName.get(name) ?? { name });
  }
  return merged;
}

/**
 * Folds an SPA profile write into the profile already stored, instead of
 * letting PUT replace it wholesale.
 *
 * `current` is the raw snake_case body a GET returned from FastAPI; `patch`
 * is what `toBackendProfile()` produced for this save. The form's own fields
 * come from the patch, every other key survives untouched. With no `current`
 * (create, or the profile does not exist yet) the patch stands alone.
 */
export function mergeProfilePatch(
  current: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>
): Record<string, unknown> {
  if (!current || typeof current !== "object") return patch;
  const merged: Record<string, unknown> = { ...current };
  for (const key of PROFILE_FORM_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) merged[key] = patch[key];
  }
  merged.skills = mergeSkills(current.skills, patch.skills);
  return merged;
}