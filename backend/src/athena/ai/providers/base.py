"""Abstract base class for Athena AI providers."""

from abc import ABC, abstractmethod
from typing import Any

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


class AthenaAIProvider(ABC):
    """Abstract base class for Athena AI providers.

    All AI providers (Gemini, OmniRoute, Local, Fallback) must implement this interface.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the provider name (e.g., 'gemini', 'fallback')."""
        ...

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Return True if the provider is configured and available."""
        ...

    @abstractmethod
    async def score_ats(self, request: ATSScoreRequest) -> ATSScoreResponse:
        """Score a job/profile pair using AI."""
        ...

    @abstractmethod
    async def tailor_resume(self, request: TailorResumeRequest) -> TailorResumeResponse:
        """Generate a tailored resume."""
        ...

    @abstractmethod
    async def tailor_document(self, request: TailorDocumentRequest) -> TailorDocumentResponse:
        """Generate a tailored document (cover letter, proposal, executive summary)."""
        ...

    @abstractmethod
    async def dehumanize(self, request: DehumanizeRequest) -> DehumanizeResponse:
        """Remove AI tells from text."""
        ...

    @abstractmethod
    async def synthesize_listings(self, request: ScrapeLiveRequest) -> ScrapeLiveResponse:
        """Synthesize job listings via AI (fallback only)."""
        ...

    @abstractmethod
    async def dispatch_n8n(self, request: N8nDispatchRequest) -> N8nDispatchResponse:
        """Dispatch n8n webhook (stub implementation)."""
        ...

    @abstractmethod
    async def submit_application(
        self,
        request: SubmitApplicationRequest,
    ) -> SubmitApplicationResponse:
        """Generate submission receipt (no actual submission)."""
        ...

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        """Return provider health status."""
        ...
