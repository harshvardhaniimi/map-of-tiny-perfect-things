#!/usr/bin/env python3
"""Export Netlify Form submissions to CSV for data ingestion."""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.parse
import urllib.request
from typing import Dict, List

NETLIFY_API_BASE = "https://api.netlify.com/api/v1"
DEFAULT_OUTPUT = "data_creation/place_submissions.csv"
DEFAULT_FORM_NAME = "place-submissions"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export Netlify place submissions")
    parser.add_argument(
        "--site-id",
        default=os.environ.get("NETLIFY_SITE_ID", ""),
        help="Netlify site ID (or set NETLIFY_SITE_ID)",
    )
    parser.add_argument(
        "--form-name",
        default=DEFAULT_FORM_NAME,
        help="Netlify form name to export",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help="Output CSV path",
    )
    return parser.parse_args()


def auth_headers() -> Dict[str, str]:
    token = os.environ.get("NETLIFY_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("NETLIFY_ACCESS_TOKEN is not set")

    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def get_json(url: str) -> List[Dict[str, object]]:
    request = urllib.request.Request(url, headers=auth_headers())
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def get_form_id(site_id: str, form_name: str) -> str:
    forms_url = f"{NETLIFY_API_BASE}/sites/{site_id}/forms"
    forms = get_json(forms_url)

    for form in forms:
        if form.get("name") == form_name:
            return str(form.get("id"))

    raise RuntimeError(f"Form '{form_name}' was not found for site '{site_id}'")


def get_submissions(form_id: str) -> List[Dict[str, object]]:
    submissions: List[Dict[str, object]] = []
    page = 1

    while True:
        params = urllib.parse.urlencode({"per_page": 100, "page": page})
        url = f"{NETLIFY_API_BASE}/forms/{form_id}/submissions?{params}"
        batch = get_json(url)

        if not batch:
            break

        submissions.extend(batch)
        page += 1

    return submissions


def to_rows(submissions: List[Dict[str, object]]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []

    for submission in submissions:
        data = submission.get("data", {})
        if not isinstance(data, dict):
            data = {}

        row = {
            "submission_id": str(submission.get("id", "")),
            "number": str(submission.get("number", "")),
            "submitted_at": str(submission.get("created_at", "")),
            "name": str(data.get("place_name", "")).strip(),
            "location": str(data.get("location", "")).strip(),
            "city": str(data.get("city", "")).strip(),
            "state": str(data.get("state", "")).strip(),
            "country": str(data.get("country", "")).strip(),
            "type2": str(data.get("category", "others")).strip() or "others",
            "notes": str(data.get("notes", "")).strip(),
            "google_maps_link": str(data.get("google_maps_link", "")).strip(),
            "contributor_name": str(data.get("contributor_name", "")).strip(),
            "contributor_email": str(data.get("contributor_email", "")).strip(),
            "creator_access_code": str(data.get("creator_access_code", "")).strip(),
            "creators_rec_requested": str(data.get("creators_rec_requested", "No")).strip() or "No",
        }

        rows.append(row)

    return rows


def write_csv(rows: List[Dict[str, str]], output_path: str) -> None:
    fieldnames = [
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
    ]

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    with open(output_path, "w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    args = parse_args()

    if not args.site_id:
        print("Missing site id. Set --site-id or NETLIFY_SITE_ID.", file=sys.stderr)
        return 1

    try:
        form_id = get_form_id(args.site_id, args.form_name)
        submissions = get_submissions(form_id)
    except Exception as exc:  # noqa: BLE001
        print(f"Failed to fetch Netlify submissions: {exc}", file=sys.stderr)
        return 1

    rows = to_rows(submissions)
    write_csv(rows, args.output)
    print(f"Exported {len(rows)} submissions to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
