# Chinook Frontend

React + TypeScript + Material UI static app for the Chinook music store demo. All HTTP APIs live in the separate **Go service** (`../api`); this package is UI only.

## Features

- **Become a user** — pick any customer on the landing page and view only their profile and invoices (PII from the `mask` schema).
- **Support assistant** — chat on the customer dashboard; natural language or raw `SELECT` queries are sent to `POST /api/support/chat` and executed by the API (scoped + read-only).
- **Admin login** — see all customers and invoices with real, unmasked data from `public`.

### Support bot security

The browser never sends `customer_id` for support queries. The Go API binds `app.customer_id` from the session, rewrites SQL to `mask.*`, injects row filters, validates read-only `SELECT`/`WITH`, and runs `BEGIN READ ONLY` with optional `support_reader` RLS. Malicious SQL from the chat box is expected; defense is server-side.

### LLM (Docker Compose)

Copy `.env.example` to `.env` and set `OPENAI_API_KEY` (default provider) or `ANTHROPIC_API_KEY` with `LLM_PROVIDER=anthropic`. The **api** service turns natural-language questions into scoped SQL via the configured model.

Optional local Ollama: `docker compose --profile ollama up` with `LLM_PROVIDER=ollama` and `OPENAI_BASE_URL=http://ollama:11434/v1`.

## Prerequisites

- [Bun](https://bun.sh) (build tooling only)
- Chinook Postgres (`docker compose up -d db`)
- For local dev: Go API on port **8080** (see `../api`)

## Run with Docker Compose

From the repo root:

```bash
docker compose up -d --build
```

Open http://localhost:23082 (Vite dev server with hot reload; proxies `/api/` → `api:8080`). API direct: http://localhost:23083 (`API_HOST_PORT`). Edit files under `frontend/` and the browser updates automatically.

Production static build (nginx): `docker build -f Dockerfile .`

## Run locally

Terminal 1 — API:

```bash
cd api && go run ./cmd/server
```

Terminal 2 — UI (Vite proxies `/api` → `http://localhost:8080`):

```bash
cd frontend && bun install && bun run dev
```

- Web UI: http://localhost:5173
- API: http://localhost:8080

Admin password defaults to `admin` (`ADMIN_PASSWORD` on the api service).

## Production build

```bash
bun run build
```

Docker serves `dist/` via nginx with `/api/` proxied to the Go container. See `nginx.conf`.
