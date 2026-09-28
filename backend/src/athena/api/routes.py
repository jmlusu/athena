import os
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from athena.documents import DocumentGenerator, DocumentOutput
from athena.timeutils import sort_key_utc

from ..ats import ats_scorer
from ..matching import matching_engine
from ..models import (
    Application,
    ApplicationStatus,
    Job,
    JobSource,
    JobStatus,
    JobType,
    UserProfile,
)
from ..scheduler import ScrapeConfig, athena_scheduler
from ..store import athena_db
from .schemas import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    ApplyRequest,
    ATSScoreResponse,
    CoverLetterRequest,
    DocumentGenerateResponse,
    DocumentResponse,
    FlagJobRequest,
    JobCreate,
    JobListResponse,
    JobResponse,
    MatchJobsRequest,
    MatchJobsResponse,
    PipelineStatsResponse,
    ReceiptListResponse,
    ReceiptResponse,
    ScrapeJobRequest,
    ScrapeJobResponse,
    ScrapeStatsResponse,
    TailorResumeRequest,
    UserProfileCreate,
    UserProfileResponse,
)

router = APIRouter(tags=["athena"])


# Job endpoints
@router.post("/jobs", response_model=JobResponse)
async def create_job(job: JobCreate):
    """Create a new job entry."""
    job_obj = Job(**job.model_dump())
    return athena_db.add_job(job_obj)


@router.get("/jobs", response_model=JobListResponse)
async def list_jobs(
    status: JobStatus | None = None,
    source: JobSource | None = None,
    job_type: JobType | None = None,
    location: str | None = None,
    min_ats_score: float | None = None,
    max_ats_score: float | None = None,
    min_match_score: float | None = None,
    max_match_score: float | None = None,
    search: str | None = None,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    """List jobs with filters."""
    jobs = athena_db.jobs.get_all()

    if status:
        jobs = [j for j in jobs if j.status == status]
    if source:
        jobs = [j for j in jobs if j.source == source]
    if job_type:
        jobs = [j for j in jobs if j.job_type == job_type]
    if location:
        jobs = [j for j in jobs if location.lower() in j.location.lower()]
    if min_ats_score is not None:
        jobs = [j for j in jobs if j.ats_score and j.ats_score >= min_ats_score]
    if max_ats_score is not None:
        jobs = [j for j in jobs if j.ats_score and j.ats_score <= max_ats_score]
    if min_match_score is not None:
        jobs = [j for j in jobs if j.match_score and j.match_score >= min_match_score]
    if max_match_score is not None:
        jobs = [j for j in jobs if j.match_score and j.match_score <= max_match_score]
    if search:
        search_lower = search.lower()
        jobs = [
            j
            for j in jobs
            if search_lower in j.title.lower()
            or search_lower in j.company.lower()
            or search_lower in j.description.lower()
        ]

    total = len(jobs)
    jobs.sort(key=lambda j: sort_key_utc(j.scraped_at), reverse=True)
    jobs = jobs[offset : offset + limit]

    return JobListResponse(
        jobs=[JobResponse.model_validate(j) for j in jobs],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID):
    """Get a single job by ID."""
    job = athena_db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)


@router.patch("/jobs/{job_id}", response_model=JobResponse)
async def update_job(job_id: UUID, updates: dict[str, Any]):
    """Update a job."""
    job = athena_db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for key, value in updates.items():
        if hasattr(job, key):
            setattr(job, key, value)

    return athena_db.update_job(job)


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: UUID):
    """Delete a job."""
    if not athena_db.jobs.delete(job_id):
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True}


# User Profile endpoints
@router.post("/profiles", response_model=UserProfileResponse)
async def create_profile(profile: UserProfileCreate):
    """Create a new user profile."""
    profile_obj = UserProfile(**profile.model_dump())
    return athena_db.add_user_profile(profile_obj)


@router.get("/profiles", response_model=list[UserProfileResponse])
async def list_profiles():
    """List all user profiles."""
    profiles = athena_db.user_profiles.get_all()
    return [UserProfileResponse.model_validate(p) for p in profiles]


@router.get("/profiles/{profile_id}", response_model=UserProfileResponse)
async def get_profile(profile_id: UUID):
    """Get a user profile by ID."""
    profile = athena_db.get_user_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserProfileResponse.model_validate(profile)


@router.get("/profiles/email/{email}", response_model=UserProfileResponse)
async def get_profile_by_email(email: str):
    """Get a user profile by email."""
    profile = athena_db.get_user_profile_by_email(email)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserProfileResponse.model_validate(profile)


@router.patch("/profiles/{profile_id}", response_model=UserProfileResponse)
async def update_profile(profile_id: UUID, updates: dict[str, Any]):
    """Update a user profile."""
    profile = athena_db.get_user_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    for key, value in updates.items():
        if hasattr(profile, key):
            setattr(profile, key, value)

    profile = UserProfile.model_validate(profile.model_dump())
    return athena_db.update_user_profile(profile)


# Application endpoints
@router.post("/applications", response_model=ApplicationResponse)
async def create_application(application: ApplicationCreate):
    """Create a new application."""
    job = athena_db.get_job(application.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    app = Application(
        **application.model_dump(),
        ats_score=job.ats_score or 0.0,
        match_score=job.match_score or 0.0,
    )
    return athena_db.add_application(app)


@router.get("/applications", response_model=ApplicationListResponse)
async def list_applications(
    user_profile_id: UUID | None = None,
    job_id: UUID | None = None,
    status: ApplicationStatus | None = None,
):
    """List applications with filters."""
    apps = athena_db.get_applications(user_profile_id, job_id, status)
    return ApplicationListResponse(
        applications=[ApplicationResponse.model_validate(a) for a in apps],
        total=len(apps),
    )


@router.get("/applications/{app_id}", response_model=ApplicationResponse)
async def get_application(app_id: UUID):
    """Get an application by ID."""
    app = athena_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse.model_validate(app)


@router.patch("/applications/{app_id}", response_model=ApplicationResponse)
async def update_application(app_id: UUID, updates: dict[str, Any]):
    """Update an application."""
    app = athena_db.get_application(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    for key, value in updates.items():
        if hasattr(app, key):
            setattr(app, key, value)

    return athena_db.update_application(app)


# Receipts endpoints
@router.get("/receipts", response_model=ReceiptListResponse)
async def list_receipts(
    user_profile_id: UUID | None = None,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    """List application receipts (applications with receipt_data)."""
    apps = athena_db.get_applications(user_profile_id, None, None)
    
    # Filter to only applications with receipt data
    receipts = []
    for app in apps:
        if app.receipt_data and app.receipt_data.get("receipt_id"):
            job = athena_db.get_job(app.job_id)
            profile = athena_db.get_user_profile(app.user_profile_id)
            
            receipt = ReceiptResponse(
                receipt_id=app.receipt_data.get("receipt_id", f"ATH-RCPT-{str(app.id)[:8]}"),
                confirmation_hash=app.receipt_data.get("confirmation_hash", f"SHA256-{str(app.id)}"),
                submitted_at=app.submitted_at or app.created_at,
                job_title=job.title if job else "Unknown Position",
                company=job.company if job else "Unknown Company",
                applicant_name=profile.full_name if profile else "Unknown Applicant",
                authorized_by=app.receipt_data.get("authorized_by", "System"),
                authorized_at=app.receipt_data.get("authorized_at", app.created_at),
                portal_name=app.receipt_data.get("portal_name", "Athena Direct"),
                follow_up_date=app.receipt_data.get("follow_up_date", (app.created_at).strftime("%Y-%m-%d")),
                status=app.receipt_data.get("status", "SUBMITTED"),
                notes=app.receipt_data.get("notes"),
            )
            receipts.append(receipt)
    
    # Sort by submitted_at descending (tolerates legacy naive timestamps)
    receipts.sort(key=lambda r: sort_key_utc(r.submitted_at), reverse=True)
    total = len(receipts)
    receipts = receipts[offset:offset + limit]
    
    return ReceiptListResponse(receipts=receipts, total=total)


@router.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(receipt_id: str):
    """Get a specific receipt by ID."""
    apps = athena_db.get_applications(None, None, None)
    
    for app in apps:
        if app.receipt_data and app.receipt_data.get("receipt_id") == receipt_id:
            job = athena_db.get_job(app.job_id)
            profile = athena_db.get_user_profile(app.user_profile_id)
            
            return ReceiptResponse(
                receipt_id=app.receipt_data.get("receipt_id", f"ATH-RCPT-{str(app.id)[:8]}"),
                confirmation_hash=app.receipt_data.get("confirmation_hash", f"SHA256-{str(app.id)}"),
                submitted_at=app.submitted_at or app.created_at,
                job_title=job.title if job else "Unknown Position",
                company=job.company if job else "Unknown Company",
                applicant_name=profile.full_name if profile else "Unknown Applicant",
                authorized_by=app.receipt_data.get("authorized_by", "System"),
                authorized_at=app.receipt_data.get("authorized_at", app.created_at),
                portal_name=app.receipt_data.get("portal_name", "Athena Direct"),
                follow_up_date=app.receipt_data.get("follow_up_date", (app.created_at).strftime("%Y-%m-%d")),
                status=app.receipt_data.get("status", "SUBMITTED"),
                notes=app.receipt_data.get("notes"),
            )
    
    raise HTTPException(status_code=404, detail="Receipt not found")


# Profile Documents endpoints
@router.get("/profiles/{profile_id}/documents", response_model=list[DocumentResponse])
async def list_profile_documents(profile_id: UUID):
    """List all documents for a user profile."""
    profile = athena_db.get_user_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    documents = []
    for doc in profile.documents:
        if isinstance(doc, dict):
            documents.append(DocumentResponse(**doc))
        else:
            documents.append(DocumentResponse.model_validate(doc))
    
    return documents


@router.post("/profiles/{profile_id}/documents", response_model=DocumentResponse)
async def upload_profile_document(
    profile_id: UUID,
    document: DocumentResponse,
):
    """Add a document to a user profile."""
    profile = athena_db.get_user_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Convert to dict for storage
    doc_dict = document.model_dump()
    profile.documents.append(doc_dict)
    athena_db.update_user_profile(profile)
    
    return document


@router.delete("/profiles/{profile_id}/documents/{document_id}")
async def delete_profile_document(profile_id: UUID, document_id: UUID):
    """Remove a document from a user profile."""
    profile = athena_db.get_user_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Find and remove the document
    original_count = len(profile.documents)
    profile.documents = [
        doc for doc in profile.documents
        if str(doc.get("id") if isinstance(doc, dict) else doc.id) != str(document_id)
    ]
    
    if len(profile.documents) == original_count:
        raise HTTPException(status_code=404, detail="Document not found")
    
    athena_db.update_user_profile(profile)
    return {"success": True}


# Combined Stats endpoint
@router.get("/stats", response_model=dict[str, Any])
async def get_combined_stats():
    """Get combined statistics for dashboard."""
    pipeline_stats = await get_pipeline_stats()
    scraping_stats = await get_scraping_stats()
    
    return {
        "pipeline": pipeline_stats.model_dump(),
        "scraping": scraping_stats.model_dump(),
    }


# Job action endpoints
def _persist_document_output(output: DocumentOutput, job: Job) -> DocumentGenerateResponse:
    """Write a generated document under the Athena data directory."""
    out_dir = athena_db.base_dir / "documents" / str(job.id)
    out_dir.mkdir(parents=True, exist_ok=True)

    filename = Path(output.filename).name
    docx_name = Path(filename).with_suffix(".docx")
    out_dir.joinpath(docx_name).write_bytes(output.docx_bytes)
    if output.pdf_bytes is not None:
        out_dir.joinpath(Path(filename).with_suffix(".pdf")).write_bytes(output.pdf_bytes)

    return DocumentGenerateResponse(
        filename=filename,
        path=str(out_dir / filename),
        warnings=list(output.warnings),
    )


@router.post("/jobs/{job_id}/apply", response_model=ApplicationResponse)
async def apply_to_job(job_id: UUID, request: ApplyRequest) -> ApplicationResponse:
    """Apply to a job with a tailored resume."""
    job = athena_db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    profile = athena_db.get_user_profile(request.user_profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    documents: Any = profile.documents
    resume_ids = {str(doc.get("id") if isinstance(doc, dict) else doc.id) for doc in documents}
    if str(request.resume_id) not in resume_ids:
        raise HTTPException(status_code=404, detail="Resume not found")

    app = Application(
        job_id=job.id,
        user_profile_id=profile.id,
        resume_id=request.resume_id,
        cover_letter_id=request.cover_letter_id,
        ats_score=job.ats_score or 0.0,
        match_score=job.match_score or 0.0,
    )
    created = athena_db.add_application(app)

    job.status = JobStatus.APPLIED
    athena_db.update_job(job)

    return ApplicationResponse.model_validate(created)


@router.post("/jobs/{job_id}/tailor-resume", response_model=DocumentGenerateResponse)
async def tailor_resume(job_id: UUID, request: TailorResumeRequest) -> DocumentGenerateResponse:
    """Generate a resume tailored to a job."""
    job = athena_db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    profile = athena_db.get_user_profile(request.user_profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    output = await DocumentGenerator().generate_resume(profile, job, request.output_format)
    return _persist_document_output(output, job)


@router.post("/jobs/{job_id}/cover-letter", response_model=DocumentGenerateResponse)
async def generate_job_cover_letter(
    job_id: UUID,
    request: CoverLetterRequest,
) -> DocumentGenerateResponse:
    """Generate a cover letter for a job."""
    job = athena_db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    profile = athena_db.get_user_profile(request.user_profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    output = await DocumentGenerator().generate_cover_letter(profile, job, request.output_format)
    return _persist_document_output(output, job)


@router.post("/jobs/{job_id}/flag", response_model=JobResponse)
async def flag_job(job_id: UUID, request: FlagJobRequest | None = None) -> JobResponse:
    """Flag a job for review."""
    job = athena_db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = JobStatus.FLAGGED
    if request is not None and request.reason:
        job.metadata["flag_reason"] = request.reason

    return JobResponse.model_validate(athena_db.update_job(job))


# Scraping endpoints
@router.post("/scrape", response_model=ScrapeJobResponse)
async def trigger_scrape(request: ScrapeJobRequest, background_tasks: BackgroundTasks):
    """Trigger a scrape job."""
    # Test mode: return mock response instantly without hitting external APIs
    if os.getenv("ATHENA_TEST_MODE") == "true":
        from datetime import datetime, UTC
        from uuid import uuid4
        
        # Return the seeded test jobs (5 jobs from global-setup)
        mock_scrape_job = ScrapeJobResponse(
            id=uuid4(),
            source=JobSource.LINKEDIN,
            query=request.query or "software engineer",
            location=request.location,
            job_type=request.job_type,
            max_results=request.max_results or 100,
            status="completed",
            jobs_found=5,
            jobs_new=5,
            jobs_updated=0,
            error=None,
            started_at=datetime.now(UTC),
            completed_at=datetime.now(UTC),
            created_at=datetime.now(UTC),
        )
        return mock_scrape_job
    
    config = ScrapeConfig(
        query=request.query,
        location=request.location,
        job_type=request.job_type,
        max_results=request.max_results,
        sources=request.sources,
        user_profile_id=request.user_profile_id,
    )
    scrape_job = await athena_scheduler.run_scrape_config(config)
    return ScrapeJobResponse.model_validate(scrape_job)


@router.get("/scrape/history", response_model=list[ScrapeJobResponse])
async def get_scrape_history(limit: int = 50):
    """Get recent scrape job history."""
    jobs = athena_db.get_recent_scrape_jobs(limit)
    return [ScrapeJobResponse.model_validate(j) for j in jobs]


# Matching & Scoring endpoints
@router.post("/process")
async def process_jobs():
    """Re-run matching/scoring for all NEW/FETCHED jobs (e.g. after profile save)."""
    await athena_scheduler.process_new_jobs()
    jobs = athena_db.jobs.get_all()
    scored = len([j for j in jobs if j.status == JobStatus.SCORED])
    return {"status": "processed", "total_jobs": len(jobs), "scored": scored}


@router.post("/match", response_model=MatchJobsResponse)
async def match_jobs(request: MatchJobsRequest):
    """Match jobs against a user profile."""
    profile = athena_db.get_user_profile(request.profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    jobs: list[Job] = []
    if request.job_ids:
        jobs = [j for j in (athena_db.get_job(jid) for jid in request.job_ids) if j is not None]
    else:
        jobs = athena_db.jobs.get_all()

    scored = matching_engine.rank_jobs(profile, jobs, request.top_k)

    if request.min_score > 0:
        scored = [(j, s) for j, s in scored if s >= request.min_score]

    matches = [
        {
            "job": JobResponse.model_validate(job),
            "match_score": score,
            "match_tier": job.match_tier.value if job.match_tier else None,
        }
        for job, score in scored
    ]

    return MatchJobsResponse(matches=matches, total=len(matches))


@router.get("/score/{job_id}/{profile_id}", response_model=ATSScoreResponse)
async def get_ats_score(job_id: UUID, profile_id: UUID):
    """Get ATS score for a job-profile pair."""
    job = athena_db.get_job(job_id)
    profile = athena_db.get_user_profile(profile_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    breakdown = ats_scorer.score_resume_against_job(profile, job)

    return ATSScoreResponse(
        job_id=job_id,
        profile_id=profile_id,
        keyword_match=breakdown.keyword_match,
        semantic_similarity=breakdown.semantic_similarity,
        experience_relevance=breakdown.experience_relevance,
        education_match=breakdown.education_match,
        overall=breakdown.overall,
        details=breakdown.details,
        tier=ats_scorer.get_score_tier(breakdown.overall),
        should_auto_apply=ats_scorer.should_auto_apply(breakdown.overall),
        should_flag_for_review=ats_scorer.should_flag_for_review(breakdown.overall),
    )


# Statistics endpoints
@router.get("/stats/pipeline", response_model=PipelineStatsResponse)
async def get_pipeline_stats():
    """Get job pipeline statistics."""
    jobs = athena_db.jobs.get_all()

    by_status = {}
    for status in JobStatus:
        by_status[status.value] = len([j for j in jobs if j.status == status])

    by_source = {}
    for source in JobSource:
        count = len([j for j in jobs if j.source == source])
        if count > 0:
            by_source[source.value] = count

    by_type = {}
    for jtype in JobType:
        count = len([j for j in jobs if j.job_type == jtype])
        if count > 0:
            by_type[jtype.value] = count

    ats_scores = [j.ats_score for j in jobs if j.ats_score is not None]
    match_scores = [j.match_score for j in jobs if j.match_score is not None]

    return PipelineStatsResponse(
        total_jobs=len(jobs),
        new=by_status.get(JobStatus.NEW.value, 0),
        fetched=by_status.get(JobStatus.FETCHED.value, 0),
        matched=by_status.get(JobStatus.MATCHED.value, 0),
        scored=by_status.get(JobStatus.SCORED.value, 0),
        applied=by_status.get(JobStatus.APPLIED.value, 0),
        interview=by_status.get(JobStatus.INTERVIEW.value, 0),
        offer=by_status.get(JobStatus.OFFER.value, 0),
        rejected=by_status.get(JobStatus.REJECTED.value, 0),
        by_source=by_source,
        by_type=by_type,
        avg_ats_score=sum(ats_scores) / len(ats_scores) if ats_scores else 0,
        avg_match_score=sum(match_scores) / len(match_scores) if match_scores else 0,
    )


@router.get("/stats/scraping", response_model=ScrapeStatsResponse)
async def get_scraping_stats():
    """Get scraping statistics."""
    scrape_jobs = athena_db.get_recent_scrape_jobs(20)
    total_scraped = sum(j.jobs_found for j in scrape_jobs)
    total_new = sum(j.jobs_new for j in scrape_jobs)
    last_scrape = scrape_jobs[0].completed_at if scrape_jobs else None

    return ScrapeStatsResponse(
        recent_scrapes=[ScrapeJobResponse.model_validate(j) for j in scrape_jobs],
        total_jobs_scraped=total_scraped,
        total_new_jobs=total_new,
        last_scrape_at=last_scrape,
    )


# Scheduler control
@router.post("/scheduler/start")
async def start_scheduler():
    """Start the Athena scheduler."""
    if not athena_scheduler._running:
        athena_scheduler.start()
    return {"status": "started", "running": athena_scheduler._running}


@router.post("/scheduler/stop")
async def stop_scheduler():
    """Stop the Athena scheduler."""
    if athena_scheduler._running:
        athena_scheduler.stop()
    return {"status": "stopped", "running": athena_scheduler._running}


@router.get("/scheduler/status")
async def get_scheduler_status():
    """Get scheduler status."""
    jobs = []
    for job in athena_scheduler.scheduler.get_jobs():
        jobs.append(
            {
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            },
        )
    return {"running": athena_scheduler._running, "jobs": jobs}
