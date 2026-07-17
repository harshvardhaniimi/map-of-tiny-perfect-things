# The Map of Tiny Perfect Things

A crowd-powered map of meaningful places: cafes, food spots, parks, museums, and other tiny perfect things discovered by real people.

## Organization

- **Creators and maintainers:** Dea Bardhoshi and Harshvardhan
- **Creator websites:** https://deabardhoshi.com/ and https://blog.harsh17.in/
- **Mission:** document places that feel memorable, not just highly rated
- **Contribution model:** open submissions + maintainer review

## Monorepo Structure

- `map/`
  - Public web app (React + Leaflet)
  - Netlify-hosted no-login forms for place submissions and feature requests
  - Native no-login chat page (`/chat`) with retrieval + Netlify Function backed by OpenAI
- `master_data/`
  - Source-of-truth dataset (`master_data.csv`, `master_data.json`)
- `data_creation/`
  - Data ingestion notebooks/scripts for moderation and merge workflows
  - Includes Netlify form export script
- `chatbot/`
  - Local RAG experimentation utilities (Ollama + a JSON vector index + Streamlit)

## What Changed

1. **Submission flow moved off Google Forms**
- Replaced with Netlify Forms (`/submit`) so users do not need GitHub or any login.
- Added feature request form (`/feature`) with same no-login approach.

2. **Creator override on form**
- The form has maintainer-only options for creator recommendations.
- Overrides are validated server-side during ingestion via secret access codes, not public name checks.
- Requests are still reviewed before dataset merge.

3. **Native hosted chat**
- New `/chat` page in the web app (no user login required).
- Retrieval happens on submitted data.
- Generation uses Netlify Function + OpenAI API key from deployment secrets.
- Fallback mode still returns retrieval-based recommendations if model call fails.

4. **UI refresh**
- New light pixel-art interface, mobile-friendly layout, and component-focused intro panel.

## Deployment (Netlify)

`map/` is designed for automatic Netlify deploys on push.

### Required Netlify env vars

- `OPENAI_API_KEY` (for `map/netlify/functions/ask-ava.mjs`)

### Optional env vars

- `OPENAI_MODEL` (default: `gpt-5.2`)

## Local Development

### Web app

```bash
cd map
npm install
npm start
```

### Production build check

```bash
cd map
npm run build
```

### Tests

```bash
cd map
npm test
```

## Submission Moderation + Data Merge

This is now automated.

- Workflow: `.github/workflows/auto-sync-submissions.yml`
- Schedule: every 6 hours (and manual `workflow_dispatch`)
- Output: an auto PR with updated submission export + master dataset + map dataset copy + city docs
- Privacy: the tracked `data_creation/place_submissions.csv` is a public-safe
  export. Contributor emails and creator access codes remain in Netlify and are
  never written to the repository.

Required GitHub Action secrets:
- `NETLIFY_ACCESS_TOKEN`
- `NETLIFY_SITE_ID`
- `CREATOR_ACCESS_CODES` (comma-separated maintainer codes for creator override validation)

If `NETLIFY_ACCESS_TOKEN` or `NETLIFY_SITE_ID` is missing, the workflow run succeeds but skips ingestion and PR creation.

Optional secret:
- `GOOGLE_PLACES_API_KEY` (if missing, fallback geocoding still runs via Nominatim)

The scheduled workflow creates or updates a pull request only when it ingests
at least one new place. Maintainers can rely on GitHub's pull request
notifications instead of a separate SMTP email.

Manual fallback command:

```bash
python data_creation/auto_ingest_submissions.py
```

Notebook `data_creation/02_add_new_places.qmd` is now optional/manual-only.

## Local Chatbot Utilities

Production chat is in `map/`, but local experiments remain in `chatbot/`.

```bash
pip install -r chatbot/requirements.txt
python chatbot/ingest.py
streamlit run chatbot/main.py
```

## Security Status

- The web app uses Vite and Vitest instead of the retired Create React App toolchain.
- The optional local chatbot uses a dependency-light JSON vector index instead of ChromaDB.
- Run `npm audit` in `map/` after dependency changes and keep the Python requirements current.

## Contribution Guidelines

- Use no-login forms in the app for place submissions and feature requests.
- For code changes, open PRs with focused commits and test/build evidence.
- Keep `master_data/` as the canonical data source.
