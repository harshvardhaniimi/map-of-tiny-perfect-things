# Map of Tiny Perfect Things

A crowd-powered map of meaningful places — cafes, parks, museums, bookstores, and more. Users submit places via a no-login form; submissions are enriched via Google Places API and displayed on an interactive Leaflet map.

**Live site:** Deployed on Netlify (React app in `map/`)
**Repo:** `harshvardhaniimi/map-of-tiny-perfect-things`

## Architecture

```
map/                          React app (CRA, Leaflet, Netlify Forms + Functions)
  src/App.js                  Single-file app: map view, submit form, feature form, chat
  src/App.css                 All styles
  src/master_data.json        Copy of master dataset (auto-synced from master_data/)
  public/netlify-forms.html   Netlify Forms endpoint (must match React form fields exactly)
  netlify/functions/ask-ava.mjs  Serverless chat function (OpenAI)
  netlify.toml                Build config (publish dir: build/, functions dir)

data_creation/                Ingestion pipeline (Python)
  auto_ingest_submissions.py  Main automated pipeline — fetches, dedupes, enriches, consolidates
  export_netlify_submissions.py  Netlify API export helper (imported by auto_ingest)
  02_add_new_places.qmd       Manual fallback (R/Quarto, rarely used)
  04_consolidate_categories.qmd  Legacy R category script (fully superseded by Python)

master_data/                  Source of truth
  master_data.csv             Canonical dataset
  master_data.json            JSON mirror (derived from CSV)
  city_files/                 Per-city text docs for chatbot RAG context

chatbot/                      Streamlit chatbot (local dev only, not deployed)

.github/workflows/
  auto-sync-submissions.yml   Daily GitHub Action: ingest → PR → email
```

## Data Pipeline

### Automated (GitHub Actions)
`.github/workflows/auto-sync-submissions.yml` runs once daily (cron: `17 8 * * *`):
1. Fetches submissions from Netlify Forms API
2. De-duplicates against existing master_data and within submissions
3. Enriches new entries via Google Places API (fallback: Nominatim geocoding)
4. Derives `type2` category from Google Maps `type` via `consolidate_type2()`
5. Updates master CSV/JSON, map JSON copy, and city text docs
6. Opens a PR **only if there are actual data changes** — PR body lists each new place
7. Emails maintainers (hvsc1708@gmail.com, dea.bardhoshi@berkeley.edu) if new places were added

### Category System (`type` and `type2`)
- **`type`**: Raw Google Maps place type (e.g., `cafe`, `restaurant`, `park`, `museum`)
- **`type2`**: Consolidated category derived from `type` by `consolidate_type2()` in `auto_ingest_submissions.py`

| type2       | Google Maps types                                                              | Emoji |
|-------------|--------------------------------------------------------------------------------|-------|
| coffee      | cafe                                                                           | ☕    |
| food        | restaurant, bakery, meal_takeaway, meal_delivery                               | 🍜    |
| drinks      | bar, liquor_store, night_club                                                  | 🍷    |
| culture     | museum, library, book_store, church, art_gallery                               | 🏛    |
| outdoors    | park, natural_feature, campground                                              | 🌳    |
| shopping    | store, clothing_store, electronics_store, shopping_mall, grocery_or_supermarket | 🛍    |
| attraction  | tourist_attraction, point_of_interest, locality                                | 📍    |
| other       | everything else                                                                | 🗺    |

The submission form lets users pick a category as a hint; the authoritative `type2` is derived from Google Maps data during enrichment, falling back to the user's selection when no Google type is available.

The valid values for `type2` are defined in `VALID_TYPE2_VALUES` in `auto_ingest_submissions.py`. The mapping from Google type to `type2` is in `_TYPE_TO_TYPE2` in the same file. To add a new category, update both constants, the form dropdown in `App.js`, the Netlify form in `netlify-forms.html`, the filter bar, `getMarkerEmoji()`, and `buildTypeTokenSet()`.

### Re-enriching existing data
To re-run Google Places API on all entries and re-consolidate categories:
```bash
cd "/path/to/map-of-tiny-perfect-things"
python data_creation/auto_ingest_submissions.py \
  --re-enrich \
  --google-api-key "$GOOGLE_PLACES_API_KEY" \
  --skip-export
```
Without an API key, `--re-enrich` will only re-consolidate `type2` from existing `type` values (no API calls).

## Frontend (`map/`)

- **Framework:** React 18 (Create React App)
- **Map:** Leaflet + react-leaflet
- **Forms:** Netlify Forms (submissions go to Netlify, not a custom backend)
- **Chat:** Netlify Function calling OpenAI API (`ask-ava.mjs`)
- **Single-file app:** Everything is in `App.js` — map view, submit page, feature request page, chat panel
- **Build:** `cd map && npm run build`
- **Dev server:** `cd map && npm start`
- **Tests:** `cd map && npm test`

### Anti-spam
The place submission form has two layers of bot protection:
1. **Honeypot field** (`bot-field`): hidden input that bots fill but humans don't
2. **Math CAPTCHA**: random addition question (e.g., "What is 3 + 7?") validated client-side before submission

### Form field mapping
The React form in `App.js` uses camelCase state (`formData.placeName`) but submits snake_case to Netlify (`place_name`). The field names in `netlify-forms.html` **must** match the snake_case submission names exactly — Netlify uses that HTML file to register the form schema.

### Filter bar
The category filter bar at the bottom of the map view uses:
- **Desktop:** `flex-wrap` layout, buttons wrap into rows, centered
- **Mobile:** horizontal scroll (no wrap), swipe to see all categories, hidden scrollbar

## Secrets (GitHub Actions / Netlify)

| Secret | Purpose |
|--------|---------|
| `NETLIFY_ACCESS_TOKEN` | Netlify API auth for fetching form submissions |
| `NETLIFY_SITE_ID` | Identifies the Netlify site |
| `GOOGLE_PLACES_API_KEY` | Google Places API for enrichment (also accepted as `GOOGLE_MAPS_API_KEY`) |
| `CREATOR_ACCESS_CODES` | Comma-separated codes for creator recommendation overrides |
| `NOTIFY_SMTP_SERVER`, `_PORT`, `_USERNAME`, `_PASSWORD`, `_FROM` | SMTP credentials for email notifications |

## Conventions

- `master_data/master_data.csv` is the canonical source of truth; JSON mirrors are derived from it
- `map/src/master_data.json` is a copy of `master_data/master_data.json` — kept in sync by the pipeline; do not edit directly
- The R notebooks in `data_creation/` are legacy manual tools; the Python pipeline (`auto_ingest_submissions.py`) is authoritative
- All form field changes must be reflected in **both** `App.js` and `netlify-forms.html`
- The `type2` column must only contain values from `VALID_TYPE2_VALUES`
- Category consolidation happens in Python (`consolidate_type2()`), not R — the R script `04_consolidate_categories.qmd` is obsolete
- The GitHub Action creates PRs (not direct pushes) so changes can be reviewed before merging
