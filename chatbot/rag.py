"""Shared RAG utilities for the Tiny Perfect Things chatbot."""

from __future__ import annotations

import hashlib
import json
import math
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Sequence

import ollama
import pandas as pd

STORE_VERSION = 1


@dataclass
class RetrievedPlace:
    document: str
    metadata: Dict[str, str]
    distance: float | None


def _slug(text: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return value or "place"


def _document_from_row(row: pd.Series) -> str:
    return "\n".join(
        [
            f"Name: {row.get('name', '')}",
            f"Category: {row.get('type2', '')}",
            f"City: {row.get('city', '')}",
            f"State: {row.get('state', '')}",
            f"Country: {row.get('country', '')}",
            f"Creator's Rec: {row.get('creators_rec', '')}",
            f"Notes: {row.get('notes', '')}",
            f"Address: {row.get('address', '')}",
            f"Rating: {row.get('rating', '')}",
            f"Ratings Count: {row.get('user_ratings_total', '')}",
            f"Google Maps: {row.get('google_maps_link', '')}",
            f"Opening Hours: {row.get('opening_hours', '')}",
        ]
    )


def _metadata_from_row(row: pd.Series) -> Dict[str, str]:
    return {
        "name": str(row.get("name", "")),
        "city": str(row.get("city", "")),
        "state": str(row.get("state", "")),
        "country": str(row.get("country", "")),
        "type2": str(row.get("type2", "")),
        "creators_rec": str(row.get("creators_rec", "")),
        "google_maps_link": str(row.get("google_maps_link", "")),
    }


def _row_id(row: pd.Series, index: int) -> str:
    place_id = str(row.get("google_place_id", "")).strip()
    if place_id:
        return place_id

    digest = hashlib.sha1(
        f"{row.get('name', '')}|{row.get('city', '')}|{row.get('state', '')}|{index}".encode("utf-8")
    ).hexdigest()[:12]
    return f"{_slug(str(row.get('name', 'place')))}-{digest}"


def _store_path(persist_dir: str, collection_name: str) -> str:
    return os.path.join(persist_dir, f"{_slug(collection_name)}.json")


def _load_store(persist_dir: str, collection_name: str) -> Dict[str, object]:
    path = _store_path(persist_dir, collection_name)
    with open(path, encoding="utf-8") as handle:
        payload = json.load(handle)

    if payload.get("version") != STORE_VERSION or not isinstance(payload.get("items"), list):
        raise ValueError(f"Unsupported or corrupt vector index: {path}")

    return payload


def _embed_texts(
    texts: Sequence[str],
    embedding_model: str,
    ollama_base_url: str,
) -> List[List[float]]:
    if not texts:
        return []

    client = ollama.Client(host=ollama_base_url)
    response = client.embed(model=embedding_model, input=list(texts))
    embeddings = response.get("embeddings", [])
    if len(embeddings) != len(texts):
        raise RuntimeError(
            f"Ollama returned {len(embeddings)} embeddings for {len(texts)} documents"
        )

    return [[float(value) for value in embedding] for embedding in embeddings]


def _cosine_distance(left: Sequence[float], right: Sequence[float]) -> float:
    if len(left) != len(right):
        raise ValueError("Stored and query embeddings have different dimensions")

    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 1.0

    similarity = max(-1.0, min(1.0, dot / (left_norm * right_norm)))
    return 1.0 - similarity


def collection_exists(persist_dir: str, collection_name: str) -> bool:
    return os.path.isfile(_store_path(persist_dir, collection_name))


def collection_count(persist_dir: str, collection_name: str) -> int:
    try:
        store = _load_store(persist_dir, collection_name)
    except (FileNotFoundError, json.JSONDecodeError, ValueError):
        return 0

    return len(store["items"])


def build_vectorstore(
    csv_path: str,
    persist_dir: str,
    collection_name: str,
    embedding_model: str,
    ollama_base_url: str,
) -> int:
    dataframe = pd.read_csv(csv_path).fillna("")

    ids: List[str] = []
    documents: List[str] = []
    metadatas: List[Dict[str, str]] = []

    for index, row in dataframe.iterrows():
        ids.append(_row_id(row, index))
        documents.append(_document_from_row(row))
        metadatas.append(_metadata_from_row(row))

    embeddings: List[List[float]] = []
    batch_size = 64
    for start in range(0, len(ids), batch_size):
        end = start + batch_size
        embeddings.extend(
            _embed_texts(
                documents[start:end],
                embedding_model=embedding_model,
                ollama_base_url=ollama_base_url,
            )
        )

    items = [
        {
            "id": row_id,
            "document": document,
            "metadata": metadata,
            "embedding": embedding,
        }
        for row_id, document, metadata, embedding in zip(
            ids,
            documents,
            metadatas,
            embeddings,
        )
    ]
    payload = {
        "version": STORE_VERSION,
        "collection": collection_name,
        "embedding_model": embedding_model,
        "items": items,
    }

    os.makedirs(persist_dir, exist_ok=True)
    path = _store_path(persist_dir, collection_name)
    temporary_path = f"{path}.tmp"
    with open(temporary_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False)
    os.replace(temporary_path, path)

    return len(items)


def retrieve_places(
    query: str,
    persist_dir: str,
    collection_name: str,
    embedding_model: str,
    ollama_base_url: str,
    top_k: int = 6,
) -> List[RetrievedPlace]:
    store = _load_store(persist_dir, collection_name)
    if store.get("embedding_model") != embedding_model:
        raise ValueError(
            "The vector index uses a different embedding model. Rebuild the index first."
        )

    query_embedding = _embed_texts(
        [query],
        embedding_model=embedding_model,
        ollama_base_url=ollama_base_url,
    )[0]

    ranked = sorted(
        (
            (
                _cosine_distance(item["embedding"], query_embedding),
                item,
            )
            for item in store["items"]
        ),
        key=lambda pair: pair[0],
    )

    rows: List[RetrievedPlace] = []
    for distance, item in ranked[: max(0, top_k)]:
        rows.append(
            RetrievedPlace(
                document=item["document"],
                metadata=item["metadata"],
                distance=distance,
            )
        )

    return rows


def answer_question(
    question: str,
    retrieved: List[RetrievedPlace],
    chat_model: str,
    ollama_base_url: str,
) -> str:
    context = "\n\n---\n\n".join(item.document for item in retrieved)

    system_prompt = (
        "You are Ava, a recommendation assistant for The Map of Tiny Perfect Things. "
        "Answer only from the supplied context whenever possible. "
        "If the answer is not in context, say so clearly and suggest checking Google Maps. "
        "Always prefer practical recommendations with place names and short reasons."
    )

    user_prompt = (
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Give a concise answer and include 2-5 relevant places when available."
    )

    client = ollama.Client(host=ollama_base_url)
    response = client.chat(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        options={"temperature": 0.2},
    )

    message = response.get("message", {})
    return message.get("content", "I could not generate a response.")
