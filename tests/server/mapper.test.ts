import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  toOpportunity,
  toOpportunityList,
  toApplicantProfile,
  toApplicantProfileList,
  toSkillList,
  formatMonthYear,
  formatPeriod,
  deriveScope,
  deriveCategory,
  str,
  num,
  strArray,
  SOURCE_PLATFORM,
  STATUS_MAP,
} from "../../athena-mapper.ts";

// Mirrors a real row from company/athena/jobs.jsonl.
const REAL_JOB = {
  id: "6033fa19-3506-43c2-bae0-357f8098ea7d",
  source: "remote_ok",
  source_job_id: "1137224",
  title: "AI Engineer Data APIs",
  company: "Benzinga",
  location: "Remote",
  job_type: "full_time",
  description: "Remote - apply with a Loom video walkthrough.",
  requirements: [],
  responsibilities: [],
  keywords: ["golang", "video", "engineer"],
  salary_range: null,
  posted_date: "2026-08-30T21:00:01+00:00",
  expiry_date: null,
  application_url: "https://remoteok.com/remote-jobs/x",
  ats_score: 36.2,
  match_score: 69.0261721611023,
  match_tier: "poor",
  status: "fetched",
  scraped_at: "2026-10-03T12:01:32.367494+00:00",
  updated_at: "2026-10-03T12:11:09.739313+00:00",
  metadata: {},
};

// Every JobSource member in backend/src/athena/models/enums.py.
const ALL_SOURCES = [
  "linkedin",
  "indeed",
  "glassdoor",
  "company_career",
  "malawi_jobs",
  "malawi_work",
  "jobs_malawi",
  "upwork",
  "toptal",
  "freelancer",
  "guru",
  "people_per_hour",
  "remote_ok",
  "we_work_remotely",
  "remote_co",
  "other",
];

// Every JobStatus member in backend/src/athena/models/enums.py.
const ALL_STATUSES = [
  "new",
  "fetched",
  "matched",
  "scored",
  "applied",
  "flagged",
  "interview",
  "offer",
  "rejected",
  "archived",
];

describe("coercers", () => {
  test("str returns empty for null, undefined, objects and arrays", () => {
    for (const bad of [null, undefined, {}, [], () => {}, Symbol("s")]) {
      assert.equal(str(bad), "");
    }
  });

  test("str passes through strings and stringifies primitives", () => {
    assert.equal(str("hello"), "hello");
    assert.equal(str(42), "42");
    assert.equal(str(false), "false");
  });

  test("num returns 0 for junk and parses numeric strings", () => {
    assert.equal(num(null), 0);
    assert.equal(num(undefined), 0);
    assert.equal(num(""), 0);
    assert.equal(num("abc"), 0);
    assert.equal(num(Number.NaN), 0);
    assert.equal(Number.POSITIVE_INFINITY === num(Number.POSITIVE_INFINITY), false);
    assert.equal(num("88.5"), 88.5);
    assert.equal(num(57.5), 57.5);
  });

  test("strArray filters non-strings and empties", () => {
    assert.deepEqual(strArray(["a", "", 1, null, "b"]), ["a", "b"]);
    assert.deepEqual(strArray("not an array"), []);
    assert.deepEqual(strArray(null), []);
  });
});

describe("deriveScope", () => {
  test("names Lilongwe without remote as local", () => {
    assert.equal(deriveScope("Lilongwe, Malawi"), "lilongwe-local");
    assert.equal(deriveScope("Lilongwe City Centre"), "lilongwe-local");
  });

  test("treats a Lilongwe role advertising remote work as lilongwe-remote", () => {
    assert.equal(deriveScope("Lilongwe (100% Remote)"), "lilongwe-remote");
    assert.equal(deriveScope("Lilongwe, Malawi (Remote)"), "lilongwe-remote");
  });

  test("treats everything else as international-remote", () => {
    assert.equal(deriveScope("Remote"), "international-remote");
    assert.equal(deriveScope("Greater London,"), "international-remote");
    assert.equal(deriveScope(""), "international-remote");
  });

  test("is case insensitive", () => {
    assert.equal(deriveScope("LILONGWE"), "lilongwe-local");
  });
});

describe("deriveCategory", () => {
  test("only consultancy maps to consultancy", () => {
    assert.equal(deriveCategory("consultancy"), "consultancy");
    assert.equal(deriveCategory("full_time"), "job");
    assert.equal(deriveCategory("contract"), "job");
    assert.equal(deriveCategory(""), "job");
  });
});

describe("enum coverage", () => {
  test("SOURCE_PLATFORM covers all 16 JobSource members", () => {
    for (const source of ALL_SOURCES) {
      assert.ok(SOURCE_PLATFORM[source], `missing platform for source "${source}"`);
    }
    assert.equal(Object.keys(SOURCE_PLATFORM).length, ALL_SOURCES.length);
  });

  test("STATUS_MAP covers all 10 JobStatus members", () => {
    for (const status of ALL_STATUSES) {
      assert.ok(STATUS_MAP[status], `missing pipeline status for "${status}"`);
    }
    assert.equal(Object.keys(STATUS_MAP).length, ALL_STATUSES.length);
  });

  test("rejected and archived collapse to evaluated, never to awaiting_signoff", () => {
    assert.equal(STATUS_MAP.rejected, "evaluated");
    assert.equal(STATUS_MAP.archived, "evaluated");
  });

  test("an unrecognised source falls back to Corporate", () => {
    assert.equal(toOpportunity({ source: "some_new_board" }).platform, "Corporate");
    assert.equal(toOpportunity({}).platform, "Corporate");
  });
});

describe("toOpportunity field mapping", () => {
  test("maps a real JSONL row", () => {
    const opp = toOpportunity(REAL_JOB);
    assert.equal(opp.id, REAL_JOB.id);
    assert.equal(opp.title, "AI Engineer Data APIs");
    assert.equal(opp.company, "Benzinga");
    assert.equal(opp.location, "Remote");
    assert.equal(opp.category, "job");
    assert.equal(opp.scope, "international-remote");
    assert.equal(opp.platform, "RemoteOK");
    assert.equal(opp.atsScore, 36.2);
    assert.equal(opp.postedDate, "2026-08-30T21:00:01+00:00");
    assert.equal(opp.status, "evaluated");
    assert.equal(opp.isFlagged, false);
  });

  test("falls back to keywords when requirements is empty", () => {
    const opp = toOpportunity(REAL_JOB);
    assert.deepEqual(opp.requirements, ["golang", "video", "engineer"]);
  });

  test("prefers requirements over keywords when both are present", () => {
    const opp = toOpportunity({ requirements: ["React"], keywords: ["golang"] });
    assert.deepEqual(opp.requirements, ["React"]);
  });

  test("null optional fields become display-safe defaults", () => {
    const opp = toOpportunity({ salary_range: null, expiry_date: null, description: null });
    assert.equal(opp.salaryOrBudget, "Not disclosed");
    assert.equal(opp.deadline, "");
    assert.equal(opp.description, "");
  });

  test("title and company fall back rather than rendering blank", () => {
    const opp = toOpportunity({});
    assert.equal(opp.title, "Untitled role");
    assert.equal(opp.company, "Unknown employer");
    assert.equal(opp.location, "Not specified");
  });

  test("postedDate falls back to scraped_at", () => {
    assert.equal(toOpportunity({ scraped_at: "2026-10-03T12:00:00Z" }).postedDate, "2026-10-03T12:00:00Z");
  });

  test("an entirely empty job still yields every required field", () => {
    const opp = toOpportunity({});
    for (const [key, value] of Object.entries(opp)) {
      assert.notEqual(value, undefined, `${key} is undefined`);
    }
    assert.deepEqual(opp.requirements, []);
    assert.equal(opp.atsScore, 0);
    assert.equal(opp.status, "discovered");
  });

  test("a null job does not throw", () => {
    assert.equal(toOpportunity({ id: null, source: null, status: null }).platform, "Corporate");
  });
});

describe("isFlagged bands", () => {
  test("flags 80-89 and leaves everything else alone", () => {
    assert.equal(toOpportunity({ ats_score: 80 }).isFlagged, true);
    assert.equal(toOpportunity({ ats_score: 89.9 }).isFlagged, true);
    assert.equal(toOpportunity({ ats_score: 79.9 }).isFlagged, false);
    assert.equal(toOpportunity({ ats_score: 90 }).isFlagged, false);
    assert.equal(toOpportunity({ ats_score: 57.5 }).isFlagged, false);
    assert.equal(toOpportunity({}).isFlagged, false);
  });
});

describe("toOpportunityList", () => {
  test("unwraps the { jobs, total } envelope", () => {
    assert.equal(toOpportunityList({ jobs: [REAL_JOB], total: 1 }).length, 1);
  });

  test("accepts a bare array", () => {
    assert.equal(toOpportunityList([REAL_JOB]).length, 1);
  });

  test("returns an empty array for junk instead of throwing", () => {
    for (const junk of [null, undefined, {}, "nope", 42, { jobs: null }]) {
      assert.deepEqual(toOpportunityList(junk), []);
    }
  });

  test("drops non-object entries rather than crashing on them", () => {
    const list = toOpportunityList({ jobs: [REAL_JOB, null, "x", 7] });
    assert.equal(list.length, 1);
  });
});

describe("regression: synthesized fallback payloads are not real jobs", () => {
  // /api/ai/scrape-live returns these when no Gemini key is configured. They must
  // never be reachable through the real /scrape path again.
  const SYNTHESIZED = {
    id: "job-mw-101",
    title: "Senior Digital Systems & M&E Specialist",
    company: "USAID Malawi / Global Health Supply Project",
    atsScore: 94,
    category: "job",
    scope: "lilongwe-local",
    platform: "ReliefWeb",
  };

  test("the id is recognisable as synthesized, not scraped", () => {
    assert.match(SYNTHESIZED.id, /^job-mw-\d+$|^job-intl-\d+$/);
  });

  test("a synthesized payload loses its camelCase scores through the mapper", () => {
    // The mapper reads snake_case. A camelCase payload yields atsScore 0, which
    // is how a real-but-wrong payload fails loudly instead of scoring 94.
    const opp = toOpportunity(SYNTHESIZED);
    assert.equal(opp.atsScore, 0);
    assert.notEqual(opp.atsScore, SYNTHESIZED.atsScore);
  });

  test("a synthesized payload has no snake_case status so it lands on discovered", () => {
    assert.equal(toOpportunity(SYNTHESIZED).status, "discovered");
  });
});
describe("profile mapping", () => {
  // Trimmed from the live profile at company/athena/profiles.jsonl.
  const RAW = {
    id: "d974bf19",
    email: "jmlusu@gmail.com",
    fullName: 'Jacob Raymond "Jack" Mlusu',
    phone: "(+265) 0980016004",
    location: "Lilongwe, Malawi / Remote",
    headline: "Digital Transformation Executive",
    summary: "Strategy and digital transformation executive.",
    skills: [
      { name: "AI Strategy", level: null, years_experience: null, category: "AI" },
      { name: "Data Architecture", level: "expert", years_experience: 12, category: "Data" },
    ],
    experience: [
      {
        title: "Founder / Digital Transformation Lead",
        company: "Lightspeed Holdings Limited",
        location: "Lilongwe, Malawi",
        start_date: "2023-11-01T00:00:00Z",
        end_date: null,
        current: true,
        description: "Founder",
        achievements: ["Founded an AI workflow venture.", "Building a data platform."],
        skills_used: ["AI Strategy"],
      },
      {
        title: "Head of IT",
        company: "Ministry",
        start_date: "2015-01-01T00:00:00Z",
        end_date: "2019-06-30T00:00:00Z",
        achievements: [],
        description: "",
      },
    ],
    education: [
      {
        institution: "Howard University",
        degree: "Master of Science",
        field_of_study: "Chemical Engineering",
        start_date: null,
        end_date: "2011-12-14T00:00:00Z",
      },
    ],
    certifications: ["Google AI Essentials (Google, 2025)"],
  };

  test("skills become strings, never objects", () => {
    // This is the regression: React threw "Objects are not valid as a React
    // child" because a skill object reached a chip as {skill}.
    const skills = toApplicantProfile(RAW).skills;
    assert.deepEqual(skills, ["AI Strategy", "Data Architecture"]);
    for (const skill of skills) assert.equal(typeof skill, "string");
  });

  test("a string[] skills payload still passes through unchanged", () => {
    assert.deepEqual(toSkillList(["n8n", "PostgreSQL"]), ["n8n", "PostgreSQL"]);
  });

  test("unnamed skill objects are dropped rather than rendered as [object]", () => {
    assert.deepEqual(toSkillList([{ name: "AI" }, { level: "expert" }, "n8n"]), ["AI", "n8n"]);
  });

  test("full_name is accepted when the BFF has not camelCased it", () => {
    const profile = toApplicantProfile({ ...RAW, fullName: undefined, full_name: "Fallback Name" });
    assert.equal(profile.fullName, "Fallback Name");
  });

  test("experience title maps to role and achievements become bullets", () => {
    const [current, past] = toApplicantProfile(RAW).experience;
    assert.equal(current.role, "Founder / Digital Transformation Lead");
    assert.deepEqual(current.bullets, ["Founded an AI workflow venture.", "Building a data platform."]);
    assert.equal(current.period, "Nov 2023 - Present");
    assert.equal(past.period, "Jan 2015 - Jun 2019");
    assert.equal(past.location, "Not specified");
  });

  test("an experience entry with no achievements falls back to its description", () => {
    const entry = { title: "Consultant", achievements: [], description: "Advised on strategy." };
    const mapped = toApplicantProfile({ ...RAW, experience: [entry] }).experience[0];
    assert.deepEqual(mapped.bullets, ["Advised on strategy."]);
  });

  test("education joins degree and field, and derives the year", () => {
    const [entry] = toApplicantProfile(RAW).education;
    assert.equal(entry.degree, "Master of Science, Chemical Engineering");
    assert.equal(entry.institution, "Howard University");
    assert.equal(entry.year, "Dec 2011");
  });

  test("a degree that already names its field is not repeated", () => {
    const [entry] = toApplicantProfile({
      ...RAW,
      education: [{ degree: "MSc in Chemical Engineering", field_of_study: "Chemical Engineering" }],
    }).education;
    assert.equal(entry.degree, "MSc in Chemical Engineering");
  });

  test("unsupported calendar values yield an empty string, not Invalid Date", () => {
    assert.equal(formatMonthYear("not-a-date"), "");
    assert.equal(formatMonthYear(null), "");
    assert.equal(formatPeriod("2023-11-01T00:00:00Z", null, true), "Nov 2023 - Present");
  });

  test("fields with no backend source fall back to the SPA defaults", () => {
    const profile = toApplicantProfile(RAW);
    assert.equal(profile.hourlyRateUsd, 85);
    assert.equal(profile.expectedMonthlyMwk, 4500000);
    // legalAuthorizedSigner defaults to the candidate's own name.
    assert.equal(profile.legalAuthorizedSigner, RAW.fullName);
  });

  test("a null or empty profile does not throw", () => {
    for (const input of [{}, { skills: null }, { experience: "nope", education: 7 }]) {
      const profile = toApplicantProfile(input as Record<string, unknown>);
      assert.deepEqual(profile.skills, []);
      assert.deepEqual(profile.experience, []);
      assert.deepEqual(profile.education, []);
    }
  });

  test("list mapping accepts both a bare array and a {profiles} envelope", () => {
    const fromArray = toApplicantProfileList([RAW]);
    const fromEnvelope = toApplicantProfileList({ profiles: [RAW] });
    assert.equal(fromArray.length, 1);
    assert.equal(fromEnvelope.length, 1);
    assert.deepEqual(fromArray[0].skills, fromEnvelope[0].skills);
    assert.deepEqual(toApplicantProfileList(null), []);
    assert.deepEqual(toApplicantProfileList({ detail: "not found" }), []);
  });
});
