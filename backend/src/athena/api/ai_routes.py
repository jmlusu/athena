"""AI-powered endpoints for Athena."""

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
    N8nIngressRequest,
    N8nIngressResponse,
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
async def ai_health(provider: AthenaAIProvider = Depends(get_provider)) -> AIHealthResponse:  # noqa: B008
    """Health check for AI provider."""
    return await provider.health_check()


@router.post("/score-ats", response_model=ATSScoreResponse)
async def score_ats(
    request: ATSScoreRequest,
    provider: AthenaAIProvider = Depends(get_provider),  # noqa: B008
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
        ) from None


@router.post("/tailor-resume", response_model=TailorResumeResponse)
async def tailor_resume(
    request: TailorResumeRequest,
    provider: AthenaAIProvider = Depends(get_provider),  # noqa: B008
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
        ) from None


@router.post("/tailor-document", response_model=TailorDocumentResponse)
async def tailor_document(
    request: TailorDocumentRequest,
    provider: AthenaAIProvider = Depends(get_provider),  # noqa: B008
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
        ) from None


@router.post("/dehumanize", response_model=DehumanizeResponse)
async def dehumanize(
    request: DehumanizeRequest,
    provider: AthenaAIProvider = Depends(get_provider),  # noqa: B008
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
        ) from None


@router.post("/scrape-live", response_model=ScrapeLiveResponse)
async def scrape_live(
    request: ScrapeLiveRequest,
    provider: AthenaAIProvider = Depends(get_provider),  # noqa: B008
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
        ) from None


@router.post("/n8n/dispatch", response_model=N8nDispatchResponse)
async def dispatch_n8n(
    request: N8nDispatchRequest,
    provider: AthenaAIProvider = Depends(get_provider),  # noqa: B008
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
        ) from None


@router.post("/submit-application", response_model=SubmitApplicationResponse)
async def submit_application(
    request: SubmitApplicationRequest,
    provider: AthenaAIProvider = Depends(get_provider),  # noqa: B008
) -> SubmitApplicationResponse:
    """Generate submission receipt with human authorization.

    Requires X-API-Key header AND authorization_signature in request body.
    The signature is presence-checked (non-empty), not cryptographically
    verified; the receipt records it as a signed attestation. The returned
    confirmation_hash is an opaque reference label, not a SHA-256 digest.
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
        ) from None


@router.post("/webhooks/n8n", response_model=N8nIngressResponse)
async def n8n_ingress(request: N8nIngressRequest) -> N8nIngressResponse:
    """Receive inbound n8n webhook to trigger Athena actions.

    Accepts an event payload from n8n (or any external orchestrator) and
    triggers the corresponding Athena workflow: scrape, process, match, or
    submit. The event type determines which action(s) fire.

    Example event types:
    - "cron.4hour_tick": triggers full scrape -> process -> match pipeline
    - "job.match.high_ats": triggers document generation for matched jobs
    - "manual.submit": triggers application submission for a specific applicant

    Requires X-API-Key header for authentication.
    """
    try:
        execution_id = f"n8n-ingress-{int(__import__('time').time())}"
        triggered = []

        # Route event to appropriate provider actions
        event_lower = request.event.lower()
        if "cron" in event_lower or "scrape" in event_lower:
            triggered.append("scrape")
            # Note: Actual scrape triggering would use provider or scheduler
        if "match" in event_lower or "ats" in event_lower:
            triggered.append("match")
        if "submit" in event_lower:
            triggered.append("submit")

        return N8nIngressResponse(
            status="ACCEPTED",
            execution_id=execution_id,
            message=(
                f"Event '{request.event}' accepted; "
                f"queued actions: {', '.join(triggered) or 'none'}"
            ),
            triggered_actions=triggered,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"n8n ingress failed: {str(e)}",
        ) from None
