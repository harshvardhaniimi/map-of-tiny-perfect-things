"""Shared RAG utilities for the Tiny Perfect Things chatbot."""

from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass
from typing import Dict, List

import chromadb
import ollama
import pandas as pd
from chromadb.errors import NotFoundError
from chromadb.utils.embedding_functions import OllamaEmbeddingFunction


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


def _client(persist_dir: str) -> chromadb.Client:
    os.makedirs(persist_dir, exist_ok=True)
    return chromadb.PersistentClient(path=persist_dir)


def _embedding_function(embedding_model: str, ollama_base_url: str) -> OllamaEmbeddingFunction:
    return OllamaEmbeddingFunction(
        model_name=embedding_model,
        url=ollama_base_url,
    )


def collection_exists(persist_dir: str, collection_name: str) -> bool:
    client = _client(persist_dir)
    try:
        client.get_collection(collection_name)
    except NotFoundError:
        return False
    return True


def collection_count(persist_dir: str, collection_name: str) -> int:
    client = _client(persist_dir)
    try:
        collection = client.get_collection(collection_name)
    except NotFoundError:
        return 0

    return collection.count()


def build_vectorstore(
    csv_path: str,
    persist_dir: str,
    collection_name: str,
    embedding_model: str,
    ollama_base_url: str,
) -> int:
    dataframe = pd.read_csv(csv_path).fillna("")

    client = _client(persist_dir)
    try:
        client.delete_collection(collection_name)
    except NotFoundError:
        pass

    collection = client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
        embedding_function=_embedding_function(embedding_model, ollama_base_url),
    )

    ids: List[str] = []
    documents: List[str] = []
    metadatas: List[Dict[str, str]] = []

    for index, row in dataframe.iterrows():
        ids.append(_row_id(row, index))
        documents.append(_document_from_row(row))
        metadatas.append(_metadata_from_row(row))

    batch_size = 100
    for start in range(0, len(ids), batch_size):
        end = start + batch_size
        collection.add(
            ids=ids[start:end],
            documents=documents[start:end],
            metadatas=metadatas[start:end],
        )

    return collection.count()


def retrieve_places(
    query: str,
    persist_dir: str,
    collection_name: str,
    embedding_model: str,
    ollama_base_url: str,
    top_k: int = 6,
) -> List[RetrievedPlace]:
    client = _client(persist_dir)
    collection = client.get_collection(
        collection_name,
        embedding_function=_embedding_function(embedding_model, ollama_base_url),
    )

    result = collection.query(
        query_texts=[query],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]

    rows: List[RetrievedPlace] = []
    for idx, document in enumerate(documents):
        rows.append(
            RetrievedPlace(
                document=document,
                metadata=metadatas[idx] if idx < len(metadatas) else {},
                distance=distances[idx] if idx < len(distances) else None,
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
