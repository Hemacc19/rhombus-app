.PHONY: up down test seed clean

up:
	docker compose up --build -d

down:
	docker compose down

test:
	docker compose exec web pytest

seed:
	docker compose exec web python /app/../scripts/seed_s3_data.py

logs:
	docker compose logs -f
