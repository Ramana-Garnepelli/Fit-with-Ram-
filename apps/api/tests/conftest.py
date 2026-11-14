from collections.abc import Generator

import pytest
from app.db.base import Base
from app.db.models import Branch, Organization
from app.db.session import get_db
from app.main import app
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def app_client() -> Generator[tuple[TestClient, Organization, Branch], None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_db():
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    with testing_session() as db:
        organization = Organization(name="FitWithRam", slug="fitwithram")
        db.add(organization)
        db.flush()
        branch = Branch(organization_id=organization.id, name="Central", slug="central")
        db.add(branch)
        db.commit()
        db.refresh(organization)
        db.refresh(branch)

    with TestClient(app) as client:
        yield client, organization, branch

    app.dependency_overrides.clear()
    engine.dispose()
