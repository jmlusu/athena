"""Build the Athena profile payload from the markdown sources in profile/.

The database previously held a fabricated persona (scripts/profile_schema.json)
that borrowed only a name and LinkedIn URL. This script regenerates that file
from the authoritative markdown so the payload can never drift into fiction
again: every field below is parsed out of profile/*.md, nothing is invented.

Sources
    profile/profile.md       identity, summary, headline, languages, skill categories
    profile/resume.md        professional experience
    profile/education.md     degrees
    profile/certifications.md certification inventory
    profile/ats-keywords.md  matching keyword bank

Usage
    python scripts/build_profile_payload.py [--check]

    --check  parse and report, write nothing
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PROFILE_DIR = REPO / "profile"
OUTPUT = Path(__file__).resolve().parent / "profile_schema.json"
RECOVERED_BANK = REPO / "docs" / "archive" / "keyword_bank_recovered.json"

MONTHS = {
    m: i
    for i, m in enumerate(
        ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
        start=1,
    )
}


def read(name: str) -> str:
    return (PROFILE_DIR / name).read_text(encoding="utf-8")


def strip_md(text: str) -> str:
    """Remove markdown emphasis/link syntax, keeping the readable text."""
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = text.replace("**", "").replace("__", "")
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = text.replace("*", "")
    # Normalise typographic quotes/dashes so the payload is plain ASCII-safe text.
    for smart, plain in (("\u201c", '"'), ("\u201d", '"'), ("\u2018", "'"), ("\u2019", "'")):
        text = text.replace(smart, plain)
    return re.sub(r"\s+", " ", text).strip()


def parse_date(token: str) -> datetime | None:
    """'Nov 2023' -> 2023-11-01 UTC. Returns None for 'Present'."""
    m = re.match(r"([A-Za-z]+)\s+(\d{4})", token.strip())
    if not m:
        return None
    month = MONTHS.get(m.group(1)[:3].lower())
    if not month:
        return None
    return datetime(int(m.group(2)), month, 1, tzinfo=UTC)


def split_terms(blob: str, sep: str) -> list[str]:
    return [t.strip() for t in blob.split(sep) if t.strip()]


# --------------------------------------------------------------------------
# identity
# --------------------------------------------------------------------------
def parse_identity() -> dict:
    """Read the Identity table in profile.md."""
    fields = {}
    for line in read("profile.md").splitlines():
        m = re.match(r"\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|$", line)
        if m:
            fields[strip_md(m.group(1)).lower()] = strip_md(m.group(2))
    required = ["full name", "email", "phone", "location", "linkedin", "headline"]
    missing = [r for r in required if r not in fields]
    if missing:
        raise SystemExit(f"profile.md identity table missing: {missing}")
    return fields


def parse_summary() -> str:
    """Executive summary paragraph(s) from profile.md."""
    text = read("profile.md")
    block = re.search(r"## Executive Summary\n(.*?)\n## ", text, re.S)
    if not block:
        raise SystemExit("profile.md: no Executive Summary section")
    return " ".join(strip_md(p) for p in block.group(1).strip().split("\n\n") if p.strip())


def parse_languages() -> list[str]:
    """'English — Fluent (Professional Proficiency)' -> 'English (Fluent)'.

    The API and domain models both type languages as list[str], so proficiency
    is folded into the label rather than kept as a separate object.
    """
    text = read("profile.md")
    block = re.search(r"## Languages\n+(.*?)(?:\n## |\Z)", text, re.S)
    langs: list[str] = []
    for line in (block.group(1) if block else "").splitlines():
        m = re.match(r"-\s*(.+?)\s*[—-]\s*(.+?)\s*$", line.strip())
        if not m:
            continue
        name = strip_md(m.group(1))
        raw_level = strip_md(m.group(2))
        # 'Fluent (Professional Proficiency)' -> 'Fluent'
        level = re.sub(r"\s*\([^)]*\)\s*$", "", raw_level).strip()
        langs.append(f"{name} ({level})" if level else name)
    return langs


# --------------------------------------------------------------------------
# skills
# --------------------------------------------------------------------------
def parse_skill_categories() -> list[dict]:
    """The 'Technical categories' table gives skills plus a category each."""
    text = read("profile.md")
    block = re.search(r"### Technical categories\n(.*?)\n## ", text, re.S)
    if not block:
        raise SystemExit("profile.md: no Technical categories table")
    skills, seen = [], set()
    for line in block.group(1).splitlines():
        m = re.match(r"\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|$", line)
        if not m:
            continue
        category = strip_md(m.group(1))
        for name in m.group(2).split(","):
            name = strip_md(name)
            if name and name.lower() not in seen:
                seen.add(name.lower())
                skills.append({"name": name, "category": category})
    return skills


# --------------------------------------------------------------------------
# matching keywords
# --------------------------------------------------------------------------
# Target job titles (spec item 6.3) — the roles this profile aims at. Kept
# here rather than in the markdown because they are a curated targeting list,
# not prose parsed from a source document.
JOB_TITLES = [
    "Chief Technology Officer",
    "Chief Data Officer",
    "Chief Innovation Officer",
    "Director",
    "Director of Digital Transformation",
]

# Label for the categorical structure below (metadata only; the scorer unions
# every list regardless of this label — see JobPreferences in models/jobs.py).
KEYWORDS_CATEGORY = "executive"


def parse_keywords() -> dict[str, list[str]]:
    """Matching bank = sourced terms from ats-keywords.md + the recovered bank.

    Returns four lists:
        flat        merged, de-duplicated bank (sourced + recovered) — the
                    recall source the scorer matches against
        executive   the three per-section lists, exactly as written in
        functional  ats-keywords.md (de-duplicated within the section, order
        core        preserved) — the categorical structure of spec item 3

    profile/ats-keywords.md is the documented source (executive roles, functional
    keywords, core skill tags). docs/archive/keyword_bank_recovered.json holds
    the larger pre-existing bank that was authored for Athena earlier and later
    discarded with the mock profile. The recovered bank is merged into `flat`
    only — the categorical lists mirror the markdown so they stay auditable.

    Order is stable and de-duplication is case/punctuation-insensitive so the
    generated payload does not churn between runs.
    """
    text = read("ats-keywords.md")
    sections: dict[str, list[str]] = {}
    for heading in ("Executive role keywords", "Functional keywords"):
        m = re.search(rf"## {re.escape(heading)}\n+(.*?)(?:\n\n|\Z)", text, re.S)
        if not m:
            raise SystemExit(f"ats-keywords.md: missing '{heading}'")
        sections[heading] = split_terms(strip_md(m.group(1)), "\u00b7")
    m = re.search(r"## Core skill tags \(for Athena matching\)\n+(.*?)(?:\n\n|\Z)", text, re.S)
    if m:
        sections["Core skill tags"] = split_terms(strip_md(m.group(1)), ",")

    out, seen = [], set()

    def push(terms: list[str]) -> int:
        added = 0
        for term in terms:
            cleaned = term.strip(" .")
            key = cleaned.lower()
            if key and key not in seen:
                seen.add(key)
                out.append(cleaned)
                added += 1
        return added

    def clean(terms: list[str]) -> list[str]:
        """Section lists: strip outer punctuation, drop empties, dedupe."""
        result, local_seen = [], set()
        for term in terms:
            cleaned = term.strip(" .")
            key = cleaned.lower()
            if key and key not in local_seen:
                local_seen.add(key)
                result.append(cleaned)
        return result

    for bucket in sections.values():
        push(bucket)

    sourced = len(out)
    recovered_added = 0
    if RECOVERED_BANK.exists():
        recovered = json.loads(RECOVERED_BANK.read_text(encoding="utf-8")).get("keywords", [])
        recovered_added = push(recovered)

    print(f"  keywords: {sourced} sourced + {recovered_added} recovered = {len(out)} unique")
    return {
        "flat": out,
        "executive": clean(sections.get("Executive role keywords", [])),
        "functional": clean(sections.get("Functional keywords", [])),
        "core": clean(sections.get("Core skill tags", [])),
    }


# --------------------------------------------------------------------------
# experience
# --------------------------------------------------------------------------
ROLE_HEADER = re.compile(r"^###\s+(?!.*\d{4}$)(.+?)\s*$")
ROLE_META = re.compile(r"^\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*\*(.+?)\*\s*$")


def parse_experience() -> list[dict]:
    """Roles from the Professional Experience section of resume.md."""
    text = read("resume.md")
    section = re.search(r"## Professional Experience\n(.*?)\n## ", text, re.S)
    if not section:
        raise SystemExit("resume.md: no Professional Experience section")

    roles, cur = [], None
    for raw in section.group(1).splitlines():
        line = raw.rstrip()
        header = ROLE_HEADER.match(line)
        if header:
            if cur:
                roles.append(cur)
            cur = {"title": strip_md(header.group(1)), "_body": []}
            continue
        if cur is None:
            continue
        meta = ROLE_META.match(line.strip())
        if meta and "company" not in cur:
            cur["company"] = strip_md(meta.group(1))
            cur["location"] = strip_md(meta.group(2))
            cur["_dates"] = strip_md(meta.group(3))
            continue
        cur["_body"].append(line)

    if cur:
        roles.append(cur)

    out = []
    for role in roles:
        if "company" not in role:
            raise SystemExit(f"resume.md: role '{role['title']}' has no company/date line")

        dates = re.split(r"\s*[–-]\s*", role["_dates"], maxsplit=1)
        start = parse_date(dates[0])
        end_token = dates[1] if len(dates) > 1 else ""
        end = parse_date(end_token)
        if start is None:
            raise SystemExit(f"resume.md: unparsable start date '{dates[0]}' for {role['title']}")
        current = end is None and ("present" in end_token.lower() or not end_token)

        body = role["_body"]
        skills_used: list[str] = []
        prose: list[str] = []
        achievements: list[str] = []

        for line in body:
            ks = re.match(r"^\*\*Key skills:\*\*\s*(.+?)\s*$", line.strip())
            if ks:
                skills_used = [s.strip() for s in strip_md(ks.group(1)).split("·") if s.strip()]
                continue
            if line.strip().startswith("---"):
                continue
            if line.strip().startswith("|") or line.strip().startswith("**Selected engagements"):
                continue  # client tables are prose, not structured data
            stripped = line.strip()
            if stripped.startswith("- ") or stripped.startswith("-**"):
                text = strip_md(stripped.lstrip("-").strip())
                if text:
                    achievements.append(text)
            elif stripped:
                prose.append(strip_md(stripped))

        out.append(
            {
                "title": role["title"],
                "company": role["company"],
                "location": role["location"] or None,
                "start_date": start.isoformat(),
                "end_date": end.isoformat() if end else None,
                "current": current,
                "description": " ".join(prose).strip() or role["title"],
                "achievements": achievements,
                "skills_used": skills_used,
            }
        )
    return out


# --------------------------------------------------------------------------
# education
# --------------------------------------------------------------------------
DEGREE_PREFIX = re.compile(
    r"^(?:Master|Bachelor|Doctor(?:ate)?|Ph\.?D|M\.?S\.?|B\.?S\.?|MBA|MBA)\s+(?:of\s+\w+\s+)?in\s+",
    re.I,
)
CONFERRED = re.compile(r"(\d{1,2})\s+([A-Za-z]+)\s+((?:19|20)\d{2})")


def parse_education() -> list[dict]:
    """Degrees from education.md.

    A heading only starts a degree when the table beneath it names an
    Institution, which keeps narrative sections such as 'Academic trajectory
    note' from being mistaken for a qualification.
    """
    lines = read("education.md").splitlines()
    entries: list[tuple[str, dict[str, str]]] = []

    i = 0
    while i < len(lines):
        heading = re.match(r"^##\s+(.+?)\s*$", lines[i])
        if not heading:
            i += 1
            continue
        fields: dict[str, str] = {}
        j = i + 1
        while j < len(lines) and not lines[j].startswith("## "):
            row = re.match(r"^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|?\s*$", lines[j])
            if row:
                fields[strip_md(row.group(1)).lower()] = strip_md(row.group(2))
            j += 1
        if "institution" in fields:
            entries.append((strip_md(heading.group(1)), fields))
        i = j

    if not entries:
        raise SystemExit("education.md: no degree entries parsed")

    out = []
    for degree, fields in entries:
        institution = fields["institution"]
        location = None
        if "," in institution:
            institution, location = (part.strip() for part in institution.split(",", 1))

        start_date = end_date = None
        years = re.findall(r"(?:19|20)\d{2}", fields.get("years", ""))
        if len(years) >= 2:
            start_date = f"{years[0]}-01-01T00:00:00+00:00"
            end_date = f"{years[1]}-12-31T00:00:00+00:00"
        elif conferred := CONFERRED.search(fields.get("degree conferred", "")):
            day, month, year = conferred.groups()
            month_no = MONTHS.get(month[:3].lower())
            if month_no:
                end_date = datetime(int(year), month_no, int(day), tzinfo=UTC).isoformat()

        field_of_study = DEGREE_PREFIX.sub("", degree).strip() or degree

        out.append(
            {
                "institution": institution,
                "degree": degree,
                "field_of_study": field_of_study,
                "location": location,
                "start_date": start_date,
                "end_date": end_date,
                "gpa": None,
                "honors": [],
            }
        )
    return out


# --------------------------------------------------------------------------
# certifications
# --------------------------------------------------------------------------
def parse_certifications() -> list[str]:
    """Certification inventory; degrees are excluded (they go to education)."""
    text = read("certifications.md")
    certs, seen = [], set()
    for raw in text.splitlines():
        line = raw.strip()
        if not line.startswith("- "):
            continue
        item = strip_md(line[2:])
        if not item or item.lower().startswith("source folder"):
            continue
        # Degrees are recorded under education, not certifications.
        if re.search(r"\b(Master|Bachelor|Doctor|Ph\.?D)\b.*\b(Science|Engineering|Arts)\b", item):
            continue
        key = item.lower()
        if key not in seen:
            seen.add(key)
            certs.append(item)
    return certs


# --------------------------------------------------------------------------
def build() -> dict:
    ident = parse_identity()
    certs = parse_certifications()
    keywords = parse_keywords()
    experience = parse_experience()
    education = parse_education()
    skills = parse_skill_categories()
    languages = parse_languages()

    return {
        "email": ident["email"],
        "full_name": ident["full name"],
        "phone": ident["phone"],
        "location": ident["location"],
        "linkedin_url": ident["linkedin"],
        "headline": ident["headline"],
        "summary": parse_summary(),
        "skills": skills,
        "experience": experience,
        "education": education,
        "certifications": certs,
        "languages": languages,
        "preferences": {
            "keywords": keywords["flat"],
            "excluded_keywords": [],
            "locations": ["Lilongwe, Malawi", "Remote", "Washington, D.C."],
            "job_types": ["full_time", "contract"],
            "min_salary": None,
            "preferred_sources": ["linkedin", "indeed", "glassdoor"],
            "remote_only": False,
            "visa_sponsorship_required": False,
            # Categorical structure (spec items 3 & 6): job_titles, a
            # metadata label, and the three per-section keyword lists.
            "job_titles": JOB_TITLES,
            "keywords_category": KEYWORDS_CATEGORY,
            "executive_keywords": keywords["executive"],
            "functional_keywords": keywords["functional"],
            "core_skill_tags": keywords["core"],
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="parse and report, write nothing")
    args = parser.parse_args()

    payload = build()

    print("parsed from profile/*.md:")
    print(f"  email          : {payload['email']}")
    print(f"  full_name      : {payload['full_name']}")
    print(f"  headline       : {payload['headline'][:70]}")
    print(f"  skills         : {len(payload['skills'])}")
    print(f"  experience     : {len(payload['experience'])}")
    print(f"  education      : {len(payload['education'])}")
    print(f"  certifications : {len(payload['certifications'])}")
    print(f"  languages      : {len(payload['languages'])}")
    print(f"  keywords       : {len(payload['preferences']['keywords'])}")
    prefs = payload["preferences"]
    print(f"  job_titles     : {len(prefs['job_titles'])}")
    print(f"  kw_category    : {prefs['keywords_category']}")
    print(f"  exec keywords  : {len(prefs['executive_keywords'])}")
    print(f"  func keywords  : {len(prefs['functional_keywords'])}")
    print(f"  core skill tags: {len(prefs['core_skill_tags'])}")
    print(f"  summary chars  : {len(payload['summary'])}")

    for role in payload["experience"]:
        end = "Present" if role["current"] else (role["end_date"] or "")[:7]
        print(f"    - {role['title'][:44]:<46} {role['company'][:26]:<28} {role['start_date'][:7]} -> {end}")

    if args.check:
        print("\n--check: nothing written")
        return 0

    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nwrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
