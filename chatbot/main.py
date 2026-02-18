from __future__ import annotations

import os

import streamlit as st

from rag import answer_question, build_vectorstore, collection_count, collection_exists, retrieve_places

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(BASE_DIR)

MASTER_DATA_PATH = os.getenv("MASTER_DATA_PATH", os.path.join(REPO_ROOT, "master_data", "master_data.csv"))
VECTORSTORE_DIR = os.getenv("VECTORSTORE_DIR", os.path.join(BASE_DIR, "vectorstore"))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "tiny-perfect-places")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:7b")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

st.set_page_config(page_title="Ava - Perfect Places", page_icon="🗺️", layout="wide")

st.title("🗺️ Ava: Tiny Perfect Things Assistant")
st.caption(
    "Ask for recommendations from the map dataset. This app uses local/free-first RAG with "
    "Ollama + Chroma."
)


if "messages" not in st.session_state:
    st.session_state.messages = []


with st.sidebar:
    st.header("RAG Settings")
    st.write(f"Chat model: `{OLLAMA_CHAT_MODEL}`")
    st.write(f"Embedding model: `{OLLAMA_EMBED_MODEL}`")
    st.write(f"Vector store: `{VECTORSTORE_DIR}`")

    if st.button("Rebuild Vector Index", use_container_width=True):
        with st.spinner("Rebuilding vector index..."):
            count = build_vectorstore(
                csv_path=MASTER_DATA_PATH,
                persist_dir=VECTORSTORE_DIR,
                collection_name=COLLECTION_NAME,
                embedding_model=OLLAMA_EMBED_MODEL,
                ollama_base_url=OLLAMA_BASE_URL,
            )
        st.success(f"Vector index rebuilt with {count} places.")

    if collection_exists(VECTORSTORE_DIR, COLLECTION_NAME):
        count = collection_count(VECTORSTORE_DIR, COLLECTION_NAME)
        st.success(f"Index ready ({count} places)")
    else:
        st.warning("No vector index yet. Click 'Rebuild Vector Index' to create one.")

    st.markdown("---")
    st.markdown("### Example prompts")
    st.markdown("- Best coffee spots in Berkeley")
    st.markdown("- Plan a perfect food crawl in Bengaluru")
    st.markdown("- Creator's rec places in New York")


for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if message.get("sources"):
            st.caption(message["sources"])


prompt = st.chat_input("Ask Ava for a recommendation")
if prompt:
    with st.chat_message("user"):
        st.markdown(prompt)

    st.session_state.messages.append({"role": "user", "content": prompt})

    if not collection_exists(VECTORSTORE_DIR, COLLECTION_NAME):
        fallback = (
            "I don't have an index yet. Please click 'Rebuild Vector Index' in the sidebar first."
        )
        with st.chat_message("assistant"):
            st.markdown(fallback)
        st.session_state.messages.append({"role": "assistant", "content": fallback})
    else:
        try:
            with st.spinner("Searching places and composing answer..."):
                retrieved = retrieve_places(
                    query=prompt,
                    persist_dir=VECTORSTORE_DIR,
                    collection_name=COLLECTION_NAME,
                    embedding_model=OLLAMA_EMBED_MODEL,
                    ollama_base_url=OLLAMA_BASE_URL,
                    top_k=6,
                )

                answer = answer_question(
                    question=prompt,
                    retrieved=retrieved,
                    chat_model=OLLAMA_CHAT_MODEL,
                    ollama_base_url=OLLAMA_BASE_URL,
                )

            unique_places = []
            for item in retrieved:
                name = item.metadata.get("name", "")
                city = item.metadata.get("city", "")
                maps_link = item.metadata.get("google_maps_link", "")
                if not name:
                    continue

                if maps_link:
                    source_line = f"[{name} ({city})]({maps_link})"
                else:
                    source_line = f"{name} ({city})"

                if source_line not in unique_places:
                    unique_places.append(source_line)

            sources = "Sources: " + ", ".join(unique_places[:6]) if unique_places else ""

            with st.chat_message("assistant"):
                st.markdown(answer)
                if sources:
                    st.caption(sources)

            st.session_state.messages.append(
                {"role": "assistant", "content": answer, "sources": sources}
            )
        except Exception as exc:  # noqa: BLE001
            error_message = (
                "I hit an error while querying the local RAG stack. "
                f"Please verify Ollama is running at `{OLLAMA_BASE_URL}`.\n\nError: `{exc}`"
            )
            with st.chat_message("assistant"):
                st.markdown(error_message)
            st.session_state.messages.append({"role": "assistant", "content": error_message})
