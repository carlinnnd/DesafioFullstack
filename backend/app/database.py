"""Conexão e ciclo de vida do banco SQLite."""

from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


def default_database_url() -> str:
    data_directory = Path(__file__).resolve().parents[1] / "data"
    data_directory.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{(data_directory / 'lotes.db').as_posix()}"


DATABASE_URL = os.getenv("DATABASE_URL", default_database_url())


def make_engine(database_url: str = DATABASE_URL) -> Engine:
    options: dict[str, object] = {}
    if database_url.startswith("sqlite"):
        options["connect_args"] = {"check_same_thread": False}
    if database_url == "sqlite://":
        options["poolclass"] = StaticPool
    return create_engine(database_url, **options)


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
