# Map of Tiny Perfect Things

A crowd-powered map of meaningful places — cafes, parks, museums, bookstores, and more. Users submit places via a no-login form; submissions are enriched via Google Places API and displayed on an interactive Leaflet map.

**Live site:** Deployed on Netlify (React app in `map/`)
**Repo:** `harshvardhaniimi/map-of-tiny-perfect-things`

## Architecture

```
map/                    React app (CRA, Leaflet, Netlify Forms + Functions)
  src/App.js            Single-file app: map view, submit form, feature form, chat
  src/App.css           All styles
  src/master_data.json  Copy of master dataset (auto-synced)
  public/netlify-forms.html  Netlify Forms endpoint (must match React form fields)
  netlify/functions/ask-ava.mjs  Serverless chat function (OpenAI)

data_creation/          Ingestion pipeline (Python)
  auto_ingest_submissions.py   Main automated pipeline (GitHub Actions)
  export_netlify_submissions.py  Netlify API export helper
  02_add_new_places.qmd        Manual fallback (R/Quarto, rarely used)
  04_consolidate_categories.qmd  Legacy R category script (superseded by Python)

master_data/            Source of truth
  master_data.csv       Canonical dataset
  master_data.json      JSON mirror
  city_files/           Per-city text docs for chatbot RAG context

chatbot/                Streamlit chatbot (local dev, not deployed)
```

## Data Pipeline

### Automated (GitHub Actions)
`.github/workflows/auto-sync-submissions.yml` runs daily:
1. Fetches submissions from Netlify Forms API
2. De-duplicates against existing master_data
3. Enriches new entries via Google Places API (fallback: Nominatim)
4. Consolidates `type` (from Google) into `type2` category
5. Updates master CSV/JSON, map JSON copy, and city docs
6. Opens a PR only if there are actual changes (with a list of new places in the body)
7. Emails maintainers if new places were added

### Category System (`type` and `type2`)
- `type`: Raw Google Maps place type (e.g., `cafe`, `restaurant`, `park`, `museum`)
- `type2`: Consolidated category derived from `type` by `consolidate_type2()` in `auto_ingest_submissions.py`

| type2       | Google Maps types                                                        | Emoji |
|-------------|--------------------------------------------------------------------------|-------|
| coffee      | cafe                                                                     | ☕    |
| food        | restaurant, bakery, meal_takeaway, meal_delivery                         | 🍜    |
| drinks      | bar, liquor_store, night_club                                            | 🍷    |
| culture     | museum, library, book_store, church, art_gallery                         | 🏛    |
| outdoors    | park, natural_feature, campground                                        | 🌳    |
| shopping    | store, clothing_store, electronics_store, shopping_mall, grocery_or_supermarket | 🛍 |
| attraction  | tourist_attraction, point_of_interest, locality                          | 📍    |
| other       | everything else                                                          | 🗺    |

The form lets users pick a category as a hint; the authoritative `type2` is derived from Google Maps data during enrichment, falling back to the user's selection if no Google type is available.

### Re-enriching existing data
To re-run Google Places API on all entries and re-consolidate categories:
```bash
cd data_creation
python auto_ingest_submissions.py --re-enrich --google-api-key "$GOOGLE_PLACES_API_KEY" --skip-export
```
Without an API key, `--re-enrich` will only re-consolidate `type2` from existing `type` values.

## Frontend (`map/`)

- **Framework:** React 18 (Create React App)
- **Map:** Leaflet + react-leaflet
- **Forms:** Netlify Forms (submissions go to Netlify, not a custom backend)
- **Chat:** Netlify Function calling OpenAI API
- **Single-file app:** Everything is in `App.js` — map view, submit page, feature request page, chat panel
- **Build:** `cd map && npm run build` (or `npx react-scripts build`)
- **Dev server:** `cd map && npm start`
- **Anti-spam:** Honeypot field + math CAPTCHA on the place submission form

### Form field mapping
The React form in `App.js` uses camelCase state (`formData.placeName`) but submits snake_case to Netlify (`place_name`). The field names in `netlify-forms.html` must match the snake_case submission names exactly.

## Secrets (GitHub Actions / Netlify)

| Secret | Purpose |
|--------|---------|
| `NETLIFY_ACCESS_TOKEN` | Netlify API auth for fetching form submissions |
| `NETLIFY_SITE_ID` | Identifies the Netlify site |
| `GOOGLE_PLACES_API_KEY` | Google Places API enrichment |
| `CREATOR_ACCESS_CODES` | Comma-separated codes for creator recommendation overrides |
| `NOTIFY_SMTP_*` | SMTP credentials for email notifications |

## Conventions

- `master_data/master_data.csv` is the canonical source of truth; JSON mirrors are derived from it
- `map/src/master_data.json` is a copy of `master_data/master_data.json` (auto-synced by the pipeline)
- The R notebooks in `data_creation/` are legacy manual tools; the Python pipeline is authoritative
- All form field changes must be reflected in both `App.js` and `netlify-forms.html`
- The `type2` column must only contain values from `VALID_TYPE2_VALUES` in `auto_ingest_submissions.py`
