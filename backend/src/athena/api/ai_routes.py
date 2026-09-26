"""AI-powered endpoints for Athena."""

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from athena.ai import get_ai_provider
from athena.ai.providers.base import AthenaAIProvider
from athena.api.ai_schemas import (
    AIHealthResponse,
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

router = APIRouter(prefix="/ai", tags=["athena-ai"])


async def get_provider() -> AthenaAIProvider:
    """Dependency to get configured AI provider."""
    return get_ai_provider()


@router.get("/health", response_model=AIHealthResponse)
async def ai_health(provider: AthenaAIProvider = Depends(get_provider)) -> AIHealthResponse:
    """Health check for AI provider."""
    return await provider.health_check()


@router.post("/score-ats", response_model=ATSScoreResponse)
async def score_ats(
    request: ATSScoreRequest,
    provider: AthenaAIProvider = Depends(get_provider),
) -> ATSScoreResponse:
    """Score a job/profile pair using AI-powered ATS evaluation.

    Requires X-API-Key header for authentication.
    Falls back to deterministic scoring if no AI provider key configured.
    """
    try:
        return await provider.score_ats(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS scoring failed: {str(e)}",
        )


@router.post("/tailor-resume", response_model=TailorResumeResponse)
async def tailor_resume(
    request: TailorResumeRequest,
    provider: AthenaAIProvider = Depends(get_provider),
) -> TailorResumeResponse:
    """Generate a tailored resume for a job/profile pair.

    Supports one-column and two-column layouts with optional dehumanization.
    Requires X-API-Key header for authentication.
    """
    try:
        return await provider.tailor_resume(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume tailoring failed: {str(e)}",
        )


@router.post("/tailor-document", response_model=TailorDocumentResponse)
async def tailor_document(
    request: TailorDocumentRequest,
    provider: AthenaAIProvider = Depends(get_provider),
) -> TailorDocumentResponse:
    """Generate a tailored document (cover letter, executive summary, or consultancy proposal).

    Supports multiple document types with optional dehumanization.
    Requires X-API-Key header for authentication.
    """
    try:
        return await provider.tailor_document(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document tailoring failed: {str(e)}",
        )


@router.post("/dehumanize", response_model=DehumanizeResponse)
async def dehumanize(
    request: DehumanizeRequest,
    provider: AthenaAIProvider = Depends(get_provider),
) -> DehumanizeResponse:
    """Remove AI tells from text to produce authentic human voice.

    Requires X-API-Key header for authentication.
    """
    try:
        return await provider.dehumanize(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dehumanization failed: {str(e)}",
        )


@router.post("/scrape-live", response_model=ScrapeLiveResponse)
async def scrape_live(
    request: ScrapeLiveRequest,
    provider: AthenaAIProvider = Depends(get_provider),
) -> ScrapeLiveResponse:
    """Synthesize job listings via AI (fallback mode).

    Note: This endpoint uses AI synthesis as a fallback. Primary job discovery
    should use the real scrapers via POST /api/v1/athena/scrape.
    """
    try:
        return await provider.synthesize_listings(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Live scraping failed: {str(e)}",
        )


@router.post("/n8n/dispatch", response_model=N8nDispatchResponse)
async def dispatch_n8n(
    request: N8nDispatchRequest,
    provider: AthenaAIProvider = Depends(get_provider),
) -> N8nDispatchResponse:
    """Dispatch n8n webhook trigger.

    Requires X-API-Key header for authentication.
    """
    try:
        return await provider.dispatch_n8n(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"n8n dispatch failed: {str(e)}",
        )


@router.post("/submit-application", response_model=SubmitApplicationResponse)
async def submit_application(
    request: SubmitApplicationRequest,
    provider: AthenaAIProvider = Depends(get_provider),
) -> SubmitApplicationResponse:
    """Generate submission receipt with human authorization.

    Requires X-API-Key header AND authorization_signature in request body.
    This is the formal submission endpoint that creates a cryptographic receipt.
    """
    if not request.authorization_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required human applicant authorization signature.",
        )

    try:
        return await provider.submit_application(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Application submission failed: {str(e)}",
        )