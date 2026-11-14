from app.db.base import Base
from app.main import app
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import configure_mappers

client = TestClient(app)


def test_health_endpoint_reports_service_status() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "fitwithram-api"}


def test_openapi_docs_are_available() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["title"] == "FITWITHRAM"


def test_domain_models_build_a_consistent_relational_schema() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    configure_mappers()
    Base.metadata.create_all(engine)

    expected_tables = {
        "organizations",
        "branches",
        "users",
        "memberships",
        "payments",
        "attendance",
        "fitness_classes",
        "class_bookings",
        "audit_logs",
    }
    assert expected_tables.issubset(Base.metadata.tables)
