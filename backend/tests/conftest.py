from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import get_session
from app.main import create_app


@pytest.fixture
def client(tmp_path) -> Generator[TestClient, None, None]:
    database_url = f"sqlite:///{(tmp_path / 'test.db').as_posix()}"
    test_engine = create_engine(database_url, connect_args={"check_same_thread": False})
    TestSession = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    application = create_app(test_engine)

    def override_get_session() -> Generator[Session, None, None]:
        with TestSession() as session:
            yield session

    application.dependency_overrides[get_session] = override_get_session
    with TestClient(application) as test_client:
        yield test_client
    test_engine.dispose()
