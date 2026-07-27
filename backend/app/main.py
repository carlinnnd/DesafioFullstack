"""Ponto de entrada da API FastAPI."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from math import ceil
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, HTTPException, Path, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Engine, asc, desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import cors_origins
from app.database import engine, get_session
from app.models import Base, Lote
from app.schemas import LoteCreate, LoteResponse, LotesPage

OrderField = Literal["id", "numero", "preco"]
OrderDirection = Literal["asc", "desc"]


def create_app(database_engine: Engine = engine) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        Base.metadata.create_all(bind=database_engine)
        yield

    application = FastAPI(
        title="API de Lotes de Leilão",
        version="1.0.0",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @application.get("/lotes", response_model=LotesPage, tags=["lotes"])
    def list_lotes(
        session: Annotated[Session, Depends(get_session)],
        pagina: Annotated[int, Query(ge=1)] = 1,
        por_pagina: Annotated[int, Query(ge=1, le=100)] = 10,
        ordenar: OrderField = "id",
        direcao: OrderDirection = "desc",
        busca: Annotated[str | None, Query(max_length=50, pattern=r"^\d+$")] = None,
    ) -> LotesPage:
        filters = [Lote.numero == busca] if busca else []
        total = session.scalar(select(func.count()).select_from(Lote).where(*filters)) or 0
        columns = {"id": Lote.id, "numero": Lote.numero, "preco": Lote.preco}
        order_column = columns[ordenar]
        primary_order = asc(order_column) if direcao == "asc" else desc(order_column)
        tie_breaker = asc(Lote.id) if direcao == "asc" else desc(Lote.id)
        statement = (
            select(Lote)
            .where(*filters)
            .order_by(primary_order, tie_breaker)
            .offset((pagina - 1) * por_pagina)
            .limit(por_pagina)
        )
        lots = list(session.scalars(statement))
        return LotesPage(
            itens=lots,
            total=total,
            pagina=pagina,
            por_pagina=por_pagina,
            total_paginas=ceil(total / por_pagina) if total else 0,
        )

    @application.post(
        "/lotes",
        response_model=LoteResponse,
        status_code=status.HTTP_201_CREATED,
        tags=["lotes"],
    )
    def create_lote(
        payload: LoteCreate,
        response: Response,
        session: Annotated[Session, Depends(get_session)],
    ) -> Lote:
        lote = Lote(numero=payload.numero, preco=payload.preco)
        session.add(lote)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um lote com este número.",
            ) from None
        session.refresh(lote)
        response.headers["Location"] = f"/lotes/{lote.id}"
        return lote

    @application.get("/lotes/{lote_id}", response_model=LoteResponse, tags=["lotes"])
    def get_lote(
        lote_id: Annotated[int, Path(ge=1)],
        session: Annotated[Session, Depends(get_session)],
    ) -> Lote:
        lote = session.get(Lote, lote_id)
        if lote is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lote não encontrado.",
            )
        return lote

    return application


app = create_app()
