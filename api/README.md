# Chinook API (Go)

REST API for the customer portal and scoped support SQL.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/become` | Customer session |
| `POST` | `/api/auth/admin` | Admin session |
| `GET` | `/api/dashboard/profile` | Customer profile (`mask`) |
| `GET` | `/api/dashboard/invoices` | Customer invoices |
| `GET` | `/api/admin/*` | Admin stats, customers, invoices |
| `POST` | `/api/support/chat` | NL or SQL → scoped read-only query |
| `POST` | `/api/support/query` | Raw SQL only |
| `GET` | `/api/support/status` | LLM availability |

## Support query pipeline

1. **Validate** — single statement, `SELECT`/`WITH` only, block DDL/DML/system catalogs.
2. **Scope** — allowlisted tables → `mask.*`, inject `customer_id` (and invoice_line subquery).
3. **Execute** — `BEGIN READ ONLY`, `set_config('app.customer_id', …)`, `SET LOCAL ROLE support_reader`, `search_path = mask, public`, row limit.

## Run

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5435/chinook
export ADMIN_PASSWORD=admin
go run ./cmd/server
```

Listens on `:8080` (`ADDR`).

## Environment

See `internal/config/config.go` and `docker-compose.yml` (`api` service).
