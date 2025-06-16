build_base:
	docker build --no-cache -t workbench_base:latest -f dockerfile.base .

build_uv:
	docker build --no-cache -t workbench_uv:latest -f dockerfile.uv .

build_service:
	tar -hczvf src.tar.gz --directory=.. app
	docker build --no-cache -t workbench:latest -f dockerfile.service  . 
	rm src.tar.gz

build: build_base build_uv build_service