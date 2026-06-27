.PHONY: build up down logs check health ready

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f api

check:
	npm run check

health:
	curl -fsS http://127.0.0.1:3010/health | jq .

ready:
	curl -fsS http://127.0.0.1:3010/ready | jq .
