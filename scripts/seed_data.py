#!/usr/bin/env python
"""Seed backend with Jacob Raymond Mlusu profile + scrape jobs across all scopes."""
import asyncio
import json
import sys
import httpx
from pathlib import Path

API_BASE = "http://localhost:8000/api/v1/athena"
API_KEY = "dev-admin-key"
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

PROFILE_PATH = Path(__file__).parent / "profile_schema.json"


def load_profile() -> dict:
    """Load the canonical profile (expanded keyword set) from profile_schema.json."""
    with PROFILE_PATH.open(encoding="utf-8") as f:
        return json.load(f)


# Target roles are taken from profile/ats-keywords.md ("Executive role keywords"),
# which reflects the real profile: digital transformation, data/AI strategy and
# enterprise architecture leadership. The previous list targeted individual
# contributor and web-development roles (software engineer, devops, VP
# Engineering) and belonged to the discarded mock profile.
#
# Remote carries the bulk of the volume because the profile's preferred locations
# are Lilongwe, Remote and Washington D.C., and most African-executive roles are
# posted remotely or as consultancy.
QUERIES = [
    # --- C-suite & director-level leadership (full-time, remote) ---
    {"query": "Chief Technology Officer", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Chief Data Officer", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Chief Innovation Officer", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Director of Digital Transformation", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Director of IT Strategy and Innovation", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Head of Information Systems", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "PMO Director", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Digital Platforms Implementation Lead", "location": "Remote", "job_type": "full_time", "max_results": 100},
    # --- Data & architecture leadership (full-time, remote) ---
    {"query": "Enterprise Architect", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Head of Data Governance and Architecture", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Director of Business Intelligence", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Director of Information Management and Analytics", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Data Integration and Systems Advisor", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "Strategic Technology Partnerships Lead", "location": "Remote", "job_type": "full_time", "max_results": 100},
    # --- Advisory / consultancy (remote) ---
    {"query": "ICT Strategy Consultant", "location": "Remote", "job_type": "consultancy", "max_results": 50},
    {"query": "Data and AI Strategy Advisor", "location": "Remote", "job_type": "consultancy", "max_results": 50},
    {"query": "Technical Advisor Data Systems", "location": "Remote", "job_type": "consultancy", "max_results": 50},
    {"query": "AI Strategy Consultant", "location": "Remote", "job_type": "consultancy", "max_results": 50},
    {"query": "Enterprise Architecture Consultant", "location": "Remote", "job_type": "consultancy", "max_results": 50},
    # --- MEL / climate / ICT4D advisory leadership (full-time, remote) ---
    {"query": "Head of MEL Systems", "location": "Remote", "job_type": "full_time", "max_results": 100},
    {"query": "MEL Technology Lead", "location": "Remote", "job_type": "consultancy", "max_results": 50},
    {"query": "Climate Data Systems Lead", "location": "Remote", "job_type": "full_time", "max_results": 100},
    # --- Malawi domestic market (full-time & consultancy) ---
    {"query": "Chief Technology Officer", "location": "Lilongwe", "job_type": "full_time", "max_results": 50},
    {"query": "Digital Health Systems Director", "location": "Lilongwe", "job_type": "full_time", "max_results": 50},
    {"query": "Enterprise Architect", "location": "Lilongwe", "job_type": "full_time", "max_results": 50},
    {"query": "ICT4D Lead", "location": "Lilongwe", "job_type": "consultancy", "max_results": 50},
    {"query": "Digital Transformation Consultant", "location": "Lilongwe", "job_type": "consultancy", "max_results": 50},
]

async def upsert_profile(client: httpx.AsyncClient, profile: dict) -> str:
    """Resolve the profile id, without clobbering a richer existing profile.

    POST /profiles is a full replace. profile_schema.json is a deliberately
    trimmed seed and is missing data the live profile may carry (education gpa,
    honours and location, uploaded documents), so posting it over an existing
    profile would silently destroy those fields. Only create when absent.
    """
    listing = await client.get(f"{API_BASE}/profiles")
    listing.raise_for_status()
    for existing in listing.json():
        if existing.get("email") == profile["email"]:
            print(f"  Existing profile found, keeping it: {existing['id']}")
            return existing["id"]

    print("  No existing profile, creating from profile_schema.json")
    r = await client.post(f"{API_BASE}/profiles", json=profile)
    r.raise_for_status()
    data = r.json()
    pid = data.get("id") or data.get("profile_id")
    if not pid:
        raise RuntimeError(f"profile upsert returned no id: {data}")
    return pid

async def main():
    async with httpx.AsyncClient(timeout=180.0, headers=HEADERS) as client:
        # 1. Upsert profile
        profile = load_profile()
        print(f"Resolving profile: {profile['full_name']} ({len(profile['preferences']['keywords'])} keywords)")
        pid = await upsert_profile(client, profile)
        print(f"  Profile ID: {pid}")
        
        # 2. Sequential scrapes. The API runs one scrape at a time and answers
        # 409 while a slot is busy, so back off and retry instead of dropping
        # the query.
        failed = []
        for i, q in enumerate(QUERIES, 1):
            print(f"Scrape {i}/{len(QUERIES)}: {q['query']} @ {q['location']} ({q['job_type']})")
            for attempt in range(1, 13):
                try:
                    r = await client.post(f"{API_BASE}/scrape", json=q)
                    if r.status_code == 409:
                        await asyncio.sleep(min(5 * attempt, 30))
                        continue
                    r.raise_for_status()
                    result = r.json()
                    print(f"  -> {result['jobs_found']} found, {result['jobs_new']} new")
                    break
                except Exception as e:
                    if attempt == 12:
                        print(f"  FAILED: {e}")
                        failed.append(q)
                        break
                    await asyncio.sleep(min(5 * attempt, 30))
            if i < len(QUERIES):
                await asyncio.sleep(2)

        if failed:
            print(f"\n{len(failed)} quer{'y' if len(failed) == 1 else 'ies'} failed after 12 attempts:")
            for q in failed:
                print(f"  - {q['query']} @ {q['location']}")
        
        # 3. Process (matching + ATS)
        print("Running processor (matching + ATS)...")
        try:
            r = await client.post(f"{API_BASE}/process")
            r.raise_for_status()
            print(f"  Process result: {r.json()}")
        except Exception as e:
            print(f"  ✗ Process failed: {e}")
        
        # 4. Verify
        print("Verifying data...")
        jobs = await client.get(f"{API_BASE}/jobs?limit=10")
        jobs.raise_for_status()
        print(f"Jobs in DB: {jobs.json().get('total', '?')}")
        profiles = await client.get(f"{API_BASE}/profiles")
        profiles.raise_for_status()
        print(f"Profiles: {len(profiles.json())}")

if __name__ == "__main__":
    asyncio.run(main())
