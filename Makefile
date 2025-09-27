try-build:
	REGISTRY=localhost NEXT_IMAGE_TAG=0 FRONT_IMAGE_TAG=0 FRONT_IMAGE_NAME=front-image NEXT_IMAGE_NAME=next-image make build

build: build-frontend build-nextjs

build-frontend:
	docker --log-level=debug build --pull --file=docker/production/nginx/Dockerfile --tag=${REGISTRY}/${FRONT_IMAGE_NAME}:${FRONT_IMAGE_TAG} .

build-nextjs:
	docker --log-level=debug build --pull --file=docker/production/node/Dockerfile --tag=${REGISTRY}/${NEXT_IMAGE_NAME}:${NEXT_IMAGE_TAG} .

push: push-frontend push-nextjs

push-frontend:
	docker push ${REGISTRY}/${FRONT_IMAGE_NAME}:${FRONT_IMAGE_TAG}

push-nextjs:
	docker push ${REGISTRY}/${NEXT_IMAGE_NAME}:${INEXT_IMAGE_TAG}

down:
	docker compose down --remove-orphans