# Repository Guide

## Scope

These instructions apply to the entire repository.

The Map of Tiny Perfect Things is a community map of memorable cafes, restaurants, parks, cultural spaces, shops, attractions, and other places worth sharing.

The public application is deployed on Netlify and combines a React map, no-login contribution forms, a dataset-grounded assistant called Ava, and an automated moderation pipeline.

## Start Here

- Read `README.md` for the public project overview, current features, and roadmap.
- Treat `master_data/master_data.csv` as the canonical dataset.
- Use `map/src/App.jsx` for application behavior and `map/src/App.css` for application styling.
- Use `data_creation/auto_ingest_submissions.py` for ingestion, enrichment, category consolidation, and derived data updates.
- Use `.github/workflows/auto-sync-submissions.yml` for the scheduled ingestion workflow.

## Repository Layout

```text
map/                          React 18, Vite, Leaflet, Netlify Forms, and Netlify Functions
  src/App.jsx                 Map, search, Near Me, forms, About page, and Ava chat
  src/App.css                 Shared desktop and mobile styles
  src/master_data.json        Generated copy used by the application
  public/netlify-forms.html   Static form definitions required by Netlify
  netlify/functions/          Serverless functions, including Ava's OpenAI call
  build/                      Generated production output tracked in Git

master_data/                  Canonical CSV, derived JSON, and generated city files
data_creation/                Authoritative Python ingestion pipeline and privacy tests
chatbot/                      Local Streamlit and retrieval experiments, not production
.github/workflows/            Scheduled ingestion and pull-request automation
```

## Working Rules

- Inspect `git status` before editing and preserve unrelated or uncommitted work.
- Do not commit, push, merge, deploy, or resolve review threads unless the user asks.
- Never expose API keys, access codes, contributor emails, or other private submission data.
- Keep `data_creation/place_submissions.csv` public-safe and exclude contributor emails and creator access codes.
- Do not edit `map/src/master_data.json` directly because the ingestion pipeline generates it from canonical data.
- Do not treat the legacy R notebooks as authoritative when the Python pipeline covers the same work.
- Write one complete sentence per physical line in prose files when practical.
- Do not add AI attribution to commits or project documentation.

## Coupled Changes

Form schema changes must remain aligned across `map/src/App.jsx`, `map/index.html`, and `map/public/netlify-forms.html`.

Category changes must update `VALID_TYPE2_VALUES` and `_TYPE_TO_TYPE2` in `data_creation/auto_ingest_submissions.py` as well as the submission options, filter bar, marker emoji mapping, and query token mapping in `map/src/App.jsx`.

The supported `type2` values are `coffee`, `food`, `drinks`, `culture`, `outdoors`, `shopping`, `attraction`, and `other`.

Creator recommendation requests must continue to require a valid server-side access code during ingestion.

Browser geolocation must remain optional, and location coordinates must not be transmitted unless a separately approved feature requires it.

## Data Pipeline

The daily GitHub Action fetches Netlify submissions, removes duplicates, enriches new places through Google Places with Nominatim as a fallback, consolidates categories, updates derived files, and opens a pull request only when places were added.

The workflow must update the canonical CSV, derived JSON files, application data copy, and city documents together.

Automated changes should go through a reviewable pull request rather than a direct push to the default branch.

## Development Commands

Install and run the frontend from `map/`:

```bash
npm ci
npm start
```

Validate frontend changes from `map/`:

```bash
npm test
npm run build
```

Validate ingestion privacy and enrichment behavior from the repository root:

```bash
python -m unittest discover -s data_creation/tests
```

Run the ingestion pipeline manually from the repository root only when the task requires data synchronization:

```bash
python data_creation/auto_ingest_submissions.py
```

The ingestion command can contact Netlify, Google Places, and Nominatim and can rewrite multiple tracked data files, so inspect its options and environment before running it.

## Validation Expectations

- Run the frontend tests for application behavior changes.
- Run the production build for frontend or deployment changes and inspect the generated `map/build/` diff.
- Run the Python tests for ingestion, export, creator override, or privacy changes.
- Run `git diff --check` before handing work back.
- Verify responsive map changes at desktop and mobile sizes, including safe areas, overlays, the search controls, place cards, and the bottom filter bar.
- Confirm that generated files contain no private submission fields before including them in a change.

## Documentation

Keep `README.md` focused on the public project, current features, setup, and roadmap.

Keep this file focused on repository structure, invariants, and working practices for coding agents.

Link to the original announcement rather than copying it into repository documentation.
