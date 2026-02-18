# Map Web App

Frontend for The Map of Tiny Perfect Things.

## Highlights

- Leaflet-based map explorer with filters and search
- No-login place submission form (`/submit`) using Netlify Forms
- No-login feature request form (`/feature`) using Netlify Forms
- Native chat page (`/chat`) with retrieval over map data and Netlify Function model call
- Maintainer-only creator override validation during ingestion (secret-code based)
- Light pixel-art responsive UI for desktop and mobile

## Scripts

```bash
npm install
npm start
CI=true npm test
npm run build
```

## Netlify

`netlify.toml` config:

- build command: `CI= npm run build`
- publish dir: `build/`
- functions dir: `netlify/functions`

### Required env vars

- `OPENAI_API_KEY`

### Optional env vars

- `OPENAI_MODEL` (defaults to `gpt-5.2`)

## Forms

Two Netlify forms are defined:

- `place-submissions`
- `feature-requests`

Hidden static form definitions are included in `public/index.html` so Netlify can detect them during build.

## Data Automation

Place submissions are auto-ingested by repository automation in:

- `.github/workflows/auto-sync-submissions.yml`

That workflow runs the pipeline script:

- `data_creation/auto_ingest_submissions.py`
