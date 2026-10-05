import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  toOpportunity,
  toOpportunityList,
  toApplicantProfile,
  toApplicantProfileList,
  toBackendProfile,
  mergeProfilePatch,
  toIsoDate,
  parsePeriod,
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
import type { ApplicantProfile } from "../../src/types.ts";

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

// The SPA and FastAPI disagree about profile shape badly enough that every PUT
// answered 422: string[] is not list[Skill], experience[].role is not
// Experience.title, education[].year carries no field_of_study. These assert the
// request body FastAPI actually accepts, and that reading it back returns what
// the form sent.
describe("toBackendProfile", () => {
  const SPA = {
    id: "d974bf19",
    fullName: 'Jacob Raymond "Jack" Mlusu',
    email: "jmlusu@gmail.com",
    phone: "(+265) 0980016004",
    location: "Lilongwe, Malawi / Remote",
    headline: "Digital Transformation Executive",
    summary: "Strategy and digital transformation executive.",
    skills: ["AI Strategy", "Data Architecture"],
    experience: [
      {
        role: "Founder / Digital Transformation Lead",
        company: "Lightspeed Holdings Limited",
        location: "Lilongwe, Malawi",
        period: "Nov 2023 - Present",
        bullets: ["Founded an AI workflow venture.", "Building a data platform."],
      },
      {
        role: "Head of IT",
        company: "Ministry of Health",
        location: "Lilongwe, Malawi",
        period: "Jan 2015 - Jun 2019",
        bullets: ["Delivered a national MIS rollout."],
      },
    ],
    education: [
      {
        degree: "Master of Science, Chemical Engineering",
        institution: "Howard University",
        year: "2011",
      },
    ],
    certifications: ["PMP", "AWS Solutions Architect"],
    hourlyRateUsd: 95,
    expectedMonthlyMwk: 5200000,
    legalAuthorizedSigner: "J. M. Mlusu",
  } as unknown as ApplicantProfile;

  const body = toBackendProfile(SPA);

  test("top-level keys are snake_case and the id is left to the path param", () => {
    assert.equal(body.full_name, SPA.fullName);
    assert.equal(body.hourly_rate_usd, 95);
    assert.equal(body.expected_monthly_mwk, 5200000);
    assert.equal(body.legal_authorized_signer, "J. M. Mlusu");
    // UserProfileRequest has no `id` field; the route takes it from the URL.
    assert.equal("id" in body, false);
    // Nothing camelCase survives at the top level.
    assert.equal("fullName" in body, false);
    assert.equal("hourlyRateUsd" in body, false);
  });

  test("string skills become the objects list[Skill] requires", () => {
    assert.deepEqual(body.skills, [{ name: "AI Strategy" }, { name: "Data Architecture" }]);
    // toSkillList accepts either shape, so this survives the read side too.
    assert.deepEqual(toSkillList(body.skills), SPA.skills);
  });

  test("experience carries the fields Experience requires, none missing", () => {
    const [first, second] = body.experience as Record<string, unknown>[];
    assert.equal(first.title, "Founder / Digital Transformation Lead");
    assert.equal(first.company, "Lightspeed Holdings Limited");
    assert.equal(first.start_date, "2023-11-01T00:00:00Z");
    assert.equal(first.end_date, null);
    assert.equal(first.current, true);
    assert.deepEqual(first.achievements, SPA.experience[0].bullets);
    // description is a required str with no default -- it can never be absent.
    assert.equal(typeof first.description, "string");
    assert.equal(second.title, "Head of IT");
    assert.equal(second.start_date, "2015-01-01T00:00:00Z");
    assert.equal(second.end_date, "2019-06-01T00:00:00Z");
    assert.equal(second.current, false);
    for (const item of body.experience as Record<string, unknown>[]) {
      for (const required of ["title", "company", "start_date", "description"]) {
        assert.ok(required in item, `experience entry is missing ${required}`);
      }
    }
  });

  test("education supplies field_of_study, which is required with no default", () => {
    const [row] = body.education as Record<string, unknown>[];
    assert.equal(row.institution, "Howard University");
    assert.equal(row.degree, "Master of Science, Chemical Engineering");
    assert.equal(row.field_of_study, "");
    assert.ok("field_of_study" in row);
    // A bare year is stored as Jan 1 of that year; see the round-trip test.
    assert.equal(row.end_date, "2011-01-01T00:00:00Z");
  });

  test("a saved profile reads back with everything the form shows intact", () => {
    const reloaded = toApplicantProfile(body);
    assert.equal(reloaded.fullName, SPA.fullName);
    assert.equal(reloaded.email, SPA.email);
    assert.equal(reloaded.phone, SPA.phone);
    assert.equal(reloaded.location, SPA.location);
    assert.equal(reloaded.headline, SPA.headline);
    assert.equal(reloaded.summary, SPA.summary);
    assert.deepEqual(reloaded.skills, SPA.skills);
    assert.deepEqual(reloaded.certifications, SPA.certifications);
    assert.equal(reloaded.hourlyRateUsd, 95);
    assert.equal(reloaded.expectedMonthlyMwk, 5200000);
    assert.equal(reloaded.legalAuthorizedSigner, "J. M. Mlusu");
    // Roles and bullets survive verbatim; only `period` is reformatted, because
    // the backend stores dates and the SPA renders them through formatMonthYear.
    assert.equal(reloaded.experience[0].role, SPA.experience[0].role);
    assert.deepEqual(reloaded.experience[0].bullets, SPA.experience[0].bullets);
    assert.equal(reloaded.experience[0].period, "Nov 2023 - Present");
    assert.equal(reloaded.experience[1].role, "Head of IT");
    assert.equal(reloaded.education[0].institution, "Howard University");
  });

  test("a year-only period gains a month, and is stable from then on", () => {
    // Documented, inherent loss: Experience stores a datetime and the SPA shows
    // a month name, so "2019 - 2022" becomes "Jan 2019 - Jan 2022" on first
    // save. Any period that already came from the backend is byte-identical.
    const yearOnly = toBackendProfile({
      ...SPA,
      experience: [{ ...SPA.experience[0], period: "2019 - 2022" }],
    });
    const once = toApplicantProfile(yearOnly);
    assert.equal(once.experience[0].period, "Jan 2019 - Jan 2022");
    const twice = toApplicantProfile(toBackendProfile(once));
    assert.equal(twice.experience[0].period, once.experience[0].period);
  });

  test("a backend-native period round-trips byte for byte", () => {
    for (const period of ["Nov 2023 - Present", "Jan 2015 - Jun 2019"]) {
      const reloaded = toApplicantProfile(toBackendProfile({ ...SPA, experience: [{ ...SPA.experience[0], period }] }));
      assert.equal(reloaded.experience[0].period, period);
    }
  });

  test("malformed input still produces a body FastAPI can validate", () => {
    const junk = toBackendProfile({
      id: "x",
      fullName: "",
      email: "",
      phone: "",
      location: "",
      headline: "",
      summary: "",
      skills: [],
      experience: [{ role: "", company: "", location: "", period: "", bullets: [] }],
      education: [{ degree: "", institution: "", year: "not-a-year" }],
      certifications: [],
      hourlyRateUsd: 0,
      expectedMonthlyMwk: 0,
      legalAuthorizedSigner: "",
    } as unknown as ApplicantProfile);

    const [exp] = junk.experience as Record<string, unknown>[];
    // start_date has no default, so it must always be a real datetime.
    assert.equal(typeof exp.start_date, "string");
    assert.ok(!Number.isNaN(Date.parse(String(exp.start_date))));
    assert.equal(typeof exp.description, "string");
    const [edu] = junk.education as Record<string, unknown>[];
    assert.equal(typeof edu.field_of_study, "string");
    assert.ok("end_date" in edu);
    // An unset rate is null, not 0 -- 0 would read back as the 85 default and
    // silently overwrite a deliberate zero.
    assert.equal(junk.hourly_rate_usd, null);
  });
});

describe("period and date parsing", () => {
  test("toIsoDate handles every shape the SPA renders", () => {
    assert.equal(toIsoDate("Nov 2023"), "2023-11-01T00:00:00Z");
    assert.equal(toIsoDate("Feb 2019"), "2019-02-01T00:00:00Z");
    assert.equal(toIsoDate("2023"), "2023-01-01T00:00:00Z");
    assert.equal(toIsoDate("2023-05-09T10:30:00Z"), "2023-05-09T10:30:00Z");
    assert.equal(toIsoDate("  Dec 2015 "), "2015-12-01T00:00:00Z");
    assert.equal(toIsoDate("Present"), null);
    assert.equal(toIsoDate("not-a-date"), null);
    assert.equal(toIsoDate(""), null);
    assert.equal(toIsoDate(null), null);
    assert.equal(toIsoDate(undefined), null);
  });

  test("parsePeriod splits an open-ended period", () => {
    assert.deepEqual(parsePeriod("Nov 2023 - Present"), {
      startDate: "2023-11-01T00:00:00Z",
      endDate: null,
      current: true,
    });
    assert.deepEqual(parsePeriod("2022 - Present"), {
      startDate: "2022-01-01T00:00:00Z",
      endDate: null,
      current: true,
    });
    // formatPeriod emits "start" alone when there is no end at all.
    assert.deepEqual(parsePeriod("Nov 2023"), {
      startDate: "2023-11-01T00:00:00Z",
      endDate: null,
      current: true,
    });
  });

  test("parsePeriod splits a closed period", () => {
    assert.deepEqual(parsePeriod("Jan 2015 - Jun 2019"), {
      startDate: "2015-01-01T00:00:00Z",
      endDate: "2019-06-01T00:00:00Z",
      current: false,
    });
    assert.deepEqual(parsePeriod("2019 - 2022"), {
      startDate: "2019-01-01T00:00:00Z",
      endDate: "2022-01-01T00:00:00Z",
      current: false,
    });
  });

  test("an unreadable period still yields a valid start_date", () => {
    for (const period of ["", "whenever", "- -", "Present - Present"]) {
      const { startDate, endDate, current } = parsePeriod(period);
      assert.equal(typeof startDate, "string");
      assert.ok(!Number.isNaN(Date.parse(startDate)), `bad start_date for ${JSON.stringify(period)}`);
      assert.equal(endDate, null);
      assert.equal(typeof current, "boolean");
    }
  });
});

// PUT replaces the whole document, so server.ts folds the form's edits into
// the stored profile first. Without that fold, one save on a live profile took
// it from 30,224 bytes to 16,508: 18 documents, 2 languages, 231 search
// keywords, both field_of_study values and all 43 skill categories vanished.
describe("mergeProfilePatch", () => {
  const stored: Record<string, unknown> = {
    id: "d974bf19-9b28-4e54-a26c-9857b94f40fa",
    email: "old@example.com",
    full_name: "Old Name",
    phone: "+265 1",
    location: "Lilongwe, Malawi",
    headline: "Old headline",
    summary: "Long-form summary that no form field edits.",
    linkedin_url: "https://www.linkedin.com/in/jack/",
    skills: [
      { name: "AI Strategy", category: "AI & Automation", level: "expert", years_experience: 8 },
      { name: "Data Architecture", category: "Data & Analytics" },
      { name: "Removed Skill", category: "Methodologies" },
    ],
    experience: [
      {
        id: "033d3da7-91b1-4370-95bb-5301871dd132",
        title: "Founder",
        company: "Lightspeed Holdings Limited",
        start_date: "2023-11-14T00:00:00+00:00",
        end_date: null,
        description: "Founder / Digital Transformation Leader",
        achievements: ["Built an AI workflow venture."],
        skills_used: ["AI Strategy", "Data Architecture"],
      },
    ],
    education: [
      {
        id: "5626bda7-91b1-4370-95bb-5301871dd132",
        institution: "Howard University",
        degree: "Master of Science",
        field_of_study: "Chemical Engineering",
        location: "Washington, D.C.",
        end_date: "2011-12-14T00:00:00+00:00",
      },
    ],
    certifications: ["PMP"],
    languages: ["English", "Chichewa"],
    preferences: {
      keywords: ["ai", "data platform", "digital transformation"],
      core_skill_tags: ["ai", "strategy"],
      job_titles: ["CTO", "Chief Data Officer"],
      locations: ["Lilongwe, Malawi", "Remote"],
      keywords_category: "executive",
    },
    documents: [
      { id: "doc-1", name: "Jack Mlusu resume.pdf", type: "resume" },
      { id: "doc-2", name: "WFP Cover Letter.pdf", type: "cover_letter" },
    ],
    resume_base: { parsed: true },
    created_at: "2026-10-03T12:44:53.264728+00:00",
    updated_at: "2026-10-03T13:12:32.233321+00:00",
  };

  const formPatch = toBackendProfile({
    id: stored.id as string,
    fullName: 'Jacob Raymond "Jack" Mlusu',
    email: "jmlusu@gmail.com",
    phone: "(+265) 0980016004",
    location: "Lilongwe, Malawi / Remote",
    headline: "Digital Transformation Executive",
    summary: "Long-form summary that no form field edits.",
    skills: ["AI Strategy", "Data Architecture", "Brand New Skill"],
    experience: [],
    education: [],
    certifications: [],
    hourlyRateUsd: 95,
    expectedMonthlyMwk: 5200000,
    legalAuthorizedSigner: "J. M. Mlusu",
  } as unknown as ApplicantProfile);

  test("everything the form has no editor for survives the write", () => {
    const merged = mergeProfilePatch(stored, formPatch);

    assert.deepEqual(merged.languages, ["English", "Chichewa"]);
    assert.deepEqual(merged.documents, stored.documents);
    assert.deepEqual(merged.preferences, stored.preferences);
    assert.deepEqual(merged.resume_base, { parsed: true });
    assert.equal(merged.linkedin_url, "https://www.linkedin.com/in/jack/");
    assert.equal(merged.summary, stored.summary);
    assert.equal(merged.created_at, stored.created_at);
    assert.deepEqual(merged.certifications, ["PMP"]);

    // experience/education have no editor either: ids, dates and
    // field_of_study all come through as stored, not as the mapper guessed.
    assert.deepEqual(merged.experience, stored.experience);
    assert.deepEqual(merged.education, stored.education);
  });

  test("the fields the form does edit are taken from the patch", () => {
    const merged = mergeProfilePatch(stored, formPatch);

    assert.equal(merged.full_name, 'Jacob Raymond "Jack" Mlusu');
    assert.equal(merged.email, "jmlusu@gmail.com");
    assert.equal(merged.phone, "(+265) 0980016004");
    assert.equal(merged.location, "Lilongwe, Malawi / Remote");
    assert.equal(merged.headline, "Digital Transformation Executive");
    assert.equal(merged.hourly_rate_usd, 95);
    assert.equal(merged.expected_monthly_mwk, 5200000);
    assert.equal(merged.legal_authorized_signer, "J. M. Mlusu");
  });

  test("skill metadata survives; removed skills drop and new ones start bare", () => {
    const merged = mergeProfilePatch(stored, formPatch);
    const skills = merged.skills as Record<string, unknown>[];

    assert.deepEqual(
      skills.map((s) => s.name),
      ["AI Strategy", "Data Architecture", "Brand New Skill"]
    );
    assert.deepEqual(
      skills.map((s) => s.category),
      ["AI & Automation", "Data & Analytics", undefined]
    );
    assert.equal(skills[0].level, "expert");
    assert.equal(skills[0].years_experience, 8);
    assert.ok(!skills.some((s) => s.name === "Removed Skill"));
  });

  test("a patch without a skills array leaves the stored list untouched", () => {
    const { skills: _skills, ...withoutSkills } = formPatch;
    const merged = mergeProfilePatch(stored, withoutSkills);
    assert.deepEqual(merged.skills, stored.skills);
  });

  test("with nothing stored yet the patch stands alone", () => {
    assert.equal(mergeProfilePatch(null, formPatch), formPatch);
    assert.equal(mergeProfilePatch(undefined, formPatch), formPatch);
    assert.deepEqual(mergeProfilePatch({}, formPatch).skills, formPatch.skills);
  });
});
