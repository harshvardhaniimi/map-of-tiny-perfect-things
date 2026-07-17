"""Tests for the dependency-light local vector index."""

from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from chatbot import rag


class _FakeOllamaClient:
    def __init__(self, host: str):
        self.host = host

    def embed(self, model: str, input: list[str]) -> dict[str, list[list[float]]]:
        del model
        embeddings = []
        for text in input:
            lowered = text.lower()
            embeddings.append([1.0, 0.0] if "coffee" in lowered else [0.0, 1.0])
        return {"embeddings": embeddings}


class LocalVectorIndexTests(unittest.TestCase):
    @patch("chatbot.rag.ollama.Client", _FakeOllamaClient)
    def test_build_and_retrieve(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            csv_path = Path(temporary_dir) / "places.csv"
            with csv_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(
                    handle,
                    fieldnames=[
                        "name",
                        "city",
                        "state",
                        "country",
                        "type2",
                        "creators_rec",
                        "notes",
                        "address",
                        "rating",
                        "user_ratings_total",
                        "google_maps_link",
                        "opening_hours",
                        "google_place_id",
                    ],
                )
                writer.writeheader()
                writer.writerow(
                    {
                        "name": "Coffee Test",
                        "city": "Vienna",
                        "type2": "coffee",
                        "notes": "Excellent coffee",
                        "google_place_id": "coffee-test",
                    }
                )
                writer.writerow(
                    {
                        "name": "Food Test",
                        "city": "Vienna",
                        "type2": "food",
                        "notes": "Excellent lunch",
                        "google_place_id": "food-test",
                    }
                )

            count = rag.build_vectorstore(
                csv_path=str(csv_path),
                persist_dir=temporary_dir,
                collection_name="test-places",
                embedding_model="test-model",
                ollama_base_url="http://ollama.test",
            )

            self.assertEqual(count, 2)
            self.assertTrue(rag.collection_exists(temporary_dir, "test-places"))
            self.assertEqual(rag.collection_count(temporary_dir, "test-places"), 2)

            results = rag.retrieve_places(
                query="coffee",
                persist_dir=temporary_dir,
                collection_name="test-places",
                embedding_model="test-model",
                ollama_base_url="http://ollama.test",
                top_k=1,
            )

            self.assertEqual(len(results), 1)
            self.assertEqual(results[0].metadata["name"], "Coffee Test")
            self.assertAlmostEqual(results[0].distance or 0.0, 0.0)


if __name__ == "__main__":
    unittest.main()
