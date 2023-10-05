########################
# Installation Process #
########################
# 1. Build			   #
# 2. Install		   #
# 3. Permission		   #
# 4. Start			   #
########################

# Define common Docker run options
DOCKER_RUN_OPTIONS := -it -p 3456:3456 -v "$(shell pwd)":/app

# Docker image name
DOCKER_IMAGE := ubuntu_shopify_custom_app

# Docker container working directory
CONTAINER_WORKDIR := /app

# Docker container installation directory
INSTALL_WORKDIR := /app

# Build Docker Image
buildd:
	docker build -t $(DOCKER_IMAGE) .
# docker build -t ubuntu_shopify_custom_app .

# Install Shopify
install:
	docker run $(DOCKER_RUN_OPTIONS) --network=host -w $(INSTALL_WORKDIR) $(DOCKER_IMAGE) npm init @shopify/app@latest -y
# docker run -it -p 3456:3456 -v "$(pwd)":/app --network=host -w /app ubuntu_shopify_custom_app npm init @shopify/app@latest -y

# Change Permission
permission:
	docker run $(DOCKER_RUN_OPTIONS) --network=host -w $(INSTALL_WORKDIR) $(DOCKER_IMAGE) chmod 777 . -R
# docker run -it -p 3456:3456 -v "$(pwd)":/app --network=host -w /app ubuntu_shopify_custom_app chmod 777 . -R

# Start Shopify Development Server
start:
	docker run $(DOCKER_RUN_OPTIONS) --network=host -w $(CONTAINER_WORKDIR) $(DOCKER_IMAGE) npm run dev
# docker run -it -p 3456:3456 -v "$(pwd)":/app --network=host -w /app ubuntu_shopify_custom_app npm run dev

# Run Container
deploy:
	docker run $(DOCKER_RUN_OPTIONS) --network=host -w $(CONTAINER_WORKDIR) $(DOCKER_IMAGE)
# docker run -it -p 3456:3456 -v "$(pwd)":/app --network=host -w /app ubuntu_shopify_custom_app

# Migrate a Model: make migrate model=add-qrcode-table
migrate:
	docker run $(DOCKER_RUN_OPTIONS) --network=host -w $(CONTAINER_WORKDIR) $(DOCKER_IMAGE) npm run prisma migrate dev --name $(MIGRATION_NAME)

# Prisma
prisma:
	docker run $(DOCKER_RUN_OPTIONS) --network=host -w $(CONTAINER_WORKDIR) $(DOCKER_IMAGE) npm run prisma studio
# docker run -it -p 3456:3456 -v "$(pwd)":/app --network=host -w /app ubuntu_shopify_custom_app npm run prisma studio