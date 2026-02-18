#!/usr/bin/env python3
"""Build or rebuild the local vector store from master data."""

from __future__ import annotations

import argparse
import os

from rag import build_vectorstore


def parse_args() -> argparse.Namespace:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(base_dir)

    parser = argparse.ArgumentParser(description="Build vector store for the Tiny Perfect Things chatbot")
    parser.add_argument(
        "--csv",
        default=os.path.join(repo_root, "master_data", "master_data.csv"),
        help="Path to master_data CSV",
    )
    parser.add_argument(
        "--persist-dir",
        default=os.path.join(base_dir, "vectorstore"),
        help="Directory where Chroma persists vectors",
    )
    parser.add_argument(
        "--collection",
        default="tiny-perfect-places",
        help="Chroma collection name",
    )
    parser.add_argument(
        "--embedding-model",
        default=os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text"),
        help="Ollama embedding model",
    )
    parser.add_argument(
        "--ollama-url",
        default=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        help="Ollama base URL",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    count = build_vectorstore(
        csv_path=args.csv,
        persist_dir=args.persist_dir,
        collection_name=args.collection,
        embedding_model=args.embedding_model,
        ollama_base_url=args.ollama_url,
    )

    print(f"Vector store ready with {count} places in collection '{args.collection}'.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
