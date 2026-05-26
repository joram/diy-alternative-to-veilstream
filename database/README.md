# Database

Postgres image and init scripts for the Chinook demo with [PostgreSQL Anonymizer](https://postgresql-anonymizer.readthedocs.io/).

## Layout

- `Dockerfile` — Dalibo `postgresql_anonymizer` base image
- `initdb/` — scripts run on first container start (alphabetical order):
  - `02-internal-company-data.sql` — wholesale `unit_cost`, `internal_notes`
  - `03-enable-anon.sql` — extension setup
  - `04-mask-pii.sql` — PII and internal column mask labels
  - `05-support-rls.sql` — `support_reader` role and RLS for support SQL
  - `06-start-dynamic-masking.sql` — `anon.start_dynamic_masking()` (creates `mask` schema)

## Build

From the repo root:

```bash
docker compose build db
```
