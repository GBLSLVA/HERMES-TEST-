.PHONY: infra-up infra-down migrate api test lint web

infra-up:
	docker compose up -d postgres redis

infra-down:
	docker compose down

migrate:
	cd apps/api && alembic upgrade head

api:
	cd apps/api && uvicorn hermes_api.main:app --reload

test:
	cd apps/api && pytest -q

lint:
	cd apps/api && ruff check src tests

web:
	cd apps/web && npm run dev
