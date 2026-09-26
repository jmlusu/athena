"""Gemini AI provider implementation."""

import json
import os
from datetime import datetime
from typing import Any, Optional

from google import genai
from google.genai import types

from athena.api.ai_schemas import (
    ATSScoreRequest,
    ATSScoreResponse,
    DehumanizeRequest,
    DehumanizeResponse,
    N8nDispatchRequest,
    N8nDispatchResponse,
    ScrapeLiveRequest,
    ScrapeLiveResponse,
    SubmitApplicationRequest,
    SubmitApplicationResponse,
    TailorDocumentRequest,
    TailorDocumentResponse,
    TailorResumeRequest,
    TailorResumeResponse,
)
from athena.ai.providers.base import AthenaAIProvider
from athena.ai.providers.fallback import FallbackProvider


class GeminiProvider(AthenaAIProvider):
    """Google Gemini AI provider."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-3.8-flash"):
        self._api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self._model = model
        self._client: Optional[genai.Client] = None
        self._fallback = FallbackProvider()

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    def _get_client(self) -> Optional[genai.Client]:
        if not self._api_key:
            return None
        if self._client is None:
            self._client = genai.Client(
                api_key=self._api_key,
                http_options=types.HttpOptions(headers={"User-Agent": "athena-ai-studio"}),
            )
        return self._client

    def _fallback_response(self, method_name: str, request: Any) -> Any:
        """Delegate to fallback provider."""
        method = getattr(self._fallback, method_name)
        return method(request)

    async def score_ats(self, request: ATSScoreRequest) -> ATSScoreResponse:
        client = self._get_client()
        if not client:
            return await self._fallback.score_ats(request)

        prompt = f"""You are an elite Applicant Tracking System (ATS) algorithmic evaluator and executive hiring partner.
Analyze this {request.item_type or "job"} listing against the applicant profile:

TARGET ROLE / CONSULTANCY:
Title: {request.job_title}
Organization: {request.company}
Description: {request.description}
Required Skills & Criteria: {json.dumps(request.requirements or [])}

APPLICANT PROFILE & CREDENTIALS:
{json.dumps(request.applicant_profile or {})}

TASK:
1. Provide a precise ATS score (0 to 100) reflecting semantic keyword match, seniority alignment, regional context (Lilongwe, Malawi / International Remote), and capability fit.
2. If ATS >= 90: It qualifies for autonomous priority document generation.
3. If ATS 80-89: It qualifies for auto-flagging for applicant review.
4. Extract matched skills, missing/gap skills, key strengths, and an honest ATS verdict.
5. Provide a crisp 2-sentence authentic pitch that avoids AI cliches.

Return strict JSON matching this schema:
{{
  "atsScore": number,
  "matchCategory": "CRITICAL_MATCH" (>=90) | "FLAGGED_REVIEW" (80-89) | "STANDARD" (<80),
  "matchedSkills": string[],
  "missingSkills": string[],
  "strengths": string[],
  "recommendation": string,
  "dehumanizedPitch": string
}}"""

        try:
            response = await client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )
            parsed = json.loads(response.text or "{}")
            return ATSScoreResponse(**parsed)
        except Exception as e:
            # Log error and fall back
            print(f"Gemini ATS scoring error: {e}")
            return await self._fallback.score_ats(request)

    async def tailor_resume(self, request: TailorResumeRequest) -> TailorResumeResponse:
        client = self._get_client()
        if not client:
            return await self._fallback.tailor_resume(request)

        job = request.job
        profile = request.applicant_profile
        dehumanize = request.dehumanize

        dehumanize_instruction = (
            "CRITICAL DEHUMANIZING INSTRUCTION:\n"
            "   - Strip ALL robotic AI filler words: 'delve', 'spearheaded an ecosystem', 'testament to', 'fast-paced environment', 'tapestry', 'beacon', 'catalyst'.\n"
            "   - Write in calm, assertive, authentic first-person professional cadence.\n"
            "   - Sound like an elite human professional with high self-respect and practical mastery. Keep verbs active and concrete."
            if dehumanize
            else "Write in professional executive tone."
        )

        prompt = f"""You are an upscale executive resume writer for elite white-collar positions and high-value consultancies.
Tailor the applicant's resume specifically for this opportunity:

JOB/CONSULTANCY:
Title: {job.get("title")}
Company/Client: {job.get("company")}
Location: {job.get("location")}
Description: {job.get("description")}
Required Skills: {json.dumps(job.get("requirements", []))}

APPLICANT RAW BACKGROUND:
{json.dumps(profile or {})}

FORMAT: {request.column_layout} layout.
{dehumanize_instruction}

Return JSON with this structure:
{{
  "fullName": string,
  "title": string,
  "contact": {{ "email": string, "phone": string, "location": string, "linkedin": string }},
  "summary": string,
  "skills": string[],
  "experience": [
    {{
      "role": string,
      "company": string,
      "period": string,
      "location": string,
      "bullets": string[]
    }}
  ],
  "education": [
    {{ "degree": string, "institution": string, "year": string }}
  ],
  "certifications": string[],
  "layout": "{request.column_layout}"
}}"""

        try:
            response = await client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.4,
                ),
            )
            parsed = json.loads(response.text or "{}")
            return TailorResumeResponse(tailored_resume=parsed)
        except Exception as e:
            print(f"Gemini resume tailoring error: {e}")
            return await self._fallback.tailor_resume(request)

    async def tailor_document(self, request: TailorDocumentRequest) -> TailorDocumentResponse:
        client = self._get_client()
        if not client:
            return await self._fallback.tailor_document(request)

        job = request.job
        profile = request.applicant_profile
        doc_type = request.doc_type
        dehumanize = request.dehumanize

        dehumanize_rules = (
            "NEVER use robotic AI tropes like: 'thrilled to apply', 'beacon of hope', 'harness the power of', 'testament to', 'in today's fast paced world'. Use crisp, dignified, human professional tone."
            if dehumanize
            else "Professional upscale corporate tone."
        )

        prompt = f"""You are a high-level executive career strategist and ghostwriter.
Generate a tailored {doc_type} for:

TARGET:
Title: {job.get("title")}
Company: {job.get("company")}
Location: {job.get("location")}
Description: {job.get("description")}
Requirements: {json.dumps(job.get("requirements", []))}

CANDIDATE PROFILE:
{json.dumps(profile or {})}

DOCUMENT TYPE: {doc_type} ("cover-letter" OR "consultancy-proposal" OR "executive-summary")
LAYOUT: {request.column_layout} (single-column or two-column upscale letterhead)
{dehumanize_rules}

Return JSON with this schema:
{{
  "title": string,
  "recipient": string,
  "date": string,
  "greeting"?: string,
  "executiveSummary"?: string,
  "paragraphs"?: string[],
  "sections"?: [ {{ "heading": string, "body": string }} ],
  "closing"?: string,
  "signature"?: string,
  "layout": "{request.column_layout}",
  "dehumanized": {str(dehumanize).lower()}
}}"""

        try:
            response = await client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.4,
                ),
            )
            parsed = json.loads(response.text or "{}")
            return TailorDocumentResponse(document=parsed)
        except Exception as e:
            print(f"Gemini document tailoring error: {e}")
            return await self._fallback.tailor_document(request)

    async def dehumanize(self, request: DehumanizeRequest) -> DehumanizeResponse:
        client = self._get_client()
        if not client or not request.text:
            return await self._fallback.dehumanize(request)

        prompt = f"""You are a world-class editor specializing in "Dehumanizing" AI text to make it sound unmistakably human, natural, confident, and authentic.
Remove all AI telltales:
- Overused buzzwords ("spearhead", "delve", "testament", "beacon", "synergy", "paradigm", "plethora", "crucial", "seamlessly")
- Generic robotic syntactic formulas ("Not only X, but also Y", "In today's fast-paced world")
- Excessive passive voice or hollow enthusiasm.
Keep it direct, engaging, and professional.

ORIGINAL TEXT:
{request.text}

CONTEXT: {request.context or "Job application / Cover letter"}

Return JSON:
{{
  "humanizedText": string,
  "flaggedWordsRemoved": string[],
  "confidenceScore": number
}}"""

        try:
            response = await client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )
            parsed = json.loads(response.text or "{}")
            return DehumanizeResponse(**parsed)
        except Exception as e:
            print(f"Gemini dehumanize error: {e}")
            return await self._fallback.dehumanize(request)

    async def synthesize_listings(self, request: ScrapeLiveRequest) -> ScrapeLiveResponse:
        client = self._get_client()
        if not client:
            return await self._fallback.synthesize_listings(request)

        prompt = f"""Generate 4 realistic and high-precision current job/consultancy listings matching:
Target location filter: {request.location_filter or "Lilongwe, Malawi & International Remote"}
Category: {request.search_type or "Jobs and Consultancies"}
Target keywords: {request.keywords or "Technology, Program Management, Operations, Public Health, Software, Finance"}
Applicant skills: {json.dumps(request.resume_skills or [])}

Include platforms such as: "LinkedIn", "Upwork", "ReliefWeb/UN Malawi", "Corporate Career Portal", "Devex Malawi".
For each item provide:
- id: unique string
- title: realistic job/consultancy title
- company: realistic reputable company/organization (e.g. UNICEF Malawi, GIZ Lilongwe, Standard Bank Malawi, Global Tech Remote, Upwork Enterprise)
- location: specific location (e.g. "Lilongwe, Malawi (Hybrid)", "Lilongwe, Malawi (100% Remote)", "Global Remote (US/EU timezones)")
- category: "job" or "consultancy"
- scope: "lilongwe-local" | "lilongwe-remote" | "international-remote"
- platform: "LinkedIn" | "Upwork" | "ReliefWeb" | "Corporate"
- description: concise 2-sentence description
- requirements: array of 4-6 key requirements
- salaryOrBudget: realistic compensation in MWK or USD
- deadline: date string
- atsScore: estimated match score (75 to 98)
- postedDate: "Just now" | "2 hours ago" | "1 day ago"

Return strict JSON:
{{
  "listings": Array
}}"""

        try:
            response = await client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.5,
                ),
            )
            data = json.loads(response.text or "{}")
            if data.get("listings") and isinstance(data["listings"], list):
                return ScrapeLiveResponse(
                    listings=[ScrapeLiveListing(**l) for l in data["listings"]],
                    timestamp=datetime.utcnow(),
                )
        except Exception as e:
            print(f"Gemini scraper error: {e}")

        return await self._fallback.synthesize_listings(request)

    async def dispatch_n8n(self, request: N8nDispatchRequest) -> N8nDispatchResponse:
        return await self._fallback.dispatch_n8n(request)

    async def submit_application(
        self, request: SubmitApplicationRequest
    ) -> SubmitApplicationResponse:
        return await self._fallback.submit_application(request)

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "ok" if self.is_available else "degraded",
            "provider": self.name,
            "has_api_key": self.is_available,
            "model": self._model,
            "timestamp": datetime.utcnow().isoformat(),
        }
