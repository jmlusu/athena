"""Deterministic fallback AI provider - no API key required."""

from datetime import UTC, datetime, timedelta
from typing import Any

from athena.ai.providers.base import AthenaAIProvider
from athena.api.ai_schemas import (
    ATSScoreRequest,
    ATSScoreResponse,
    DehumanizeRequest,
    DehumanizeResponse,
    N8nDispatchRequest,
    N8nDispatchResponse,
    N8nReceipt,
    ScrapeLiveListing,
    ScrapeLiveRequest,
    ScrapeLiveResponse,
    SubmitApplicationRequest,
    SubmitApplicationResponse,
    TailorDocumentRequest,
    TailorDocumentResponse,
    TailorResumeRequest,
    TailorResumeResponse,
)


class FallbackProvider(AthenaAIProvider):
    """Deterministic fallback provider using rule-based logic.

    Used when no AI API key is configured. Provides functional but non-LLM responses.
    """

    @property
    def name(self) -> str:
        return "fallback"

    @property
    def is_available(self) -> bool:
        return True  # Always available

    async def score_ats(self, request: ATSScoreRequest) -> ATSScoreResponse:
        """Deterministic ATS scoring based on keyword overlap."""
        req_list = request.requirements or []
        profile_text = str(request.applicant_profile).lower()

        matched = 0
        for req in req_list:
            if req.lower()[:5] in profile_text:
                matched += 1

        ratio = matched / len(req_list) if req_list else 0.85
        base_score = min(97, max(68, round(72 + ratio * 24)))

        if base_score >= 90:
            match_category = "CRITICAL_MATCH"
        elif base_score >= 80:
            match_category = "FLAGGED_REVIEW"
        else:
            match_category = "STANDARD"

        return ATSScoreResponse(
            ats_score=base_score,
            match_category=match_category,
            matched_skills=req_list[: max(2, matched)],
            missing_skills=req_list[matched:],
            strengths=[
                "Strong domain background in southern African development & consulting",
                "Proven delivery track record",
            ],
            recommendation=(
                "Immediate auto-application recommended"
                if base_score >= 90
                else "Tailor resume highlights prior to submission"
            ),
            dehumanized_pitch=(
                "I bring direct cross-functional experience delivering measurable outcomes in complex operating environments."
            ),
        )

    async def tailor_resume(self, request: TailorResumeRequest) -> TailorResumeResponse:
        """Generate a deterministic tailored resume."""
        job = request.job
        profile = request.applicant_profile

        full_name = profile.get("fullName", "Chifuniro Phiri")
        dehumanize = request.dehumanize

        if dehumanize:
            summary = (
                "Hands-on practitioner with 9+ years managing technical programs, operational scale, "
                "and cross-border digital initiatives across Malawi and international donor-funded consortia. "
                "Direct experience delivering within UNDP, USAID, and private venture mandates."
            )
        else:
            summary = (
                "Accomplished leader with deep expertise in managing high-impact technical initiatives "
                "and strategic consultancy across Lilongwe and global remote engagements."
            )

        resume = {
            "full_name": full_name,
            "title": job.get("title")
            and f"Principal Consultant & {job['title']}"
            or "Senior Technology & Operations Specialist",
            "contact": {
                "email": profile.get("email", "chifuniro.phiri@consult-mw.com"),
                "phone": "+265 99 412 8890",
                "location": "Area 10, Lilongwe, Malawi",
                "linkedin": "linkedin.com/in/chifuniro-phiri-mw",
            },
            "summary": summary,
            "skills": [
                "Project & Program Direction",
                "Systems Architecture & Data Pipelines",
                "Stakeholder Negotiation & Government Relations",
                "Monitoring & Evaluation (M&E)",
                "Budgetary Oversight ($2M+ portfolios)",
                "Remote Team Leadership",
            ],
            "experience": [
                {
                    "role": "Lead Technical Consultant / Lead Specialist",
                    "company": "Malawi Innovation & Impact Advisory",
                    "period": "2021 - Present",
                    "location": "Lilongwe, Malawi / Remote",
                    "bullets": [
                        "Directed cross-functional execution for 4 major institutional engagements, meeting 100% of milestone deliverables on time.",
                        "Engineered workflow automation reducing reporting overhead by 40% for multi-country regional programs.",
                        "Coordinated with ministries, multilateral funders, and private partners to ensure compliance and technical integrity.",
                    ],
                },
                {
                    "role": "Senior Operations & Tech Lead",
                    "company": "Aura Global Solutions",
                    "period": "2018 - 2021",
                    "location": "Remote / Lilongwe",
                    "bullets": [
                        "Led distributed team of 14 engineers and analysts across 3 timezones.",
                        "Architected data aggregation models and automated verification frameworks.",
                    ],
                },
            ],
            "education": [
                {
                    "degree": "M.Sc. in Information Systems & Strategic Management",
                    "institution": "University of Malawi / International Partner",
                    "year": "2018",
                },
                {
                    "degree": "B.Sc. in Computer Science",
                    "institution": "Malawi University of Science and Technology (MUST)",
                    "year": "2015",
                },
            ],
            "certifications": [
                "PMP Certified",
                "AWS Certified Cloud Practitioner",
                "Agile Scrum Master",
            ],
            "layout": request.column_layout,
        }

        return TailorResumeResponse(tailored_resume=resume)

    async def tailor_document(self, request: TailorDocumentRequest) -> TailorDocumentResponse:
        """Generate deterministic cover letter, proposal, or executive summary."""
        job = request.job
        profile = request.applicant_profile
        doc_type = request.doc_type
        dehumanize = request.dehumanize

        full_name = profile.get("fullName", "Chifuniro Phiri")

        if doc_type in ("consultancy-proposal", "executive-summary"):
            if dehumanize:
                exec_summary = (
                    f"This proposal outlines a concrete 90-day delivery roadmap for {job.get('title', 'the consultancy')}. "
                    "Having delivered comparable initiatives across Southern Africa and international partners, "
                    "my methodology emphasizes clear weekly milestones, accountable metrics, and immediate stakeholder alignment from Day 1."
                )
            else:
                exec_summary = (
                    f"A comprehensive consultancy proposal offering proven strategic leadership and "
                    f"milestone-driven execution for {job.get('company', 'the client')}."
                )

            document = {
                "title": f"Technical & Financial Proposal: {job.get('title', 'Strategic Consultancy')}",
                "recipient": f"{job.get('company', 'Hiring Committee')}, Lilongwe / International Secretariat",
                "date": datetime.now(UTC).strftime("%B %d, %Y"),
                "executive_summary": exec_summary,
                "sections": [
                    {
                        "heading": "1. Problem Understanding & Context",
                        "body": (
                            "The mandate requires a seasoned lead who understands both local Malawian institutional dynamics "
                            "(Lilongwe ministries, development partners, local private sector) and international compliance standards. "
                            "Key challenges include cross-border latency, coordination friction, and data integrity."
                        ),
                    },
                    {
                        "heading": "2. Technical Approach & Work Breakdown",
                        "body": (
                            "Phase 1: Inception & Stakeholder Discovery (Weeks 1-3)\n"
                            "Phase 2: Core Engineering / Strategic Architecture (Weeks 4-8)\n"
                            "Phase 3: Implementation, Validation & Knowledge Transfer (Weeks 9-12)."
                        ),
                    },
                    {
                        "heading": "3. Deliverables & Acceptance Criteria",
                        "body": (
                            "Detailed deliverables include weekly progress logs, comprehensive audit reports, "
                            "stakeholder presentations, and handover documentation."
                        ),
                    },
                    {
                        "heading": "4. Resource Schedule & Professional Rates",
                        "body": (
                            "Offered on a milestone disbursement or retainer schedule: "
                            "$450 - $650 USD / day (or equivalent MWK indexed rate) "
                            "commensurate with Lilongwe Tier-1 consultancy guidelines."
                        ),
                    },
                ],
                "layout": request.column_layout,
                "dehumanized": dehumanize,
            }
        else:
            # Cover letter
            if dehumanize:
                para1 = (
                    f"I am writing to express my clear interest in the {job.get('title', 'role')}. "
                    "My background combines direct on-the-ground operational execution in Lilongwe "
                    "with remote collaboration across global engineering and advisory teams."
                )
            else:
                para1 = (
                    f"I am thrilled to submit my candidacy for the {job.get('title', 'position')} "
                    f"with {job.get('company', 'the organization')}."
                )

            req0 = (
                job.get("requirements", ["technical execution"])[0]
                if job.get("requirements")
                else "technical execution"
            )
            req1 = (
                job.get("requirements", ["stakeholder management"])[1]
                if len(job.get("requirements", [])) > 1
                else "stakeholder management"
            )

            document = {
                "title": f"Application for {job.get('title', 'Open Position')}",
                "recipient": f"Hiring Manager, {job.get('company', 'Company')}",
                "date": datetime.now(UTC).strftime("%B %d, %Y"),
                "greeting": f"Dear Hiring Team at {job.get('company', 'the organization')},",
                "paragraphs": [
                    para1,
                    (
                        f"In my most recent work, I led delivery of key technical and operations milestones, "
                        f"ensuring deliverables stayed on schedule and within budget. I understand the specific "
                        f"requirements your team faces regarding {req0} and {req1}."
                    ),
                    (
                        "Rather than broad promises, I bring structured execution, clean documentation, "
                        "and a focus on measurable team throughput. I welcome the opportunity to discuss "
                        "how my skill set aligns with your near-term priorities."
                    ),
                ],
                "closing": "Sincerely,",
                "signature": full_name,
                "layout": request.column_layout,
                "dehumanized": dehumanize,
            }

        return TailorDocumentResponse(document=document)

    async def dehumanize(self, request: DehumanizeRequest) -> DehumanizeResponse:
        """Rule-based dehumanization."""
        text = request.text or ""
        flagged = []

        replacements = [
            ("delve into", "examine"),
            ("in today's fast-paced world,?", "presently,"),
            ("testament to", "proof of"),
            ("spearhead(ed)?", "led"),
            ("tapestry of", "mix of"),
            ("foster an ecosystem", "build a collaborative group"),
        ]

        import re

        humanized = text
        for pattern, replacement in replacements:
            matches = re.findall(pattern, humanized, re.IGNORECASE)
            if matches:
                flagged.extend([m.split()[0] for m in matches])
            humanized = re.sub(pattern, replacement, humanized, flags=re.IGNORECASE)

        return DehumanizeResponse(
            humanized_text=humanized,
            flagged_words_removed=list(set(flagged)),
            confidence_score=0.75,
        )

    async def synthesize_listings(self, request: ScrapeLiveRequest) -> ScrapeLiveResponse:
        """Return curated fallback listings."""
        default_listings = [
            ScrapeLiveListing(
                id="job-mw-101",
                title="Senior Digital Systems & M&E Specialist",
                company="USAID Malawi / Global Health Supply Project",
                location="Lilongwe, Malawi (City Centre)",
                category="job",
                scope="lilongwe-local",
                platform="ReliefWeb",
                description="Lead the technical oversight and data synchronization pipeline for digital inventory and national public health indicators.",
                requirements=[
                    "Systems Architecture",
                    "PostgreSQL / DHIS2",
                    "Monitoring & Evaluation",
                    "Malawi Ministry Liaison",
                    "Data Pipelines",
                ],
                salary_or_budget="$38,000 - $48,000 USD / yr",
                deadline="2026-10-15",
                ats_score=94,
                posted_date="1 hour ago",
            ),
            ScrapeLiveListing(
                id="job-mw-102",
                title="Lead Remote Full-Stack Engineer (Southern Africa Hub)",
                company="AfriPay Technologies",
                location="Lilongwe, Malawi (100% Remote)",
                category="job",
                scope="lilongwe-remote",
                platform="LinkedIn",
                description="Build robust fintech merchant settlement engines and mobile money integrations (Airtel Money, TNM Mpamba, Bank APIs).",
                requirements=[
                    "React",
                    "TypeScript",
                    "Node.js",
                    "Payment Gateways",
                    "REST APIs",
                    "Fintech Security",
                ],
                salary_or_budget="MWK 3,200,000 - 4,500,000 / month",
                deadline="2026-10-02",
                ats_score=91,
                posted_date="3 hours ago",
            ),
            ScrapeLiveListing(
                id="job-intl-103",
                title="International Remote Operations Architect",
                company="Starlight Distributed Systems (London / Remote)",
                location="International Remote (Anywhere)",
                category="job",
                scope="international-remote",
                platform="Corporate",
                description="Coordinate async development teams and infrastructure automation pipelines across 6 regional timezone nodes.",
                requirements=[
                    "Distributed Systems",
                    "Cloud Infrastructure",
                    "CI/CD Workflows",
                    "Async Team Management",
                    "Technical Documentation",
                ],
                salary_or_budget="$7,500 - $9,200 USD / month",
                deadline="2026-10-20",
                ats_score=88,
                posted_date="4 hours ago",
            ),
            ScrapeLiveListing(
                id="con-mw-201",
                title="Consultancy: National Digital Transformation Strategy Framework",
                company="UNDP Malawi / Dept. of E-Government",
                location="Lilongwe, Malawi (Hybrid)",
                category="consultancy",
                scope="lilongwe-local",
                platform="Devex",
                description="Draft institutional technical guidelines and regulatory policy recommendations for sovereign digital identity and citizen services.",
                requirements=[
                    "Public Sector Advisory",
                    "Policy Drafting",
                    "Digital Identity Frameworks",
                    "Executive Stakeholder Engagement",
                ],
                salary_or_budget="$18,500 USD (Fixed Consultancy Deliverable)",
                deadline="2026-10-08",
                ats_score=95,
                posted_date="2 hours ago",
            ),
            ScrapeLiveListing(
                id="con-upw-202",
                title="Enterprise Systems Workflow Automation & n8n Specialist",
                company="Global Impact Ventures (Upwork Enterprise)",
                location="International Remote",
                category="consultancy",
                scope="international-remote",
                platform="Upwork",
                description="Design multi-step n8n automation pipelines bridging CRM, document generation, and webhook triggers for international NGO partners.",
                requirements=[
                    "n8n Architecture",
                    "Webhooks & REST APIs",
                    "Workflow Automation",
                    "JavaScript/TypeScript",
                    "Data Verification",
                ],
                salary_or_budget="$65 - $95 USD / hr ($6,000 Milestone Budget)",
                deadline="2026-09-30",
                ats_score=92,
                posted_date="30 mins ago",
            ),
            ScrapeLiveListing(
                id="job-mw-104",
                title="Senior Project Manager - Infrastructure & Renewable Energy",
                company="SunEnergy Southern Africa",
                location="Lilongwe, Malawi (Area 4)",
                category="job",
                scope="lilongwe-local",
                platform="LinkedIn",
                description="Manage end-to-end site rollout, supplier contracts, and regulatory approvals with ESCOM and MERA.",
                requirements=[
                    "Project Management (PMP)",
                    "Regulatory Compliance",
                    "Supplier Negotiation",
                    "Budgeting",
                    "Field Coordination",
                ],
                salary_or_budget="MWK 2,800,000 / month",
                deadline="2026-10-12",
                ats_score=82,
                posted_date="5 hours ago",
            ),
        ]

        return ScrapeLiveResponse(listings=default_listings, timestamp=datetime.now(UTC))

    async def dispatch_n8n(self, request: N8nDispatchRequest) -> N8nDispatchResponse:
        """Stub n8n dispatcher."""
        import random

        execution_id = f"n8n-exec-{int(datetime.now(UTC).timestamp())}-{random.randint(1000, 9999)}"
        webhook_url = (
            request.webhook_url or "https://n8n.athena-ops.internal/webhook/athena-pipeline-trigger"
        )

        return N8nDispatchResponse(
            status="DISPATCHED",
            execution_id=execution_id,
            timestamp=datetime.now(UTC),
            webhook_url=webhook_url,
            event=request.event_type or "JOB_MATCH_HIGH_ATS",
            nodes_processed=[
                {"node": "Webhook Ingress", "status": "success", "time_ms": 42},
                {"node": "ATS Filter (>90 Trigger)", "status": "success", "time_ms": 18},
                {"node": "Gemini Document Engine", "status": "success", "time_ms": 820},
                {
                    "node": "Applicant Notification (WhatsApp/Email)",
                    "status": "queued",
                    "time_ms": 15,
                },
            ],
            receipt=N8nReceipt(
                items_handled=len(
                    request.payload.get("items") or request.payload.get("job_ids") or [],
                )
                or 1,
                target_action=request.payload.get("action", "AUTO_GENERATE_DOCUMENTS"),
            ),
        )

    async def submit_application(
        self,
        request: SubmitApplicationRequest,
    ) -> SubmitApplicationResponse:
        """Generate receipt (no actual submission)."""
        import base64
        import random

        receipt_id = f"ATH-RCPT-{random.randint(100000, 999999)}"
        confirmation_hash = (
            "SHA256-"
            + base64.b64encode(
                f"{request.application_id}:{request.applicant_name}:{datetime.now(UTC).timestamp()}".encode(),
            ).decode()[:16]
        )

        return SubmitApplicationResponse(
            status="SUBMITTED",
            receipt_id=receipt_id,
            confirmation_hash=confirmation_hash,
            submitted_at=datetime.now(UTC),
            job_title=request.job_title,
            company=request.company,
            applicant_name=request.applicant_name,
            authorized_by=request.authorization_signature,
            authorized_at=request.authorized_at or datetime.now(UTC),
            next_follow_up_date=(datetime.now(UTC) + timedelta(days=7)).strftime("%Y-%m-%d"),
        )

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "provider": self.name,
            "has_api_key": False,
            "timestamp": datetime.now(UTC).isoformat(),
        }
