SHELL := /bin/bash
.DEFAULT_GOAL := help

BUN ?= bun
DOCKER_COMPOSE ?= docker compose

.PHONY: help install dev build preview generate lint lint-fix typecheck clean ci check \
	docker-build docker-up docker-down docker-logs docker-prod-up docker-prod-down

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	$(BUN) install

dev: ## Run Nuxt development server
	$(BUN) dev

build: ## Build application for production
	$(BUN) build

preview: ## Preview production build locally
	$(BUN) preview

generate: ## Generate static output
	$(BUN) generate

lint: ## Run ESLint
	$(BUN) lint

lint-fix: ## Run ESLint autofix
	$(BUN) lint:fix

typecheck: ## Run Nuxt typecheck
	$(BUN) typecheck

check: lint typecheck build ## Run main quality checks

ci: install check ## CI aggregate target

clean: ## Remove generated artifacts
	rm -rf .nuxt .output dist .cache
