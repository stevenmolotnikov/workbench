
build_base:
	docker build --no-cache -t workbench_base:latest -f dockerfile.base .

build_conda:
	docker build --no-cache -t workbench_conda:latest -f dockerfile.conda .

build_service:
	tar -hczvf src.tar.gz --directory=.. app
	docker build --no-cache -t workbench:latest -f dockerfile.service  . 
	rm src.tar.gz