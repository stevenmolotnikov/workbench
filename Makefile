build_base:
	docker build --no-cache -t workbench_base:latest -f docker/dockerfile.base .

build_uv:
	docker build --no-cache -t workbench_uv:latest -f docker/dockerfile.uv .

build_service:
	docker build --no-cache -t workbench:latest -f docker/dockerfile.service .

build: build_base build_uv build_service

# Docker commands
up:
	docker run --name workbench-api -p 8000:8000 -e ENVIRONMENT=docker workbench:latest

down:
	docker stop workbench-api
	docker rm workbench-api

clean:
	docker stop workbench-api 2>/dev/null || true
	docker rm workbench-api 2>/dev/null || true
	docker system prune -f

modal:
	modal deploy modal/image.py