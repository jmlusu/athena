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
    // No backend equivalent; these three drive quote building in the Documents
    // view. 0 and "" would render "USD 0/hr", so fall back to the SPA defaults.
    hourlyRateUsd: num(payload.hourlyRateUsd) || 85,
    expectedMonthlyMwk: num(payload.expectedMonthlyMwk) || 4500000,
    legalAuthorizedSigner: str(payload.legalAuthorizedSigner) || fullName,
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