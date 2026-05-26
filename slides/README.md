# Presentation slides

Click-through deck for the two use cases in the parent README (customer support masking + LLM chat scoping).

## Run (Docker — recommended)

From the repo root:

```bash
docker compose up slides
```

Open http://localhost:1234 (override with `SLIDES_HOST_PORT`). The container runs Vite in dev mode with hot reload; edit files under `slides/` and the browser updates automatically.

Or build and run the whole stack; slides has no dependency on db/api.

Production static build (nginx): `docker build -f Dockerfile .`

## Run (local dev)

```bash
cd slides
npm install
npm run dev
```

Open http://localhost:1234 (Vite may open the browser automatically).

## Controls

| Input | Action |
|-------|--------|
| `→` `Space` `PageDown` | Next slide |
| `←` `PageUp` `Backspace` | Previous slide |
| `Home` / `End` | First / last slide |
| `F` | Toggle fullscreen |
| Click left / right ~28% of slide | Previous / next |
| Footer dots | Jump to slide |

## Build static files

```bash
npm run build
npm run preview
```
