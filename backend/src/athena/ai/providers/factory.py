"""Factory for creating AI provider instances."""

import os

from athena.ai.providers.base import AthenaAIProvider
from athena.ai.providers.fallback import FallbackProvider
from athena.ai.providers.gemini import GeminiProvider


def get_ai_provider(provider_name: str | None = None) -> AthenaAIProvider:
    """Get AI provider instance based on configuration.

    Args:
        provider_name: Override provider name. If None, reads from ATHENA_AI_PROVIDER env var.

    Returns:
        Configured AI provider instance.
    """
    name = (provider_name or os.environ.get("ATHENA_AI_PROVIDER", "fallback")).lower()

    if name == "gemini":
        api_key = os.environ.get("GEMINI_API_KEY")
        model = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
        return GeminiProvider(api_key=api_key, model=model)

    return FallbackProvider()


# Convenience function for getting provider with explicit config
def create_provider(
    provider_type: str,
    api_key: str | None = None,
    model: str | None = None,
    **_kwargs,
) -> AthenaAIProvider:
    """Create a specific provider with explicit configuration."""
    if provider_type == "gemini":
        return GeminiProvider(api_key=api_key, model=model or "gemini-3.8-flash")
    if provider_type == "fallback":
        return FallbackProvider()
    raise ValueError(f"Unknown provider type: {provider_type}")  # noqa: TRY003
