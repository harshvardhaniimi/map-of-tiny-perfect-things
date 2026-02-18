"""Simple local smoke checks for the chatbot RAG stack."""

from __future__ import annotations

import os

from rag import collection_count, collection_exists, retrieve_places

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(BASE_DIR)
VECTORSTORE_DIR = os.getenv("VECTORSTORE_DIR", os.path.join(BASE_DIR, "vectorstore"))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "tiny-perfect-places")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")


if __name__ == "__main__":
    if not collection_exists(VECTORSTORE_DIR, COLLECTION_NAME):
        print("Collection does not exist. Run `python chatbot/ingest.py` first.")
        raise SystemExit(1)

    count = collection_count(VECTORSTORE_DIR, COLLECTION_NAME)
    print(f"Collection is available with {count} places.")

    results = retrieve_places(
        query="best cafes in Berkeley",
        persist_dir=VECTORSTORE_DIR,
        collection_name=COLLECTION_NAME,
        embedding_model=OLLAMA_EMBED_MODEL,
        ollama_base_url=OLLAMA_BASE_URL,
        top_k=3,
    )

    print("Top retrieval results:")
    for index, item in enumerate(results, start=1):
        name = item.metadata.get("name", "Unknown")
        city = item.metadata.get("city", "")
        print(f"{index}. {name} ({city})")
