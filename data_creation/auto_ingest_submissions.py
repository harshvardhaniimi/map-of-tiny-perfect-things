#!/usr/bin/env python3
"""Automate place ingestion from Netlify Forms into master datasets.

Pipeline:
1) Fetch submissions from Netlify form
2) De-duplicate against existing master_data and within submissions
3) Enrich with Google Places API (fallback to Nominatim when unavailable)
4) Update master CSV/JSON and map JSON copy
5) Refresh city text docs for chatbot context
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import pandas as pd

from export_netlify_submissions import get_form_id, get_submissions, to_rows, write_csv


DEFAULT_MASTER_CSV = "master_data/master_data.csv"
DEFAULT_MASTER_JSON = "master_data/master_data.json"
DEFAULT_MAP_JSON = "map/src/master_data.json"
DEFAULT_SUBMISSIONS_CSV = "data_creation/place_submissions.csv"
DEFAULT_CITY_FILES_DIR = "master_data/city_files"
DEFAULT_REPORT = "data_creation/last_ingest_report.json"
DEFAULT_FORM_NAME = "place-submissions"
NETLIFY_API_BASE = "https://api.netlify.com/api/v1"

# Maps Google Places API type → consolidated type2 category.
# Order matters: first match wins.
_TYPE_TO_TYPE2: Dict[str, str] = {
    "cafe": "coffee",
    "restaurant": "food",
    "bakery": "food",
    "meal_takeaway": "food",
    "meal_delivery": "food",
    "bar": "drinks",
    "liquor_store": "drinks",
    "night_club": "drinks",
    "museum": "culture",
    "library": "culture",
    "book_store": "culture",
    "church": "culture",
    "art_gallery": "culture",
    "park": "outdoors",
    "natural_feature": "outdoors",
    "campground": "outdoors",
    "store": "shopping",
    "clothing_store": "shopping",
    "electronics_store": "shopping",
    "shopping_mall": "shopping",
    "grocery_or_supermarket": "shopping",
    "tourist_attraction": "attraction",
    "point_of_interest": "attraction",
    "locality": "attraction",
}

VALID_TYPE2_VALUES = {"coffee", "food", "drinks", "culture", "outdoors", "shopping", "attraction", "other"}


def consolidate_type2(google_type: str, fallback: str = "other") -> str:
    """Derive type2 from Google Maps type, with fallback."""
    google_type = _normalize_text(google_type).lower()
    if google_type in _TYPE_TO_TYPE2:
        return _TYPE_TO_TYPE2[google_type]
    fallback = _normalize_text(fallback).lower()
    if fallback in VALID_TYPE2_VALUES:
        return fallback
    return "other"

MASTER_COLUMNS = [
    "name",
    "location",
    "city",
    "state",
    "country",
    "creators_rec",
    "notes",
    "address",
    "rating",
    "user_ratings_total",
    "google_maps_link",
    "lat",
    "lng",
    "opening_hours",
    "type",
    "google_place_id",
    "type2",
]


@dataclass
class EnrichmentResult:
    address: str = ""
    rating: str = ""
    user_ratings_total: str = ""
    google_maps_link: str = ""
    lat: str = ""
    lng: str = ""
    opening_hours: str = ""
    place_type: str = ""
    google_place_id: str = ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Automated ingestion for place submissions")
    parser.add_argument("--site-id", default=os.getenv("NETLIFY_SITE_ID", ""), help="Netlify site id")
    parser.add_argument(
        "--form-name",
        default=DEFAULT_FORM_NAME,
        help="Netlify form name (default: place-submissions)",
    )
    parser.add_argument(
        "--submissions-csv",
        default=DEFAULT_SUBMISSIONS_CSV,
        help="Path for exported submissions CSV",
    )
    parser.add_argument(
        "--master-csv",
        default=DEFAULT_MASTER_CSV,
        help="Path to master_data CSV",
    )
    parser.add_argument(
        "--master-json",
        default=DEFAULT_MASTER_JSON,
        help="Path to master_data JSON",
    )
    parser.add_argument(
        "--map-json",
        default=DEFAULT_MAP_JSON,
        help="Path to map JSON copy",
    )
    parser.add_argument(
        "--city-files-dir",
        default=DEFAULT_CITY_FILES_DIR,
        help="Directory for city text files",
    )
    parser.add_argument(
        "--report-path",
        default=DEFAULT_REPORT,
        help="Output report JSON path",
    )
    parser.add_argument(
        "--google-api-key",
        default=os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY") or "",
        help="Google Places API key (optional)",
    )
    parser.add_argument(
        "--creator-access-codes",
        default=os.getenv("CREATOR_ACCESS_CODES", ""),
        help="Comma-separated maintainer access codes to validate creator overrides",
    )
    parser.add_argument(
        "--skip-export",
        action="store_true",
        help="Skip fetching from Netlify and use existing submissions CSV",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run pipeline without writing files",
    )
    parser.add_argument(
        "--re-enrich",
        action="store_true",
        help="Re-enrich ALL existing master_data entries via Google Places API and re-consolidate type2",
    )
    return parser.parse_args()


def _read_csv_fallback(path: str) -> pd.DataFrame:
    decode_errors: List[str] = []
    parse_errors: List[str] = []

    for encoding in ("utf-8", "utf-8-sig", "latin1"):
        try:
            return pd.read_csv(path, encoding=encoding, engine="python")
        except UnicodeDecodeError as exc:
            decode_errors.append(f"{encoding}: {exc}")
        except pd.errors.ParserError as exc:
            parse_errors.append(f"{encoding}: {exc}")

    if decode_errors and not parse_errors:
        raise RuntimeError(f"Unable to decode CSV {path}. Errors: {' | '.join(decode_errors)}")

    if parse_errors:
        raise RuntimeError(f"Unable to parse CSV {path}. Errors: {' | '.join(parse_errors)}")

    raise RuntimeError(f"Unable to read CSV: {path}")


def _read_json_records(path: str) -> pd.DataFrame:
    payload: object = None
    decode_errors: List[str] = []
    for encoding in ("utf-8", "utf-8-sig", "latin1"):
        try:
            with open(path, "r", encoding=encoding) as fh:
                payload = json.load(fh)
            break
        except UnicodeDecodeError as exc:
            decode_errors.append(f"{encoding}: {exc}")
            continue

    if payload is None:
        raise RuntimeError(
            f"Unable to decode JSON {path}. Errors: {' | '.join(decode_errors)}"
        )

    if not isinstance(payload, list):
        raise RuntimeError(f"Expected list JSON records at {path}")

    return pd.DataFrame(payload)


def _read_master_dataset(master_csv: str, master_json: str, map_json: str) -> pd.DataFrame:
    try:
        return _read_csv_fallback(master_csv)
    except Exception:
        pass

    for candidate in (master_json, map_json):
        if not candidate:
            continue
        if os.path.exists(candidate):
            try:
                return _read_json_records(candidate)
            except Exception:
                continue

    raise RuntimeError(
        f"Could not parse any master dataset source: {master_csv}, {master_json}, {map_json}"
    )


def _normalize_text(value: object) -> str:
    text = str(value or "").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _norm_key(value: object) -> str:
    text = _normalize_text(value).lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _parse_creator_codes(raw: str) -> set[str]:
    if not raw:
        return set()
    return {_norm_key(item) for item in raw.split(",") if _norm_key(item)}


def _dedupe_key(row: pd.Series) -> Tuple[str, str, str, str, str]:
    return (
        _norm_key(row.get("name", "")),
        _norm_key(row.get("location", "")),
        _norm_key(row.get("city", "")),
        _norm_key(row.get("state", "")),
        _norm_key(row.get("country", "")),
    )


def _ensure_columns(df: pd.DataFrame, columns: Sequence[str]) -> pd.DataFrame:
    for col in columns:
        if col not in df.columns:
            df[col] = ""
    return df


def _http_json(url: str, headers: Optional[Dict[str, str]] = None) -> Dict[str, object]:
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def _build_google_maps_link(address: str, place_id: str, fallback_query: str) -> str:
    if address and place_id:
        return (
            "https://www.google.com/maps/search/?api=1&query="
            + urllib.parse.quote(address)
            + "&query_place_id="
            + urllib.parse.quote(place_id)
        )

    if fallback_query:
        return "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(fallback_query)

    return ""


def _enrich_with_google(query: str, google_api_key: str) -> EnrichmentResult:
    search_url = (
        "https://maps.googleapis.com/maps/api/place/textsearch/json?query="
        + urllib.parse.quote(query)
        + "&key="
        + urllib.parse.quote(google_api_key)
    )
    search_payload = _http_json(search_url)
    results = search_payload.get("results") or []
    if not results:
        return EnrichmentResult()

    first = results[0]
    place_id = _normalize_text(first.get("place_id", ""))
    address = _normalize_text(first.get("formatted_address", ""))
    rating = _normalize_text(first.get("rating", ""))
    user_ratings_total = _normalize_text(first.get("user_ratings_total", ""))
    geometry = first.get("geometry") or {}
    location = geometry.get("location") or {}
    lat = _normalize_text(location.get("lat", ""))
    lng = _normalize_text(location.get("lng", ""))
    types = first.get("types") or []
    place_type = _normalize_text(types[0] if types else "")

    opening_hours = ""
    details_maps_url = ""
    if place_id:
        details_url = (
            "https://maps.googleapis.com/maps/api/place/details/json?place_id="
            + urllib.parse.quote(place_id)
            + "&fields=formatted_address,rating,user_ratings_total,url,opening_hours,geometry,types"
            + "&key="
            + urllib.parse.quote(google_api_key)
        )
        details_payload = _http_json(details_url)
        details = details_payload.get("result") or {}
        details_maps_url = _normalize_text(details.get("url", ""))

        if not address:
            address = _normalize_text(details.get("formatted_address", ""))
        if not rating:
            rating = _normalize_text(details.get("rating", ""))
        if not user_ratings_total:
            user_ratings_total = _normalize_text(details.get("user_ratings_total", ""))

        details_geometry = details.get("geometry") or {}
        details_location = details_geometry.get("location") or {}
        if not lat:
            lat = _normalize_text(details_location.get("lat", ""))
        if not lng:
            lng = _normalize_text(details_location.get("lng", ""))

        details_types = details.get("types") or []
        if not place_type:
            place_type = _normalize_text(details_types[0] if details_types else "")

        opening = details.get("opening_hours") or {}
        weekday = opening.get("weekday_text") or []
        if weekday:
            raw = "\n".join(str(item) for item in weekday)
            # Replace Unicode whitespace/dashes with ASCII equivalents
            opening_hours = (raw
                .replace("\u202f", " ")
                .replace("\u2009", " ")
                .replace("\u2013", "-")
                .replace("\u00a0", " "))

    return EnrichmentResult(
        address=address,
        rating=rating,
        user_ratings_total=user_ratings_total,
        google_maps_link=details_maps_url,
        lat=lat,
        lng=lng,
        opening_hours=opening_hours,
        place_type=place_type,
        google_place_id=place_id,
    )


def _enrich_with_nominatim(query: str) -> EnrichmentResult:
    url = (
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&q="
        + urllib.parse.quote(query)
    )
    headers = {
        "User-Agent": "map-of-tiny-perfect-things-ingestor/1.0",
        "Accept-Language": "en",
    }

    payload = _http_json(url, headers=headers)
    if not isinstance(payload, list) or not payload:
        return EnrichmentResult()

    first = payload[0]
    return EnrichmentResult(
        address=_normalize_text(first.get("display_name", "")),
        lat=_normalize_text(first.get("lat", "")),
        lng=_normalize_text(first.get("lon", "")),
    )


def _enrich_submission(row: pd.Series, google_api_key: str) -> EnrichmentResult:
    query = " ".join(
        part
        for part in [
            _normalize_text(row.get("name", "")),
            _normalize_text(row.get("location", "")),
            _normalize_text(row.get("city", "")),
            _normalize_text(row.get("state", "")),
            _normalize_text(row.get("country", "")),
        ]
        if part
    )

    enrichment = EnrichmentResult()

    if google_api_key:
        try:
            enrichment = _enrich_with_google(query, google_api_key)
        except urllib.error.URLError:
            enrichment = EnrichmentResult()

    if not enrichment.lat or not enrichment.lng:
        try:
            nominatim = _enrich_with_nominatim(query)
            if not enrichment.address:
                enrichment.address = nominatim.address
            if not enrichment.lat:
                enrichment.lat = nominatim.lat
            if not enrichment.lng:
                enrichment.lng = nominatim.lng
        except urllib.error.URLError:
            pass

    if not enrichment.google_maps_link:
        enrichment.google_maps_link = _build_google_maps_link(
            enrichment.address,
            enrichment.google_place_id,
            query,
        )

    return enrichment


def _safe_filename(city: str, state: str) -> str:
    city_part = re.sub(r"\s+", "_", _normalize_text(city)) or "Unknown_City"
    state_part = _normalize_text(state) or "Unknown_State"
    state_part = re.sub(r"[\\/:*?\"<>|]", "", state_part)
    return f"{city_part}_{state_part}.txt"


def _write_city_files(df: pd.DataFrame, output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)

    grouped = df.groupby(["city", "state", "country"], dropna=False, sort=True)
    for (city, state, country), group in grouped:
        lines: List[str] = []
        lines.append(
            f"This document is about City {city} in State {state}, Country {country}."
        )
        lines.append("Following are some noteworthy places that we'd like to revisit again and again.")
        lines.append(
            "This list is not exhaustive but a collection of things we found awesome."
        )
        lines.append("")

        for _, row in group.iterrows():
            lines.extend(
                [
                    f"Name: {row.get('name', '')}",
                    f"City: {row.get('city', '')}",
                    f"State: {row.get('state', '')}",
                    f"Country: {row.get('country', '')}",
                    f"Creator's Rec: {row.get('creators_rec', '')}",
                    f"Notes: {row.get('notes', '')}",
                    f"Address: {row.get('address', '')}",
                    f"Rating: {row.get('rating', '')} with {row.get('user_ratings_total', '')} ratings",
                    f"Google Maps Link: {row.get('google_maps_link', '')}",
                    f"Opening Hours: {row.get('opening_hours', '')}",
                    "",
                ]
            )

        file_path = os.path.join(output_dir, _safe_filename(str(city), str(state)))
        with open(file_path, "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines).strip() + "\n")


def _write_json_records(df: pd.DataFrame, output_path: str) -> None:
    records = df.fillna("").to_dict(orient="records")
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False)


def _has_valid_creator_override(submission: pd.Series, valid_codes: set[str]) -> bool:
    requested = _norm_key(submission.get("creators_rec_requested", "")) == "yes"
    if not requested:
        return False

    if not valid_codes:
        return False

    submitted_code = _norm_key(submission.get("creator_access_code", ""))
    return submitted_code in valid_codes


def _to_master_row(
    submission: pd.Series,
    enrichment: EnrichmentResult,
    creator_override_allowed: bool,
) -> Dict[str, object]:
    creators_rec = "Yes" if creator_override_allowed else ""

    google_maps_link = _normalize_text(submission.get("google_maps_link", ""))
    if not google_maps_link:
        google_maps_link = enrichment.google_maps_link

    return {
        "name": _normalize_text(submission.get("name", "")),
        "location": _normalize_text(submission.get("location", "")),
        "city": _normalize_text(submission.get("city", "")),
        "state": _normalize_text(submission.get("state", "")),
        "country": _normalize_text(submission.get("country", "")),
        "creators_rec": creators_rec,
        "notes": _normalize_text(submission.get("notes", "")),
        "address": enrichment.address,
        "rating": enrichment.rating,
        "user_ratings_total": enrichment.user_ratings_total,
        "google_maps_link": google_maps_link,
        "lat": enrichment.lat,
        "lng": enrichment.lng,
        "opening_hours": enrichment.opening_hours,
        "type": enrichment.place_type,
        "google_place_id": enrichment.google_place_id,
        "type2": consolidate_type2(
            enrichment.place_type,
            fallback=_normalize_text(submission.get("type2", "other")) or "other",
        ),
    }


def _fetch_submissions_csv(site_id: str, form_name: str, output_csv: str) -> Tuple[int, List[Dict[str, str]]]:
    if not site_id:
        raise RuntimeError("NETLIFY_SITE_ID/--site-id is required when export is enabled")

    form_id = get_form_id(site_id, form_name)
    submissions = get_submissions(form_id)
    rows_with_codes = to_rows(submissions, include_creator_access_code=True)
    rows_for_csv = to_rows(submissions, include_creator_access_code=False)
    write_csv(rows_for_csv, output_csv, include_creator_access_code=False)
    return len(rows_with_codes), rows_with_codes


def _parse_timestamp(value: object) -> datetime:
    text = _normalize_text(value)
    if not text:
        return datetime.min

    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return datetime.min


def _dedupe_submissions(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["_dedupe_key"] = df.apply(_dedupe_key, axis=1)
    df["_submitted_at"] = df.get("submitted_at", "").apply(_parse_timestamp)
    df = df.sort_values(by=["_submitted_at"], ascending=False)
    df = df.drop_duplicates(subset=["_dedupe_key"], keep="first")
    df = df.drop(columns=["_submitted_at"])
    return df


def _filter_new_submissions(submissions: pd.DataFrame, master: pd.DataFrame) -> pd.DataFrame:
    master = master.copy()
    master["_dedupe_key"] = master.apply(_dedupe_key, axis=1)
    existing_keys = set(master["_dedupe_key"].tolist())

    submissions = submissions.copy()
    submissions["_dedupe_key"] = submissions.apply(_dedupe_key, axis=1)
    new_rows = submissions[~submissions["_dedupe_key"].isin(existing_keys)].copy()
    return new_rows


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for column in MASTER_COLUMNS:
        if column not in df.columns:
            df[column] = ""
    df = df[MASTER_COLUMNS]

    for column in ["name", "location", "city", "state", "country", "notes", "type", "type2", "google_place_id"]:
        df[column] = df[column].fillna("").astype(str).map(_normalize_text)

    for column in ["creators_rec"]:
        df[column] = df[column].fillna("").astype(str).map(_normalize_text)

    for column in ["address", "google_maps_link", "opening_hours"]:
        df[column] = df[column].fillna("").astype(str)

    return df


def _re_enrich_master(master_df: pd.DataFrame, google_api_key: str) -> pd.DataFrame:
    """Re-enrich every row in master_data via Google Places API and re-consolidate type2."""
    if not google_api_key:
        print("WARNING: --re-enrich requires a Google API key. Only re-consolidating type2 from existing type.", file=sys.stderr)
        master_df = master_df.copy()
        master_df["type2"] = master_df.apply(
            lambda row: consolidate_type2(str(row.get("type", "")), fallback=str(row.get("type2", "other"))),
            axis=1,
        )
        return master_df

    updated_rows: List[Dict[str, object]] = []
    total = len(master_df)
    for idx, (_, row) in enumerate(master_df.iterrows(), 1):
        name = _normalize_text(row.get("name", ""))
        if not name:
            updated_rows.append(row.to_dict())
            continue

        print(f"  Re-enriching [{idx}/{total}]: {name}")
        enrichment = _enrich_submission(row, google_api_key)

        updated = row.to_dict()
        # Update enrichment fields but keep human-curated fields (name, location, city, etc.)
        if enrichment.address:
            updated["address"] = enrichment.address
        if enrichment.rating:
            updated["rating"] = enrichment.rating
        if enrichment.user_ratings_total:
            updated["user_ratings_total"] = enrichment.user_ratings_total
        if enrichment.lat:
            updated["lat"] = enrichment.lat
        if enrichment.lng:
            updated["lng"] = enrichment.lng
        if enrichment.opening_hours:
            updated["opening_hours"] = enrichment.opening_hours
        if enrichment.place_type:
            updated["type"] = enrichment.place_type
        if enrichment.google_place_id:
            updated["google_place_id"] = enrichment.google_place_id
        if enrichment.google_maps_link:
            updated["google_maps_link"] = enrichment.google_maps_link

        updated["type2"] = consolidate_type2(
            updated.get("type", ""),
            fallback=str(row.get("type2", "other")),
        )
        updated_rows.append(updated)

    return pd.DataFrame(updated_rows)


def run(args: argparse.Namespace) -> int:
    os.makedirs(os.path.dirname(args.report_path) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(args.submissions_csv) or ".", exist_ok=True)

    # --re-enrich mode: re-enrich all existing entries and exit
    if args.re_enrich:
        master_df = _read_master_dataset(args.master_csv, args.master_json, args.map_json)
        master_df = _clean_dataframe(master_df)
        print(f"Re-enriching {len(master_df)} existing entries...")
        enriched = _re_enrich_master(master_df, args.google_api_key)
        enriched = _clean_dataframe(enriched)
        if not args.dry_run:
            enriched.to_csv(args.master_csv, index=False, encoding="utf-8")
            _write_json_records(enriched, args.master_json)
            shutil.copyfile(args.master_json, args.map_json)
            _write_city_files(enriched, args.city_files_dir)
            print(f"Re-enriched and saved {len(enriched)} entries.")
        else:
            print(f"Dry run: would update {len(enriched)} entries.")
        return 0

    fetched_count = 0
    fetched_rows: Optional[List[Dict[str, str]]] = None
    if not args.skip_export:
        fetched_count, fetched_rows = _fetch_submissions_csv(args.site_id, args.form_name, args.submissions_csv)

    if fetched_rows is not None:
        submissions_df = pd.DataFrame(fetched_rows)
    else:
        submissions_df = _read_csv_fallback(args.submissions_csv)
    submissions_df = _ensure_columns(
        submissions_df,
        [
            "submission_id",
            "number",
            "submitted_at",
            "name",
            "location",
            "city",
            "state",
            "country",
            "type2",
            "notes",
            "google_maps_link",
            "contributor_name",
            "contributor_email",
            "creator_access_code",
            "creators_rec_requested",
        ],
    )
    submissions_df = submissions_df.fillna("")
    submissions_df = _dedupe_submissions(submissions_df)

    master_df = _read_master_dataset(args.master_csv, args.master_json, args.map_json)
    master_df = _clean_dataframe(master_df)
    valid_creator_codes = _parse_creator_codes(args.creator_access_codes)

    new_submissions = _filter_new_submissions(submissions_df, master_df)
    enriched_rows: List[Dict[str, object]] = []
    creator_overrides_applied = 0

    for _, submission in new_submissions.iterrows():
        if not _normalize_text(submission.get("name", "")):
            continue

        enrichment = _enrich_submission(submission, args.google_api_key)
        creator_override_allowed = _has_valid_creator_override(submission, valid_creator_codes)
        if creator_override_allowed:
            creator_overrides_applied += 1
        enriched_rows.append(
            _to_master_row(
                submission,
                enrichment,
                creator_override_allowed=creator_override_allowed,
            )
        )

    if enriched_rows:
        additions_df = pd.DataFrame(enriched_rows)
        additions_df = _clean_dataframe(additions_df)
        merged = pd.concat([master_df, additions_df], ignore_index=True)
        merged = _clean_dataframe(merged)
    else:
        merged = master_df

    # Build a contributor-attributed list of additions for the PR body. The
    # downstream workflow renders this verbatim, so include everything except
    # contributor_email (kept out of the public PR).
    additions_for_report: List[Dict[str, object]] = []
    for _, submission in new_submissions.iterrows():
        if not _normalize_text(submission.get("name", "")):
            continue
        additions_for_report.append({
            "name": _normalize_text(submission.get("name", "")),
            "location": _normalize_text(submission.get("location", "")),
            "city": _normalize_text(submission.get("city", "")),
            "state": _normalize_text(submission.get("state", "")),
            "country": _normalize_text(submission.get("country", "")),
            "type2": _normalize_text(submission.get("type2", "")),
            "notes": _normalize_text(submission.get("notes", "")),
            "google_maps_link": _normalize_text(submission.get("google_maps_link", "")),
            "contributor_name": _normalize_text(submission.get("contributor_name", "")),
            "submitted_at": _normalize_text(submission.get("submitted_at", "")),
        })

    report = {
        "timestamp_utc": datetime.utcnow().isoformat() + "Z",
        "fetched_submissions": int(fetched_count) if not args.skip_export else None,
        "submissions_in_csv": int(len(submissions_df)),
        "new_unique_submissions": int(len(new_submissions)),
        "added_rows": int(len(enriched_rows)),
        "creator_overrides_applied": int(creator_overrides_applied),
        "master_rows_before": int(len(master_df)),
        "master_rows_after": int(len(merged)),
        "google_places_enabled": bool(args.google_api_key),
        "creator_override_validation_enabled": bool(valid_creator_codes),
        "dry_run": bool(args.dry_run),
        "additions": additions_for_report,
    }

    if not args.dry_run:
        merged.to_csv(args.master_csv, index=False, encoding="utf-8")
        _write_json_records(merged, args.master_json)
        shutil.copyfile(args.master_json, args.map_json)
        _write_city_files(merged, args.city_files_dir)

        with open(args.report_path, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=2)

    print(json.dumps(report, indent=2))
    return 0


def main() -> int:
    args = parse_args()

    try:
        return run(args)
    except Exception as exc:  # noqa: BLE001
        print(f"Automated ingestion failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
