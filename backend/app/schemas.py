"""Schemas públicos da API."""

from __future__ import annotations

import re
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

MAX_PRECO = Decimal("99999999.99")


class LoteCreate(BaseModel):
    numero: str = Field(max_length=50)
    preco: Decimal = Field(gt=0, le=MAX_PRECO, max_digits=10, decimal_places=2)

    @field_validator("numero", mode="before")
    @classmethod
    def normalize_numero(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("numero")
    @classmethod
    def validate_numero(cls, value: str) -> str:
        if not value:
            raise ValueError("O número do lote não pode ser vazio.")
        if not re.fullmatch(r"\d+", value):
            raise ValueError("O número do lote deve conter apenas dígitos.")
        return value


class LoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str
    preco: Decimal

    @field_serializer("preco", when_used="json", return_type=float)
    def serialize_preco(self, value: Decimal) -> float:
        return float(value)


class LotesPage(BaseModel):
    itens: list[LoteResponse]
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
