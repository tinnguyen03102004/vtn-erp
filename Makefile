# ================================================================
# VTN-ERP Monorepo — Developer Commands
# ================================================================

.PHONY: dev build test lint typecheck clean install format

# ── Development ──
dev:
	npm run dev

# ── Build ──
build:
	npx turbo run build

# ── Testing ──
test:
	npm run test

test-e2e:
	npm run test:e2e

test-all: test test-e2e

# ── Code Quality ──
lint:
	npx turbo run lint

typecheck:
	npx turbo run typecheck

format:
	npx prettier --write .

# ── Database ──
db-generate:
	npx prisma generate

db-push:
	npx prisma db push

db-studio:
	npx prisma studio

# ── Utilities ──
clean:
	npx turbo run clean
	rm -rf node_modules/.cache
	rm -rf .next

install:
	npm install

# ── Docker ──
docker-up:
	docker compose up -d

docker-down:
	docker compose down
