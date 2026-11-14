.PHONY: dev-up dev-down api web migrate test-api

dev-up:
	docker compose up --build

dev-down:
	docker compose down

api:
	uvicorn app.main:app --app-dir apps/api --reload --port 8000

web:
	cd apps/web && npm run dev

migrate:
	alembic -c apps/api/alembic.ini upgrade head

test-api:
	pytest
