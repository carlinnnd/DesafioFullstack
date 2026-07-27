"""Configurações centralizadas da aplicação."""

from __future__ import annotations

import os


def cors_origins() -> list[str]:
    """Retorna as origens liberadas para o frontend local."""

    configured = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in configured.split(",") if origin.strip()]
