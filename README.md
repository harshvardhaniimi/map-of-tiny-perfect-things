# The Map of Tiny Perfect Things

The Map of Tiny Perfect Things is a community atlas of places that feel memorable, not merely popular.

What began as Dea Bardhoshi's journal of meaningful places and Harshvardhan's catalogue of cafes has grown into an open map where anyone can discover and contribute places worth revisiting.

[Explore the map](https://mtpt.netlify.app/) · [Read the original announcement](https://harsh17.in/mtpt/) · [Submit a place](https://mtpt.netlify.app/submit) · [Ask Ava](https://mtpt.netlify.app/chat)

## Current Features

### Explore the Map

- Browse a worldwide interactive map built with React, Leaflet, CARTO, and OpenStreetMap.
- Search for a city or place and move directly to the matching area.
- Use the optional Near Me control to focus the map within 50 kilometres of the browser's location.
- Filter places across eight categories: coffee, food, drinks, culture, outdoors, shopping, attractions, and other.
- Identify creator recommendations through distinct star markers and badges.
- Open a place card with its notes, address, opening hours, rating, review count, and Google Maps link when those details are available.
- Read about the project's purpose, contributors, and open-source approach on the About page.
- Use the responsive pixel-art interface on desktop, tablet, and mobile screens.

### Contribute Places and Ideas

- Submit a place without creating an account or signing in.
- Suggest product improvements through public GitHub issues linked from the About page.
- Provide a category, location details, notes, and a Google Maps link to support moderation and enrichment.
- Keep creator recommendations restricted to maintainers through server-side access-code validation.
- Route every public submission through maintainer review before it joins the canonical dataset.

### Ask Ava

- Ask for recommendations by city, category, atmosphere, or creator preference through the `/chat` page.
- Ground answers in the map dataset and show the matching places as sources.
- Match common location aliases, including Bangalore and Bengaluru.
- Fall back to local retrieval when the hosted model is unavailable.
- Refuse to invent recommendations when the dataset has no relevant places.

### Maintain the Collection

- Fetch new submissions from Netlify Forms through a daily GitHub Action.
- Remove duplicates before adding new entries to the collection.
- Enrich places through Google Places and use Nominatim as a geocoding fallback.
- Consolidate raw place types into the eight public map categories.
- Update the canonical dataset, application data, and city documents together.
- Open an automated pull request only when the pipeline adds places.
- Keep public submission exports free of contributor emails and maintainer access codes.

## Ideas Under Consideration

The open roadmap contains possibilities rather than release commitments.

Product ideas currently under consideration include:

- Opening Ava as a chat panel directly inside the map.
- Letting people save or favourite places.
- Adding stronger quality checks for submitted ratings and descriptions.
- Creating richer place descriptions from suitable review sources.
- Exploring a location-based social layer for meetups, which would require an account system and a separate privacy design.

Community ideas currently under consideration include:

- Publishing a newsletter about new places and project updates.
- Sharing the project with relevant data-visualisation and community forums.

Discussion and progress are tracked in [GitHub issue #1](https://github.com/harshvardhaniimi/map-of-tiny-perfect-things/issues/1).

## Repository Structure

```text
map/             Public React application, Netlify forms, and serverless functions
master_data/     Canonical CSV, derived JSON, and generated city documents
data_creation/   Submission export, enrichment, consolidation, and moderation pipeline
chatbot/         Local retrieval and Streamlit experiments
.github/         Scheduled ingestion and pull-request automation
```

The repository-wide development instructions are in [`AGENTS.md`](AGENTS.md).

## Local Development

The web application requires Node.js 20.19 or later.

```bash
cd map
npm ci
npm start
```

Run the frontend checks before submitting a code change:

```bash
cd map
npm test
npm run build
```

Run the ingestion tests from the repository root:

```bash
python -m unittest discover -s data_creation/tests
```

## Deployment

Netlify builds and publishes the `map/` application on push.

The production chat function requires `OPENAI_API_KEY` and uses `OPENAI_MODEL` when that optional variable is set.

Google Analytics requires a GA4 web stream measurement ID in `VITE_GA_MEASUREMENT_ID` (for example, `G-XXXXXXXXXX`).
Set it in Netlify before the production build; local development can use the same variable in `map/.env`.
Keep Enhanced Measurement's page-load and browser-history page views enabled for navigation tracking.

The daily ingestion workflow requires `NETLIFY_ACCESS_TOKEN` and `NETLIFY_SITE_ID`.

`GOOGLE_PLACES_API_KEY` enables Google Places enrichment, while `CREATOR_ACCESS_CODES` validates maintainer-only creator recommendations.

If the required Netlify ingestion credentials are absent, the scheduled workflow exits safely without modifying data or opening a pull request.

## Data and Moderation

`master_data/master_data.csv` is the source of truth for the collection.

The Python ingestion pipeline generates the JSON copies used by the application and the per-city documents used by local retrieval tools.

The scheduled workflow runs once daily at 08:17 UTC and opens a reviewable pull request only when it adds at least one place.

The public `data_creation/place_submissions.csv` export excludes contributor emails and maintainer access codes.

## Contributing

Use the [place submission form](https://mtpt.netlify.app/submit) to recommend a place or [open a GitHub issue](https://github.com/harshvardhaniimi/map-of-tiny-perfect-things/issues/new) to suggest an improvement.

For code changes, use a focused branch and include relevant test and build evidence in the pull request.

The project is created and maintained by [Dea Bardhoshi](https://deabardhoshi.com/) and [Harshvardhan](https://harsh17.in/).
