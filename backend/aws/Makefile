
login:
	aws sso login --profile AdministratorAccess-797161732516

deploy:
	cdk deploy  --app "python app.py" --profile AdministratorAccess-797161732516

push:
	aws ecr get-login-password --region us-east-1 --profile AdministratorAccess-797161732516 \
	 | docker login --username AWS --password-stdin 797161732516.dkr.ecr.us-east-1.amazonaws.com
	docker tag workbench:latest 797161732516.dkr.ecr.us-east-1.amazonaws.com/workbench:latest
	docker push 797161732516.dkr.ecr.us-east-1.amazonaws.com/workbench:latest
