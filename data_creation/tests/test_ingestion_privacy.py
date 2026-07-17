import csv
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd


DATA_CREATION_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(DATA_CREATION_DIR))

import auto_ingest_submissions as ingest  # noqa: E402
import export_netlify_submissions as export  # noqa: E402


class SubmissionPrivacyTests(unittest.TestCase):
    def test_rows_exclude_contributor_email(self):
        submissions = [
            {
                "id": "submission-1",
                "number": 1,
                "created_at": "2026-07-17T00:00:00Z",
                "data": {
                    "place_name": "Test Cafe",
                    "contributor_name": "Contributor",
                    "contributor_email": "private@example.com",
                },
            }
        ]

        rows = export.to_rows(submissions)

        self.assertNotIn("contributor_email", rows[0])
        self.assertNotIn("private@example.com", repr(rows))

    def test_csv_writer_drops_email_even_from_legacy_rows(self):
        row = {field: "" for field in export.PUBLIC_EXPORT_FIELDS}
        row.update(
            {
                "submission_id": "submission-1",
                "name": "Test Cafe",
                "contributor_email": "private@example.com",
            }
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            output = Path(tmpdir) / "submissions.csv"
            export.write_csv([row], str(output))
            text = output.read_text(encoding="utf-8")
            with output.open(newline="", encoding="utf-8") as csv_file:
                header = next(csv.reader(csv_file))

        self.assertNotIn("contributor_email", header)
        self.assertNotIn("private@example.com", text)


class ExactPlaceIdEnrichmentTests(unittest.TestCase):
    def test_existing_place_id_is_used_without_text_search(self):
        calls = []

        def fake_http_json(url, headers=None):
            calls.append(url)
            self.assertIn("/place/details/", url)
            return {
                "result": {
                    "formatted_address": "Exact address",
                    "rating": 4.7,
                    "user_ratings_total": 27,
                    "url": "https://maps.example/exact",
                    "opening_hours": {"weekday_text": ["Friday: 8:00 AM - 11:30 PM"]},
                    "geometry": {"location": {"lat": 30.1297161, "lng": 78.324983}},
                    "types": ["cafe"],
                }
            }

        row = pd.Series(
            {
                "name": "Toki",
                "city": "Rishikesh",
                "state": "Uttarakhand",
                "country": "India",
                "google_place_id": "ChIJpZd63zkXCTkR7SA9TNds8VA",
            }
        )

        with patch.object(ingest, "_http_json", side_effect=fake_http_json):
            result = ingest._enrich_submission(row, "test-api-key")

        self.assertEqual(1, len(calls))
        self.assertEqual("ChIJpZd63zkXCTkR7SA9TNds8VA", result.google_place_id)
        self.assertEqual("cafe", result.place_type)
        self.assertEqual("4.7", result.rating)
        self.assertEqual("27", result.user_ratings_total)


if __name__ == "__main__":
    unittest.main()
